# CallItEven - Shutdown Script (PowerShell)

$ErrorActionPreference = 'SilentlyContinue'

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  CallItEven - Stopping Services" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Stop Nginx
if (Get-Process nginx -ErrorAction SilentlyContinue) {
    Write-Host "[..] Stopping Nginx..."
    & "C:\nginx\nginx.exe" -p "C:\nginx" -s quit 2>&1 | Out-Null
    Start-Sleep -Seconds 2
    Get-Process nginx -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] Nginx stopped" -ForegroundColor Green
} else {
    Write-Host "[--] Nginx is not running" -ForegroundColor Gray
}

# 2. Stop backend
Write-Host "[..] Stopping backend..."
pm2 stop calliteven-api 2>&1 | Out-Null
pm2 delete calliteven-api 2>&1 | Out-Null
Write-Host "[OK] Backend stopped" -ForegroundColor Green

# 3. Optionally stop MongoDB
Write-Host ""
$answer = Read-Host "Stop MongoDB too? (y/N)"
if ($answer -eq 'y' -or $answer -eq 'Y') {
    Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] MongoDB stopped" -ForegroundColor Green
} else {
    Write-Host "[--] MongoDB left running" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  All services stopped" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Read-Host "Press Enter to close"
