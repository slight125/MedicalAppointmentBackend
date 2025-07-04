@echo off
echo 🚀 Testing Medical Appointment System Webhooks
echo.

echo 🧪 Test 1: Development Payment Endpoint
echo POST /api/dev/test-payment
curl -X POST http://localhost:3000/api/dev/test-payment ^
  -H "Content-Type: application/json" ^
  -d "{\"appointment_id\": 1, \"amount\": 75.00}"
echo.
echo.

echo 📊 Test 2: View All Payments
echo GET /api/dev/payments
curl -X GET http://localhost:3000/api/dev/payments
echo.
echo.

echo 🎯 Test 3: Stripe Webhook Simulation
echo POST /api/webhooks/stripe
curl -X POST http://localhost:3000/api/webhooks/stripe ^
  -H "Content-Type: application/json" ^
  -H "Stripe-Signature: t=1672531200,v1=test_signature" ^
  -d "{\"id\": \"evt_test\", \"object\": \"event\", \"type\": \"checkout.session.completed\", \"data\": {\"object\": {\"id\": \"cs_test\", \"amount_total\": 5000, \"payment_intent\": \"pi_test\", \"payment_status\": \"paid\", \"metadata\": {\"appointment_id\": \"3\"}}}}"
echo.
echo.

echo ✅ Testing Complete!
echo Check your server logs for processing messages.
pause
