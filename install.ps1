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
    Write-Host "[!] Vencord nao foi encontrado no seu computador." -ForegroundColor Red
    Write-Host "Por favor, instale o Vencord primeiro em https://vencord.dev (clique em Download/Install) e depois execute este comando novamente." -ForegroundColor Yellow
    return
}

# 2. Backup existing bundle
$BackupDir = Join-Path $VencordDir "dist.bak"
if (-not (Test-Path $BackupDir)) {
    Write-Host "[+] Criando backup do seu Vencord atual em dist.bak..." -ForegroundColor Gray
    Copy-Item $DistDir $BackupDir -Recurse -Force
}

# 3. Close Discord
Write-Host "[+] Fechando o Discord para atualizar os arquivos..." -ForegroundColor Yellow
Get-Process Discord -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2

# 4. Download latest Encrypt Chat bundle files
Write-Host "[+] Baixando os arquivos do Encrypt Chat..." -ForegroundColor Cyan
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
        Write-Host "  -> $f baixado com sucesso!" -ForegroundColor Green
    } catch {
        Write-Host "  [!] Aviso: Nao foi possivel baixar $f (usando versao local se disponivel)" -ForegroundColor DarkGray
    }
}

# 5. Configure settings.json
Write-Host "[+] Configurando o plugin no settings.json..." -ForegroundColor Cyan
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
    method              = "inspecttor"
    secretWord          = "galax"
    funnyStyle          = "superscript"
    xorFormat           = "binary"
    includeMethodPrefix = $false
    autoEncrypt         = $false
})

Set-JsonProp $j.plugins "ChatInputButtonAPI"    ([pscustomobject]@{ enabled = $true })
Set-JsonProp $j.plugins "MessageAccessoriesAPI" ([pscustomobject]@{ enabled = $true })

$jsonText = $j | ConvertTo-Json -Depth 30
[System.IO.File]::WriteAllText($SettingsFile, $jsonText, (New-Object System.Text.UTF8Encoding $false))

# 6. Restart Discord
Write-Host "[+] Reiniciando o Discord..." -ForegroundColor Green
$DiscordUpdate = Join-Path $env:LOCALAPPDATA "Discord\Update.exe"
if (Test-Path $DiscordUpdate) {
    & $DiscordUpdate --processStart Discord.exe
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Instalacao Concluida com Sucesso!                 " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "O icone de cadeado aparecera na sua barra de chat." -ForegroundColor Gray
Write-Host "- Clique normal: Ativa/Desativa a criptografia (fica verde)." -ForegroundColor Gray
Write-Host "- Shift + Clique: Abre as configuracoes e o Live Playground." -ForegroundColor Gray
Write-Host ""
