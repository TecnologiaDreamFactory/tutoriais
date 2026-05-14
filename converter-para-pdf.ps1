# Converte todos os DOCX e PPTX em PDF usando Microsoft Office COM
$ErrorActionPreference = 'Continue'
$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# Remove caches de Interop quebrados (causa do TYPE_E_CANTLOADLIBRARY)
$gacCaches = @(
    "$env:LOCALAPPDATA\Microsoft\VisualStudio",
    "$env:LOCALAPPDATA\assembly\dl3"
)

$files = Get-ChildItem -Path $root -Recurse -Include *.docx,*.pptx -File |
    Where-Object { $_.FullName -notlike '*\site\*' -and $_.Name -notlike '~$*' }

Write-Host "Arquivos a converter: $($files.Count)" -ForegroundColor Green

# === WORD ===
$docxFiles = $files | Where-Object { $_.Extension -ieq '.docx' }
if ($docxFiles.Count -gt 0) {
    Write-Host "`n[Word]" -ForegroundColor Cyan
    $word = New-Object -ComObject Word.Application
    foreach ($f in $docxFiles) {
        $pdf = [IO.Path]::ChangeExtension($f.FullName, '.pdf')
        if (Test-Path $pdf) { Write-Host "  pulando (ja existe): $($f.Name)" -ForegroundColor DarkGray; continue }
        try {
            $doc = $word.Documents.Open($f.FullName, $false, $true)  # ConfirmConv, ReadOnly
            $doc.SaveAs([ref]$pdf, [ref]17)  # 17 = wdFormatPDF
            $doc.Close($false)
            Write-Host "  OK: $($f.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ERRO em $($f.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    try { $word.Quit() } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null } catch {}
    Remove-Variable word -ErrorAction SilentlyContinue
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

# === POWERPOINT ===
$pptxFiles = $files | Where-Object { $_.Extension -ieq '.pptx' }
if ($pptxFiles.Count -gt 0) {
    Write-Host "`n[PowerPoint]" -ForegroundColor Magenta
    $ppt = New-Object -ComObject PowerPoint.Application
    foreach ($f in $pptxFiles) {
        $pdf = [IO.Path]::ChangeExtension($f.FullName, '.pdf')
        if (Test-Path $pdf) { Write-Host "  pulando (ja existe): $($f.Name)" -ForegroundColor DarkGray; continue }
        try {
            # Open(FileName, ReadOnly=-1, Untitled=0, WithWindow=0)
            $pres = $ppt.Presentations.Open($f.FullName, $true, $false, $false)
            $pres.SaveAs($pdf, 32)  # 32 = ppSaveAsPDF
            $pres.Close()
            Write-Host "  OK: $($f.Name)" -ForegroundColor Green
        } catch {
            Write-Host "  ERRO em $($f.Name): $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    try { $ppt.Quit() } catch {}
    try { [System.Runtime.InteropServices.Marshal]::ReleaseComObject($ppt) | Out-Null } catch {}
    Remove-Variable ppt -ErrorAction SilentlyContinue
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
}

Write-Host "`nConcluido. PDFs gerados:" -ForegroundColor Green
Get-ChildItem -Path $root -Recurse -Include *.pdf -File | Where-Object { $_.FullName -notlike '*\site\*' } | ForEach-Object {
    Write-Host "  - $($_.FullName.Substring($root.Length + 1))"
}
