async function loadApps() {
  const res = await fetch("data/apps.json");
  const apps = await res.json();

  const container = document.getElementById("featured-apps");
  container.innerHTML = "";

  if (!apps.length) {
    container.innerHTML = "<p>No apps available.</p>";
    return;
  }

  apps.forEach(app => {
    const card = document.createElement("div");
    card.className = "featured-app-card";

    card.innerHTML = `
      <img src="${app.screenshot}" onerror="this.src='images/placeholder.png'">
      <h3>${app.name}</h3>
      <p>${app.description}</p>
      <p><b>Platform:</b> ${app.platform}</p>
      <p><b>Rating:</b> ⭐ ${app.rating}</p>

      ${app.demoUrl ? `<a href="${app.demoUrl}" class="download-btn">Download Demo</a>` : ""}

      ${
        app.price > 0
          ? `<a href="${app.purchaseLink}" class="download-btn">Buy Full ($${app.price})</a>`
          : ""
      }
    `;

    container.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", loadApps);
