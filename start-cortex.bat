@echo off
color 0A
title Cortex Mobile App - One-Click Startup

echo.
echo  ========================================================
echo    CORTEX MOBILE APP - AUTOMATED STARTUP
echo  ========================================================
echo.
echo  This script will automatically:
echo    [1] Check and install dependencies
echo    [2] Configure Windows Firewall
echo    [3] Start API Server (port 8080)
echo    [4] Start Expo Metro (port 8081)
echo    [5] Display connection instructions
echo.
echo  ========================================================
echo.

REM Check if we're in the right directory
if not exist "cortex-mobile" (
    echo  [ERROR] Please run this script from the IBM-Bob directory
    echo  Current directory: %CD%
    echo.
    pause
    exit /b 1
)

echo  [STEP 1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python is not installed or not in PATH
    echo  Please install Python 3.8+ from https://www.python.org/
    echo.
    pause
    exit /b 1
)
echo  [OK] Python is installed
echo.

echo  [STEP 2/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js is not installed or not in PATH
    echo  Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo  [OK] Node.js is installed
echo.

echo  [STEP 3/5] Installing/Checking dependencies...
echo.
echo  - Checking Python dependencies...
cd src\cortex-api
if not exist "venv" (
    echo    Installing Python packages (first time only, ~30 seconds)...
    pip install -q -r requirements.txt
) else (
    echo    [OK] Python dependencies already installed
)
cd ..\..
echo.
echo  - Checking Node.js dependencies...
cd cortex-mobile
if not exist "node_modules" (
    echo.
    echo    ============================================
    echo     FIRST-TIME SETUP: Installing npm packages
    echo    ============================================
    echo.
    echo     This will take 2-5 minutes (only once!)
    echo     Progress will be shown below...
    echo.
    call npm install
    echo.
    echo    [OK] npm packages installed successfully!
) else (
    echo    [OK] npm packages already installed (skipping)
)
cd ..
echo.

echo  [STEP 4/5] Configuring Windows Firewall...
echo  Checking if firewall rules exist...
netsh advfirewall firewall show rule name="Cortex API" >nul 2>&1
if errorlevel 1 (
    echo  Adding firewall rule for API (port 8080)...
    netsh advfirewall firewall add rule name="Cortex API" dir=in action=allow protocol=TCP localport=8080 >nul 2>&1
    if errorlevel 1 (
        echo  [WARNING] Could not add firewall rule automatically
        echo  You may need to run this script as Administrator
        echo  Or manually allow port 8080 in Windows Firewall
    ) else (
        echo  [OK] Firewall rule added for port 8080
    )
) else (
    echo  [OK] Firewall rule already exists for port 8080
)

netsh advfirewall firewall show rule name="Cortex Expo Metro" >nul 2>&1
if errorlevel 1 (
    echo  Adding firewall rule for Expo (port 8081)...
    netsh advfirewall firewall add rule name="Cortex Expo Metro" dir=in action=allow protocol=TCP localport=8081 >nul 2>&1
    if errorlevel 1 (
        echo  [WARNING] Could not add firewall rule automatically
        echo  You may need to run this script as Administrator
    ) else (
        echo  [OK] Firewall rule added for port 8081
    )
) else (
    echo  [OK] Firewall rule already exists for port 8081
)
echo.

echo  [STEP 5/5] Starting services...
echo.
echo  Starting API Server (port 8080)...
start "Cortex API Server" cmd /k "title Cortex API Server && color 0B && cd src\cortex-api && python -m cortex_api"
timeout /t 2 /nobreak >nul

echo  Starting Expo Metro Bundler (port 8081)...
start "Cortex Mobile - Expo" cmd /k "title Cortex Mobile - Expo && color 0E && cd cortex-mobile && npx expo start --lan"
timeout /t 2 /nobreak >nul

echo.
echo  ========================================================
echo    SERVICES STARTED SUCCESSFULLY!
echo  ========================================================
echo.
echo  Two new windows have opened:
echo    [1] Cortex API Server (BLUE) - Running on port 8080
echo    [2] Cortex Mobile - Expo (YELLOW) - Running on port 8081
echo.
echo  --------------------------------------------------------
echo    WAIT 10-30 SECONDS FOR SERVICES TO FULLY START
echo  --------------------------------------------------------
echo.
echo  You will see:
echo    - API Server: "Uvicorn running on http://0.0.0.0:8080"
echo    - Expo: QR code displayed
echo.
echo  ========================================================
echo    CONNECT YOUR PHONE TO THE APP
echo  ========================================================
echo.
echo  OPTION 1: Scan QR Code (Easiest)
echo  --------------------------------
echo    1. Open "Expo Go" app on your phone
echo    2. Tap "Scan QR code"
echo    3. Scan the QR code from the Expo window (YELLOW)
echo    4. Wait for app to load (1-2 minutes first time)
echo.
echo  OPTION 2: Manual URL Entry
echo  ---------------------------
echo    1. Open "Expo Go" app on your phone
echo    2. Tap "Enter URL manually"
echo    3. Type: exp://192.168.10.8:8081
echo    4. Tap "Connect"
echo.
echo  OPTION 3: If Connection Fails
echo  ------------------------------
echo    - Make sure phone is on same Wi-Fi network
echo    - Phone IP should be 192.168.10.x (check Wi-Fi settings)
echo    - In Expo window, press 'r' to reload
echo    - Or close Expo window and run this script again
echo.
echo  ========================================================
echo    CONFIGURE APP AFTER IT LOADS
echo  ========================================================
echo.
echo  Once the app loads on your phone:
echo    1. Go to "Profile" or "More" tab
echo    2. Find "Settings" or API configuration
echo    3. Enter API URL: http://192.168.10.8:8080
echo    4. Enter Token: (get from .env file - DIARY_TOKEN)
echo    5. Tap "Test Connection"
echo    6. Save and start using the app!
echo.
echo  ========================================================
echo    TROUBLESHOOTING
echo  ========================================================
echo.
echo  If you see "Unable to connect":
echo    - Check both windows are still running
echo    - Verify phone is on Wi-Fi (not mobile data)
echo    - Try restarting: Close both windows and run this script again
echo.
echo  If app loads but shows errors:
echo    - Check API URL in app settings: http://192.168.10.8:8080
echo    - Make sure you entered the correct token
echo    - Test connection in app settings
echo.
echo  For detailed help, see: cortex-mobile\START_HERE.md
echo.
echo  ========================================================
echo.
echo  Press any key to close this window...
echo  (Keep the other two windows open!)
echo.
pause >nul

@REM Made with Bob
