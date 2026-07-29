@echo off
title Ticket System Installer Builder
echo ========================================================
echo         TICKET SYSTEM ELECTRON INSTALLER BUILDER
echo ========================================================
echo.
echo This script will rebuild your Windows desktop installer
echo incorporating all the new self-healing and startup fixes.
echo.
echo Installing any missing dependencies first...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo WARNING: npm install failed. Proceeding to build anyway...
)
echo.
echo Building the installer...
call npm run dist
if %errorlevel% neq 0 (
    echo.
    echo ========================================================
    echo ERROR: Rebuild failed.
    echo Please make sure Node.js is installed from https://nodejs.org
    echo and that you have restarted your computer or terminal.
    echo ========================================================
    pause
    exit /b 1
)
echo.
echo ========================================================
echo SUCCESS! Your new installer is ready:
echo dist\TicketSystem Setup 1.0.0.exe
echo ========================================================
pause
