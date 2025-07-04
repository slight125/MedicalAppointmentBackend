# Webhook Testing Script
Write-Host "🚀 Testing Medical Appointment System Webhooks" -ForegroundColor Green
Write-Host ""

# Test 1: Development Payment Endpoint
Write-Host "🧪 Test 1: Development Payment Endpoint" -ForegroundColor Yellow
Write-Host "POST /api/dev/test-payment" -ForegroundColor Cyan

try {
    $response1 = Invoke-WebRequest -Uri "http://localhost:3000/api/dev/test-payment" `
        -Method POST `
        -Headers @{"Content-Type"="application/json"} `
        -Body '{"appointment_id": 1, "amount": 75.00}' `
        -UseBasicParsing

    Write-Host "✅ Status: $($response1.StatusCode)" -ForegroundColor Green
    Write-Host "📝 Response: $($response1.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 2: View All Payments
Write-Host "📊 Test 2: View All Payments" -ForegroundColor Yellow
Write-Host "GET /api/dev/payments" -ForegroundColor Cyan

try {
    $response2 = Invoke-WebRequest -Uri "http://localhost:3000/api/dev/payments" `
        -Method GET `
        -UseBasicParsing

    Write-Host "✅ Status: $($response2.StatusCode)" -ForegroundColor Green
    Write-Host "📝 Payments: $($response2.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Test 3: Simple Webhook Test
Write-Host "🎯 Test 3: Webhook Endpoint Check" -ForegroundColor Yellow
Write-Host "POST /api/webhooks/stripe" -ForegroundColor Cyan

$webhookPayload = @{
    id = "evt_test"
    object = "event"
    type = "checkout.session.completed"
    data = @{
        object = @{
            id = "cs_test"
            amount_total = 5000
            payment_intent = "pi_test"
            payment_status = "paid"
            metadata = @{
                appointment_id = "3"
            }
        }
    }
} | ConvertTo-Json -Depth 4

try {
    $response3 = Invoke-WebRequest -Uri "http://localhost:3000/api/webhooks/stripe" `
        -Method POST `
        -Headers @{
            "Content-Type"="application/json"
            "Stripe-Signature"="t=1672531200,v1=test_signature"
        } `
        -Body $webhookPayload `
        -UseBasicParsing

    Write-Host "✅ Status: $($response3.StatusCode)" -ForegroundColor Green
    Write-Host "📝 Response: $($response3.Content)" -ForegroundColor White
} catch {
    Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Testing Complete!" -ForegroundColor Green
Write-Host "📋 Check your server logs for webhook processing messages." -ForegroundColor Cyan
