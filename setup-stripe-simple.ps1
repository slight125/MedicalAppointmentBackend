# Simple Stripe CLI Setup
Write-Host "Setting up Stripe CLI..." -ForegroundColor Green

# Try to find Stripe CLI in common locations
$stripePaths = @(
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\stripe.exe",
    "$env:USERPROFILE\AppData\Local\Microsoft\WinGet\Links\stripe.exe",
    "C:\Program Files\Stripe\stripe.exe"
)

$stripeFound = $false
foreach ($path in $stripePaths) {
    if (Test-Path $path) {
        Write-Host "Found Stripe CLI at: $path" -ForegroundColor Green
        $stripeFound = $true
        
        # Test the installation
        & $path --version
        
        Write-Host "To use Stripe CLI, run:" -ForegroundColor Yellow
        Write-Host "1. $path login" -ForegroundColor White
        Write-Host "2. $path listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor White
        break
    }
}

if (-not $stripeFound) {
    Write-Host "Stripe CLI not found in common locations." -ForegroundColor Red
    Write-Host "Please download manually from: https://github.com/stripe/stripe-cli/releases" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Alternative: Use our test endpoint at /api/dev/test-payment" -ForegroundColor Cyan
