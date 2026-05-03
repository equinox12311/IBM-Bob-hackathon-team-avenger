# 🚀 Cortex Mobile App - Quick Start

## ⚡ ONE-CLICK STARTUP

### How to Run:

1. **Navigate to project folder:**
   ```
   c:\Users\HP\Videos\cortex\IBM-Bob
   ```

2. **Double-click this file:**
   ```
   start-cortex.bat
   ```

3. **That's it!** The script will automatically:
   - ✅ Check Python & Node.js
   - ✅ Install dependencies
   - ✅ Configure firewall
   - ✅ Start API server
   - ✅ Start Expo Metro
   - ✅ Show connection instructions

---

## 📱 Connect Your Phone

After running `start-cortex.bat`, wait for the QR code to appear, then:

### Option 1: Scan QR Code (Easiest)
1. Open **Expo Go** app on your phone
2. Tap **"Scan QR code"**
3. Scan the QR code from the yellow window
4. Wait for app to load

### Option 2: Manual Entry
1. Open **Expo Go** app
2. Tap **"Enter URL manually"**
3. Type: `exp://192.168.10.8:8081`
4. Tap **"Connect"**

---

## ⚙️ Configure App (First Time Only)

Once app loads on your phone:

1. Go to **Profile** or **More** tab
2. Find **Settings**
3. Enter **API URL:** `http://192.168.10.8:8080`
4. Enter **Token:** (from `.env` file - look for `DIARY_TOKEN`)
5. Tap **"Test Connection"**
6. **Save** and start using!

---

## 🛑 How to Stop

- Close the two windows that opened (Blue and Yellow)
- Or press `Ctrl+C` in each window

---

## 🔄 How to Restart

- Just double-click `start-cortex.bat` again!

---

## ❓ Troubleshooting

### "Unable to connect to Metro"
- Make sure phone is on same Wi-Fi network (192.168.10.x)
- Check phone's Wi-Fi settings - should show IP like 192.168.10.x
- Try closing both windows and running `start-cortex.bat` again

### "Network request failed" in app
- Check API URL in app settings: `http://192.168.10.8:8080`
- Make sure you entered the correct token
- Tap "Test Connection" in settings

### Still not working?
- See detailed guide: `cortex-mobile\START_HERE.md`
- Or run diagnostic: `cortex-mobile\fix-expo-connection.ps1` (as Administrator)

---

## 📋 What You Need

- ✅ Python 3.8+ installed
- ✅ Node.js installed
- ✅ Expo Go app on your phone ([iOS](https://apps.apple.com/app/expo-go/id982107779) | [Android](https://play.google.com/store/apps/details?id=host.exp.exponent))
- ✅ Phone and PC on same Wi-Fi network

---

## 🎉 That's It!

Just double-click `start-cortex.bat` and follow the on-screen instructions!

**Everything else is automated!** 🚀