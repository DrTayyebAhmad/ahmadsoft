const APPS_INDEX = "/data/apps-index.json";
const APPS_DIR = "/data/";

document.addEventListener("DOMContentLoaded", loadApps);

async function loadApps() {
  const container = document.getElementById("featured-apps");
  container.innerHTML = "<p>Loading apps…</p>";

  try {
    const indexRes = await fetch(APPS_INDEX);
    const files = await indexRes.json();

    container.innerHTML = "";

    for (const file of files) {
      const res = await fetch(APPS_DIR + file);
      const app = await res.json();
      container.appendChild(renderApp(app));
    }
  } catch (e) {
    container.innerHTML = "<p>Failed to load apps.</p>";
    console.error(e);
  }
}

function renderApp(app) {
  const card = document.createElement("div");
  card.className = "featured-app-card";

  card.innerHTML = `
    <img class="app-image" src="${app.screenshot || "images/placeholder.png"}">
    <h3>${app.name}</h3>
    <p class="platform">${app.platform}</p>
    <p class="description">${app.description}</p>

    ${renderList("Features", app.features)}
    ${renderList("Deliverables", app.deliverables)}

    <p class="rating">⭐ ${app.rating}</p>
    <p class="price">$${app.price}</p>

    <div class="actions">
      ${app.demoUrl ? `<a href="${app.demoUrl}" class="btn">Download Demo</a>` : ""}
      ${app.fullUrl ? `<a href="${app.fullUrl}" class="btn primary">Buy Full</a>` : ""}
    </div>
  `;

  return card;
}

function renderList(title, items) {
  if (!items || items.length === 0) return "";

  return `
    <h4>${title}</h4>
    <ul>
      ${items.map(i => `<li>${i}</li>`).join("")}
    </ul>
  `;
}
