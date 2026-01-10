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
    <button class="download-btn" onclick="downloadApp('${app.file}', '${app.fileName}')">Download</button>
  `;

  appGrid.appendChild(appCard);
});

// Download App Function
function downloadApp(base64File, fileName) {
  if (base64File) {
    // Convert Base64 to a Blob
    const byteCharacters = atob(base64File.split(",")[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "application/octet-stream" });

    // Create a download link
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    link.click();
  } else {
    alert("Download link not available.");
  }
}