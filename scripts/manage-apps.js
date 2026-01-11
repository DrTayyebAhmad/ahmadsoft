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
      ${app.price && app.price > 0 ? `<p><strong>Price:</strong> $${Number(app.price).toFixed(2)}</p>` : ''}
      <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
      <div class="app-actions">
      <button onclick="downloadApp('${app.id}')">Download Demo</button>
      ${app.price && app.price > 0 ? `<button onclick="downloadFullApp('${app.id}')">Download Full</button>` : ''}
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
      const base64Data = fileData.split(",")[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: "application/octet-stream" });
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

async function downloadFullApp(appId) {
  try {
    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    const app = apps.find(a => a.id === appId);
    if (!app) {
      alert("App not found");
      return;
    }
    if (app.fullFileUrl) {
      const a = document.createElement("a");
      a.href = app.fullFileUrl;
      a.download = app.fullFileName || `full_${appId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const key = app.fullFileKey || `full_${appId}`;
    const fileData = localStorage.getItem(key);
    let blob = null;
    if (fileData) {
      const base64Data = fileData.split(",")[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: "application/octet-stream" });
    } else {
      try {
        const db = await openFilesDB();
        const tx = db.transaction("files", "readonly");
        const store = tx.objectStore("files");
        const req = store.get(key);
        await new Promise((resolve, reject) => {
          req.onsuccess = () => {
            blob = req.result ? req.result.blob : null;
            resolve();
          };
          req.onerror = () => reject(new Error("IndexedDB read error"));
        });
      } catch (_) {
        blob = null;
      }
    }
    if (!blob) {
      alert("Full version file not found");
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = app.fullFileName || `full_${appId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error downloading full file.");
  }
}

function openFilesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("appFiles", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("IndexedDB open error"));
  });
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

