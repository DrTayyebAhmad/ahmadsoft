const appGrid = document.getElementById("app-grid");

// Load apps from localStorage
const apps = JSON.parse(localStorage.getItem("apps")) || [];

// Display apps
apps.forEach((app) => {
  const appCard = document.createElement("div");
  appCard.classList.add("app-card");

  const owned = localStorage.getItem(`owned_${app.id}`) === 'true';
  const priceHtml = app.price && app.price > 0 ? `<p><strong>Price:</strong> $${Number(app.price).toFixed(2)}</p>` : '';
  appCard.innerHTML = `
    <img src="${app.screenshot}" alt="${app.name}">
    <h3>${app.name}</h3>
    <p>${app.description}</p>
    <p><strong>Platform:</strong> ${app.platform}</p>
    ${priceHtml}
    <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
    <button class="download-btn" onclick="downloadApp('${app.id}')">Download Demo</button>
    ${app.price && app.price > 0 ? `<button class="download-btn" onclick="buyOrDownloadFull('${app.id}')">${owned ? 'Download Full Version' : 'Buy Full Version'}</button>` : ''}
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

async function downloadFull(appId) {
  try {
    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    const app = apps.find((a) => a.id === appId);
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
        blob = await getFileFromIndexedDB(key);
      } catch (_) {
        blob = null;
      }
    }
    if (!blob) {
      alert("Full version file not found");
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = app.fullFileName || `full_${appId}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  } catch (e) {
    alert("Error downloading full version.");
  }
}

function getReturnUrl(appId) {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  params.set("purchase_success", "1");
  params.set("appId", appId);
  return base + "?" + params.toString();
}

function markOwnershipFromReturn() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get("purchase_success");
  const appId = params.get("appId");
  if (success === "1" && appId) {
    localStorage.setItem(`owned_${appId}`, "true");
    params.delete("purchase_success");
    params.delete("appId");
    const base = window.location.origin + window.location.pathname;
    const newUrl = params.toString() ? base + "?" + params.toString() : base;
    window.history.replaceState({}, "", newUrl);
  }
}

function buyOrDownloadFull(appId) {
  const apps = JSON.parse(localStorage.getItem("apps")) || [];
  const app = apps.find((a) => a.id === appId);
  if (!app) {
    alert("App not found");
    return;
  }
  const owned = localStorage.getItem(`owned_${appId}`) === "true";
  if (owned) {
    downloadFull(appId);
    return;
  }
  if (app.purchaseLink) {
    const ret = getReturnUrl(appId);
    const url = app.purchaseLink.includes("?")
      ? `${app.purchaseLink}&return_url=${encodeURIComponent(ret)}`
      : `${app.purchaseLink}?return_url=${encodeURIComponent(ret)}`;
    window.location.href = url;
    return;
  }
  alert("Purchase link not available.");
}

document.addEventListener("DOMContentLoaded", markOwnershipFromReturn);
