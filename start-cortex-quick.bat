@echo off
color 0A
title Cortex Mobile App - Quick Start (Skip Checks)

echo.
echo  ========================================================
echo    CORTEX MOBILE APP - QUICK START
echo  ========================================================
echo.
echo  This version skips dependency checks and starts faster!
echo  Use this after running start-cortex.bat at least once.
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

echo  [1/2] Starting API Server (port 8080)...
start "Cortex API Server" cmd /k "title Cortex API Server && color 0B && cd src\cortex-api && python -m cortex_api"
timeout /t 2 /nobreak >nul
echo  [OK] API Server starting...
echo.

echo  [2/2] Starting Expo Metro Bundler (port 8081)...
start "Cortex Mobile - Expo" cmd /k "title Cortex Mobile - Expo && color 0E && cd cortex-mobile && npx expo start --lan"
timeout /t 2 /nobreak >nul
echo  [OK] Expo Metro starting...
echo.

echo  ========================================================
echo    SERVICES STARTED!
echo  ========================================================
echo.
echo  Two windows opened:
echo    [1] API Server (BLUE) - port 8080
echo    [2] Expo Metro (YELLOW) - port 8081
echo.
echo  Wait 10-30 seconds for QR code to appear
echo.
echo  ========================================================
echo    CONNECT YOUR PHONE
echo  ========================================================
echo.
echo  Option 1: Scan QR Code
echo    - Open Expo Go app
echo    - Scan QR from yellow window
echo.
echo  Option 2: Manual Entry
echo    - Open Expo Go app
echo    - Enter: exp://192.168.10.8:8081
echo.
echo  ========================================================
echo.
echo  Press any key to close this window...
echo  (Keep the other two windows open!)
echo.
pause >nul

@REM Made with Bob
