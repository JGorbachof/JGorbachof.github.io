# Creator Hub

The public catalog of my mods, updates and compatibility patches. Browse it at https://jgorbachof.github.io/.

## Purpose

Find current releases, original authors, links and support channels in one place. For installation instructions, use the individual Workshop pages.

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

## Catalog organization

Projects are grouped by game, then by authorship: **Original mods & tools** (original projects, including original extensions that depend on other mods) and **Compatibility patches & mod revivals** (forks, updates, combined packs and compatibility editions). Third-party contributions and original sources remain credited on individual cards. Set `projectGroup` explicitly to `original` or `maintenance` for every new catalog entry. Do not infer ownership from a dependency or asset credit alone. Unclassified entries use a neutral fallback rather than claiming authorship.

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
- Law Enforcement Institution Overhaul - Tech & Res → `#law-enforcement-overhaul-tech-res`
- Shattered World - Every State a Country → `#shattered-world`
- Tech & Res - 3D Model Extension (Work in Progress) → `#tech-res-3d-extension`
- Victoria 3 Native Loader → `#victoria3-native-loader`
- Home Affairs Institution Overhaul → `#home-affairs-overhaul`
- Distinct Military Weapons → `#distinct-military-weapons`
- Distinct Military Weapons - Tech & Res (Beta) → `#distinct-military-weapons-tech-res`
- Enhanced Vassalization Principle → `#enhanced-vassalization-principle`

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
  "projectGroup": "maintenance",
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

## Minecraft 26.3 / NeoForge

Unofficial alpha ports. Client rendering remains untested.

- [Ranged Pumps](https://github.com/JGorbachof/ranged-pumps-26-3/releases/tag/v2.0.0-port.1) - A powered pump drains liquids across a configurable area. Original: [raoulvdberge / Refined Mods](https://www.curseforge.com/minecraft/mc-mods/ranged-pumps). [CurseForge](https://www.curseforge.com/minecraft/mc-mods/ranged-pumps-unofficial-port).
- [AllTheCompressed](https://github.com/JGorbachof/allthecompressed-26-3/releases/tag/v5.0.1-port.3) - Compress blocks into nine storage tiers and unpack them when needed. Original: [Pdiddy973](https://www.curseforge.com/minecraft/mc-mods/allthecompressed). [CurseForge](https://www.curseforge.com/minecraft/mc-mods/allthecompressed-unofficial-port).
- [Ocean's Delight](https://github.com/JGorbachof/oceans-delight-26-3/releases/tag/v1.0.4-port.3) - Prepare seafood dishes using Farmer’s Delight cooking and cutting recipes. Original: [Scouter456 (scouter567 on CurseForge)](https://www.curseforge.com/minecraft/mc-mods/oceans-delight). [CurseForge](https://www.curseforge.com/minecraft/mc-mods/oceans-delight-unofficial-port).

[ModHub](https://jgorbachof.github.io/) | [Discord](https://discord.gg/3zPAp2vk6Q)
