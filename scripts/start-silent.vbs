Set WshShell = CreateObject("WScript.Shell")
WshShell.Run Chr(34) & "F:\flowbender\scripts\start-service.bat" & Chr(34), 0, False
Set WshShell = Nothing
