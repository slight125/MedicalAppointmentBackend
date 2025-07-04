# Test Medical History Functionality
# This script tests the medical history endpoints

$baseUrl = "http://localhost:3000"

Write-Host "🏥 Testing Medical History Functionality" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Test 1: Test medical history retrieval (without authentication)
Write-Host "`n📋 Test 1: Testing medical history retrieval..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-medical-history/1" -Method GET
    Write-Host "✅ Medical history retrieved successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 4) -ForegroundColor Green
}
catch {
    Write-Host "❌ Medical history retrieval failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Test with different user ID
Write-Host "`n📋 Test 2: Testing medical history for user ID 2..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-medical-history/2" -Method GET
    Write-Host "✅ Medical history for user 2 retrieved successfully!" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 4) -ForegroundColor Green
}
catch {
    Write-Host "❌ Medical history retrieval for user 2 failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Note: The following tests require proper JWT tokens
Write-Host "`n🔒 Note: The following endpoints require authentication:" -ForegroundColor Yellow
Write-Host "   GET /api/medical-history/self (user token required)" -ForegroundColor Gray
Write-Host "   GET /api/medical-history/:userId (doctor/admin token required)" -ForegroundColor Gray

Write-Host "`n🎉 Medical history tests completed!" -ForegroundColor Cyan
Write-Host "Note: Ensure your backend server is running on http://localhost:3000" -ForegroundColor Yellow
