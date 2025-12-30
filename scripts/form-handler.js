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
      console.warn("Backend upload failed; falling back to local storage for file data");
    }

    const appId = Date.now().toString();
    const newApp = {
      id: appId,
      name: document.getElementById("app-name").value,
      platform: document.getElementById("platform").value,
      description: document.getElementById("description").value,
      hyperlink: document.getElementById("hyperlink").value || null,
      screenshot: document.getElementById("screenshot").value,
      rating: parseFloat(document.getElementById("rating").value),
      fileName: file.name,
      fileUrl: fileUrl,
      fileKey: `file_${appId}`,
    };

    console.log("New App Object:", newApp);

    const apps = JSON.parse(localStorage.getItem("apps")) || [];
    apps.push(newApp);
    localStorage.setItem("apps", JSON.stringify(apps));

    if (!fileUrl) {
      try {
        const readerResult = await readFileAsDataURL(file);
        localStorage.setItem(`file_${appId}`, readerResult);
        console.log("Stored file as base64 in localStorage under key:", `file_${appId}`);
      } catch (e) {
        console.warn("Failed to store file in localStorage (likely size limit). Ensure backend is running.", e);
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
