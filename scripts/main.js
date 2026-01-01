const appGrid = document.getElementById("app-grid");

// Load apps from localStorage
const apps = JSON.parse(localStorage.getItem("apps")) || [];

// Display apps
apps.forEach((app) => {
  const appCard = document.createElement("div");
  appCard.classList.add("app-card");

  appCard.innerHTML = `
    <img src="${app.screenshot}" alt="${app.name}">
    <h3>${app.name}</h3>
    <p>${app.description}</p>
    <p><strong>Platform:</strong> ${app.platform}</p>
    <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
    <button class="download-btn" onclick="downloadApp('${app.id}')">Download</button>
  `;

  appGrid.appendChild(appCard);
});

// Download App Function (uses same logic as featured-apps)
async function downloadApp(appId) {
  try {
    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    const app = apps.find((a) => a.id === appId);
    if (!app) {
      alert("App not found");
      return;
    }
    if (app.fileUrl) {
      const a = document.createElement("a");
      a.href = app.fileUrl;
      a.download = app.fileName || `app_${appId}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }
    const key = app.fileKey || `file_${appId}`;
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
        blob = await getFileFromIndexedDB(key);
      } catch (_) {
        blob = null;
      }
    }
    if (!blob) {
      alert("App file not found");
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = app.fileName || `app_${appId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error downloading file.");
  }
}
async function openFilesDB() {
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
async function getFileFromIndexedDB(key) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(new Error("IndexedDB read error"));
  });
}
