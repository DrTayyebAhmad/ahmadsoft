function checkAuth() {
  if (localStorage.getItem("isAuthenticated") !== "true") {
    window.location.href = "login.html";
  }
}

function logout() {
  localStorage.removeItem("isAuthenticated");
  window.location.href = "login.html";
}

const appGrid = document.getElementById("app-grid");

/* Load apps from JSON */
async function loadApps() {
  try {
    const indexRes = await fetch("/data/apps-index.json", { cache: "no-store" });
    const appFiles = await indexRes.json();

    if (!appFiles.length) {
      appGrid.innerHTML = "<p>No apps available.</p>";
      return;
    }

    appGrid.innerHTML = "";

    for (const file of appFiles) {
      const appRes = await fetch(`/data/${file}`, { cache: "no-store" });
      const app = await appRes.json();
      renderApp(app, file);
    }
  } catch (err) {
    console.error(err);
    appGrid.innerHTML = "<p>Failed to load apps.</p>";
  }
}

/* Render admin card */
function renderApp(app, filename) {
  const card = document.createElement("div");
  card.className = "app-card";

  card.innerHTML = `
    <div class="img-wrapper">
      <img src="${app.screenshot || "/images/placeholder.png"}"
           onerror="this.src='/images/placeholder.png'">
    </div>

    <h3>${app.name}</h3>
    <p>${app.description}</p>
    <p><strong>Platform:</strong> ${app.platform}</p>

    ${app.price ? `<p><strong>Price:</strong> $${app.price}</p>` : ""}

    <div class="rating">
      ${"★".repeat(app.rating || 0)}${"☆".repeat(5 - (app.rating || 0))}
    </div>

    <div class="app-actions">
      ${app.demoUrl ? `<a class="btn" href="${app.demoUrl}" target="_blank">Demo</a>` : ""}
      ${app.fullUrl ? `<a class="btn primary" href="${app.fullUrl}" target="_blank">Full</a>` : ""}
      <button onclick="deleteApp('${filename}')">Delete</button>
    </div>
  `;

  appGrid.appendChild(card);
}

/* Delete instruction (static-safe) */
function deleteApp(filename) {
  alert(
`To delete this app:

1. Open GitHub repository
2. Remove "${filename}" from:
   /data/apps-index.json
3. (Optional) delete:
   /data/${filename}
4. Commit & push
5. Vercel redeploys automatically`
  );
}

document.addEventListener("DOMContentLoaded", () => {
  checkAuth();
  loadApps();
});
