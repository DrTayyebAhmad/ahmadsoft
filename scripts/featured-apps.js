const APPS_INDEX_URL = "data/apps-index.json";

document.addEventListener("DOMContentLoaded", loadFeaturedApps);

async function loadFeaturedApps() {
  const container = document.getElementById("featured-apps");
  if (!container) return;

  container.innerHTML = "<p>Loading apps...</p>";

  try {
    // 1. Load index
    const indexRes = await fetch(APPS_INDEX_URL);
    if (!indexRes.ok) throw new Error("Index not found");

    const appFiles = await indexRes.json();

    if (!Array.isArray(appFiles) || appFiles.length === 0) {
      container.innerHTML = "<p>No apps available.</p>";
      return;
    }

    container.innerHTML = ""; // clear once only

    // 2. Load each app JSON
    for (const file of appFiles) {
      try {
        const appRes = await fetch(`data/${file}`);
        if (!appRes.ok) continue;

        const app = await appRes.json();
        renderAppCard(container, app);
      } catch (err) {
        console.warn("Failed loading", file, err);
      }
    }
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Failed to load apps.</p>";
  }
}

function renderAppCard(container, app) {
  const card = document.createElement("div");
  card.className = "featured-app-card";

  const featuresHtml = Array.isArray(app.features)
    ? `<ul>${app.features.map(f => `<li>${f}</li>`).join("")}</ul>`
    : "";

  const demoBtn = app.demoUrl
    ? `<a class="btn" href="${app.demoUrl}" download>Download Demo</a>`
    : "";

  const fullBtn = app.fullUrl
    ? `<a class="btn primary" href="${app.fullUrl}" download>Buy Full ($${app.price})</a>`
    : "";

  card.innerHTML = `
  <div class="img-wrapper">
    <img src="${app.screenshot || "images/placeholder.png"}"
         alt="${app.name}"
         onerror="this.src='images/placeholder.png'">
  </div>

  <h3>${app.name}</h3>
  <p>${app.description}</p>

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
    ${app.demoUrl ? `<a href="${app.demoUrl}" class="download-btn" target="_blank">Download Demo</a>` : ""}
    ${app.fullUrl ? `<a href="${app.fullUrl}" class="download-btn" target="_blank">Download Full</a>` : ""}
  </div>
`;

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


  container.appendChild(card);
}
