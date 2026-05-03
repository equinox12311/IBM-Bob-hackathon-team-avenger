# Cortex one-command boot for Windows (PowerShell).
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Definition
$python = (Get-Command py -ErrorAction SilentlyContinue) ?? (Get-Command python -ErrorAction SilentlyContinue)
if (-not $python) {
    Write-Error "Python 3 not found. Install from https://www.python.org/downloads/"
    exit 1
}
& $python.Source (Join-Path $here 'scripts\start.py') @args
