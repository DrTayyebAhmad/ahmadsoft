function checkAuth() {
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  if (!isAuthenticated || isAuthenticated !== 'true') {
    window.location.href = 'login.html';
  }
}

function logout() {
  localStorage.removeItem('isAuthenticated');
  window.location.href = 'login.html';
}

const appGrid = document.getElementById("app-grid");
let manageAppsCache = [];

function getPocketBaseClientForManage() {
  if (window.pb) return window.pb;
  if (window.PocketBase) {
    window.pb = new window.PocketBase('http://127.0.0.1:8090');
    return window.pb;
  }
  throw new Error('PocketBase client not initialized');
}

async function displayApps() {
  appGrid.innerHTML = "";

  let apps = [];
  try {
    const pb = getPocketBaseClientForManage();
    apps = await pb.collection('apps').getFullList({
      sort: '-created',
    });
    manageAppsCache = apps;
  } catch (e) {
    console.error('Error loading apps from PocketBase:', e);
    appGrid.innerHTML = '<p>Failed to load apps.</p>';
    return;
  }

  if (!apps || apps.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
    return;
  }

  apps.forEach((app) => {
    const appCard = document.createElement("div");
    appCard.classList.add("app-card");

    appCard.innerHTML = `
      <div class="img-wrapper">
      <img src="${app.screenshot}" alt="${app.name}" onerror="this.src='images/placeholder.png'">
      </div>
      <h3>${app.name}</h3>
      <p>${app.description}</p>
      <p><strong>Platform:</strong> ${app.platform}</p>
      <div class="rating">${"★".repeat(Math.floor(app.rating || 0))}${"☆".repeat(5 - Math.floor(app.rating || 0))}</div>
      <div class="app-actions">
      <button onclick="downloadApp('${app.id}')">Download Demo</button>
      <button onclick="deleteApp('${app.id}')">Delete</button>
      </div>
      `;

    appGrid.appendChild(appCard);
  });
}

async function downloadApp(appId) {
  try {
    const app = manageAppsCache.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!app.demo_file) { alert('Demo file not available.'); return; }

    const pb = getPocketBaseClientForManage();
    const url = pb.files.getUrl(app, app.demo_file);
    const a = document.createElement("a");
    a.href = url;
    a.download = app.demo_file || `app_${appId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    console.error('Download failed:', e);
    alert("Download failed.");
  }
}

function deleteApp(appId) {
  if (!confirm("Are you sure you want to delete this app?")) return;

  (async () => {
    try {
      const pb = getPocketBaseClientForManage();
      await pb.collection('apps').delete(appId);
      manageAppsCache = manageAppsCache.filter(a => a.id !== appId);
      displayApps();
    } catch (e) {
      console.error('Delete failed:', e);
      alert('Failed to delete app.');
    }
  })();
}

// Check authentication and display apps when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  displayApps();
});

