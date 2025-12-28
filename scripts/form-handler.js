document.getElementById("app-form").addEventListener("submit", async function (e) {
  e.preventDefault();

  const demoInput = document.getElementById("demo-file");
  const fullInput = document.getElementById("full-file");
  const demoFile = demoInput?.files[0];
  const fullFile = fullInput?.files[0] || null;

  if (!demoFile) {
    alert("Please upload a demo file.");
    return;
  }

  const name = document.getElementById("app-name").value;
  const platform = document.getElementById("platform").value;
  const description = document.getElementById("description").value;
  const hyperlink = document.getElementById("hyperlink").value || "";
  const screenshot = document.getElementById("screenshot").value;
  const rating = parseFloat(document.getElementById("rating").value);
  const price = parseFloat(document.getElementById("price").value) || 0;

  const formData = new FormData();
  formData.append("name", name);
  formData.append("platform", platform);
  formData.append("description", description);
  formData.append("hyperlink", hyperlink);
  formData.append("screenshot", screenshot);
  formData.append("rating", rating.toString());
  formData.append("price", price.toString());
  formData.append("demo_file", demoFile);
  if (fullFile) {
    formData.append("full_file", fullFile);
  }

  try {
    if (!window.pb) {
      throw new Error("PocketBase client not initialized.");
    }

    const record = await window.pb.collection("apps").create(formData);
    console.log("Created app record:", record);

    alert("App submitted successfully!");
    document.getElementById("app-form").reset();
    window.location.href = "index.html";
  } catch (error) {
    console.error("Error:", error);
    const msg = error && error.message ? error.message : String(error) || "Failed to submit app. Please try again.";
    alert(msg);
  }
});
