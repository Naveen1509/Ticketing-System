@echo off
setlocal
set "CONFIG_FILE=%~dp0client-url.txt"

if not exist "%CONFIG_FILE%" (
  start "" "http://localhost:3000/user-login.html"
  exit /b 0
)

set /p TARGET_URL=<"%CONFIG_FILE%"
if "%TARGET_URL%"=="" set "TARGET_URL=http://localhost:3000/user-login.html"

start "" "%TARGET_URL%"
