const APPS_INDEX_URL = "data/apps-index.json";
const APPS_JSON_URL = "data/apps.json";
const APPS_API_URL = "/api/apps";

document.addEventListener("DOMContentLoaded", loadFeaturedApps);

async function loadFeaturedApps() {
  const container = document.getElementById("featured-apps");
  if (!container) return;

  if (window.AppAnalytics) {
    window.AppAnalytics.trackVisit("home");
  }

  container.innerHTML = "<p>Loading apps...</p>";

  try {
    const apps = await getApps();
    if (!apps.length) {
      container.innerHTML =
        window.location.protocol === "file:"
          ? "<p>No apps found. For file mode, run `npm.cmd run build:local-apps` after JSON edits, or start a local server.</p>"
          : "<p>No apps available.</p>";
      return;
    }

    container.innerHTML = "";
    apps.forEach((app) => renderAppCard(container, app));
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load apps.</p>";
  }
}

async function getApps() {
  const isFileProtocol = window.location.protocol === "file:";

  if (isFileProtocol) {
    const bundledLocalApps = getBundledLocalApps();
    if (bundledLocalApps.length) return bundledLocalApps;
    const localApps = getAppsFromLocalStorage();
    if (localApps.length) return localApps;
    return [];
  }

  const indexedApps = await getAppsFromIndexFiles();
  if (indexedApps.length) return indexedApps;

  const appsJson = await fetchJson(APPS_JSON_URL);
  if (Array.isArray(appsJson) && appsJson.length) return appsJson;
  if (appsJson && typeof appsJson === "object") return [appsJson];

  const apiApps = await fetchJson(APPS_API_URL);
  if (Array.isArray(apiApps) && apiApps.length) return apiApps;

  return [];
}

function getBundledLocalApps() {
  const apps = window.__LOCAL_APPS__;
  return Array.isArray(apps) ? apps : [];
}

function getAppsFromLocalStorage() {
  try {
    const apps = JSON.parse(localStorage.getItem("apps") || "[]");
    return Array.isArray(apps) ? apps : [];
  } catch (_) {
    return [];
  }
}

async function getAppsFromIndexFiles() {
  const appFiles = await fetchJson(APPS_INDEX_URL);
  if (!Array.isArray(appFiles) || !appFiles.length) return [];

  const apps = [];
  for (const file of appFiles) {
    const app = await fetchJson(`data/${file}`);
    if (app && typeof app === "object") {
      apps.push(app);
    }
  }

  return apps;
}

async function fetchJson(url) {
  try {
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) return null;
    return await response.json();
  } catch (_) {
    return null;
  }
}

function renderAppCard(container, app) {
  const card = document.createElement("div");
  card.className = "featured-app-card";

  card.innerHTML = `
    <div class="img-wrapper">
      <img src="${app.screenshot || "images/placeholder.png"}"
           alt="${app.name}"
           onerror="this.src='images/placeholder.png'">
    </div>

    <h3>${app.name}</h3>
    <p class="app-description">${app.description}</p>

    <p><strong>Platform:</strong> ${app.platform}</p>
    <p><strong>Price:</strong> ${app.price && app.price > 0 ? `$${app.price}` : "Free"}</p>

    ${app.features?.length ? `
      <h4>Key Features</h4>
      <ul class="features-list">
        ${app.features.map(f => `<li>${f}</li>`).join("")}
      </ul>
    ` : ""}

    ${app.deliverables?.length ? `
      <h4>Deliverables</h4>
      <ul class="deliverables-list">
        ${app.deliverables.map(d => `<li>${d}</li>`).join("")}
      </ul>
    ` : ""}

    <div class="rating">
      ${"★".repeat(app.rating || 0)}${"☆".repeat(5 - (app.rating || 0))}
    </div>

    <div class="app-actions">
      ${app.demoUrl ? `
        <a href="${app.demoUrl}" class="download-btn" download>
          Download Demo
        </a>
      ` : ""}

      ${app.price > 0 && app.paddleCheckoutUrl ? `
        <a href="${app.paddleCheckoutUrl}"
           class="download-btn paid-btn"
           target="_blank"
           rel="noopener">
          Buy Full Version ($${app.price})
        </a>
      ` : ""}
    </div>
  `;

  const demoLink = card.querySelector(".app-actions a.download-btn[download]");
  if (demoLink && window.AppAnalytics) {
    demoLink.addEventListener("click", () => {
      window.AppAnalytics.trackDownload(app.name || "Demo App");
    });
  }

  container.appendChild(card);
}

