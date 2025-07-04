# Test All CSV Export Functionality
# This script tests all admin CSV export endpoints

$baseUrl = "http://localhost:3000"

Write-Host "📊 Testing All CSV Export Functionality" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Test 1: Appointments CSV export test
Write-Host "`n📋 Test 1: Testing appointments CSV export..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-csv-export" -Method GET
    Write-Host "✅ Appointments CSV test successful!" -ForegroundColor Green
    Write-Host "Records found: $($response.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Appointments CSV test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Payments CSV export test
Write-Host "`n💳 Test 2: Testing payments CSV export..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-payments-csv" -Method GET
    Write-Host "✅ Payments CSV test successful!" -ForegroundColor Green
    Write-Host "Records found: $($response.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Payments CSV test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 3: Prescriptions CSV export test
Write-Host "`n💊 Test 3: Testing prescriptions CSV export..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-prescriptions-csv" -Method GET
    Write-Host "✅ Prescriptions CSV test successful!" -ForegroundColor Green
    Write-Host "Records found: $($response.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Prescriptions CSV test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 4: Users CSV export test
Write-Host "`n👥 Test 4: Testing users CSV export..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-users-csv" -Method GET
    Write-Host "✅ Users CSV test successful!" -ForegroundColor Green
    Write-Host "Records found: $($response.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Users CSV test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 5: Complaints CSV export test
Write-Host "`n📞 Test 5: Testing complaints CSV export..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-complaints-csv" -Method GET
    Write-Host "✅ Complaints CSV test successful!" -ForegroundColor Green
    Write-Host "Records found: $($response.count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Complaints CSV test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n🔒 Production Endpoints (Require Admin Authentication):" -ForegroundColor Yellow
Write-Host "   GET /api/admin/reports/appointments.csv" -ForegroundColor Gray
Write-Host "   GET /api/admin/reports/payments.csv" -ForegroundColor Gray
Write-Host "   GET /api/admin/reports/prescriptions.csv" -ForegroundColor Gray
Write-Host "   GET /api/admin/reports/users.csv" -ForegroundColor Gray
Write-Host "   GET /api/admin/reports/complaints.csv" -ForegroundColor Gray
Write-Host "   Authorization: Bearer <admin_jwt_token>" -ForegroundColor Gray

Write-Host "`n📝 Example Production Usage:" -ForegroundColor Yellow
Write-Host '   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/appointments.csv -o appointments.csv' -ForegroundColor Gray
Write-Host '   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/reports/users.csv -o users.csv' -ForegroundColor Gray

Write-Host "`n🎉 All CSV export tests completed!" -ForegroundColor Cyan
Write-Host "Note: Ensure your backend server is running on http://localhost:3000" -ForegroundColor Yellow
