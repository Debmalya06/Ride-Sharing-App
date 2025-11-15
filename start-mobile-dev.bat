@echo off
REM SmartRide Mobile Development Server Starter
REM This script starts the frontend on a network-accessible port

echo ============================================
echo SmartRide Mobile Development Server
echo ============================================
echo.

REM Get IP Address
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| find "IPv4"') do (
    set "IP=%%a"
    goto :found_ip
)

:found_ip
set "IP=%IP: =%"
echo Your IP Address: %IP%
echo.
echo ✅ Access your app on mobile at:
echo    http://%IP%:5173
echo.
echo ⚠️  Make sure:
echo    1. Mobile is on the same WiFi network
echo    2. Backend is running on port 8080 (if needed)
echo    3. Windows Firewall allows port 5173
echo.

cd client
echo Starting Vite Development Server...
echo.
npm run dev -- --host 0.0.0.0

pause
