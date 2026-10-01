@echo off
title MASTER CLOUD - Local Z: Drive Installer
echo.
echo  ============================================================
echo   MASTER CLOUD - 10 TB Local Drive (Z:) Setup ^& Auto-Start
echo  ============================================================
echo.

node "%~dp0scripts\webdav-server.mjs" --install

echo.
echo  Opening Z:\ Drive in Windows Explorer...
explorer.exe "Z:\"
pause
