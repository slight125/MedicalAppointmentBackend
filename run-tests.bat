@echo off
echo 🚀 Testing Enhanced Webhook System
echo.

echo Test 1: Server Health Check
curl -s http://localhost:3000/
echo.
echo.

echo Test 2: Complete Payment Flow
curl -s -X POST http://localhost:3000/api/dev/complete-payment -H "Content-Type: application/json" -d "{\"appointment_id\": 1, \"amount\": 85.00}"
echo.
echo.

echo Test 3: View All Payments
curl -s http://localhost:3000/api/dev/payments
echo.
echo.

echo ✅ Tests completed! Check server logs for processing details.
pause
