const state = { projects: [], filter: "All games" };
const assetVersion = "20261120-3";

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
  return ["All games", ...new Set(projects.map(p => p.game).filter(Boolean))];
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

function link(label, url) {
  if (!url) return "";
  return `<a href="${url}" target="_blank" rel="noopener">${label}</a>`;
}

function cardMarkup(p) {
  return `
    <article class="card ${p.featured ? "featured" : ""}">
      ${p.imageUrl ? `<img class="card-image" src="${p.imageUrl}" alt="${p.title} preview" loading="lazy">` : ""}
      <div class="card-body">
        <div class="card-top">
          <span class="badge">${p.type || "Project"}</span>
          <span class="badge status">${p.status || "Active"}</span>
        </div>
        <h3>${p.title}</h3>
        <p>${p.summary || ""}</p>
        ${p.credits ? `<p class="credits">${p.credits}</p>` : ""}
        <div class="meta">
          ${p.currentVersion ? `<span>${p.currentVersion}</span>` : ""}
          ${p.lastVerified ? `<span>&bull; Verified ${p.lastVerified}</span>` : ""}
        </div>
        <div class="card-links">
          ${link("Steam Workshop", p.steamUrl)}
          ${link("Discord support", p.discordSupportUrl)}
          ${link("Source", p.sourceUrl)}
          ${link("Original mod", p.originalUrl)}
          ${link("Project page", p.projectUrl)}
        </div>
      </div>
    </article>
  `;
}

function renderProjects() {
  const catalog = document.getElementById("project-grid");
  const projects = state.filter === "All games"
    ? state.projects
    : state.projects.filter(p => p.game === state.filter);

  if (!projects.length) {
    catalog.innerHTML = '<p class="muted">No projects in this category yet.</p>';
    return;
  }

  const groups = new Map();
  for (const project of projects) {
    const game = project.game || "Other";
    if (!groups.has(game)) groups.set(game, []);
    groups.get(game).push(project);
  }

  catalog.innerHTML = [...groups.entries()].map(([game, items]) => `
    <section class="game-group">
      <div class="game-heading">
        <div>
          <p class="eyebrow">GAME</p>
          <h3 class="game-title">${game}</h3>
        </div>
        <span class="game-count">${items.length} ${items.length === 1 ? "project" : "projects"}</span>
      </div>
      <div class="project-grid">
        ${items.map(cardMarkup).join("")}
      </div>
    </section>
  `).join("");
}

async function boot() {
  try {
    const [site, projects] = await Promise.all([
      loadJson("data/site.json"),
      loadJson("data/mods.json")
    ]);
    applySite(site);
    state.projects = projects;
    renderFilters();
    renderProjects();
  } catch (error) {
    document.getElementById("project-grid").innerHTML =
      '<p class="muted">The project catalog could not be loaded.</p>';
    console.error(error);
  }
}

boot();
