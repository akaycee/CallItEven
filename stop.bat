@echo off
:: CallItEven Shutdown Script
:: Stops Nginx, Backend (PM2), and optionally MongoDB

echo ========================================
echo   CallItEven - Stopping Services
echo ========================================
echo.

:: 1. Stop Nginx
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I "nginx.exe" >NUL
if %ERRORLEVEL%==0 (
    echo [..] Stopping Nginx...
    cd /d C:\nginx
    nginx.exe -s quit
    echo [OK] Nginx stopped
) else (
    echo [--] Nginx is not running
)
echo.

:: 2. Stop PM2 backend
echo [..] Stopping backend...
pm2 stop calliteven-api >NUL 2>&1
pm2 delete calliteven-api >NUL 2>&1
echo [OK] Backend stopped
echo.

:: 3. Optionally stop MongoDB
set /p STOP_MONGO="Stop MongoDB too? (y/N): "
if /I "%STOP_MONGO%"=="y" (
    echo [..] Stopping MongoDB...
    taskkill /IM mongod.exe /F >NUL 2>&1
    echo [OK] MongoDB stopped
) else (
    echo [--] MongoDB left running
)
echo.

echo ========================================
echo   All services stopped
echo ========================================
pause
