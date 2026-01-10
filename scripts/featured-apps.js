// Fetch apps from API
async function fetchApps() {
    try {
        const response = await fetch('/api/apps');
        if (!response.ok) return [];
        return await response.json();
    } catch (e) {
        console.error('Failed to fetch apps:', e);
        return [];
    }
}

// Global variable to cache apps
let cachedApps = [];

async function displayFeaturedApps() {
	const featuredAppsContainer = document.getElementById('featured-apps');
	if (!featuredAppsContainer) return;

	cachedApps = await fetchApps();
	
	if (cachedApps.length === 0) {
		featuredAppsContainer.innerHTML = "<p>No featured apps available.</p>";
		return;
	}

	featuredAppsContainer.innerHTML = '';
	
	cachedApps.forEach(app => {
		const appCard = document.createElement('div');
		appCard.classList.add('featured-app-card');
		
		const hyperlinkHtml = app.hyperlink ? 
			`<p><strong>Website:</strong> <a href="${app.hyperlink}" target="_blank">Visit Website</a></p>` : '';
		
        const owned = localStorage.getItem(`owned_${app.id}`) === 'true';
        const priceHtml = app.price && app.price > 0 ? `<p><strong>Price:</strong> $${Number(app.price).toFixed(2)}</p>` : '';
        
        const featuresHtml = app.features ? 
          `<div class="app-details"><strong>Features:</strong><ul>${app.features.split('\n').map(f => `<li>${f}</li>`).join('')}</ul></div>` : '';
          
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

function downloadAppFile(appId) {
    const app = cachedApps.find(a => a.id === appId);
    if (!app || !app.fileUrl) {
        alert('Download not available');
        return;
    }
    
    const link = document.createElement('a');
    link.href = app.fileUrl;
    link.download = app.fileName || `app_${app.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadFullApp(appId) {
    const app = cachedApps.find(a => a.id === appId);
    if (!app || !app.fullFileUrl) {
        alert('Full version download not available');
        return;
    }
    
    const link = document.createElement('a');
    link.href = app.fullFileUrl;
    link.download = app.fullFileName || `full_${app.id}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    // Clean URL
    params.delete('purchase_success');
    params.delete('appId');
    const base = window.location.origin + window.location.pathname;
    const newUrl = params.toString() ? base + '?' + params.toString() : base;
    window.history.replaceState({}, '', newUrl);
  }
}

function buyOrDownloadFull(appId) {
  const app = cachedApps.find(a => a.id === appId);
  if (!app) return;
  
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

document.addEventListener('DOMContentLoaded', displayFeaturedApps);
document.addEventListener('DOMContentLoaded', markOwnershipFromReturn);
