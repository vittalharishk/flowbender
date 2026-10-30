@echo off
set "PATH=%APPDATA%\npm;C:\Program Files\nodejs;%PATH%"
cd /d "F:\flowbender"
call "%APPDATA%\npm\pm2.cmd" logs flowbender
