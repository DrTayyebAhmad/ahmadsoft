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
		
		appCard.innerHTML = `
			<div class="img-wrapper">
				<img src="${app.screenshot}" alt="${app.name}" onerror="this.src='images/placeholder.png'">
			</div>
			<h3>${app.name}</h3>
			<p>${app.description}</p>
			<p><strong>Platform:</strong> ${app.platform}</p>
			${hyperlinkHtml}
			<div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
			<button onclick="downloadAppFile('${app.id}')" class="download-btn">Download</button>
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
