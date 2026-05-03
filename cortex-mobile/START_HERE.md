# 🚀 Cortex Mobile App - Complete Startup Guide

## Prerequisites Check

Before starting, ensure you have:
- ✅ Node.js installed (v16 or higher)
- ✅ Expo Go app installed on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- ✅ Phone and PC on same Wi-Fi network
- ✅ Python 3.8+ installed (for API server)

---

## 🎯 Step-by-Step Startup

### Step 1: Start the API Server

**Open Terminal 1:**
```bash
# Navigate to API directory
cd src/cortex-api

# Install dependencies (first time only)
pip install -r requirements.txt

# Start the API server
python -m cortex_api
```

**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8080 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

✅ **API is now running on port 8080**

---

### Step 2: Configure Firewall (One-time setup)

**Open PowerShell as Administrator:**
```powershell
# Navigate to mobile directory
cd cortex-mobile

# Run the firewall fix script
.\fix-expo-connection.ps1
```

This will:
- Check your network configuration
- Add firewall rules for Expo (port 8081)
- Verify connectivity
- Show connection URLs

✅ **Firewall is now configured**

---

### Step 3: Start Expo Metro Bundler

**Open Terminal 2:**
```bash
# Navigate to mobile directory
cd cortex-mobile

# Install dependencies (first time only)
npm install

# Start Expo in LAN mode
npx expo start --lan --clear
```

**Expected Output:**
```
› Metro waiting on exp://192.168.10.8:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press r │ reload app
› Press m │ toggle menu
› Press ? │ show all commands
```

✅ **Expo Metro is now running**

---

### Step 4: Connect Your Phone

**Option A: Scan QR Code (Easiest)**
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"**
3. Scan the QR code shown in Terminal 2
4. Wait for app to load (may take 1-2 minutes first time)

**Option B: Manual URL Entry (If QR fails)**
1. Open **Expo Go** app on your phone
2. Tap **"Enter URL manually"**
3. Enter: `exp://192.168.10.8:8081`
4. Tap **"Connect"**

**Option C: Tunnel Mode (If both fail)**
```bash
# Stop Expo (Ctrl+C in Terminal 2)
# Restart with tunnel
npx expo start --tunnel
```
Then scan the new QR code (works across any network)

✅ **App should now be loading on your phone**

---

### Step 5: Configure API Connection in App

Once the app loads:

1. **Go to Profile/More tab**
2. **Tap Settings** (if available) or look for API configuration
3. **Enter API Base URL:** `http://192.168.10.8:8080`
4. **Enter Token:** Get from your `.env` file (DIARY_TOKEN value)
5. **Tap "Test Connection"** to verify
6. **Save settings**

✅ **App is now connected to API**

---

## 🔍 Troubleshooting

### Problem: "Unable to connect to Metro"

**Solution 1: Check Network**
```bash
# On PC, verify IP
ipconfig | findstr "IPv4"
# Should show: 192.168.10.8

# On phone, check Wi-Fi settings
# Should show IP like: 192.168.10.x (same network)
```

**Solution 2: Use Tunnel Mode**
```bash
cd cortex-mobile
npx expo start --tunnel
```

**Solution 3: Test in Browser First**
- Open phone's browser
- Go to: `http://192.168.10.8:8081`
- Should see "Metro Bundler" page
- If this works, Expo Go should work too

### Problem: "Network request failed" in app

**Solution: Check API Server**
```bash
# Verify API is running
curl http://localhost:8080/health

# Should return: {"status":"ok","version":"..."}
```

**Solution: Check Firewall**
```powershell
# Run as Administrator
New-NetFirewallRule -DisplayName "Cortex API" -Direction Inbound -LocalPort 8080 -Protocol TCP -Action Allow
```

### Problem: App loads but shows errors

**Solution: Clear Cache**
```bash
# Stop Expo (Ctrl+C)
# Clear cache and restart
npx expo start --clear
```

---

## 📱 Quick Commands Reference

### Start Everything
```bash
# Terminal 1: API Server
cd src/cortex-api && python -m cortex_api

# Terminal 2: Mobile App
cd cortex-mobile && npx expo start --lan
```

### Stop Everything
- Press `Ctrl+C` in both terminals

### Restart with Clean State
```bash
# Terminal 2
npx expo start --clear --lan
```

### Check What's Running
```bash
# Check API (port 8080)
netstat -ano | findstr "8080"

# Check Expo (port 8081)
netstat -ano | findstr "8081"
```

---

## 🎯 Success Checklist

- [ ] API server running on port 8080
- [ ] Expo Metro running on port 8081
- [ ] Firewall rules added for both ports
- [ ] Phone on same Wi-Fi network (192.168.10.x)
- [ ] Expo Go app installed on phone
- [ ] App loaded on phone via QR or manual URL
- [ ] API connection configured in app
- [ ] Test connection successful

---

## 🆘 Still Having Issues?

### Check Logs
**API Server Logs:** Look in Terminal 1 for errors
**Expo Logs:** Look in Terminal 2 for errors
**Phone Logs:** Shake phone → "Show Dev Menu" → "Debug Remote JS"

### Common Error Messages

**"ECONNREFUSED"**
- API server not running
- Wrong IP address
- Firewall blocking

**"Network request failed"**
- Phone not on same network
- API URL incorrect in app settings
- Firewall blocking port 8080

**"Unable to resolve host"**
- DNS issue
- Use IP address instead of hostname
- Check network connectivity

### Get Help
1. Check `QR_CONNECTION_TROUBLESHOOTING.md`
2. Check `MOBILE_SETUP.md`
3. Run `fix-expo-connection.ps1` for diagnostics

---

## 📊 Your Network Configuration

```
PC (Windows):
├── Wi-Fi IP: 192.168.10.8
├── WSL IP: 172.27.48.1
├── API Server: http://0.0.0.0:8080
└── Expo Metro: http://0.0.0.0:8081

Phone:
├── Wi-Fi IP: 192.168.10.x (must be same network)
├── Expo Go App: Connects to exp://192.168.10.8:8081
└── API Calls: http://192.168.10.8:8080
```

---

## 🎉 You're All Set!

Once everything is running:
- **Timeline**: View all your entries
- **Search**: Find entries by keyword
- **Capture**: Add new notes/ideas/fixes
- **Chat**: AI-powered chat with your knowledge
- **GitHub**: View GitHub activity
- **Report**: Generate daily reports
- **Automations**: Manage automations
- **Wellness**: Track breaks and wellness
- **Ideas**: Idea mapping
- **Analytics**: View analytics
- **Profile**: Manage settings
- **Settings**: Configure API and token (NEW!)

Enjoy using Cortex! 🚀