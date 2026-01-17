$Action = New-ScheduledTaskAction -Execute "python" -Argument "c:\monelyfinance\python\sync_investments.py"
$Trigger = New-ScheduledTaskTrigger -Daily -At 9am
$Principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -LogonType Interactive
$Settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

$TaskName = "MonelyFinance_SyncInvestments"
Register-ScheduledTask -Action $Action -Trigger $Trigger -Principal $Principal -Settings $Settings -TaskName $TaskName -Description "Syncs Monely Finance investments daily"

Write-Host "Task '$TaskName' created successfully. It will run daily at 9:00 AM."
Write-Host "You can test it by running: Start-ScheduledTask -TaskName '$TaskName'"
