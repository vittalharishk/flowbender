@echo off
set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
cd /d "F:\flowbender"
echo Restarting Flowbender...
call "%APPDATA%\npm\pm2.cmd" restart flowbender
call "%APPDATA%\npm\pm2.cmd" save
echo Done.
