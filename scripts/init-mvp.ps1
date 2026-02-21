# ============================================================
# Senior Dev Mind - MVP Auto-Initializer
# Usage:
#   .\scripts\init-mvp.ps1 -ProjectName "open-crm-marketing"
#   .\scripts\init-mvp.ps1 -ProjectName "open-crm-marketing" -Template "git@github.com:lamji/ai-builder-template.git"
# ============================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$ProjectName,

    [string]$Template = "git@github.com:lamji/ai-builder-template.git",

    [switch]$SkipInstall
)

$Root = Split-Path -Parent $PSScriptRoot
$ProjectPath = Join-Path $Root $ProjectName

function Info($msg)    { Write-Host "  $msg" -ForegroundColor Cyan }
function Success($msg) { Write-Host "  OK $msg" -ForegroundColor Green }
function Warn($msg)    { Write-Host "  WARN $msg" -ForegroundColor Yellow }
function Fail($msg)    { Write-Host "  FAIL $msg" -ForegroundColor Red; exit 1 }

function Header($msg) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Magenta
    Write-Host "  $msg" -ForegroundColor Magenta
    Write-Host "============================================" -ForegroundColor Magenta
}

Header "Senior Dev Mind - MVP Init"
Info "Project  : $ProjectName"
Info "Template : $Template"
Info "Target   : $ProjectPath"

# Step 1: Check if project already exists
Header "Step 1 - Pre-flight Check"

if (Test-Path $ProjectPath) {
    Warn "Folder '$ProjectName' already exists at $ProjectPath"
    $confirm = Read-Host "  Overwrite? (y/n)"
    if ($confirm -ne "y") {
        Fail "Aborted. Choose a different project name."
    }
    Remove-Item -Recurse -Force $ProjectPath
    Success "Removed existing folder"
}

# Step 2: Start Task Timer
Header "Step 2 - Start Task Timer"

$timerScript = Join-Path $PSScriptRoot "task-timer.ps1"
if (Test-Path $timerScript) {
    & powershell -ExecutionPolicy Bypass -File $timerScript start
    Success "Task timer started"
} else {
    Warn "task-timer.ps1 not found, skipping timer"
}

# Step 3: Clone Template
Header "Step 3 - Clone Template"

Info "Cloning from $Template ..."
git clone $Template $ProjectPath

if ($LASTEXITCODE -ne 0) {
    Fail "Git clone failed. Check SSH key or template URL."
}
Success "Cloned successfully to $ProjectPath"

# Step 4: Remove .git folder
Header "Step 4 - Scrub Git History"

$gitFolder = Join-Path $ProjectPath ".git"
if (Test-Path $gitFolder) {
    Remove-Item -Recurse -Force $gitFolder
    Success "Removed .git folder - fresh project state"
} else {
    Warn ".git folder not found, skipping"
}

# Step 5: Install Dependencies
Header "Step 5 - Install Dependencies"

if ($SkipInstall) {
    Warn "Skipping npm install (SkipInstall flag set)"
} else {
    Set-Location $ProjectPath
    Info "Running npm install..."
    npm install

    if ($LASTEXITCODE -ne 0) {
        Fail "npm install failed. Check package.json or network."
    }
    Success "Dependencies installed"
}

# Step 6: Scaffold MVVM folders
Header "Step 6 - Scaffold MVVM Structure"

$folders = @(
    "presentations",
    "components",
    "lib\validation",
    "lib\api-client",
    "hooks",
    "scripts",
    ".logs"
)

foreach ($folder in $folders) {
    $fullPath = Join-Path $ProjectPath $folder
    if (-Not (Test-Path $fullPath)) {
        New-Item -ItemType Directory -Force -Path $fullPath | Out-Null
        Success "Created $folder"
    } else {
        Info "Exists: $folder"
    }
}

# Step 7: Create .logs.md and .corrections
Header "Step 7 - Init Log Files"

$logsFile = Join-Path $ProjectPath ".logs.md"
if (-Not (Test-Path $logsFile)) {
    $logsContent = @"
# Global Project Changelog

| Date | Feature / Change | Status | Author |
|------|-----------------|--------|--------|

## Summary
Project initialized via init-mvp.ps1 - Senior Dev Mind automation.
"@
    Set-Content -Path $logsFile -Value $logsContent -Encoding utf8
    Success "Created .logs.md"
} else {
    Info ".logs.md already exists"
}

$correctionsFile = Join-Path $ProjectPath ".corrections"
if (-Not (Test-Path $correctionsFile)) {
    $correctionsContent = @"
# AI Correction Logs (.corrections)
This file tracks all corrections and behavioral adjustments requested by the USER.
The AI must review this file at the start of every task to avoid repeating past mistakes.

## Correction History
"@
    Set-Content -Path $correctionsFile -Value $correctionsContent -Encoding utf8
    Success "Created .corrections"
} else {
    Info ".corrections already exists"
}

# Step 8: Done
Header "MVP Initialized - $ProjectName"

Info "Path  : $ProjectPath"
Info "Next  : Start building features"
Info ""
Info "RAG Context for this project:"
$ragTask = "mvp " + $ProjectName.Replace("-", " ")
Info "  GET http://localhost:6444/context/compressed?task=$($ProjectName.Replace('-','+'))&limit=3"
Info ""

if (Test-Path $timerScript) {
    & powershell -ExecutionPolicy Bypass -File $timerScript stop
}

Write-Host ""
Success "Done! Project '$ProjectName' is ready. Happy coding!"
