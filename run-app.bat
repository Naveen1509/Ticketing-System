@echo off
title Ticket System Desktop Launcher
echo ========================================================
echo               TICKET SYSTEM RUNNER
echo ========================================================
echo.
echo Launching the application directly using your local
echo Electron files...
echo.
start "" ".\node_modules\electron\dist\electron.exe" .
echo Application launched! You can close this window now.
timeout /t 3 >nul
exit
