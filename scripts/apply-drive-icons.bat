@echo off
echo ===================================================
echo   Applying Master Cloud & Master Storage 90TB Icons
echo ===================================================

set "ICO_PATH=C:\Users\HP\.mastercloud\drive-icon.ico"

:: Register Drive I: (90 TB) Icon & Label
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\I\DefaultIcon" /ve /t REG_SZ /d "%ICO_PATH%" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\I\DefaultLabel" /ve /t REG_SZ /d "MASTER STORAGE (90 TB)" /f

:: Register Drive Z: (10 TB) Icon & Label
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\Z\DefaultIcon" /ve /t REG_SZ /d "%ICO_PATH%" /f
reg add "HKLM\SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\DriveIcons\Z\DefaultLabel" /ve /t REG_SZ /d "MASTER CLOUD (10 TB)" /f

:: Refresh Windows Explorer and Shell Icon Cache
ie4uinit.exe -show >nul 2>&1
taskkill /f /im explorer.exe >nul 2>&1
start explorer.exe shell:MyComputerFolder

echo Done!
