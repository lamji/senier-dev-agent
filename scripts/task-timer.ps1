# Task Timer Utility for Senior Dev Workflow
# Usage: 
#   .\scripts\task-timer.ps1 start
#   .\scripts\task-timer.ps1 stop

param (
    [Parameter(Mandatory=$true)]
    [ValidateSet("start", "stop")]
    [string]$Action
)

$timerFile = Join-Path $PSScriptRoot ".task_timer"

if ($Action -eq "start") {
    Get-Date -Format "yyyy-MM-dd HH:mm:ss" | Out-File $timerFile -Encoding utf8
    Write-Host "Task timer started at $(Get-Date -Format 'HH:mm:ss')." -ForegroundColor Cyan
}
elseif ($Action -eq "stop") {
    if (-Not (Test-Path $timerFile)) {
        Write-Error "No active task timer found. Run with 'start' first."
        exit 1
    }

    $startTimeStr = Get-Content $timerFile
    $startTime = [datetime]::ParseExact($startTimeStr, "yyyy-MM-dd HH:mm:ss", $null)
    $endTime = Get-Date
    $duration = $endTime - $startTime

    $formattedDuration = "$($duration.Minutes)min and $($duration.Seconds)secs"
    Write-Host "Task completed in: $formattedDuration" -ForegroundColor Green
    
    # Clean up
    Remove-Item $timerFile
}
