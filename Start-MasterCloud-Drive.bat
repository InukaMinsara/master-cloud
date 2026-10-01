@echo off
title MASTER CLOUD (10 TB) - Virtual Drive Engine
cd /d "%~dp0"
echo ===============================================================================
echo  MASTER CLOUD (10 TB) - Starting Virtual Local Drive (Z:)
echo ===============================================================================
node scripts\master-cloud-daemon.mjs
pause
