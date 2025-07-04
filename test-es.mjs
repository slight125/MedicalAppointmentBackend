import http from 'http';
import crypto from 'crypto';

// Test the development payment endpoint first
const testDevPayment = () => {
  const postData = JSON.stringify({
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
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Testing Development Payment Endpoint...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('📝 Response:', result);
      } catch (e) {
        console.log('📝 Raw Response:', data);
      }
      
      // After dev test, test the webhook
      setTimeout(testWebhook, 1000);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Dev Payment Test Failed:', e.message);
  });

  req.write(postData);
  req.end();
};

// Test the actual webhook endpoint
const testWebhook = () => {
  const webhookSecret = 'whsec_test123';
  
  const event = {
    id: 'evt_test_webhook',
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_test_session',
        object: 'checkout.session',
        amount_total: 8500, // $85.00 in cents
        currency: 'usd',
        payment_intent: 'pi_test_intent_456',
        payment_status: 'paid',
        metadata: {
          appointment_id: '2'
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
  
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(timestamp + '.' + payload)
    .digest('hex');

  const stripeSignature = `t=${timestamp},v1=${signature}`;

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

  console.log('\n🎯 Testing Stripe Webhook...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Webhook Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('📝 Webhook Response:', result);
      } catch (e) {
        console.log('📝 Raw Webhook Response:', data);
      }
      
      // Test viewing all payments
      setTimeout(testViewPayments, 1000);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Webhook Test Failed:', e.message);
  });

  req.write(payload);
  req.end();
};

// Test viewing all payments
const testViewPayments = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dev/payments',
    method: 'GET'
  };

  console.log('\n📊 Fetching All Payments...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('📝 All Payments:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📝 Raw Response:', data);
      }
      
      console.log('\n🎉 Testing Complete!');
      console.log('\n📋 Summary:');
      console.log('1. ✅ Development payment endpoint tested');
      console.log('2. ✅ Stripe webhook simulation tested');
      console.log('3. ✅ Payment retrieval tested');
      console.log('\n🎯 Next: Check your server logs for webhook processing messages!');
    });
  });

  req.on('error', (e) => {
    console.error('❌ View Payments Test Failed:', e.message);
  });

  req.end();
};

// Start testing
console.log('🚀 Starting Webhook System Tests...');
console.log('📡 Server should be running on http://localhost:3000\n');

testDevPayment();
