# Expo QR Code Connection Troubleshooting

## Common Issues and Solutions

### Issue: Mobile device can't connect via QR code

**Possible Causes:**

1. **Different Networks**
   - PC and mobile must be on the SAME Wi-Fi network
   - Check: PC on `192.168.10.x` and mobile on same network

2. **Firewall Blocking Expo**
   - Windows Firewall may block Expo Metro bundler
   - Default Expo port: `8081` (different from API port `8080`)

3. **Expo Using Wrong Network Interface**
   - Expo may bind to wrong IP address
   - WSL IP (`172.27.48.1`) vs Wi-Fi IP (`192.168.10.8`)

---

## Solutions

### Solution 1: Use Tunnel Mode (Easiest)
```bash
cd cortex-mobile
npx expo start --tunnel
```
- Creates a public URL via ngrok
- Works across different networks
- Slower but most reliable

### Solution 2: Specify LAN Connection
```bash
cd cortex-mobile
npx expo start --lan
```
- Forces LAN mode
- Uses your Wi-Fi IP (`192.168.10.8`)

### Solution 3: Allow Firewall Access
```powershell
# Run PowerShell as Administrator
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -LocalPort 8081 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Expo Metro" -Direction Inbound -LocalPort 19000-19001 -Protocol TCP -Action Allow
```

### Solution 4: Manual Connection
If QR doesn't work, manually enter the URL in Expo Go app:

1. Start Expo: `npx expo start --lan`
2. Note the URL shown (e.g., `exp://192.168.10.8:8081`)
3. In Expo Go app, tap "Enter URL manually"
4. Enter the URL from step 2

### Solution 5: Check Network Configuration
```powershell
# Verify your IP
ipconfig | findstr /i "IPv4"

# Should show:
# IPv4 Address. . . . . . . . . . . : 192.168.10.8
```

---

## Recommended Startup Command

For best compatibility with your network setup:

```bash
cd cortex-mobile
npx expo start --lan --clear
```

Options explained:
- `--lan`: Use LAN connection (Wi-Fi IP)
- `--clear`: Clear Metro bundler cache

---

## Testing Connection

1. **Start Expo with LAN mode:**
   ```bash
   cd cortex-mobile
   npx expo start --lan
   ```

2. **Verify the URL shown:**
   - Should be: `exp://192.168.10.8:8081`
   - NOT: `exp://172.27.48.1:8081` (WSL IP)
   - NOT: `exp://localhost:8081`

3. **Scan QR or enter URL manually in Expo Go app**

4. **Once app loads, verify API connection:**
   - Go to Profile tab
   - Check API Base URL: `http://192.168.10.8:8080`
   - Tap "Test Connection"

---

## Still Not Working?

### Check Both Services Are Running:

**Terminal 1 - API Server:**
```bash
cd src/cortex-api
python -m cortex_api
# Should show: Uvicorn running on http://0.0.0.0:8080
```

**Terminal 2 - Expo Metro:**
```bash
cd cortex-mobile
npx expo start --lan
# Should show: Metro waiting on exp://192.168.10.8:8081
```

### Verify Ports:
```powershell
# Check if ports are in use
netstat -ano | findstr "8080"  # API
netstat -ano | findstr "8081"  # Expo Metro
```

### Alternative: Use USB Connection
If Wi-Fi continues to fail:
1. Connect phone via USB
2. Enable USB debugging (Android) or trust computer (iOS)
3. Run: `npx expo start --localhost`
4. App will install via USB

---

## Network Diagram

```
Mobile Device (Expo Go)
    ↓ (scans QR or enters URL)
Expo Metro Bundler (192.168.10.8:8081)
    ↓ (serves React Native bundle)
Mobile App Running
    ↓ (API calls)
Cortex API (192.168.10.8:8080)
    ↓
SQLite Database
```

Both services must be accessible from mobile device on the same network.