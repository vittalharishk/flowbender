@echo off
setlocal enabledelayedexpansion

echo ================================================================
echo           FINALIZE RENAME: F:\showrunner -^> F:\flowbender
echo ================================================================
echo.
echo NOTE: Please make sure Antigravity IDE or VS Code is CLOSED
echo before running this script so that file locks on F:\showrunner
echo are released.
echo.
pause

set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"

echo Stopping PM2 flowbender service...
call "%APPDATA%\npm\pm2.cmd" stop flowbender >nul 2>&1

echo Removing temporary junction F:\flowbender if it exists...
if exist "F:\flowbender" (
    rmdir "F:\flowbender"
)

echo Renaming physical directory F:\showrunner to F:\flowbender...
ren "F:\showrunner" "flowbender"
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Could not rename F:\showrunner. A file or folder is still in use.
    echo Please make sure Antigravity IDE, terminals, and editors are closed.
    echo Restoring junction...
    mklink /J "F:\flowbender" "F:\showrunner"
    call "%APPDATA%\npm\pm2.cmd" start flowbender
    pause
    exit /b 1
)

echo Creating backward-compatible junction F:\showrunner -^> F:\flowbender...
mklink /J "F:\showrunner" "F:\flowbender"

echo Restarting PM2 flowbender service...
cd /d "F:\flowbender"
call "%APPDATA%\npm\pm2.cmd" start ecosystem.config.js
call "%APPDATA%\npm\pm2.cmd" save

echo.
echo ================================================================
echo SUCCESS!
echo - Physical folder is now: F:\flowbender
echo - Compatibility junction: F:\showrunner -^> F:\flowbender
echo You can now open F:\flowbender in your IDE.
echo ================================================================
pause
