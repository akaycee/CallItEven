@echo off
:: CallItEven - Full Installation Script
:: Takes you from a fresh clone to a running application
:: Prerequisites: Node.js and MongoDB must already be installed

setlocal enabledelayedexpansion

echo ========================================
echo   CallItEven - Installation
echo ========================================
echo.

:: -----------------------------------------------
:: Step 0: Check prerequisites
:: -----------------------------------------------
echo [..] Checking prerequisites...

where node >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Node.js is not installed or not in PATH.
    echo        Download from https://nodejs.org/
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do echo        Node.js %%i found

where npm >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] npm is not installed or not in PATH.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do echo        npm %%i found

where mongod >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [WARN] mongod is not in PATH. MongoDB may not be installed.
    echo        Download from https://www.mongodb.com/try/download/community
    echo        If it is installed, make sure the bin folder is in your PATH.
    echo.
    set /p CONTINUE="Continue anyway? (y/N): "
    if /I not "!CONTINUE!"=="y" exit /b 1
)
echo [OK] Prerequisites check passed
echo.

:: -----------------------------------------------
:: Step 1: Install backend dependencies
:: -----------------------------------------------
echo [..] Installing backend dependencies...
cd /d %~dp0backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Backend npm install failed
    pause
    exit /b 1
)
echo [OK] Backend dependencies installed
echo.

:: -----------------------------------------------
:: Step 2: Install frontend dependencies
:: -----------------------------------------------
echo [..] Installing frontend dependencies...
cd /d %~dp0frontend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Frontend npm install failed
    pause
    exit /b 1
)
echo [OK] Frontend dependencies installed
echo.

:: -----------------------------------------------
:: Step 3: Build frontend for production
:: -----------------------------------------------
echo [..] Building frontend (this may take a minute)...
cd /d %~dp0frontend
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] Frontend build failed
    pause
    exit /b 1
)
echo [OK] Frontend built successfully
echo.

:: -----------------------------------------------
:: Step 4: Create backend .env if it doesn't exist
:: -----------------------------------------------
cd /d %~dp0backend
if not exist .env (
    echo [..] Creating backend .env file...

    :: Generate a random JWT secret using Node.js
    for /f "tokens=*" %%s in ('node -e "process.stdout.write(require('crypto').randomBytes(64).toString('hex'))"') do set JWT_SECRET=%%s

    (
        echo PORT=5000
        echo MONGODB_URI=mongodb://localhost:27017/calliteven
        echo JWT_SECRET=!JWT_SECRET!
        echo NODE_ENV=production
    ) > .env

    echo [OK] .env created with generated JWT_SECRET
) else (
    echo [OK] .env already exists - skipping
)
echo.

:: -----------------------------------------------
:: Step 5: Create logs directory
:: -----------------------------------------------
if not exist "%~dp0backend\logs" (
    mkdir "%~dp0backend\logs"
    echo [OK] Created backend\logs directory
) else (
    echo [OK] backend\logs directory already exists
)
echo.

:: -----------------------------------------------
:: Step 6: Create MongoDB data directory
:: -----------------------------------------------
if not exist "C:\data\db" (
    echo [..] Creating MongoDB data directory C:\data\db...
    mkdir "C:\data\db"
    echo [OK] MongoDB data directory created
) else (
    echo [OK] MongoDB data directory already exists
)
echo.

:: -----------------------------------------------
:: Step 7: Install PM2 globally
:: -----------------------------------------------
echo [..] Installing PM2 globally...
call npm install -g pm2 >NUL 2>&1
where pm2 >NUL 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [FAIL] PM2 installation failed
    pause
    exit /b 1
)
echo [OK] PM2 installed
echo.

:: -----------------------------------------------
:: Step 8: Check for Nginx
:: -----------------------------------------------
if exist "C:\nginx\nginx.exe" (
    echo [OK] Nginx found at C:\nginx
    :: Copy nginx config if not already there
    if exist "%~dp0nginx.conf" (
        copy /Y "%~dp0nginx.conf" "C:\nginx\conf\nginx.conf" >NUL
        echo [OK] nginx.conf copied to C:\nginx\conf\
    )
) else (
    echo [WARN] Nginx not found at C:\nginx
    echo        To complete setup:
    echo        1. Download Nginx from https://nginx.org/en/download.html
    echo        2. Extract to C:\nginx
    echo        3. Copy nginx.conf from this project to C:\nginx\conf\nginx.conf
    echo           or run: copy "%~dp0nginx.conf" C:\nginx\conf\nginx.conf
)
echo.

:: -----------------------------------------------
:: Done
:: -----------------------------------------------
echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Make sure MongoDB is running
echo   2. Run start.bat to launch the application
echo   3. Open http://localhost in your browser
echo.
pause
