import { upload } from 'https://cdn.jsdelivr.net/npm/@vercel/blob@0.22.0/client/index.js';

function initFormHandler() {
  const form = document.getElementById("app-form");
  if (!form) return;

  // Remove existing listeners to be safe (though not strictly possible without reference)
  // We rely on this running once per page load
  
  form.addEventListener("submit", async function (e) {
    e.preventDefault(); // STOP default form submission
    e.stopPropagation();

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
      let fileUrl;
      try {
          fileUrl = await uploadFile(file);
      } catch (e) {
          throw new Error(`Demo file upload failed: ${e.message}`);
      }
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
      form.reset();
      window.location.href = "index.html";

    } catch (error) {
      console.error("Error:", error);
      alert("Failed to submit app: " + error.message);
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
    }
  });
}

// Ensure the DOM is fully loaded before attaching listeners
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFormHandler);
} else {
    initFormHandler();
}

async function uploadFile(file) {
  const newBlob = await upload(file.name, file, {
    access: 'public',
    handleUploadUrl: '/api/upload',
  });
  return newBlob.url;
}

async function saveApp(app) {
    const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
    });
    
    if (!response.ok) throw new Error('Failed to save app metadata');
}
