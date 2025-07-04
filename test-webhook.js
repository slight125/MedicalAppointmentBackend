const crypto = require('crypto');

// Use built-in fetch in Node.js 18+ or provide alternative
let fetch;
try {
  fetch = globalThis.fetch;
  if (!fetch) {
    // Fallback for older Node.js versions
    fetch = require('node-fetch');
  }
} catch (error) {
  console.error('❌ Please install node-fetch: npm install node-fetch');
  process.exit(1);
}

// Simulate a Stripe webhook event
const simulateWebhook = async () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test123';
  const webhookUrl = 'http://localhost:3000/api/webhooks/stripe';
  
  // Sample checkout.session.completed event
  const event = {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_session',
        object: 'checkout.session',
        amount_total: 5000, // $50.00 in cents
        currency: 'usd',
        payment_intent: 'pi_test_intent_123',
        payment_status: 'paid',
        metadata: {
          appointment_id: '1'
        }
      }
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: null,
      idempotency_key: null
    },
    type: 'checkout.session.completed'
  };

  const payload = JSON.stringify(event);
  const timestamp = Math.floor(Date.now() / 1000);
  
  // Create signature (simplified - in real Stripe webhooks this is more complex)
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + payload)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': stripeSignature
      },
      body: payload
    });

    console.log('✅ Webhook Response Status:', response.status);
    const result = await response.json();
    console.log('📝 Response:', result);
  } catch (error) {
    console.error('❌ Webhook Test Failed:', error);
  }
};

// Run the test
console.log('🧪 Testing Stripe Webhook...');
simulateWebhook();
