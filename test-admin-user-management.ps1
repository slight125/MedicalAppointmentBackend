# Admin User Management API Test Script
# Run this script to test the admin user management endpoints

$baseUrl = "http://localhost:3000/api"

# You'll need to replace this with a valid admin JWT token
$adminToken = "your_admin_jwt_token_here"

$headers = @{
    "Authorization" = "Bearer $adminToken"
    "Content-Type" = "application/json"
}

Write-Host "🔧 Testing Admin User Management Endpoints..." -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test 1: Get All Users
Write-Host "`n1. 📋 Testing GET /api/admin/users (Get All Users)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/users" -Method GET -Headers $headers
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Total Users: $($response.count)" -ForegroundColor White
    if ($response.data.Count -gt 0) {
        Write-Host "First User ID: $($response.data[0].user_id)" -ForegroundColor White
        $testUserId = $response.data[0].user_id
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Search Users
Write-Host "`n2. 🔍 Testing GET /api/admin/users/search (Search Users)" -ForegroundColor Yellow
try {
    $searchQuery = "john"  # Search for users containing "john"
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/search?query=$searchQuery" -Method GET -Headers $headers
    Write-Host "✅ Success!" -ForegroundColor Green
    Write-Host "Found Users: $($response.count)" -ForegroundColor White
    Write-Host "Search Query: '$searchQuery'" -ForegroundColor White
    if ($response.data.Count -gt 0) {
        Write-Host "First Result: $($response.data[0].firstname) $($response.data[0].lastname)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Get User by ID (using first user from above)
if ($testUserId) {
    Write-Host "`n3. 👤 Testing GET /api/admin/users/$testUserId (Get User by ID)" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/$testUserId" -Method GET -Headers $headers
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "User: $($response.data.firstname) $($response.data.lastname)" -ForegroundColor White
        Write-Host "Role: $($response.data.role)" -ForegroundColor White
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 4: Update User
    Write-Host "`n4. ✏️ Testing PATCH /api/admin/users/$testUserId (Update User)" -ForegroundColor Yellow
    $updateData = @{
        contact_phone = "+1-555-0123"
        address = "123 Updated Street, Test City"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/$testUserId" -Method PATCH -Headers $headers -Body $updateData
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Message: $($response.message)" -ForegroundColor White
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }

    # Test 5: Verify Update
    Write-Host "`n5. 🔍 Verifying Update - GET /api/admin/users/$testUserId" -ForegroundColor Yellow
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/$testUserId" -Method GET -Headers $headers
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Updated Phone: $($response.data.contact_phone)" -ForegroundColor White
        Write-Host "Updated Address: $($response.data.address)" -ForegroundColor White
    } catch {
        Write-Host "❌ Failed: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test 6: Test Non-existent User
Write-Host "`n6. 🚫 Testing GET /api/admin/users/99999 (Non-existent User)" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/admin/users/99999" -Method GET -Headers $headers
    Write-Host "❌ Unexpected success!" -ForegroundColor Red
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "✅ Correctly returned 404!" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed with unexpected error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Admin User Management API Tests Complete!" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Note about DELETE endpoint
Write-Host "`n⚠️ DELETE Endpoint Available" -ForegroundColor Magenta
Write-Host "DELETE /api/admin/users/:id is implemented but not tested in this script" -ForegroundColor Yellow
Write-Host "Use with caution as it permanently deletes users!" -ForegroundColor Red

Write-Host "`n💡 To use this script:" -ForegroundColor White
Write-Host "1. Replace 'your_admin_jwt_token_here' with a valid admin JWT token" -ForegroundColor Gray
Write-Host "2. Ensure your server is running on localhost:3000" -ForegroundColor Gray
Write-Host "3. Run: ./test-admin-user-management.ps1" -ForegroundColor Gray
