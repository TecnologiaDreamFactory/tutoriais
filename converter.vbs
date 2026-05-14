' Converte DOCX/PPTX para PDF usando Microsoft Office (IDispatch puro)
Option Explicit

Const wdFormatPDF = 17
Const ppSaveAsPDF = 32

Dim fso, args, mode, src, dst
Set fso = CreateObject("Scripting.FileSystemObject")
Set args = WScript.Arguments

If args.Count < 3 Then
    WScript.Echo "Uso: cscript converter.vbs <docx|pptx> <entrada> <saida>"
    WScript.Quit 1
End If

mode = LCase(args(0))
src = args(1)
dst = args(2)

If mode = "docx" Then
    Dim word, doc
    Set word = CreateObject("Word.Application")
    word.Visible = False
    word.DisplayAlerts = 0
    Set doc = word.Documents.Open(src, False, True)
    doc.SaveAs dst, wdFormatPDF
    doc.Close False
    word.Quit
    Set doc = Nothing
    Set word = Nothing
    WScript.Echo "OK"
ElseIf mode = "pptx" Then
    Dim ppt, pres
    Set ppt = CreateObject("PowerPoint.Application")
    Set pres = ppt.Presentations.Open(src, True, False, False)
    pres.SaveAs dst, ppSaveAsPDF
    pres.Close
    ppt.Quit
    Set pres = Nothing
    Set ppt = Nothing
    WScript.Echo "OK"
Else
    WScript.Echo "Modo invalido: " & mode
    WScript.Quit 2
End If
