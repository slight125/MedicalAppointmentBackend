# Test Admin Analytics Functionality
# This script tests all admin analytics endpoints

$baseUrl = "http://localhost:3000"

Write-Host "📊 Testing Admin Analytics Functionality" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# Test 1: Analytics summary test
Write-Host "`n📈 Test 1: Testing analytics summary..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-analytics-summary" -Method GET
    Write-Host "✅ Analytics summary test successful!" -ForegroundColor Green
    Write-Host "Total Users: $($response.data.totals.users)" -ForegroundColor Green
    Write-Host "Total Doctors: $($response.data.totals.doctors)" -ForegroundColor Green
    Write-Host "Total Appointments: $($response.data.totals.appointments)" -ForegroundColor Green
    Write-Host "Total Revenue: $($response.data.totals.revenue)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Analytics summary test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Test 2: Booking trends test
Write-Host "`n📅 Test 2: Testing booking trends..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dev/test-booking-trends" -Method GET
    Write-Host "✅ Booking trends test successful!" -ForegroundColor Green
    Write-Host "Range: $($response.range)" -ForegroundColor Green
    Write-Host "Data points: $($response.data.Count)" -ForegroundColor Green
}
catch {
    Write-Host "❌ Booking trends test failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}

Write-Host "`n🔒 Production Analytics Endpoints (Require Admin Authentication):" -ForegroundColor Yellow
Write-Host "   GET /api/admin/analytics/summary" -ForegroundColor Gray
Write-Host "   GET /api/admin/analytics/bookings?range=7" -ForegroundColor Gray
Write-Host "   GET /api/admin/analytics/top-doctors" -ForegroundColor Gray
Write-Host "   GET /api/admin/analytics/revenue?range=30" -ForegroundColor Gray
Write-Host "   GET /api/admin/analytics/appointment-status" -ForegroundColor Gray
Write-Host "   Authorization: Bearer <admin_jwt_token>" -ForegroundColor Gray

Write-Host "`n📝 Example Production Usage:" -ForegroundColor Yellow
Write-Host '   curl -H "Authorization: Bearer <token>" http://localhost:3000/api/admin/analytics/summary' -ForegroundColor Gray
Write-Host '   curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/admin/analytics/bookings?range=14"' -ForegroundColor Gray

Write-Host "`n🎯 Frontend Integration:" -ForegroundColor Yellow
Write-Host "   - Summary cards: Users, Doctors, Appointments, Revenue" -ForegroundColor Gray
Write-Host "   - Line charts: Booking trends over time" -ForegroundColor Gray
Write-Host "   - Bar charts: Top doctors, appointment status breakdown" -ForegroundColor Gray
Write-Host "   - Revenue analytics: Daily revenue trends" -ForegroundColor Gray

Write-Host "`n🎉 Analytics tests completed!" -ForegroundColor Cyan
Write-Host "Note: Ensure your backend server is running on http://localhost:3000" -ForegroundColor Yellow
