@echo off
:: CallItEven Startup Script
:: Starts MongoDB, Backend (PM2), and Nginx

echo ========================================
echo   CallItEven - Starting Services
echo ========================================
echo.

:: 1. Check if MongoDB is already running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
if %ERRORLEVEL%==0 (
    echo [OK] MongoDB is already running
) else (
    echo [..] Starting MongoDB...
    start /B "" mongod --dbpath C:\data\db >NUL 2>&1
    timeout /t 3 /nobreak >NUL
    tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I "mongod.exe" >NUL
    if %ERRORLEVEL%==0 (
        echo [OK] MongoDB started
    ) else (
        echo [FAIL] MongoDB failed to start. Check that mongod is in PATH and C:\data\db exists.
        pause
        exit /b 1
    )
)
echo.

:: 2. Start backend with PM2
echo [..] Starting backend with PM2...
cd /d C:\Users\anirudhk\Desktop\CallItEven\backend

:: Stop any existing instance first
pm2 stop calliteven-api >NUL 2>&1
pm2 delete calliteven-api >NUL 2>&1

pm2 start ecosystem.config.js >NUL 2>&1
timeout /t 3 /nobreak >NUL

:: Verify backend is running
pm2 status
echo.

:: 3. Copy nginx config from project
echo [..] Copying nginx.conf to C:\nginx\conf\...
copy /Y "%~dp0nginx.conf" "C:\nginx\conf\nginx.conf" >NUL 2>&1
if %ERRORLEVEL%==0 (
    echo [OK] nginx.conf copied
) else (
    echo [WARN] Could not copy nginx.conf - using existing config
)
echo.

:: 4. Check if Nginx is already running
tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I "nginx.exe" >NUL
if %ERRORLEVEL%==0 (
    echo [OK] Nginx is already running - reloading config...
    C:\nginx\nginx.exe -p C:\nginx -s reload
) else (
    echo [..] Starting Nginx...
    pushd C:\nginx
    start "" /B nginx.exe -p C:\nginx
    popd
    timeout /t 2 /nobreak >NUL
    tasklist /FI "IMAGENAME eq nginx.exe" 2>NUL | find /I "nginx.exe" >NUL
    if %ERRORLEVEL%==0 (
        echo [OK] Nginx started
    ) else (
        echo [FAIL] Nginx failed to start. Check C:\nginx\conf\nginx.conf
    )
)
echo.

echo ========================================
echo   CallItEven is running!
echo   Open http://localhost in your browser
echo ========================================
echo.
echo To stop everything, run stop.bat
pause
