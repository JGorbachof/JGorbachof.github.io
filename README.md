# Creator Hub

A dependency-free static site for a creator-wide mod catalog.

## Purpose

Use one public hub across all games and projects instead of treating support as attached to any single mod. Workshop pages can link here for project information, credits, source code, compatibility notes, and maintenance status. Optional creator support belongs on this broader hub.

## Current structure

- `index.html` — homepage and catalog
- `assets/styles.css` — site styling
- `assets/app.js` — loads configuration and project data
- `data/site.json` — creator identity and global links
- `data/mods.json` — mod/project catalog
- `.nojekyll` — keeps GitHub Pages deployment simple

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
  "featured": false
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
