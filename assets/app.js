const state = { projects: [], submissions: [], filter: "All games" };
const assetVersion = "20261125-mc-release3";

async function loadJson(path) {
  const response = await fetch(`${path}?v=${assetVersion}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`Could not load ${path}`);
  return response.json();
}

function setLink(id, url) {
  const el = document.getElementById(id);
  if (!el || !url) return;
  el.href = url;
  el.hidden = false;
}

function applySite(site) {
  const name = site.creatorName || "Creator Hub";
  document.title = site.pageTitle || name;
  document.getElementById("brand-name").textContent = name;
  document.getElementById("footer-name").textContent = name;
  if (site.heroTitle) document.getElementById("hero-title").textContent = site.heroTitle;
  if (site.tagline) document.getElementById("hero-tagline").textContent = site.tagline;
  setLink("steam-link", site.steamProfileUrl);
  setLink("discord-link", site.discordUrl);

  if (site.supportUrl) {
    const section = document.getElementById("support");
    const nav = document.getElementById("support-nav");
    const link = document.getElementById("support-link");
    section.hidden = false;
    nav.hidden = false;
    link.href = site.supportUrl;
    link.textContent = site.supportLabel || "Support my work";
  }
}

function projectGames(projects) {
  return ["All games", ...new Set([...projects.map(p => p.game).filter(Boolean), "Minecraft"])];
}

function gameLabel(game) {
  if (game === "Workers & Resources: Soviet Republic") return "Workers & Resources";
  return game;
}

function renderFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
  for (const game of projectGames(state.projects)) {
    const button = document.createElement("button");
    button.className = "filter" + (state.filter === game ? " active" : "");
    button.type = "button";
    button.textContent = gameLabel(game);
    button.addEventListener("click", () => {
      state.filter = game;
      renderFilters();
      renderProjects();
    });
    box.appendChild(button);
  }
}

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function safeUrl(url) {
  try { const u = new URL(url); return u.protocol === "https:" && !u.username && !u.password ? esc(u.href) : ""; }
  catch { return ""; }
}
function link(label, url) {
  url = safeUrl(url);
  if (!url) return "";
  return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
}

function minecraftDetails(p) {
  if (p.game !== "Minecraft") return "";
  return [
    p.unofficialPort ? "Unofficial compatibility port — not endorsed by the original creator." : "",
    p.originalCreator ? "Original creator: " + p.originalCreator : "",
    p.license ? "License: " + p.license : "",
    p.minecraftVersions?.length ? "Minecraft: " + p.minecraftVersions.join(", ") : "",
    p.modLoaders?.length ? "Loaders: " + p.modLoaders.join(", ") : "",
    p.developmentStatus ? "Development: " + p.developmentStatus : "",
    p.releaseStatus ? "Release: " + p.releaseStatus : ""
  ].filter(Boolean).map(t => '<p class="credits">' + esc(t) + '</p>').join("");
}
function cardMarkup(p) {
  return `
    <article id="${esc(p.id || "")}" class="card ${p.featured ? "featured" : ""}">
      ${p.imageUrl ? `<img class="card-image" src="${esc(p.imageUrl)}" alt="${esc(p.title)} preview" loading="lazy">` : ""}
      <div class="card-body">
        <div class="card-top">
          <span class="badge">${esc(p.type || "Project")}</span>
          <span class="badge status">${esc(p.status || "Active")}</span>
        </div>
        <h5>${esc(p.title)}</h5>
        <p>${esc(p.summary || "")}</p>
        ${p.credits ? `<p class="credits">${esc(p.credits)}</p>` : ""}
        ${minecraftDetails(p)}
        <div class="meta">
          ${p.currentVersion ? `<span>${esc(p.currentVersion)}</span>` : ""}
          ${p.lastVerified ? `<span>&bull; Verified ${esc(p.lastVerified)}</span>` : ""}
        </div>
        <div class="card-links">
          ${link("Steam Workshop", p.steamUrl)}
          ${p.game === "Minecraft" && p.releaseStatus === "Published" ? link("CurseForge", p.curseforgeUrl) : ""}
          ${p.game === "Minecraft" && p.releaseStatus === "Published" ? link("GitHub download", p.githubReleaseUrl) : ""}
          ${link("Discord support", p.discordSupportUrl)}
          ${link("Source", p.sourceUrl)}
          ${link("Original mod", p.originalUrl)}
          ${link("Project page", p.projectUrl)}
          ${link("Asset credits", p.creditsUrl)}
        </div>
      </div>
    </article>
  `;
}

// Explicit per-project classification takes precedence over the fallback for older entries.
const projectSections = [
  { key: "original", title: "Original mods & tools", description: "Projects I created, including original add-ons for other mods. Third-party assets and dependencies are credited separately." },
  { key: "maintenance", title: "Compatibility patches & mod revivals", description: "Updates, forks, compatibility editions and combined packs based on other creators' work. Credit for the original mods remains with their authors." },
  { key: "unclassified", title: "Other projects", description: "Projects whose authorship classification has not yet been confirmed." }
];

function projectGroup(project) {
  if (["original", "maintenance"].includes(project.projectGroup)) return project.projectGroup;
  if (project.unofficialPort || project.originalUrl || ["Revived mod", "Maintenance fork", "Compatibility patch", "Compatibility edition", "Combined replacement"].includes(project.type)) return "maintenance";
  if (project.type === "Original project") return "original";
  return "unclassified";
}

function projectSectionMarkup(items) {
  return projectSections.map(section => {
    const members = items.filter(p => projectGroup(p) === section.key);
    if (!members.length) return "";
    return `
      <section class="project-section">
        <div class="project-section-heading">
          <h4>${section.title}</h4>
          <span class="game-count">${members.length} ${members.length === 1 ? "project" : "projects"}</span>
        </div>
        <p class="project-section-description">${section.description}</p>
        <div class="project-grid">
          ${members.map(cardMarkup).join("")}
        </div>
      </section>
    `;
  }).join("");
}

function pendingMinecraftMarkup() {
  const pending = state.submissions.filter(p => !state.projects.some(q => q.id === p.id));
  if (!pending.length) return "";
  return '<section class="project-section"><div class="project-section-heading"><h4>Submitted for moderation</h4></div><p class="project-section-description">Unofficial Minecraft 26.3 NeoForge ports. Downloads are not available yet.</p><div class="project-grid">' + pending.map(p => cardMarkup({id:p.id,title:p.title + " - Unofficial Port",game:"Minecraft",type:"Compatibility port",status:"Awaiting release",summary:p.summary,originalCreator:p.originalCreator,originalUrl:p.originalUrl,unofficialPort:true,minecraftVersions:[p.minecraft],modLoaders:[p.loader],releaseStatus:p.status})).join("") + '</div></section>';
}
function renderProjects() {
  const catalog = document.getElementById("project-grid");
  const projects = state.filter === "All games"
    ? state.projects
    : state.projects.filter(p => p.game === state.filter);

  if (!projects.length && state.filter !== "Minecraft") {
    catalog.innerHTML = '<p class="muted">No projects in this category yet.</p>';
    return;
  }

  const groups = new Map();
  for (const project of projects) {
    const game = project.game || "Other";
    if (!groups.has(game)) groups.set(game, []);
    groups.get(game).push(project);
  }

  if ((state.filter === "Minecraft" || state.filter === "All games") && !groups.has("Minecraft")) groups.set("Minecraft", []);
  catalog.innerHTML = [...groups.entries()].map(([game, items]) => `
    <section class="game-group">
      <div class="game-heading">
        <div>
          <p class="eyebrow">GAME</p>
          <h3 class="game-title">${esc(game)}</h3>
        </div>
        <span class="game-count">${items.length} ${items.length === 1 ? "project" : "projects"}</span>
      </div>
      ${items.length ? projectSectionMarkup(items) : '<p class="muted">No published Minecraft projects yet.</p>'}
      ${game === "Minecraft" ? pendingMinecraftMarkup() : ""}
    </section>
  `).join("");
}

async function boot() {
  try {
    const [site, projects, submissions] = await Promise.all([
      loadJson("data/site.json"),
      loadJson("data/mods.json"),
      loadJson("data/minecraft-submissions.json").catch(() => [])
    ]);
    applySite(site);
    state.submissions = Array.isArray(submissions) ? submissions : [];
    state.projects = projects.filter(p => p.game !== "Minecraft" || p.publicApproved === true);
    renderFilters();
    renderProjects();
  } catch (error) {
    document.getElementById("project-grid").innerHTML =
      '<p class="muted">The project catalog could not be loaded.</p>';
    console.error(error);
  }
}

boot();
