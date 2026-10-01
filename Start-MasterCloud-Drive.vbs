Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "node scripts\master-cloud-daemon.mjs", 0, False
