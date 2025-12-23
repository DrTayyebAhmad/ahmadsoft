document.getElementById("app-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  console.log("Form submitted");

  const demoInput = document.getElementById("demo-file");
  const fullInput = document.getElementById("full-file");
  const demoFile = demoInput?.files[0];
  const fullFile = fullInput?.files[0] || null;

  if (!demoFile) {
    alert("Please upload a demo file.");
    return;
  }

  console.log("Demo file selected:", demoFile.name);
  if (fullFile) console.log("Full file selected:", fullFile.name);

  try {
    console.log("Uploading file...");
    let demoFileUrl = null;
    let demoFileData = null;
    let fullFileUrl = null;
    let fullFileData = null;
    try {
      demoFileUrl = await uploadFile(demoFile);
      console.log("Demo upload URL:", demoFileUrl);
    } catch (uploadErr) {
      if (demoFile.size <= 5 * 1024 * 1024) {
        const readerResult = await readFileAsDataURL(demoFile);
        demoFileData = readerResult;
      } else {
        throw uploadErr;
      }
    }

    if (fullFile) {
      try {
        fullFileUrl = await uploadFile(fullFile);
        console.log("Full upload URL:", fullFileUrl);
      } catch (uploadErr2) {
        if (fullFile.size <= 5 * 1024 * 1024) {
          const readerResult2 = await readFileAsDataURL(fullFile);
          fullFileData = readerResult2;
        } else {
          throw uploadErr2;
        }
      }
    }

    const newApp = {
      id: Date.now().toString(),
      name: document.getElementById("app-name").value,
      platform: document.getElementById("platform").value,
      description: document.getElementById("description").value,
      hyperlink: document.getElementById("hyperlink").value || null,
      screenshot: document.getElementById("screenshot").value,
      rating: parseFloat(document.getElementById("rating").value),
      price: parseFloat(document.getElementById("price").value) || 0,
      demoFileName: demoFile.name,
      demoFileUrl: demoFileUrl,
      demoFileData: demoFileData,
      fullFileName: fullFile ? fullFile.name : null,
      fullFileUrl: fullFileUrl,
      fullFileData: fullFileData,
    };

    console.log("New App Object:", newApp);

    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    apps.push(newApp);
    localStorage.setItem("apps", JSON.stringify(apps));

    alert("App submitted successfully!");
    document.getElementById("app-form").reset();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error:", error);
    const msg = error && error.message ? error.message : String(error) || "Failed to submit app. Please try again.";
    alert(msg);
  }
});

async function uploadFile(file) {
  const stored = typeof window !== "undefined" ? localStorage.getItem("uploadEndpoint") : null;
  const endpoint = (typeof window !== "undefined" && (window.UPLOAD_ENDPOINT || stored))
    ? (window.UPLOAD_ENDPOINT || stored)
    : "/api/upload";

  if (window.location && window.location.protocol === "https:" && endpoint.startsWith("http://")) {
    throw new Error("Uploads require HTTPS endpoint when site is served over HTTPS.");
  }
  if (window.location && /github\.io$/i.test(window.location.hostname) && (!window.UPLOAD_ENDPOINT || window.UPLOAD_ENDPOINT === "")) {
    throw new Error("Uploads are not available on GitHub Pages without a configured backend endpoint.");
  }

  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(endpoint, {
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

(function(){
  try {
    const qs = new URLSearchParams(window.location.search);
    const ep = qs.get("uploadEndpoint");
    if (ep) {
      localStorage.setItem("uploadEndpoint", ep);
      window.UPLOAD_ENDPOINT = ep;
    } else {
      const stored = localStorage.getItem("uploadEndpoint");
      if (stored) {
        window.UPLOAD_ENDPOINT = stored;
      }
    }
  } catch (_) {}
})();
