@echo off
echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.cmd >nul 2>&1
timeout /t 2 /nobreak >nul
echo Starting BLOXPVP Frontend Server...
npm run dev -- --port 5173 --host 0.0.0.0
pause