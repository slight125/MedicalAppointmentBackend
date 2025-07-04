# Enhanced Webhook Testing Commands
Write-Host "🚀 Enhanced Webhook System Testing" -ForegroundColor Green
Write-Host ""

# Test 1: Complete Payment Flow
Write-Host "🧪 Test 1: Complete Payment Flow (marks appointment as paid)" -ForegroundColor Yellow
$body1 = '{"appointment_id": 1, "amount": 85.00}'
$headers1 = @{"Content-Type"="application/json"}

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/complete-payment" -Method POST -Headers $headers1 -Body $body1
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response1 | ConvertTo-Json -Depth 2) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: View All Payments (should show paid status)
Write-Host "📊 Test 2: View All Payments (check paid status)" -ForegroundColor Yellow
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/dev/payments" -Method GET
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host ($response2 | ConvertTo-Json -Depth 3) -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Enhanced testing complete!" -ForegroundColor Green
Write-Host "📋 Check your server logs for:" -ForegroundColor Cyan
Write-Host "  - Payment processing messages" -ForegroundColor White
Write-Host "  - Appointment paid status updates" -ForegroundColor White
Write-Host "  - Email sending confirmations" -ForegroundColor White
