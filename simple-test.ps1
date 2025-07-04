Write-Host "🚀 Testing Medical Appointment System Webhooks" -ForegroundColor Green

# Test 1: Development Payment Endpoint
Write-Host "🧪 Test 1: Development Payment Endpoint" -ForegroundColor Yellow
$body1 = '{"appointment_id": 1, "amount": 75.00}'
$headers1 = @{"Content-Type"="application/json"}

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/test-payment" -Method POST -Headers $headers1 -Body $body1
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: View All Payments
Write-Host "📊 Test 2: View All Payments" -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/payments" -Method GET
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Basic tests complete! Check your server logs." -ForegroundColor Green
