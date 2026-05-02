# Run as Administrator to open ports for Expo Go + Cortex
$ports = @(8081, 8080, 19000, 19001, 19002, 11434, 5173)
foreach ($port in $ports) {
    netsh advfirewall firewall delete rule name="Cortex-$port" 2>$null
    netsh advfirewall firewall add rule name="Cortex-$port" dir=in action=allow protocol=TCP localport=$port profile=any
    Write-Host "Opened port $port" -ForegroundColor Green
}

# Also set WiFi to Private
$profile = Get-NetConnectionProfile | Where-Object { $_.NetworkCategory -eq "Public" }
if ($profile) {
    Set-NetConnectionProfile -Name $profile.Name -NetworkCategory Private
    Write-Host "Set '$($profile.Name)' to Private" -ForegroundColor Green
}

Write-Host "`nAll done! Ports opened: $($ports -join ', ')" -ForegroundColor Cyan
