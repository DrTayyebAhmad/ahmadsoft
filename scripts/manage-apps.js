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

let cachedApps = [];

async function displayApps() {
  appGrid.innerHTML = "";
  
  cachedApps = await fetchApps();

  if (cachedApps.length === 0) {
    appGrid.innerHTML = "<p>No apps available.</p>";
    return;
  }

  cachedApps.forEach((app, index) => {
    const appCard = document.createElement("div");
    appCard.classList.add("app-card");

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
      ${app.price && app.price > 0 ? `<p><strong>Price:</strong> $${Number(app.price).toFixed(2)}</p>` : ''}
      <div class="rating">${"★".repeat(Math.floor(app.rating))}${"☆".repeat(5 - Math.floor(app.rating))}</div>
      <div class="app-actions">
      <button onclick="downloadApp('${app.id}')">Download Demo</button>
      ${app.price && app.price > 0 ? `<button onclick="downloadFullApp('${app.id}')">Download Full</button>` : ''}
      <button onclick="deleteApp('${app.id}')">Delete</button>
      </div>
    `;

    appGrid.appendChild(appCard);
  });
}

function downloadApp(appId) {
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

async function deleteApp(appId) {
  if (confirm("Are you sure you want to delete this app?")) {
    try {
        const response = await fetch('/api/apps', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: appId })
        });
        
        if (response.ok) {
            displayApps();
        } else {
            alert("Failed to delete app");
        }
    } catch (e) {
        console.error(e);
        alert("Error deleting app");
    }
  }
}

// Check authentication and display apps when page loads
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  displayApps();
});
