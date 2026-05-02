# Cortex Mobile App - Network Setup Guide

## Connecting Mobile App to Local Backend

Based on your network configuration, here's how to connect the mobile app to your local Cortex API:

### Your Network Information:
- **Local IP (Wi-Fi 2)**: `192.168.10.8`
- **WSL IP**: `172.27.48.1`

### Setup Steps:

#### 1. **Start the Cortex API Backend**

```bash
# In your project root
cd src/cortex-api
python -m cortex_api.server
```

The API should start on `http://localhost:8080` or `http://0.0.0.0:8080`

#### 2. **Configure Mobile App API Base URL**

The mobile app needs to connect to your machine's IP address, not `localhost`.

**Option A: Using Wi-Fi IP (Recommended for physical devices)**
```
http://192.168.10.8:8080
```

**Option B: Using WSL IP (If running in WSL)**
```
http://172.27.48.1:8080
```

#### 3. **Update Mobile App Configuration**

Open the mobile app and go to:
1. **Profile/Settings** tab
2. Find **API Base URL** setting
3. Enter: `http://192.168.10.8:8080`
4. Save and restart the app

#### 4. **Firewall Configuration**

Make sure Windows Firewall allows connections on port 8080:

```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Cortex API" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

#### 5. **Test Connection**

From your mobile device browser, try accessing:
```
http://192.168.10.8:8080/health
```

You should see a JSON response with API health status.

### Troubleshooting:

**If mobile app can't connect:**

1. **Check API is running**:
   ```bash
   curl http://localhost:8080/health
   ```

2. **Verify firewall allows port 8080**

3. **Ensure both devices are on same Wi-Fi network** (192.168.10.x)

4. **Try alternative IP**:
   - If Wi-Fi IP doesn't work, try WSL IP
   - Check if API is bound to `0.0.0.0` not just `127.0.0.1`

5. **Check API binding**:
   In `src/cortex-api/cortex_api/server.py`, ensure:
   ```python
   uvicorn.run(app, host="0.0.0.0", port=8080)
   ```

### Quick Start Commands:

```bash
# Terminal 1: Start API
cd src/cortex-api
python -m cortex_api.server

# Terminal 2: Start Mobile App
cd cortex-mobile
npm start
# or
npx expo start
```

### Mobile App Features Now Available:

✅ **Today Hub** with tasks, calendar, notifications
✅ **Wellness tracking** with break reminders
✅ **Popup notifications** every 30 seconds
✅ **Task management** with priority levels
✅ **Calendar events** with time and location
✅ **Real-time sync** with backend API
✅ **Offline mode** with local SQLite fallback

### Network Diagram:

```
Mobile Device (192.168.10.x)
    ↓
Wi-Fi Network (192.168.10.0/24)
    ↓
Your PC (192.168.10.8)
    ↓
Cortex API (Port 8080)
    ↓
SQLite Database
```

### Default Configuration:

✅ **UPDATED**: The mobile app now defaults to `http://192.168.10.8:8080` for easier setup with physical devices.
- Emulator users can change this to `http://localhost:8080` in Profile settings
- Physical device users can use the default or update if your IP changed

### Security Note:

This setup is for development only. For production:
- Use HTTPS
- Implement proper authentication
- Use environment-specific configurations
- Consider using ngrok or similar for external access