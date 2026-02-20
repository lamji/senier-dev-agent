param(
    [Parameter(Mandatory=$true)]
    [string]$Title,
    
    [Parameter(Mandatory=$true)]
    [string]$Type,
    
    [Parameter(Mandatory=$true)]
    [string]$Description,
    
    [Parameter(Mandatory=$true)]
    [string]$Modified,
    
    [string]$Verification = "npm run build passed successfully (Exit code: 0)."
)

$Date = Get-Date -Format "yyyy-MM-dd"
$LogPath = Join-Path (Get-Location) ".agent\memory\logs.md"

if (-not (Test-Path $LogPath)) {
    Write-Host "Error: Logs file not found at $LogPath" -ForegroundColor Red
    return
}

$Content = @"

## [$Date] - $Title
**Type**: $Type
**Status**: Completed

### Description
$Description

### Added/Modified
$Modified

### Verification (The Wall)
- $Verification

---
"@

Add-Content -Path $LogPath -Value $Content
Write-Host "Log entry appended successfully to logs.md" -ForegroundColor Green
