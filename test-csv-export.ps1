# Test CSV Export Functionality
# This script tests the admin CSV export endpoint

$baseUrl = "http://localhost:3000"

Write-Host "📊 Testing CSV Export Functionality" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan

# Test 1: Test CSV export (Note: This requires admin authentication in production)
Write-Host "`n📋 Test 1: Testing CSV export endpoint..." -ForegroundColor Yellow

try {
    # Note: In production, this would require an admin JWT token
    # For testing purposes, you may need to temporarily remove authentication
    $response = Invoke-WebRequest -Uri "$baseUrl/api/admin/reports/appointments.csv" -Method GET
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ CSV export successful!" -ForegroundColor Green
        Write-Host "Content-Type: $($response.Headers.'Content-Type')" -ForegroundColor Green
        Write-Host "Content-Disposition: $($response.Headers.'Content-Disposition')" -ForegroundColor Green
        Write-Host "Response Length: $($response.Content.Length) characters" -ForegroundColor Green
        
        # Save CSV to file for inspection
        $response.Content | Out-File -FilePath "appointments_export_test.csv" -Encoding UTF8
        Write-Host "CSV saved to: appointments_export_test.csv" -ForegroundColor Green
    }
}
catch {
    Write-Host "❌ CSV export failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host "Note: This endpoint requires admin authentication" -ForegroundColor Yellow
}

Write-Host "`n📝 Production Usage:" -ForegroundColor Yellow
Write-Host "   GET /api/admin/reports/appointments.csv" -ForegroundColor Gray
Write-Host "   Authorization: Bearer <admin_jwt_token>" -ForegroundColor Gray

Write-Host "`n🎉 CSV export test completed!" -ForegroundColor Cyan
Write-Host "Note: Ensure your backend server is running on http://localhost:3000" -ForegroundColor Yellow
