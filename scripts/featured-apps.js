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

function downloadAppFile(appId) {
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
        if (!app.fileData) {
            alert('App file not found');
            return;
        }
        const base64Data = app.fileData.split(',')[1];
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'application/octet-stream' });
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


