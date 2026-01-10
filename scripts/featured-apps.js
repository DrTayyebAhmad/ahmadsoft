function displayFeaturedApps() {
	const featuredAppsContainer = document.getElementById('featured-apps');
	if (!featuredAppsContainer) return;

	const apps = JSON.parse(localStorage.getItem('apps')) || [];
	
	if (apps.length === 0) {
		featuredAppsContainer.innerHTML = "<p>No featured apps available.</p>";
		return;
	}

	featuredAppsContainer.innerHTML = '';
	
	apps.forEach(app => {
		const appCard = document.createElement('div');
		appCard.classList.add('featured-app-card');
		
		// Create hyperlink HTML if it exists
		const hyperlinkHtml = app.hyperlink ? 
			`<p><strong>Website:</strong> <a href="${app.hyperlink}" target="_blank">Visit Website</a></p>` : '';
		
    const owned = localStorage.getItem(`owned_${app.id}`) === 'true';
    const priceHtml = app.price && app.price > 0 ? `<p><strong>Price:</strong> $${Number(app.price).toFixed(2)}</p>` : '';
    
    // Format features list
    const featuresHtml = app.features ? 
      `<div class="app-details"><strong>Features:</strong><ul>${app.features.split('\n').map(f => `<li>${f}</li>`).join('')}</ul></div>` : '';
      
    // Format deliverables list
    const deliverablesHtml = app.deliverables ? 
      `<div class="app-details"><strong>Deliverables:</strong><ul>${app.deliverables.split('\n').map(d => `<li>${d}</li>`).join('')}</ul></div>` : '';

    appCard.innerHTML = `
      <div class="img-wrapper">
        <img src="${app.screenshot}" alt="${app.name}" onerror="this.src='images/placeholder.png'">
      </div>
      <h3>${app.name}</h3>
      <p>${app.description}</p>
      ${featuresHtml}
      ${deliverablesHtml}
      <p><strong>Platform:</strong> ${app.platform}</p>
      ${hyperlinkHtml}
      ${priceHtml}
      <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
      <button onclick="downloadAppFile('${app.id}')" class="download-btn">Download Demo</button>
      ${app.price && app.price > 0 ? `<button onclick="buyOrDownloadFull('${app.id}')" class="download-btn">${owned ? 'Download Full Version' : 'Buy Full Version'}</button>` : ''}
    `;
		
		featuredAppsContainer.appendChild(appCard);
	});
}

async function downloadAppFile(appId) {
    try {
        const apps = JSON.parse(localStorage.getItem('apps')) || [];
        const app = apps.find(a => a.id === appId);
        if (!app) {
            alert('App not found');
            return;
        }
        if (app.fileUrl) {
            const link = document.createElement('a');
            link.href = app.fileUrl;
            link.download = app.fileName || `app_${app.id}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }
        const key = app.fileKey || `file_${appId}`;
        const fileData = localStorage.getItem(key);
        let blob = null;
        if (fileData) {
            const base64Data = fileData.split(',')[1];
            const binaryString = window.atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            blob = new Blob([bytes], { type: 'application/octet-stream' });
        } else {
            try {
                blob = await getFileFromIndexedDB(key);
            } catch (_) {
                blob = null;
            }
        }
        if (!blob) {
            alert('App file not found');
            return;
        }
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = app.fileName || `app_${app.id}.apk`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    } catch (error) {
        alert('Error downloading file.');
    }
}

document.addEventListener('DOMContentLoaded', displayFeaturedApps);
document.addEventListener('DOMContentLoaded', markOwnershipFromReturn);
async function openFilesDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('appFiles', 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains('files')) {
                db.createObjectStore('files', { keyPath: 'key' });
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error('IndexedDB open error'));
    });
}
async function getFileFromIndexedDB(key) {
    const db = await openFilesDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction('files', 'readonly');
        const store = tx.objectStore('files');
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result ? req.result.blob : null);
        req.onerror = () => reject(new Error('IndexedDB read error'));
    });
}

async function downloadFullApp(appId) {
  try {
    const apps = JSON.parse(localStorage.getItem('apps')) || [];
    const app = apps.find(a => a.id === appId);
    if (!app) {
      alert('App not found');
      return;
    }
    if (app.fullFileUrl) {
      const link = document.createElement('a');
      link.href = app.fullFileUrl;
      link.download = app.fullFileName || `full_${app.id}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }
    const key = app.fullFileKey || `full_${appId}`;
    const fileData = localStorage.getItem(key);
    let blob = null;
    if (fileData) {
      const base64Data = fileData.split(',')[1];
      const binaryString = window.atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      blob = new Blob([bytes], { type: 'application/octet-stream' });
    } else {
      try {
        blob = await getFileFromIndexedDB(key);
      } catch (_) {
        blob = null;
      }
    }
    if (!blob) {
      alert('Full version file not found');
      return;
    }
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = app.fullFileName || `full_${app.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    alert('Error downloading full version.');
  }
}

function getReturnUrl(appId) {
  const base = window.location.origin + window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  params.set('purchase_success', '1');
  params.set('appId', appId);
  return base + '?' + params.toString();
}

function markOwnershipFromReturn() {
  const params = new URLSearchParams(window.location.search);
  const success = params.get('purchase_success');
  const appId = params.get('appId');
  if (success === '1' && appId) {
    localStorage.setItem(`owned_${appId}`, 'true');
    params.delete('purchase_success');
    params.delete('appId');
    const base = window.location.origin + window.location.pathname;
    const newUrl = params.toString() ? base + '?' + params.toString() : base;
    window.history.replaceState({}, '', newUrl);
  }
}

function buyOrDownloadFull(appId) {
  const apps = JSON.parse(localStorage.getItem('apps')) || [];
  const app = apps.find(a => a.id === appId);
  if (!app) {
    alert('App not found');
    return;
  }
  const owned = localStorage.getItem(`owned_${appId}`) === 'true';
  if (owned) {
    downloadFullApp(appId);
    return;
  }
  if (app.purchaseLink) {
    const ret = getReturnUrl(appId);
    const url = app.purchaseLink.includes('?') ? `${app.purchaseLink}&return_url=${encodeURIComponent(ret)}` : `${app.purchaseLink}?return_url=${encodeURIComponent(ret)}`;
    window.location.href = url;
    return;
  }
  alert('Purchase link not available.');
}
