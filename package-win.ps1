$ErrorActionPreference = "Stop"

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Parent = Split-Path -Parent $Root
$Version = (Get-Content (Join-Path $Root "package.json") -Raw | ConvertFrom-Json).version
$Release = Join-Path $Root "release"
$Stage = Join-Path $Release "ThemeDeck"
$ProjectStage = Join-Path $Release "ThemeDeck-project-$Version"
$Zip = Join-Path $Release "ThemeDeck-Playhub_Installer-$Version.zip"
$PublicZip = Join-Path $Parent "ThemeDeck-Playhub_Installer-$Version.zip"
$PublicProjectZip = Join-Path $Parent "ThemeDeck-project-$Version.zip"
$PublicLegacyZip = Join-Path $Parent "ThemeDeck-Playhub_Installer.zip"

$ResolvedRoot = [IO.Path]::GetFullPath($Root).TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar
$ResolvedRelease = [IO.Path]::GetFullPath($Release)
if (-not $ResolvedRelease.StartsWith($ResolvedRoot, [StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to recreate a release directory outside the ThemeDeck project"
}

if (Test-Path $Release) { Remove-Item $Release -Recurse -Force }
New-Item -ItemType Directory -Force -Path (Join-Path $Stage "dist") | Out-Null

pnpm build
if ($LASTEXITCODE -ne 0) { throw "ThemeDeck frontend build failed" }
node --check (Join-Path $Root "dist/index.js")
if ($LASTEXITCODE -ne 0) { throw "dist/index.js validation failed" }
python -m py_compile (Join-Path $Root "main.py")
if ($LASTEXITCODE -ne 0) { throw "main.py validation failed" }

$RuntimeFiles = @(
  "plugin.json", "main.py", "package.json", "LICENSE", "NOTICE", "README.md",
  "yt-dlp.exe", "ffmpeg.exe", "ffprobe.exe", "FFMPEG-LICENSE.txt", "FFMPEG-README.txt"
)
foreach ($File in $RuntimeFiles) {
  Copy-Item (Join-Path $Root $File) $Stage -Force
}
Copy-Item (Join-Path $Root "dist/index.js") (Join-Path $Stage "dist/index.js") -Force

Compress-Archive -Path $Stage -DestinationPath $Zip -CompressionLevel Optimal -Force
Copy-Item $Zip $PublicZip -Force
Copy-Item $Zip $PublicLegacyZip -Force

New-Item -ItemType Directory -Force -Path $ProjectStage | Out-Null
$ProjectExclude = @("release", "node_modules", "node_modules-broken-copy", "__pycache__", ".pnpm-store")
Get-ChildItem -LiteralPath $Root -Force | Where-Object {
  $ProjectExclude -notcontains $_.Name
} | ForEach-Object {
  Copy-Item -LiteralPath $_.FullName -Destination $ProjectStage -Recurse -Force
}
Compress-Archive -Path $ProjectStage -DestinationPath $PublicProjectZip -CompressionLevel Optimal -Force

Write-Host "Created $Zip"
Write-Host "Updated $PublicZip"
Write-Host "Updated $PublicProjectZip"
Write-Host "Updated $PublicLegacyZip"
