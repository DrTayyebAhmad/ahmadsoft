document.getElementById("app-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const fileInput = document.getElementById("demo-file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload an app file.");
    return;
  }

  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = "Uploading...";

  try {
    console.log("Starting upload process...");
    
    // 1. Upload Demo File
    const fileUrl = await uploadFile(file);
    console.log("Demo file uploaded:", fileUrl);

    // 2. Upload Screenshot (if exists)
    let screenshotUrl = document.getElementById("screenshot").value || "";
    const screenshotFileInput = document.getElementById("screenshot-file");
    if (screenshotFileInput && screenshotFileInput.files[0]) {
       screenshotUrl = await uploadFile(screenshotFileInput.files[0]);
       console.log("Screenshot uploaded:", screenshotUrl);
    }

    // 3. Upload Full File (if exists)
    let fullFileUrl = null;
    const fullFileInput = document.getElementById("full-file");
    if (fullFileInput && fullFileInput.files[0]) {
        fullFileUrl = await uploadFile(fullFileInput.files[0]);
        console.log("Full file uploaded:", fullFileUrl);
    }

    const appId = Date.now().toString();
    const newApp = {
      id: appId,
      name: document.getElementById("app-name").value,
      platform: document.getElementById("platform").value,
      description: document.getElementById("description").value,
      features: document.getElementById("features").value || "",
      deliverables: document.getElementById("deliverables").value || "",
      hyperlink: document.getElementById("hyperlink").value || null,
      screenshot: screenshotUrl,
      rating: parseFloat(document.getElementById("rating").value),
      price: parseFloat(document.getElementById("price").value || "0") || 0,
      purchaseLink: document.getElementById("purchase-link").value || null,
      fileName: file.name,
      fileUrl: fileUrl,
      fullFileName: fullFileInput && fullFileInput.files[0] ? fullFileInput.files[0].name : null,
      fullFileUrl: fullFileUrl,
      createdAt: new Date().toISOString()
    };

    // 4. Save App Metadata
    await saveApp(newApp);
    console.log("App saved successfully");

    alert("App submitted successfully!");
    document.getElementById("app-form").reset();
    window.location.href = "index.html";

  } catch (error) {
    console.error("Error:", error);
    alert("Failed to submit app: " + error.message);
  } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
  }
});

async function uploadFile(file) {
  // Get upload URL from our API
  const response = await fetch('/api/upload', { method: 'POST' });
  if (!response.ok) throw new Error('Failed to get upload URL');
  const { uploadUrl } = await response.json();

  // Upload file to Vercel Blob
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'x-vercel-multipart': '1', 
    }
  });

  if (!uploadResponse.ok) throw new Error('Failed to upload file to Blob');
  
  const blob = await uploadResponse.json();
  return blob.url;
}

async function saveApp(app) {
    const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
    });
    
    if (!response.ok) throw new Error('Failed to save app metadata');
}
