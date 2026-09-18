param(
  [switch]$Offline,
  [string]$OutputDirectory = ""
)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
if (-not $OutputDirectory) { $OutputDirectory = Split-Path -Parent $Root }
Push-Location $Root
try {
  if ($Offline) { node scripts/build-offline.mjs } else { pnpm build }
  if ($LASTEXITCODE -ne 0) { throw "ThemeDeck frontend build failed" }
  node --check dist/index.js
  if ($LASTEXITCODE -ne 0) { throw "dist/index.js syntax validation failed" }
  python -m py_compile main.py
  if ($LASTEXITCODE -ne 0) { throw "main.py syntax validation failed" }
  python tools/package-release.py --output-dir $OutputDirectory
  if ($LASTEXITCODE -ne 0) { throw "ThemeDeck packaging/validation failed" }
} finally {
  Pop-Location
}
