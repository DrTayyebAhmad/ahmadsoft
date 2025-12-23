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

function displayApps() {
  appGrid.innerHTML = "";
  
  let apps = [];
  try {
    const storedApps = localStorage.getItem("apps");
    apps = storedApps ? JSON.parse(storedApps) : [];
  } catch (e) {
    console.error('Error loading apps:', e);
    return;
  }

  if (apps.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
    return;
  }

  apps.forEach((app, index) => {
    const appCard = document.createElement("div");
    appCard.classList.add("app-card");

    appCard.innerHTML = `
      <div class="img-wrapper">
      <img src="${app.screenshot}" alt="${app.name}" onerror="this.src='images/placeholder.png'">
      </div>
      <h3>${app.name}</h3>
      <p>${app.description}</p>
      <p><strong>Platform:</strong> ${app.platform}</p>
      <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
      <div class="app-actions">
      <button onclick="downloadApp('${app.id}')">Download</button>
      <button onclick="editApp(${index})">Edit</button>
      <button onclick="deleteApp(${index}, '${app.id}')">Delete</button>
      </div>
    `;

    appGrid.appendChild(appCard);
  });
}

function downloadApp(appId) {
  try {
    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    const app = apps.find(a => a.id === appId);
    if (app && app.fileUrl) {
      const a = document.createElement("a");
      a.href = app.fileUrl;
      a.download = app.fileName || `app_${appId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const fileData = localStorage.getItem(`file_${appId}`);
    if (fileData) {
      const blob = new Blob([fileData], { type: "application/octet-stream" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = app && app.fileName ? app.fileName : `app_${appId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return;
    }
    alert("Download file not available.");
  } catch (e) {
    alert("Download failed.");
  }
}

function editApp(index) {
  localStorage.setItem("editAppIndex", index);
  window.location.href = "submit-app.html";
}

function deleteApp(index, appId) {
  if (confirm("Are you sure you want to delete this app?")) {
    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    apps.splice(index, 1);
    localStorage.setItem("apps", JSON.stringify(apps));
    localStorage.removeItem(`file_${appId}`);
    displayApps();
  }
}

// Check authentication and display apps when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  displayApps();
});

