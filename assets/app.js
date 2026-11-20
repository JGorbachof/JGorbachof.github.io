const state = { projects: [], filter: "All" };

async function loadJson(path) {
  const response = await fetch(path, { cache: "no-store" });
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

function projectTypes(projects) {
  return ["All", ...new Set(projects.map(p => p.type).filter(Boolean))];
}

function renderFilters() {
  const box = document.getElementById("filters");
  box.innerHTML = "";
  for (const type of projectTypes(state.projects)) {
    const button = document.createElement("button");
    button.className = "filter" + (state.filter === type ? " active" : "");
    button.type = "button";
    button.textContent = type;
    button.addEventListener("click", () => {
      state.filter = type;
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

function renderProjects() {
  const grid = document.getElementById("project-grid");
  const projects = state.filter === "All"
    ? state.projects
    : state.projects.filter(p => p.type === state.filter);

  if (!projects.length) {
    grid.innerHTML = '<p class="muted">No projects in this category yet.</p>';
    return;
  }

  grid.innerHTML = projects.map(p => `
    <article class="card ${p.featured ? "featured" : ""}">
      ${p.imageUrl ? `<img class="card-image" src="${p.imageUrl}" alt="${p.title} preview">` : ""}
      <div class="card-body">
      <div class="card-top">
        <span class="badge">${p.type || "Project"}</span>
        <span class="badge status">${p.status || "Active"}</span>
      </div>
      <h3>${p.title}</h3>
      <p>${p.summary || ""}</p>
      ${p.credits ? `<p class="credits">${p.credits}</p>` : ""}
      <div class="meta">
        ${p.game ? `<span>${p.game}</span>` : ""}
        ${p.currentVersion ? `<span>• ${p.currentVersion}</span>` : ""}
        ${p.lastVerified ? `<span>• Verified ${p.lastVerified}</span>` : ""}
      </div>
      <div class="card-links">
        ${link("Steam Workshop", p.steamUrl)}
        ${link("Source", p.sourceUrl)}
        ${link("Original mod", p.originalUrl)}
        ${link("Project page", p.projectUrl)}
      </div>
      </div>
    </article>
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
