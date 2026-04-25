@echo off
:: CallItEven - Shutdown (runs the PowerShell stop script)
powershell -ExecutionPolicy Bypass -File "%~dp0stop.ps1"
