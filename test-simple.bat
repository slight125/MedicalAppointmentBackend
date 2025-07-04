echo off
echo Testing Webhook System...
echo.

echo Test 1: Development Payment
echo.
curl -s -X POST http://localhost:3000/api/dev/test-payment -H "Content-Type: application/json" -d "{\"appointment_id\": 1, \"amount\": 75.00}"
echo.
echo.

echo Test 2: View Payments  
echo.
curl -s http://localhost:3000/api/dev/payments
echo.
echo.

echo Tests complete!
