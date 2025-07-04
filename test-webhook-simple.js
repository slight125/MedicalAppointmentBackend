// Simple webhook test using built-in Node.js modules
const http = require('http');
const crypto = require('crypto');

// Test function to simulate Stripe webhook
const testWebhook = () => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test123';
  
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
  
  // Create signature (simplified)
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + payload)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

  // HTTP request options
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/webhooks/stripe',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': stripeSignature,
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log('🧪 Testing Stripe Webhook...');
  console.log('📡 Sending to: http://localhost:3000/api/webhooks/stripe');
  console.log('🔑 Appointment ID:', event.data.object.metadata.appointment_id);
  console.log('💰 Amount: $' + (event.data.object.amount_total / 100));

  const req = http.request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('📝 Response Body:', result);
        
        if (res.statusCode === 200) {
          console.log('🎉 Webhook test successful!');
        } else {
          console.log('⚠️ Webhook test completed with non-200 status');
        }
      } catch (e) {
        console.log('📝 Response Body (raw):', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Webhook Test Failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure your server is running on port 3000');
      console.log('   Run: npm run dev');
    }
  });

  // Send the payload
  req.write(payload);
  req.end();
};

// Also test the development endpoint
const testDevEndpoint = () => {
  const payload = JSON.stringify({
    appointment_id: 1,
    amount: 75.00
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dev/test-payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  console.log('\n🔧 Testing Development Payment Endpoint...');
  console.log('📡 Sending to: http://localhost:3000/api/dev/test-payment');

  const req = http.request(options, (res) => {
    console.log(`✅ Response Status: ${res.statusCode}`);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log('📝 Response:', result);
        
        if (res.statusCode === 200) {
          console.log('🎉 Development endpoint test successful!');
        }
      } catch (e) {
        console.log('📝 Response (raw):', data);
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Dev endpoint test failed:', error.message);
  });

  req.write(payload);
  req.end();
};

// Run tests
console.log('🚀 Starting webhook tests...\n');

// Test webhook first
testWebhook();

// Wait a bit, then test dev endpoint
setTimeout(() => {
  testDevEndpoint();
}, 2000);

// Instructions
setTimeout(() => {
  console.log('\n📋 Next Steps:');
  console.log('1. Check your server console for webhook processing logs');
  console.log('2. Verify payment was saved to database');
  console.log('3. Test with real Stripe CLI when available');
}, 4000);
