# Creator Hub

A dependency-free static site for a creator-wide mod catalog.

## Purpose

Use one public hub across all games and projects instead of treating support as attached to any single mod. Workshop pages can link here for project information, credits, source code, compatibility notes, and maintenance status. Optional creator support belongs on this broader hub.

## Current structure

- `index.html` — homepage and catalog
- `assets/styles.css` — site styling
- `assets/app.js` — loads configuration and project data
- `data/site.json` — creator identity and global links, including the public Discord invite
- `data/mods.json` — mod/project catalog
- `discord/` — canonical **Gorbachof Modding Hub** server configuration, sync tooling, and read-only support-review workflow
- `docs/DISCORD_SUPPORT_REVIEW_WORKFLOW.md` — worker contract for Discord bug/support review
- `AGENTS.md` — creator-hub worker routing
- `.nojekyll` — keeps GitHub Pages deployment simple

## Discord support model

The **Gorbachof Modding Hub** Discord organizes support **first by game, then by mod**. Each supported game gets its own `<GAME> — SUPPORT & REPORTS` category, and each supported mod gets one public text channel inside that category. There are no voice support channels.

Current layout:

**Victoria 3**
- Stockpile Economy Continued → `#stockpile-economy`
- Stockpile Economy Continued - Tech & Res → `#stockpile-tech-res`
- Private Sector Construction Continued → `#private-sector-construction`
- Private Sector Construction Continued - Tech & Res → `#private-sector-construction-tech-res`
- Better Politics Mod - Victorian Flavor Mod Compatch → `#bpm-vfm-compatch`
- PSC + Stockpile Replacement Pack → `#psc-stockpile-replacement`
- Private Sector Construction + Stockpile Economy - Replacement Pack (Tech & Res Compatible) → `#psc-stockpile-replacement-tech-res`
- Law Enforcement Institution Overhaul → `#law-enforcement-overhaul`

**Hearts of Iron IV**
- Reichskommissariats Plus x Road to 56 Compatch → `#rkplus-road-to-56-compatch`

**Workers & Resources: Soviet Republic**
- Smart Workforce - Auto-Close Full Factories → `#smart-workforce`
- Foreign Workers Auto Refill (140) → `#foreign-workers-auto-refill`

The catalog stores this mapping through `discordSupportCategory`, `discordSupportChannel`, and `discordSupportUrl` in `data/mods.json`.

Project channels handle installation questions, troubleshooting, bug reports, compatibility problems, and balance/behavior feedback. Distinct issues should use a thread when practical.

## Add a mod

Add an object to `data/mods.json`:

```json
{
  "title": "Example Patch",
  "game": "Victoria 3",
  "type": "Compatibility patch",
  "status": "Current",
  "summary": "Compatibility patch for two popular mods.",
  "steamUrl": "https://steamcommunity.com/...",
  "sourceUrl": "",
  "originalUrl": "",
  "projectUrl": "",
  "currentVersion": "1.x",
  "lastVerified": "2026-11-20",
  "featured": false,
  "discordSupportCategory": "VICTORIA 3 — SUPPORT & REPORTS",
  "discordSupportChannel": "example-patch",
  "discordSupportUrl": "https://discord.com/channels/..."
}
```

Suggested `type` values:
- Original project
- Revived mod
- Compatibility patch
- Maintenance fork
- Utility

Suggested `status` values:
- Current
- In development
- Testing
- Needs update
- Archived

## Configure the creator identity

Edit `data/site.json`. Keep `supportUrl` empty until the support page is ready. When it is populated, the Support navigation and support section appear automatically.

## Publishing

The site is designed to work as plain static files on GitHub Pages. GitHub Pages can publish directly from a branch, so no build framework or package install is required.

Recommended initial deployment:
1. Create a public GitHub repository for the hub.
2. Commit this folder to the default branch.
3. In repository Settings > Pages, choose Deploy from a branch.
4. Select the default branch and root folder.
5. Enforce HTTPS.
6. Add a custom domain later if desired.

## Policy / presentation approach

- Keep mods themselves free.
- Credit original authors prominently on revived/forked projects.
- Link back to original Workshop items or repositories when available.
- Use the hub for catalog, documentation, source, compatibility notes, and project history.
- Treat optional support as support for the creator's broader maintenance work, not payment for access to a specific mod.
