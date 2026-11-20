$ErrorActionPreference='Stop'
$base='F:\CreatorHub\discord'
$envLines=Get-Content -LiteralPath (Join-Path $base '.env')
$token=($envLines | Where-Object {$_ -like 'DISCORD_BOT_TOKEN=*'}).Substring(18)
$guildId=($envLines | Where-Object {$_ -like 'DISCORD_GUILD_ID=*'}).Substring(17)
$headers=@{Authorization='Bot '+$token;'User-Agent'='GorbachofModdingHubReviewTest/2.0'}
$api='https://discord.com/api/v10'
$msg=$null
try {
  $channels=Invoke-RestMethod -Headers $headers -Uri "$api/guilds/$guildId/channels" -Method Get
  $channel=$channels | Where-Object {$_.name -eq 'stockpile-economy' -and $_.type -eq 0} | Select-Object -First 1
  if(-not $channel){throw 'stockpile-economy support channel not found'}
  $body=@{content='Temporary setup test: this message exists only to verify creator-wide per-project support capture.'} | ConvertTo-Json
  $msg=Invoke-RestMethod -Headers $headers -ContentType 'application/json' -Uri "$api/channels/$($channel.id)/messages" -Method Post -Body $body
  Write-Output ('Created temporary support test message '+$msg.id)

  Push-Location $base
  try {
    & node .\review_bug_reports.mjs | Out-Null
    if($LASTEXITCODE -ne 0){throw 'review_bug_reports.mjs failed'}
  } finally { Pop-Location }

  $manifest=Get-Content -Raw -LiteralPath (Join-Path $base 'review_exports\latest_manifest.json') | ConvertFrom-Json
  $entry=$manifest.channels | Where-Object {$_.name -eq 'stockpile-economy'} | Select-Object -First 1
  if(-not $entry){throw 'stockpile-economy channel was not captured'}
  $raw=Get-Content -Raw -LiteralPath $entry.channel_json | ConvertFrom-Json
  $hit=$raw.messages | Where-Object {$_.id -eq $msg.id} | Select-Object -First 1
  if(-not $hit){throw 'temporary support message was not captured'}
  if($hit.content -notlike 'Temporary setup test:*'){throw 'support message content was not captured'}
  Write-Output 'Per-project support capture verified: content readable'
}
finally {
  if($msg -and $msg.id){
    try {
      Invoke-RestMethod -Headers $headers -Uri "$api/channels/$($channel.id)/messages/$($msg.id)" -Method Delete | Out-Null
      Write-Output ('Deleted temporary support test message '+$msg.id)
    } catch {
      Write-Warning ('Could not delete temporary support test message: '+$_.Exception.Message)
    }
  }
}
