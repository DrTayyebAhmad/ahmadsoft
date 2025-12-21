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

		const priceLabel = app.price && app.price > 0 ? `<p><strong>Price:</strong> $${app.price.toFixed(2)}</p>` : `<p><strong>Price:</strong> Free</p>`;
		const isBought = isPurchased(app.id);
		const hasDemo = !!(app.demoFileUrl || app.demoFileData);
		const hasFull = !!(app.fullFileUrl || app.fullFileData);

		const demoBtn = hasDemo ? `<button onclick="downloadDemo('${app.id}')" class="download-btn">Download Demo</button>` : '';
		const fullBtn = hasFull ? (isBought ? `<button onclick="downloadFull('${app.id}')" class="download-btn">Download Full</button>` : `<button onclick="buyFullVersion('${app.id}')" class="download-btn">Buy Full Version</button>`) : '';

		appCard.innerHTML = `
			<div class="img-wrapper">
				<img src="${app.screenshot}" alt="${app.name}" onerror="this.src='images/placeholder.png'">
			</div>
			<h3>${app.name}</h3>
			<p>${app.description}</p>
			<p><strong>Platform:</strong> ${app.platform}</p>
			${hyperlinkHtml}
			<div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
			${priceLabel}
			<div class="actions">${demoBtn} ${fullBtn}</div>
		`;
		
		featuredAppsContainer.appendChild(appCard);
	});
}

function downloadDemo(appId) {
    const apps = JSON.parse(localStorage.getItem('apps')) || [];
    const app = apps.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (app.demoFileUrl) { triggerDownload(app.demoFileUrl, app.demoFileName || `demo_${app.id}`); return; }
    if (!app.demoFileData) { alert('Demo not available'); return; }
    downloadFromBase64(app.demoFileData, app.demoFileName || `demo_${app.id}`);
}

function downloadFull(appId) {
    const apps = JSON.parse(localStorage.getItem('apps')) || [];
    const app = apps.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!isPurchased(appId)) { alert('Please purchase to download full version'); return; }
    if (app.fullFileUrl) { triggerDownload(app.fullFileUrl, app.fullFileName || `full_${app.id}`); return; }
    if (!app.fullFileData) { alert('Full version not available'); return; }
    downloadFromBase64(app.fullFileData, app.fullFileName || `full_${app.id}`);
}

function buyFullVersion(appId) {
    const apps = JSON.parse(localStorage.getItem('apps')) || [];
    const app = apps.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!(app.fullFileUrl || app.fullFileData)) { alert('Full version not available'); return; }
    const url = getPaymentUrl(app);
    window.location.href = url;
}

function isPurchased(appId) {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || {};
    return purchases[appId] === true;
}

function triggerDownload(url, name) {
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function downloadFromBase64(dataUrl, name) {
    const base64Data = dataUrl.split(',')[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) { bytes[i] = binaryString.charCodeAt(i); }
    const blob = new Blob([bytes], { type: 'application/octet-stream' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}

const PAYMENT_CONFIG = { provider: '2checkout', sid: null, product_id: null };

function getPaymentUrl(app) {
  const origin = window.location.origin || '';
  const returnUrl = `${origin}/index.html?paid=1&appId=${encodeURIComponent(app.id)}`;
  if (PAYMENT_CONFIG.provider === '2checkout' && PAYMENT_CONFIG.sid && PAYMENT_CONFIG.product_id) {
    const base = 'https://secure.2checkout.com/checkout/purchase';
    const params = new URLSearchParams({ sid: PAYMENT_CONFIG.sid, quantity: '1', product_id: PAYMENT_CONFIG.product_id, merchant_order_id: app.id, return_url: returnUrl, return_type: 'redirect' });
    return `${base}?${params.toString()}`;
  }
  return returnUrl + '&simulate=1';
}

function handlePaymentReturn() {
  const qs = new URLSearchParams(window.location.search);
  const paid = qs.get('paid');
  const appId = qs.get('appId');
  if (paid === '1' && appId) {
    const purchases = JSON.parse(localStorage.getItem('purchases')) || {};
    purchases[appId] = true;
    localStorage.setItem('purchases', JSON.stringify(purchases));
    const url = new URL(window.location.href);
    url.search = '';
    window.history.replaceState({}, '', url.toString());
  }
}

document.addEventListener('DOMContentLoaded', function(){ handlePaymentReturn(); displayFeaturedApps(); });


