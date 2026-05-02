# Cortex Mobile - Firewall Setup Script
# Run this as Administrator to allow Expo Metro connections

Write-Host "Setting up firewall rules for Cortex Mobile..." -ForegroundColor Cyan

# Allow Expo Metro Bundler (port 8081)
New-NetFirewallRule -DisplayName "Cortex Expo Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
Write-Host "✓ Added rule for Expo Metro (port 8081)" -ForegroundColor Green

# Allow Expo DevTools (ports 19000-19001)
New-NetFirewallRule -DisplayName "Cortex Expo DevTools" -Direction Inbound -LocalPort 19000-19001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
Write-Host "✓ Added rule for Expo DevTools (ports 19000-19001)" -ForegroundColor Green

# Allow Cortex API (port 8080) - if not already added
New-NetFirewallRule -DisplayName "Cortex API" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
Write-Host "✓ Added rule for Cortex API (port 8080)" -ForegroundColor Green

Write-Host "`nFirewall setup complete!" -ForegroundColor Green
Write-Host "`nYour network configuration:" -ForegroundColor Yellow
Write-Host "  Wi-Fi IP: 192.168.10.8" -ForegroundColor White
Write-Host "  Expo Metro: http://192.168.10.8:8081" -ForegroundColor White
Write-Host "  Cortex API: http://192.168.10.8:8080" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Restart Expo: npx expo start --lan" -ForegroundColor White
Write-Host "  2. Scan QR code with Expo Go app" -ForegroundColor White
Write-Host "  3. App should connect automatically" -ForegroundColor White

# Made with Bob
