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
      console.log("File selected:", file.name, "Size:", file.size, "Type:", file.type);
      
      // 1. Upload Demo File
      let fileUrl;
      try {
          console.log("Attempting to upload demo file...");
          fileUrl = await uploadFile(file);
          if (!fileUrl) {
              throw new Error('Upload completed but no URL was returned');
          }
      } catch (e) {
          console.error("Demo file upload error:", e);
          throw new Error(`Demo file upload failed: ${e.message || e.toString()}`);
      }
      console.log("Demo file uploaded successfully:", fileUrl);

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
      console.error("Form submission error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      
      // Provide more specific error messages
      let errorMessage = "Failed to submit app: ";
      if (error.message) {
        errorMessage += error.message;
      } else if (error.name === 'AbortError') {
        errorMessage += "Upload was cancelled or timed out. Please check your connection and try again.";
      } else {
        errorMessage += "An unexpected error occurred. Please check the console for details.";
      }
      
      alert(errorMessage);
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
  try {
    console.log('Uploading file:', file.name, 'Size:', file.size, 'Type:', file.type);
    
    // Check if file is too large (500 MB limit)
    if (file.size > 500 * 1024 * 1024) {
      throw new Error('File size exceeds 500 MB limit');
    }
    
    // First, test if the API endpoint is reachable
    try {
      const testResponse = await fetch('/api/upload', {
        method: 'OPTIONS',
        headers: {
          'Origin': window.location.origin
        }
      });
      console.log('API endpoint test (OPTIONS):', testResponse.status, testResponse.statusText);
    } catch (testError) {
      console.warn('API endpoint test failed:', testError);
      // Continue anyway, as the actual request might still work
    }
    
    console.log('Calling Vercel Blob upload function...');
    const uploadStartTime = Date.now();
    
    const newBlob = await upload(file.name, file, {
      access: 'public',
      handleUploadUrl: '/api/upload',
    });
    
    const uploadDuration = Date.now() - uploadStartTime;
    console.log(`Upload completed in ${uploadDuration}ms`);
    
    if (!newBlob || !newBlob.url) {
      throw new Error('Upload completed but no URL was returned');
    }
    
    console.log('Upload successful, blob URL:', newBlob.url);
    return newBlob.url;
  } catch (error) {
    console.error('Upload file error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Check if it's a network/abort error
    if (error.name === 'AbortError' || error.name === 'AbortController') {
      const detailedError = new Error('Upload was cancelled or timed out. This might be due to:\n' +
        '1. Network connectivity issues\n' +
        '2. Server not responding correctly\n' +
        '3. CORS configuration problems\n' +
        'Please check your internet connection and try again. If the problem persists, check the browser console and network tab for more details.');
      console.error('AbortError details:', {
        name: error.name,
        message: error.message,
        cause: error.cause
      });
      throw detailedError;
    } else if (error.message && (error.message.includes('fetch') || error.message.includes('network'))) {
      throw new Error('Network error during upload. Please check your internet connection and ensure the server is accessible.');
    } else if (error.message && error.message.includes('BLOB_READ_WRITE_TOKEN')) {
      throw new Error('Server configuration error: BLOB_READ_WRITE_TOKEN is missing. Please contact the administrator.');
    } else if (error.message && error.message.includes('CORS')) {
      throw new Error('CORS error: The server is not allowing requests from this origin. Please check server configuration.');
    } else {
      throw new Error(`File upload failed: ${error.message || 'Unknown error occurred. Please check the browser console for details.'}`);
    }
  }
}

async function saveApp(app) {
    const response = await fetch('/api/apps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(app)
    });
    
    if (!response.ok) throw new Error('Failed to save app metadata');
}
