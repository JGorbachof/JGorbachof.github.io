$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node .\bootstrap.mjs --validate
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
node .\bootstrap.mjs --sync
exit $LASTEXITCODE
