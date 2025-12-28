let featuredAppsCache = [];

function getPocketBaseClient() {
	if (window.pb) return window.pb;
	if (window.PocketBase) {
		window.pb = new window.PocketBase('http://127.0.0.1:8090');
		return window.pb;
	}
	throw new Error('PocketBase client not initialized');
}

async function displayFeaturedApps() {
	const featuredAppsContainer = document.getElementById('featured-apps');
	if (!featuredAppsContainer) return;

	let apps = [];
	try {
		const pb = getPocketBaseClient();
		apps = await pb.collection('apps').getFullList({
			sort: '-created',
		});
		featuredAppsCache = apps;
	} catch (err) {
		console.error('Failed to load apps from PocketBase:', err);
		featuredAppsContainer.innerHTML = '<p>Failed to load apps.</p>';
		return;
	}

	if (!apps || apps.length === 0) {
		featuredAppsContainer.innerHTML = "<p>No featured apps available.</p>";
		return;
	}

	featuredAppsContainer.innerHTML = '';
	
	const pb = getPocketBaseClient();
	apps.forEach(app => {
		const appCard = document.createElement('div');
		appCard.classList.add('featured-app-card');
		
		const hyperlinkHtml = app.hyperlink ? 
			`<p><strong>Website:</strong> <a href="${app.hyperlink}" target="_blank">Visit Website</a></p>` : '';

		const priceValue = typeof app.price === 'number' ? app.price : parseFloat(app.price || '0');
		const priceLabel = priceValue && priceValue > 0 ? `<p><strong>Price:</strong> $${priceValue.toFixed(2)}</p>` : `<p><strong>Price:</strong> Free</p>`;
		const isBought = isPurchased(app.id);

		const hasDemo = !!app.demo_file;
		const hasFull = !!app.full_file;

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
			<div class="rating">${"★".repeat(Math.floor(app.rating || 0))}${"☆".repeat(5 - Math.floor(app.rating || 0))}</div>
			${priceLabel}
			<div class="actions">${demoBtn} ${fullBtn}</div>
		`;
		
		featuredAppsContainer.appendChild(appCard);
	});
}

function downloadDemo(appId) {
    const app = featuredAppsCache.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!app.demo_file) { alert('Demo not available'); return; }
    try {
        const pb = getPocketBaseClient();
        const url = pb.files.getUrl(app, app.demo_file);
        triggerDownload(url, app.demo_file);
    } catch (e) {
        console.error('Demo download failed:', e);
        alert('Demo download failed.');
    }
}

function downloadFull(appId) {
    const app = featuredAppsCache.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!isPurchased(appId)) { alert('Please purchase to download full version'); return; }
    if (!app.full_file) { alert('Full version not available'); return; }
    try {
        const pb = getPocketBaseClient();
        const url = pb.files.getUrl(app, app.full_file);
        triggerDownload(url, app.full_file);
    } catch (e) {
        console.error('Full download failed:', e);
        alert('Full version download failed.');
    }
}

function buyFullVersion(appId) {
    const app = featuredAppsCache.find(a => a.id === appId);
    if (!app) { alert('App not found'); return; }
    if (!(app.full_file)) { alert('Full version not available'); return; }
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

document.addEventListener('DOMContentLoaded', function(){
	  handlePaymentReturn();
	  displayFeaturedApps();
});


