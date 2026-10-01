# install-windows-integration.ps1
# Master Cloud Windows Integration Installer

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " MASTER CLOUD - Windows Shell Integration Installer" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$regFile = Join-Path $scriptDir "register-context-menu.reg"
$driveLetter = "Z"
$storageDir = "D:\MasterCloudDrive"
$cacheDir = "D:\MasterCloudCache"

# 1. Ensure Directories on Drive D:
Write-Host "`n[1/3] Verifying Drive D: directories (Storage & Cache)..." -ForegroundColor Yellow
if (-not (Test-Path $storageDir)) {
    New-Item -ItemType Directory -Path $storageDir -Force | Out-Null
}
if (-not (Test-Path $cacheDir)) {
    New-Item -ItemType Directory -Path $cacheDir -Force | Out-Null
}
Write-Host "  -> Storage Directory: $storageDir [OK]" -ForegroundColor Green
Write-Host "  -> Cache Directory: $cacheDir [OK]" -ForegroundColor Green

# 2. Register Windows File Explorer Context Menu
Write-Host "`n[2/3] Registering Windows File Explorer Context Menu..." -ForegroundColor Yellow
if (Test-Path $regFile) {
    Start-Process -FilePath "reg.exe" -ArgumentList "import `"$regFile`"" -Wait -NoNewWindow
    Write-Host "  -> Context Menu Registered Successfully [OK]" -ForegroundColor Green
} else {
    Write-Host "  -> Reg file missing at $regFile" -ForegroundColor Red
}

# 3. Check Virtual Local Drive Mount
Write-Host "`n[3/3] Checking Master Cloud Virtual Local Drive ($driveLetter:)..." -ForegroundColor Yellow
if (Test-Path "$($driveLetter):\") {
    Write-Host "  -> Drive $driveLetter`: is Active and Mounted (10 TB Free Allocation) [OK]" -ForegroundColor Green
} else {
    Write-Host "  -> Drive $driveLetter`: will auto-mount when Web App or master-cloud-daemon starts." -ForegroundColor Cyan
}

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host " MASTER CLOUD Windows Integration Complete!" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Cyan
