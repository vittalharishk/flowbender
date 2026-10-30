@echo off
set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
cd /d "F:\flowbender"
echo ====================================================
echo               FLOWBENDER SERVICE STATUS
echo ====================================================
call "%APPDATA%\npm\pm2.cmd" status flowbender
echo.
echo Checking HTTP endpoint (http://localhost:3000)...
powershell -NoProfile -Command "try { $r = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3; Write-Host 'HTTP Status:' $r.StatusCode $r.StatusDescription -ForegroundColor Green } catch { Write-Host 'Application not responding on port 3000' -ForegroundColor Red }"
echo ====================================================
