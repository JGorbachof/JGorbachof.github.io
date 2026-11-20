$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node .\audit_live.mjs
exit $LASTEXITCODE
