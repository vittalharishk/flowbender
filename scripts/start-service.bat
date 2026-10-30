@echo off
setlocal enabledelayedexpansion

set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
cd /d "F:\flowbender"

:: Try to resurrect first if dump exists
call "%APPDATA%\npm\pm2.cmd" resurrect >nul 2>&1

:: Check if flowbender is running
call "%APPDATA%\npm\pm2.cmd" describe flowbender >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Starting Flowbender application...
    call "%APPDATA%\npm\pm2.cmd" start ecosystem.config.js
    call "%APPDATA%\npm\pm2.cmd" save
) else (
    echo Flowbender is already running under PM2.
)

endlocal
