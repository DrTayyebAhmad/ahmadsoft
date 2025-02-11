document.getElementById("app-form").addEventListener("submit", function (e) {
  e.preventDefault();

  try {
    const fileInput = document.getElementById("app-file");
    const file = fileInput.files[0];

    if (!file) {
      alert("Please upload an app file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(event) {
      try {
        // Get existing apps
        let apps = [];
        const existingApps = localStorage.getItem("apps");
        apps = existingApps ? JSON.parse(existingApps) : [];

        const appId = Date.now().toString();
        const fileData = event.target.result; // This is the base64 data

        // Create new app object
        const newApp = {
          id: appId,
          name: document.getElementById("app-name").value,
          platform: document.getElementById("platform").value,
          description: document.getElementById("description").value,
          hyperlink: document.getElementById("hyperlink").value || null, // Include hyperlink
          screenshot: document.getElementById("screenshot").value,
          rating: parseFloat(document.getElementById("rating").value),
          fileName: file.name,
          fileData: fileData // Store file data directly in the app object
        };

        const editIndex = localStorage.getItem("editAppIndex");

        if (editIndex !== null) {
          apps[parseInt(editIndex)] = newApp;
          localStorage.removeItem("editAppIndex");
        } else {
          apps.push(newApp);
        }

        // Save updated apps array
        localStorage.setItem("apps", JSON.stringify(apps));
        
        alert("App submitted successfully!");
        document.getElementById("app-form").reset();
        window.location.href = "index.html";
      } catch (error) {
        console.error('Error saving app:', error);
        alert("Error saving app. Please try again.");
      }
    };

    reader.readAsDataURL(file);

  } catch (error) {
    console.error('Error:', error);
    alert("Failed to submit app. Please try again.");
  }
});



