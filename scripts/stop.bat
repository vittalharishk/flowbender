@echo off
set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
cd /d "F:\flowbender"
echo Stopping Flowbender...
call "%APPDATA%\npm\pm2.cmd" stop flowbender
call "%APPDATA%\npm\pm2.cmd" save
echo Flowbender stopped.
