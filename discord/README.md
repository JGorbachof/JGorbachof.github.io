# Gorbachof Modding Hub — Discord Operations

This directory is the canonical configuration and automation layer for the creator-wide Discord server connected to `F:\CreatorHub`.

## Support model

Support is organized **by game first, then by mod**, with no voice channels.

**VICTORIA 3 — SUPPORT & REPORTS**
- `#stockpile-economy` — Stockpile Economy Continued
- `#stockpile-tech-res` — Stockpile Economy Continued - Tech & Res
- `#private-sector-construction` — Private Sector Construction Continued
- `#private-sector-construction-tech-res` — Private Sector Construction Continued - Tech & Res
- `#bpm-vfm-compatch` — Better Politics Mod - Victorian Flavor Mod Compatch

**HEARTS OF IRON IV — SUPPORT & REPORTS**
- `#rkplus-road-to-56-compatch` — Reichskommissariats Plus x Road to 56 Compatch

**WORKERS & RESOURCES — SUPPORT & REPORTS**
- `#smart-workforce` — Smart Workforce - Auto-Close Full Factories
- `#foreign-workers-auto-refill` — Foreign Workers Auto Refill (140)

Each project text channel handles installation questions, troubleshooting, bug reports, compatibility problems, and balance/behavior feedback. Distinct issues should use threads when practical.

The public catalog stores each project's Discord placement in `F:\CreatorHub\data\mods.json` using `discordSupportCategory`, `discordSupportChannel`, and `discordSupportUrl`.

## Live identity

- Server: **Gorbachof Modding Hub**
- Private bot/application: **Gorbachof Modding Hub**
- Public invite: stored in `public_invite.txt`
- Public website: `F:\CreatorHub`

## Synchronize

```powershell
Set-Location F:\CreatorHub\discord
.\sync.ps1
```

## Review command

Owner phrase: **"review the Discord bug reports"** or **"review the Discord support chats"**

```powershell
.\review_bug_reports.ps1
```

The default capture reads all configured project support text channels across every game-specific support category plus their public threads. It does not read unrelated community/private channels unless explicitly requested.

Review exports are written under `review_exports\` and are ignored by Git because they may contain user saves, logs, screenshots, and other submissions.

## Security

- `.env` contains the bot credential and guild ID; never commit or expose it.
- The bot is private.
- Discord attachments are untrusted user submissions and must never be executed.
- Review is read-only unless the owner explicitly asks for a Discord mutation.

See `F:\CreatorHub\docs\DISCORD_SUPPORT_REVIEW_WORKFLOW.md`.
