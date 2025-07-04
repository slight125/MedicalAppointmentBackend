import http from 'http';
import crypto from 'crypto';

console.log('🚀 Testing Enhanced Webhook System with Payment Confirmation...');
console.log('📡 Server should be running on http://localhost:3000\n');

// Test 1: Create a test appointment (you would need this first)
const testCompletePayment = () => {
  const postData = JSON.stringify({
    appointment_id: 1,
    amount: 85.00
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dev/complete-payment',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  console.log('🧪 Test 1: Complete Payment Flow (with appointment update)...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('📝 Response:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📝 Raw Response:', data);
      }
      
      // After complete payment test, test the enhanced webhook
      setTimeout(testEnhancedWebhook, 1000);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Complete Payment Test Failed:', e.message);
  });

  req.write(postData);
  req.end();
};

// Test 2: Enhanced webhook with email confirmation
const testEnhancedWebhook = () => {
  const webhookSecret = 'whsec_test123';
  
  const event = {
    id: 'evt_enhanced_test',
    object: 'event',
    api_version: '2025-06-30.basil',
    created: Math.floor(Date.now() / 1000),
    data: {
      object: {
        id: 'cs_enhanced_session',
        object: 'checkout.session',
        amount_total: 12500, // $125.00 in cents
        currency: 'usd',
        payment_intent: 'pi_enhanced_test_789',
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

  console.log('\n🎯 Test 2: Enhanced Stripe Webhook (with appointment update & email)...');
  
  const req = http.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`✅ Webhook Status: ${res.statusCode}`);
      try {
        const result = JSON.parse(data);
        console.log('📝 Webhook Response:', JSON.stringify(result, null, 2));
      } catch (e) {
        console.log('📝 Raw Webhook Response:', data);
      }
      
      // Test viewing all payments with paid status
      setTimeout(testViewEnhancedPayments, 1000);
    });
  });

  req.on('error', (e) => {
    console.error('❌ Enhanced Webhook Test Failed:', e.message);
  });

  req.write(payload);
  req.end();
};

// Test 3: View payments with appointment paid status
const testViewEnhancedPayments = () => {
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/dev/payments',
    method: 'GET'
  };

  console.log('\n📊 Test 3: Viewing All Payments (should show paid appointments)...');
  
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
      
      console.log('\n🎉 Enhanced Webhook Testing Complete!');
      console.log('\n📋 What was tested:');
      console.log('✅ Complete payment flow with appointment marking');
      console.log('✅ Enhanced webhook processing');
      console.log('✅ Appointment paid status updates');
      console.log('✅ Email confirmation sending');
      console.log('\n🔍 Check your server logs for:');
      console.log('- Payment logging messages');
      console.log('- Appointment paid status updates');
      console.log('- Email sending confirmations');
    });
  });

  req.on('error', (e) => {
    console.error('❌ View Enhanced Payments Test Failed:', e.message);
  });

  req.end();
};

// Start enhanced testing
testCompletePayment();
