# CallItEven - One-Click Startup Script (PowerShell)
# Verifies prerequisites, starts services, confirms everything works

$ErrorActionPreference = 'SilentlyContinue'
$ProjectDir = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CallItEven - Starting Up" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# =============================================
# PHASE 1: Prerequisite Checks
# =============================================
Write-Host "--- Checking prerequisites ---" -ForegroundColor Yellow
Write-Host ""

$fail = $false

# Check Node.js
if (Get-Command node -ErrorAction SilentlyContinue) {
    $nodeVer = node -v
    Write-Host "[OK] Node.js $nodeVer" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Node.js is not installed or not in PATH" -ForegroundColor Red
    $fail = $true
}

# Check PM2
if (-not (Get-Command pm2 -ErrorAction SilentlyContinue)) {
    Write-Host "[WARN] PM2 not found - installing..." -ForegroundColor Yellow
    npm install -g pm2 2>&1 | Out-Null
    if (Get-Command pm2 -ErrorAction SilentlyContinue) {
        Write-Host "[OK] PM2 installed" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] Could not install PM2" -ForegroundColor Red
        $fail = $true
    }
} else {
    Write-Host "[OK] PM2 found" -ForegroundColor Green
}

# Find MongoDB
$mongodPath = $null
if (Get-Command mongod -ErrorAction SilentlyContinue) {
    $mongodPath = "mongod"
    Write-Host "[OK] MongoDB found in PATH" -ForegroundColor Green
} else {
    # Search common install locations
    $searchPaths = @(
        "C:\Program Files\MongoDB\Server\*\bin\mongod.exe",
        "C:\MongoDB\bin\mongod.exe"
    )
    foreach ($pattern in $searchPaths) {
        $found = Get-Item $pattern -ErrorAction SilentlyContinue | Select-Object -Last 1
        if ($found) {
            $mongodPath = $found.FullName
            Write-Host "[OK] MongoDB found at $mongodPath" -ForegroundColor Green
            break
        }
    }
    if (-not $mongodPath) {
        # Check if already running
        if (Get-Process mongod -ErrorAction SilentlyContinue) {
            Write-Host "[OK] MongoDB is already running" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] MongoDB not found and not running" -ForegroundColor Red
            Write-Host "       Install from https://www.mongodb.com/try/download/community" -ForegroundColor Gray
            $fail = $true
        }
    }
}

# Check Nginx
if (Test-Path "C:\nginx\nginx.exe") {
    Write-Host "[OK] Nginx found at C:\nginx" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Nginx not found at C:\nginx\nginx.exe" -ForegroundColor Red
    Write-Host "       Download from https://nginx.org/en/download.html" -ForegroundColor Gray
    $fail = $true
}

# Build frontend (always rebuild to pick up source changes)
Write-Host "[..] Building frontend..." -ForegroundColor Yellow
Push-Location "$ProjectDir\frontend"
npm run build 2>&1 | Out-Null
Pop-Location
if (Test-Path "$ProjectDir\frontend\build\index.html") {
    Write-Host "[OK] Frontend built successfully" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Frontend build failed" -ForegroundColor Red
    $fail = $true
}

# Check backend .env
if (Test-Path "$ProjectDir\backend\.env") {
    Write-Host "[OK] Backend .env exists" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend .env is missing - copy .env.example and configure it" -ForegroundColor Red
    $fail = $true
}

# Check backend node_modules
if (Test-Path "$ProjectDir\backend\node_modules") {
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
} else {
    Write-Host "[WARN] Backend dependencies missing - installing..." -ForegroundColor Yellow
    Push-Location "$ProjectDir\backend"
    npm install 2>&1 | Out-Null
    Pop-Location
    Write-Host "[OK] Backend dependencies installed" -ForegroundColor Green
}

