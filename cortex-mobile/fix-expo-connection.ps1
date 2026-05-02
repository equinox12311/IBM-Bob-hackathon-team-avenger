# Expo Go Connection Fix Script
# Run this as Administrator to fix connection issues

Write-Host "=== Expo Go Connection Diagnostic & Fix ===" -ForegroundColor Cyan
Write-Host ""

# Check current network
Write-Host "1. Checking Network Configuration..." -ForegroundColor Yellow
$wifiIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "192.168.*"}).IPAddress
$wslIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {$_.IPAddress -like "172.*"}).IPAddress

Write-Host "   Wi-Fi IP: $wifiIP" -ForegroundColor Green
Write-Host "   WSL IP: $wslIP" -ForegroundColor Green
Write-Host ""

# Check if Expo is running
Write-Host "2. Checking if Expo Metro is running..." -ForegroundColor Yellow
$expoProcess = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue
if ($expoProcess) {
    Write-Host "   ✓ Expo Metro is running on port 8081" -ForegroundColor Green
} else {
    Write-Host "   ✗ Expo Metro is NOT running!" -ForegroundColor Red
    Write-Host "   Please start Expo with: npx expo start --lan" -ForegroundColor Yellow
    exit
}
Write-Host ""

# Check firewall rules
Write-Host "3. Checking Windows Firewall..." -ForegroundColor Yellow
$expoRule = Get-NetFirewallRule -DisplayName "Cortex Expo Metro" -ErrorAction SilentlyContinue
if ($expoRule) {
    Write-Host "   ✓ Firewall rule exists" -ForegroundColor Green
} else {
    Write-Host "   ✗ Firewall rule missing - Creating now..." -ForegroundColor Yellow
    
    # Add firewall rules
    New-NetFirewallRule -DisplayName "Cortex Expo Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    New-NetFirewallRule -DisplayName "Cortex Expo DevTools" -Direction Inbound -LocalPort 19000-19001 -Protocol TCP -Action Allow -ErrorAction SilentlyContinue
    
    Write-Host "   ✓ Firewall rules created!" -ForegroundColor Green
}
Write-Host ""

# Test connectivity
Write-Host "4. Testing Connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081/status" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   ✓ Expo Metro is responding" -ForegroundColor Green
} catch {
    Write-Host "   ⚠ Could not reach Expo Metro" -ForegroundColor Yellow
}
Write-Host ""

# Provide connection URLs
Write-Host "5. Connection URLs for Expo Go:" -ForegroundColor Yellow
Write-Host "   Primary (Wi-Fi):  exp://$wifiIP:8081" -ForegroundColor Cyan
Write-Host "   Fallback (WSL):   exp://$wslIP:8081" -ForegroundColor Cyan
Write-Host ""

# Instructions
Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host ""
Write-Host "Option 1: Scan QR Code" -ForegroundColor White
Write-Host "  - Make sure your phone is on the same Wi-Fi network (192.168.10.x)" -ForegroundColor Gray
Write-Host "  - Open Expo Go app and scan the QR code" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 2: Manual URL Entry" -ForegroundColor White
Write-Host "  - Open Expo Go app" -ForegroundColor Gray
Write-Host "  - Tap 'Enter URL manually'" -ForegroundColor Gray
Write-Host "  - Enter: exp://$wifiIP:8081" -ForegroundColor Gray
Write-Host ""
Write-Host "Option 3: Use Tunnel Mode (if LAN fails)" -ForegroundColor White
Write-Host "  - Stop current Expo (Ctrl+C)" -ForegroundColor Gray
Write-Host "  - Run: npx expo start --tunnel" -ForegroundColor Gray
Write-Host "  - This creates a public URL that works across any network" -ForegroundColor Gray
Write-Host ""

# Troubleshooting tips
Write-Host "=== Still Not Working? ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verify same network:" -ForegroundColor White
Write-Host "   - Phone Wi-Fi settings should show 192.168.10.x IP" -ForegroundColor Gray
Write-Host "   - PC is on 192.168.10.8" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Restart Expo with LAN mode:" -ForegroundColor White
Write-Host "   cd cortex-mobile" -ForegroundColor Gray
Write-Host "   npx expo start --lan --clear" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Check phone's browser:" -ForegroundColor White
Write-Host "   - Open browser on phone" -ForegroundColor Gray
Write-Host "   - Go to: http://$wifiIP:8081" -ForegroundColor Gray
Write-Host "   - Should see Expo Metro Bundler page" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Disable VPN/Proxy:" -ForegroundColor White
Write-Host "   - Turn off any VPN on phone or PC" -ForegroundColor Gray
Write-Host "   - Disable proxy settings" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Use USB connection:" -ForegroundColor White
Write-Host "   - Connect phone via USB" -ForegroundColor Gray
Write-Host "   - Enable USB debugging (Android) or trust computer (iOS)" -ForegroundColor Gray
Write-Host "   - Run: npx expo start --localhost" -ForegroundColor Gray
Write-Host ""

Write-Host "=== Done! ===" -ForegroundColor Green
Write-Host "If issues persist, see: cortex-mobile/QR_CONNECTION_TROUBLESHOOTING.md" -ForegroundColor Gray

# Made with Bob
