@echo off
echo ========================================
echo  Last Race - Starting Project
echo ========================================

echo [1/2] Starting SERVER...
start "Last Race - Server" cmd /k "cd /d %~dp0server && npm install && npx nodemon index.js"

timeout /t 3 /nobreak > nul

echo [2/2] Starting CLIENT...
start "Last Race - Client" cmd /k "cd /d %~dp0client && npm install && npm run dev"

echo.
echo Both terminals launched.
echo   Server: http://localhost:3001
echo   Client: http://localhost:5173
echo.
pause