Write-Host ""
if ($fail) {
    Write-Host "[!!] One or more prerequisites failed. Fix the issues above and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "--- All prerequisites OK ---" -ForegroundColor Green
Write-Host ""

# =============================================
# PHASE 2: Start Services
# =============================================
Write-Host "--- Starting services ---" -ForegroundColor Yellow
Write-Host ""

# 1. MongoDB
if (Get-Process mongod -ErrorAction SilentlyContinue) {
    Write-Host "[OK] MongoDB is already running" -ForegroundColor Green
} else {
    Write-Host "[..] Starting MongoDB..."
    if (-not (Test-Path "C:\data\db")) { New-Item -ItemType Directory -Path "C:\data\db" -Force | Out-Null }
    Start-Process -FilePath $mongodPath -ArgumentList "--dbpath", "C:\data\db" -WindowStyle Hidden
    Start-Sleep -Seconds 3
    if (Get-Process mongod -ErrorAction SilentlyContinue) {
        Write-Host "[OK] MongoDB started" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] MongoDB failed to start" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# 2. Backend (PM2)
Write-Host "[..] Starting backend..."
pm2 stop calliteven-api 2>&1 | Out-Null
pm2 delete calliteven-api 2>&1 | Out-Null

# Kill anything on port 5000
$portProcs = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
foreach ($p in $portProcs) {
    Stop-Process -Id $p.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 1

Push-Location "$ProjectDir\backend"
pm2 start ecosystem.config.js 2>&1 | Out-Null
Pop-Location
Start-Sleep -Seconds 4

# 3. Nginx
Write-Host "[..] Starting Nginx..."
Copy-Item "$ProjectDir\nginx.conf" "C:\nginx\conf\nginx.conf" -Force

# Kill stale Nginx
if (Get-Process nginx -ErrorAction SilentlyContinue) {
    & "C:\nginx\nginx.exe" -p "C:\nginx" -s quit 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 1
}

$nginxBat = Join-Path $ProjectDir "start-nginx.bat"
$psi = New-Object System.Diagnostics.ProcessStartInfo
$psi.FileName = $nginxBat
$psi.WorkingDirectory = "C:\nginx"
$psi.UseShellExecute = $true
$psi.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
[System.Diagnostics.Process]::Start($psi) | Out-Null
Start-Sleep -Seconds 2

Write-Host ""

# =============================================
# PHASE 3: Verify Everything
# =============================================
Write-Host "--- Verifying services ---" -ForegroundColor Yellow
Write-Host ""

$allOk = $true

# MongoDB
if (Get-Process mongod -ErrorAction SilentlyContinue) {
    Write-Host "[OK] MongoDB running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] MongoDB not running" -ForegroundColor Red
    $allOk = $false
}

# PM2 Backend
$pm2Pid = (pm2 pid calliteven-api 2>&1).Trim()
if ($pm2Pid -and $pm2Pid -ne "0" -and $pm2Pid -ne "") {
    Write-Host "[OK] Backend running (PID $pm2Pid)" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Backend not running" -ForegroundColor Red
    pm2 logs calliteven-api --lines 5 --nostream 2>&1
    $allOk = $false
}

# Nginx
if (Get-Process nginx -ErrorAction SilentlyContinue) {
    Write-Host "[OK] Nginx running" -ForegroundColor Green
} else {
    Write-Host "[FAIL] Nginx not running" -ForegroundColor Red
    $allOk = $false
}

# API health check
Write-Host "[..] Testing API..."
try {
    $health = Invoke-RestMethod -Uri http://localhost/api/health -TimeoutSec 5
    Write-Host "[OK] API responding: $($health.message)" -ForegroundColor Green
} catch {
    Write-Host "[WARN] API check failed - may need a moment" -ForegroundColor Yellow
}

# Frontend check
Write-Host "[..] Testing frontend..."
try {
    $page = Invoke-WebRequest -Uri http://localhost -UseBasicParsing -TimeoutSec 5
    Write-Host "[OK] Frontend serving (Status $($page.StatusCode))" -ForegroundColor Green
} catch {
    Write-Host "[WARN] Frontend check failed" -ForegroundColor Yellow
}

Write-Host ""

# =============================================
# PHASE 4: Summary
# =============================================
if ($allOk) {
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  CallItEven is running!" -ForegroundColor Green
    Write-Host "  Open http://localhost in your browser" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
} else {
    Write-Host "========================================" -ForegroundColor Yellow
    Write-Host "  Some services had issues." -ForegroundColor Yellow
    Write-Host "  Check messages above." -ForegroundColor Yellow
    Write-Host "  Try http://localhost anyway" -ForegroundColor Yellow
    Write-Host "========================================" -ForegroundColor Yellow
}
Write-Host ""
Write-Host "To stop everything, run stop.ps1" -ForegroundColor Gray
Read-Host "Press Enter to close"
