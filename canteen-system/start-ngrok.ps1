$ErrorActionPreference = 'Stop'

$root = $PSScriptRoot
$serverPath = Join-Path $root 'server'
$clientPath = Join-Path $root 'client'
$ngrokPath = $null

$localNgrok = Join-Path $root '.tools\ngrok\ngrok.exe'

if (Test-Path $localNgrok) {
    $ngrokPath = $localNgrok
} elseif (Get-Command ngrok -ErrorAction SilentlyContinue) {
    $ngrokPath = (Get-Command ngrok).Source
} else {
    $candidate = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Packages\Ngrok.Ngrok_Microsoft.WinGet.Source_8wekyb3d8bbwe\ngrok.exe'
    if (Test-Path $candidate) {
        $ngrokPath = $candidate
    }
}

if (-not $ngrokPath) {
    Write-Host 'ngrok is not installed or not available on PATH.'
    Write-Host 'Install it first: https://ngrok.com/download'
    exit 1
}

Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$serverPath`" && npm run dev" -WindowStyle Normal
Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', "cd /d `"$clientPath`" && npm run dev" -WindowStyle Normal

Write-Host 'Starting ngrok tunnel for http://localhost:5173 ...'
& $ngrokPath http 5173