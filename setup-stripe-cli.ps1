# Stripe CLI Setup Script for Windows
Write-Host "🔧 Setting up Stripe CLI..." -ForegroundColor Green

# Method 1: Try to find existing installation
$stripePaths = @(
    "$env:LOCALAPPDATA\Microsoft\WinGet\Links\stripe.exe",
    "$env:USERPROFILE\AppData\Local\Microsoft\WinGet\Links\stripe.exe",
    "C:\Program Files\Stripe\stripe.exe",
    "$env:LOCALAPPDATA\Programs\Stripe\stripe.exe"
)

$stripeFound = $false
foreach ($path in $stripePaths) {
    if (Test-Path $path) {
        Write-Host "✅ Found Stripe CLI at: $path" -ForegroundColor Green
        $stripeFound = $true
        
        # Add to PATH temporarily
        $env:PATH += ";$(Split-Path $path)"
        
        # Test the installation
        & $path --version
        break
    }
}

if (-not $stripeFound) {
    Write-Host "❌ Stripe CLI not found. Let's install it manually..." -ForegroundColor Yellow
    
    # Method 2: Download directly from GitHub
    Write-Host "📥 Downloading Stripe CLI..." -ForegroundColor Blue
    $downloadUrl = "https://github.com/stripe/stripe-cli/releases/latest/download/stripe_1.19.4_windows_x86_64.zip"
    $downloadPath = "$env:TEMP\stripe-cli.zip"
    $extractPath = "$env:LOCALAPPDATA\Stripe"
    
    try {
        # Download
        Invoke-WebRequest -Uri $downloadUrl -OutFile $downloadPath -UseBasicParsing
        
        # Extract
        if (-not (Test-Path $extractPath)) {
            New-Item -ItemType Directory -Path $extractPath -Force
        }
        Expand-Archive -Path $downloadPath -DestinationPath $extractPath -Force
        
        # Add to PATH
        $stripePath = "$extractPath\stripe.exe"
        if (Test-Path $stripePath) {
            Write-Host "✅ Stripe CLI extracted to: $stripePath" -ForegroundColor Green
            $env:PATH += ";$extractPath"
            
            # Test installation
            & $stripePath --version
            
            Write-Host "🎉 Stripe CLI is now ready!" -ForegroundColor Green
        }
        
        # Clean up
        Remove-Item $downloadPath -Force -ErrorAction SilentlyContinue
        
    } catch {
        Write-Host "❌ Failed to download Stripe CLI: $_" -ForegroundColor Red
    }
}

# Instructions for webhook testing
Write-Host "`n📋 Next Steps:" -ForegroundColor Cyan
Write-Host "1. Login to Stripe CLI: stripe login" -ForegroundColor White
Write-Host "2. Forward webhooks: stripe listen --forward-to localhost:3000/api/webhooks/stripe" -ForegroundColor White
Write-Host "3. Copy the webhook signing secret and add it to your .env file" -ForegroundColor White
Write-Host "4. Test payment: stripe trigger checkout.session.completed" -ForegroundColor White

Write-Host "`n🔧 Alternative: Use the test-webhook.js script we created" -ForegroundColor Yellow
Write-Host "   Run: node test-webhook.js" -ForegroundColor White
