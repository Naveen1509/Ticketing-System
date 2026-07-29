@echo off
setlocal
cd /d "%~dp0\..\"

echo Starting IT Ticket System server...
start "" "http://localhost:3000/admin-login.html"
node Server.js
