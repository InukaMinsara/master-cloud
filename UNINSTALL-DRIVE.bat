@echo off
title MASTER CLOUD - Local Z: Drive Uninstaller
echo.
echo  ============================================================
echo   MASTER CLOUD - Removing Z: Drive ^& Startup Registration
echo  ============================================================
echo.

node "%~dp0scripts\webdav-server.mjs" --uninstall
pause
