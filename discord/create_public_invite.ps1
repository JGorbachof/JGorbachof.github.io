$ErrorActionPreference='Stop'
$base='F:\CreatorHub\discord'
$envLines=Get-Content -LiteralPath (Join-Path $base '.env')
$token=($envLines | Where-Object {$_ -like 'DISCORD_BOT_TOKEN=*'}).Substring(18)
$guildId=($envLines | Where-Object {$_ -like 'DISCORD_GUILD_ID=*'}).Substring(17)
$h=@{Authorization='Bot '+$token;'User-Agent'='CreatorHubDiscordMigration/1.0'}
$api='https://discord.com/api/v10'
$channels=Invoke-RestMethod -Headers $h -Uri "$api/guilds/$guildId/channels" -Method Get
$target=$channels | Where-Object {$_.name -eq 'server-guide'} | Select-Object -First 1
if(-not $target){throw 'server-guide not found'}
$body=@{max_age=0;max_uses=0;temporary=$false;unique=$false} | ConvertTo-Json
$invite=Invoke-RestMethod -Headers $h -ContentType 'application/json' -Uri "$api/channels/$($target.id)/invites" -Method Post -Body $body
$inviteUrl='https://discord.gg/'+$invite.code
Set-Content -LiteralPath (Join-Path $base 'public_invite.txt') -Value $inviteUrl -NoNewline
[ordered]@{code=$invite.code;url=$inviteUrl;channel=$target.name} | ConvertTo-Json
