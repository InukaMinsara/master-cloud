' scripts/start-vgpu.vbs
' Launch Master Quantum 50x vGPU in background without console window popup
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
scriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
projectDir = fso.GetParentFolderName(scriptDir)

cmd = "cmd.exe /c cd /d """ & projectDir & """ && node scripts\master-50x-vgpu.mjs"
WshShell.Run cmd, 0, False
