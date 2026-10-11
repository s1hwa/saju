$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$outputPath = Join-Path $projectRoot 'delivery\인생흐름주기_의뢰인전달_v0.1.0'
$docxPath = Join-Path $outputPath '인생흐름주기_사용안내서.docx'
$pdfPath = Join-Path $outputPath '인생흐름주기_사용안내서.pdf'
$tempDirectory = Join-Path $env:TEMP ('saju-guide-' + [guid]::NewGuid().ToString('N'))
$tempDocx = Join-Path $tempDirectory 'guide.docx'
$tempPdf = Join-Path $tempDirectory 'guide.pdf'

New-Item -ItemType Directory -Path $tempDirectory | Out-Null
Copy-Item -LiteralPath $docxPath -Destination $tempDocx

$word = $null
$document = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($tempDocx, $false, $true)
  $document.ExportAsFixedFormat($tempPdf, 17)
  Copy-Item -LiteralPath $tempPdf -Destination $pdfPath -Force
  Write-Output $pdfPath
}
finally {
  if ($document) {
    $document.Close($false)
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($document) | Out-Null
  }
  if ($word) {
    $word.Quit()
    [System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
  }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
  Remove-Item -LiteralPath $tempDirectory -Recurse -Force -ErrorAction SilentlyContinue
}


