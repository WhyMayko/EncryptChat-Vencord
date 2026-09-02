# ==============================================================================
# Encrypt Chat - Vencord One-Line Installer
#
#   iwr -useb https://raw.githubusercontent.com/WhyMayko/Encrypt-Chat-Vencord/main/install.ps1 | iex
# ==============================================================================

$ErrorActionPreference = "Stop"
$RepoOwner = "WhyMayko"
$RepoName  = "Encrypt-Chat-Vencord"
$Branch    = "main"
$RawBase   = "https://raw.githubusercontent.com/$RepoOwner/$RepoName/$Branch/dist"

$VencordDir  = Join-Path $env:APPDATA "Vencord"
$DistDir     = Join-Path $VencordDir "dist"
$SettingsDir = Join-Path $VencordDir "settings"
$SettingsFile = Join-Path $SettingsDir "settings.json"

Clear-Host
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "         Encrypt Chat - Vencord Installer          " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check if Vencord is installed
if (-not (Test-Path (Join-Path $DistDir "patcher.js"))) {
    Write-Host "[!] Vencord was not found on your system." -ForegroundColor Red
    Write-Host "Please install Vencord first from https://vencord.dev (click Download/Install) and run this command again." -ForegroundColor Yellow
    return
}

# 2. Backup existing bundle
$BackupDir = Join-Path $VencordDir "dist.bak"
if (-not (Test-Path $BackupDir)) {
    Write-Host "[+] Creating backup of current Vencord files in dist.bak..." -ForegroundColor Gray
    Copy-Item $DistDir $BackupDir -Recurse -Force
}

# 3. Close Discord
Write-Host "[+] Closing Discord to apply updates..." -ForegroundColor Yellow
Get-Process Discord, DiscordPTB, DiscordCanary, DiscordDevelopment -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 4. Download latest Encrypt Chat bundle files
Write-Host "[+] Downloading Encrypt Chat files..." -ForegroundColor Cyan
$FilesToDownload = @(
    "patcher.js",
    "preload.js",
    "renderer.js",
    "renderer.css",
    "vencordDesktopMain.js",
    "vencordDesktopPreload.js",
    "vencordDesktopRenderer.js",
    "vencordDesktopRenderer.css"
)

foreach ($f in $FilesToDownload) {
    $url = "$RawBase/$f"
    $out = Join-Path $DistDir $f
    try {
        Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
        Write-Host "  -> $f downloaded successfully!" -ForegroundColor Green
    } catch {
        Write-Host "  [!] Warning: Could not download $f (using local version if available)" -ForegroundColor DarkGray
    }
}

# 5. Configure settings.json
Write-Host "[+] Configuring plugin in settings.json..." -ForegroundColor Cyan
function Set-JsonProp($obj, $name, $val) {
    $obj | Add-Member -NotePropertyName $name -NotePropertyValue $val -Force
}

if (-not (Test-Path $SettingsDir)) {
    New-Item -ItemType Directory -Path $SettingsDir -Force | Out-Null
}

$j = $null
if (Test-Path $SettingsFile) {
    try {
        $j = Get-Content $SettingsFile -Raw | ConvertFrom-Json
    } catch {
        $j = [pscustomobject]@{}
    }
} else {
    $j = [pscustomobject]@{}
}

Set-JsonProp $j "autoUpdate" $false
Set-JsonProp $j "autoUpdateNotification" $false

if (-not $j.PSObject.Properties["plugins"]) {
    Set-JsonProp $j "plugins" ([pscustomobject]@{})
}

Set-JsonProp $j.plugins "EncryptChat" ([pscustomobject]@{
    enabled             = $true
    method              = "inspecttor_server"
    secretWord          = ""
    inspecttorAccessKey = ""
    funnyStyle          = "superscript"
    xorFormat           = "binary"
    includeMethodPrefix = $false
    autoEncrypt         = $false
    autoDecrypt         = $true
})

Set-JsonProp $j.plugins "ChatInputButtonAPI"    ([pscustomobject]@{ enabled = $true })
Set-JsonProp $j.plugins "MessageAccessoriesAPI" ([pscustomobject]@{ enabled = $true })

$jsonText = $j | ConvertTo-Json -Depth 30
[System.IO.File]::WriteAllText($SettingsFile, $jsonText, (New-Object System.Text.UTF8Encoding $false))

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "       Installation Completed Successfully!        " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "You can now open Discord!" -ForegroundColor Yellow
Write-Host "The lock icon will appear in your chat bar." -ForegroundColor Gray
Write-Host "- Left Click:  Toggle encryption on/off (turns green when active)." -ForegroundColor Gray
Write-Host "- Right Click: Open Settings & Live Playground." -ForegroundColor Gray
Write-Host ""
