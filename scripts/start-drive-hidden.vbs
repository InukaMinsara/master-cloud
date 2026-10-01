Set WshShell = CreateObject("WScript.Shell")
strScriptDir = CreateObject("Scripting.FileSystemObject").GetParentFolderName(WScript.ScriptFullName)
WshShell.Run """D:\Program Files\nodejs\node.exe"" """ & strScriptDir & "\webdav-server.mjs"" --port=8766 --remount", 0, False
