Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Image]::FromFile('d:\Im Share X\Master Cloud\public\logo-full.png')

function Save-Resized($w, $h, $outPath) {
    $bmp = New-Object System.Drawing.Bitmap($w, $h)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.DrawImage($src, 0, 0, $w, $h)
    $bmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
    Write-Host "Generated: $outPath ($w x $h)"
}

Save-Resized 16 16 'd:\Im Share X\Master Cloud\public\favicon-16x16.png'
Save-Resized 32 32 'd:\Im Share X\Master Cloud\public\favicon-32x32.png'
Save-Resized 48 48 'd:\Im Share X\Master Cloud\public\favicon-48x48.png'
Save-Resized 96 96 'd:\Im Share X\Master Cloud\public\favicon-96x96.png'
Save-Resized 192 192 'd:\Im Share X\Master Cloud\public\favicon-192x192.png'
$src.Dispose()
Write-Host "All favicons generated successfully!"
