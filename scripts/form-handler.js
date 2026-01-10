document.getElementById("app-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  console.log("Form submitted");

  const fileInput = document.getElementById("demo-file");
  const file = fileInput.files[0];

  if (!file) {
    alert("Please upload an app file.");
    return;
  }

  console.log("File selected:", file.name);

  try {
    console.log("Uploading file...");
    let fileUrl = null;
    try {
      fileUrl = await uploadFile(file);
      console.log("File uploaded successfully. URL:", fileUrl);
    } catch (uploadErr) {
      console.warn("Backend upload failed; using local storage/indexedDB fallback");
    }
    
    const screenshotFileInput = document.getElementById("screenshot-file");
    const screenshotFile = screenshotFileInput && screenshotFileInput.files && screenshotFileInput.files[0] ? screenshotFileInput.files[0] : null;
    let screenshotValue = document.getElementById("screenshot").value || "";
    if (screenshotFile) {
      try {
        const screenshotUrl = await uploadFile(screenshotFile);
        screenshotValue = screenshotUrl;
      } catch (e) {
        try {
          screenshotValue = await readFileAsDataURL(screenshotFile);
        } catch (e2) {
          screenshotValue = "";
        }
      }
    }

    const appId = Date.now().toString();
    const fullFileInput = document.getElementById("full-file");
    const fullFile = fullFileInput && fullFileInput.files && fullFileInput.files[0] ? fullFileInput.files[0] : null;
    let fullFileUrl = null;
    let fullFileStore = null;
    const fullKey = `full_${appId}`;
    if (fullFile) {
      try {
        fullFileUrl = await uploadFile(fullFile);
        fullFileStore = "remote";
      } catch (e) {
        try {
          await saveFileToIndexedDB(fullKey, fullFile);
          fullFileStore = "indexeddb";
        } catch (e2) {
          try {
            const fullReader = await readFileAsDataURL(fullFile);
            localStorage.setItem(fullKey, fullReader);
            fullFileStore = "localstorage";
          } catch (e3) {
            fullFileStore = null;
          }
        }
      }
    }
    const newApp = {
      id: appId,
      name: document.getElementById("app-name").value,
      platform: document.getElementById("platform").value,
      description: document.getElementById("description").value,
      features: document.getElementById("features").value || "",
      deliverables: document.getElementById("deliverables").value || "",
      hyperlink: document.getElementById("hyperlink").value || null,
      screenshot: screenshotValue,
      rating: parseFloat(document.getElementById("rating").value),
      price: parseFloat(document.getElementById("price").value || "0") || 0,
      purchaseLink: document.getElementById("purchase-link").value || null,
      fileName: file.name,
      fileUrl: fileUrl,
      fileKey: `file_${appId}`,
      fileStore: fileUrl ? "remote" : "indexeddb",
      fullFileName: fullFile ? fullFile.name : null,
      fullFileUrl: fullFileUrl,
      fullFileKey: fullKey,
      fullFileStore: fullFileStore,
    };

    console.log("New App Object:", newApp);

    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    apps.push(newApp);
    localStorage.setItem("apps", JSON.stringify(apps));

    if (!fileUrl) {
      try {
        await saveFileToIndexedDB(`file_${appId}`, file);
        console.log("Stored file in IndexedDB under key:", `file_${appId}`);
      } catch (e) {
        try {
          const readerResult = await readFileAsDataURL(file);
          localStorage.setItem(`file_${appId}`, readerResult);
          console.log("Stored file as base64 in localStorage under key:", `file_${appId}`);
        } catch (e2) {
          console.warn("Failed to store file locally. Ensure backend is running.", e2);
        }
      }
    }

    alert("App submitted successfully!");
    document.getElementById("app-form").reset();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error:", error);
    alert("Failed to submit app. Please try again.");
  }
});

async function uploadFile(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch("http://localhost:3000/upload", {
    method: "POST",
    body: formData,
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Upload failed");
  }
  const data = await response.json();
  if (!data || !data.fileUrl) {
    throw new Error("Invalid upload response");
  }
  return data.fileUrl;
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("File read error"));
    reader.readAsDataURL(file);
  });
}

function openFilesDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("appFiles", 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("files")) {
        db.createObjectStore("files", { keyPath: "key" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("IndexedDB open error"));
  });
}

async function saveFileToIndexedDB(key, file) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readwrite");
    const store = tx.objectStore("files");
    store.put({ key, blob: file });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(new Error("IndexedDB write error"));
  });
}

async function getFileFromIndexedDB(key) {
  const db = await openFilesDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("files", "readonly");
    const store = tx.objectStore("files");
    const req = store.get(key);
    req.onsuccess = () => resolve(req.result ? req.result.blob : null);
    req.onerror = () => reject(new Error("IndexedDB read error"));
  });
}
