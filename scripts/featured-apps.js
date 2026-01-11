const APPS_INDEX = "/data/apps-index.json";
const APPS_DIR = "/data/";

document.addEventListener("DOMContentLoaded", loadApps);

async function loadApps() {
  try {
    const indexRes = await fetch(APPS_INDEX);
    if (!indexRes.ok) throw new Error("apps-index.json not found");

    const files = await indexRes.json();

    const container = document.getElementById("featured-apps");
    if (!container) {
      console.error("❌ #featured-apps not found in index.html");
      return;
    }

    container.innerHTML = "";

    for (const file of files) {
      const res = await fetch(APPS_DIR + file);
      if (!res.ok) continue;

      const app = await res.json();
      renderApp(app, container);
    }
  } catch (err) {
    console.error("❌ Failed to load apps:", err);
  }
}

function renderApp(app, container) {
  const card = document.createElement("div");
  card.className = "app-card";

  card.innerHTML = `
    <img src="${app.screenshot || "images/placeholder.png"}" alt="${app.name}">
    <h3>${app.name}</h3>
    <p>${app.description}</p>
    <p><strong>Platform:</strong> ${app.platform}</p>
    <p><strong>Rating:</strong> ⭐ ${app.rating}</p>
    <p><strong>Price:</strong> $${app.price}</p>
    <a href="app.html?id=${app.id}" class="btn">View Details</a>
  `;

  container.appendChild(card);
}
