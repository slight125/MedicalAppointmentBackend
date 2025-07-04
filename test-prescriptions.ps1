# Test Prescription Creation Logic
# This script tests the prescription endpoints

$baseUrl = "http://localhost:3000"

Write-Host "🧪 Testing Prescription Creation Logic" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan

# Test 1: Create a test prescription (without authentication)
Write-Host "`n📋 Test 1: Creating test prescription..." -ForegroundColor Yellow

$prescriptionPayload = @{
    appointment_id = 1
    doctor_id = 1
    medicines = @(
        @{
            name = "Aspirin"
            dosage = "100mg"
            frequency = "Once daily"
        },
        @{
            name = "Vitamin D"
            dosage = "1000 IU"
            frequency = "Daily"
        }
    )
    notes = "Take with food. Complete the full course."
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-prescription" -Method POST -Body $prescriptionPayload -ContentType "application/json"
    Write-Host "✅ Test prescription created successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Green
}
catch {
    Write-Host "❌ Test prescription creation failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Try to create duplicate prescription (should fail)
Write-Host "`n📋 Test 2: Testing duplicate prevention..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-prescription" -Method POST -Body $prescriptionPayload -ContentType "application/json"
    Write-Host "❌ Duplicate prescription was created (this should not happen!)" -ForegroundColor Red
}
catch {
    Write-Host "✅ Duplicate prescription correctly prevented!" -ForegroundColor Green
    Write-Host $_.Exception.Message -ForegroundColor Green
}

# Test 3: Test appointment update (mark as paid)
Write-Host "`n💰 Test 3: Testing appointment payment update..." -ForegroundColor Yellow

$appointmentPayload = @{
    appointment_id = 1
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-appointment-update" -Method POST -Body $appointmentPayload -ContentType "application/json"
    Write-Host "✅ Appointment marked as paid!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Green
}
catch {
    Write-Host "❌ Appointment update failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 4: Create simple payment
Write-Host "`n💳 Test 4: Creating simple payment..." -ForegroundColor Yellow

$paymentPayload = @{
    appointment_id = 1
    amount = 75.50
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/simple-payment" -Method POST -Body $paymentPayload -ContentType "application/json"
    Write-Host "✅ Payment created successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Green
}
catch {
    Write-Host "❌ Payment creation failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 5: List all payments
Write-Host "`n📊 Test 5: Listing all payments..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/simple-payments" -Method GET
    Write-Host "✅ Payments retrieved successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to retrieve payments:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n🎉 All tests completed!" -ForegroundColor Cyan
Write-Host "Note: Ensure your backend server is running on http://localhost:3000" -ForegroundColor Yellow
