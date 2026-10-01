If WScript.Arguments.Count > 0 Then
  strTarget = Replace(WScript.Arguments(0), "\", "\\")
  strTarget = Replace(strTarget, """", "\"")
  Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  http.open "POST", "http://127.0.0.1:8766/__instant_ingest", False
  http.setRequestHeader "Content-Type", "application/json"
  http.send "{""sourcePath"":""" & strTarget & """}"
End If
