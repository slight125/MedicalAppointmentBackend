# Test script for Prescription PDF Download functionality
# PowerShell script to test the prescription PDF endpoints

$baseUrl = "http://localhost:3000/api"
Write-Host "🧪 Testing Prescription PDF Download Endpoints" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan

# Test the simple PDF generation endpoint (no auth required)
Write-Host "`n📋 Testing Simple PDF Generation..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/dev/test-prescription-pdf/1" -Method GET
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ PDF generation test successful!" -ForegroundColor Green
        
        # Save the PDF to a file for verification
        $pdfPath = "test_prescription_1.pdf"
        [System.IO.File]::WriteAllBytes($pdfPath, $response.Content)
        Write-Host "📄 PDF saved as: $pdfPath" -ForegroundColor Green
    } else {
        Write-Host "❌ PDF generation failed with status: $($response.StatusCode)" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error testing PDF generation: $($_.Exception.Message)" -ForegroundColor Red
}

# Note: For authenticated endpoints, you would need a valid JWT token
Write-Host "`n📋 Testing Authenticated PDF Download..." -ForegroundColor Yellow
Write-Host "⚠️  Note: This requires a valid JWT token" -ForegroundColor Yellow

# Example of how to test with authentication (uncomment and add real token):
# $token = "your_jwt_token_here"
# $headers = @{
#     "Authorization" = "Bearer $token"
#     "Content-Type" = "application/json"
# }

# try {
#     $response = Invoke-WebRequest -Uri "$baseUrl/prescriptions/1/pdf" -Method GET -Headers $headers
#     
#     if ($response.StatusCode -eq 200) {
#         Write-Host "✅ Authenticated PDF download successful!" -ForegroundColor Green
#         
#         # Save the PDF to a file
#         $pdfPath = "authenticated_prescription_1.pdf"
#         [System.IO.File]::WriteAllBytes($pdfPath, $response.Content)
#         Write-Host "📄 PDF saved as: $pdfPath" -ForegroundColor Green
#     } else {
#         Write-Host "❌ Authenticated PDF download failed with status: $($response.StatusCode)" -ForegroundColor Red
#     }
# } catch {
#     Write-Host "❌ Error testing authenticated PDF download: $($_.Exception.Message)" -ForegroundColor Red
# }

Write-Host "`n🔧 Manual Testing Instructions:" -ForegroundColor Cyan
Write-Host "1. First, create a test prescription using POST /api/dev/test-prescription" -ForegroundColor White
Write-Host "2. Get a JWT token by logging in as a doctor or patient" -ForegroundColor White
Write-Host "3. Use the token to test the authenticated endpoint: GET /api/prescriptions/{id}/pdf" -ForegroundColor White
Write-Host "4. Check that PDFs are properly formatted and downloadable" -ForegroundColor White

Write-Host "`n📋 Available Endpoints:" -ForegroundColor Cyan
Write-Host "• GET /api/dev/test-prescription-pdf/{id} - Test PDF generation (no auth)" -ForegroundColor White
Write-Host "• GET /api/prescriptions/{id}/pdf - Download prescription PDF (auth required)" -ForegroundColor White
Write-Host "• GET /api/prescriptions/user - Get user's prescriptions" -ForegroundColor White
Write-Host "• GET /api/prescriptions/doctor - Get doctor's prescriptions" -ForegroundColor White

Write-Host "`n✅ Prescription PDF test script completed!" -ForegroundColor Green
