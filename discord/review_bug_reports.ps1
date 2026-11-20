$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot
node .\review_bug_reports.mjs
exit $LASTEXITCODE
