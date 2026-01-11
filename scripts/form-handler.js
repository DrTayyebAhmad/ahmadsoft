document.addEventListener("DOMContentLoaded", () => {
  console.log("form-handler.js loaded");

  const form = document.getElementById("app-form");

  if (!form) {
    console.error("❌ app-form not found");
    return;
  }

  console.log("✅ app-form found");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("✅ Submit event triggered");

    const app = {
      id: Date.now().toString(),
      name: document.getElementById("app-name").value,
      platform: document.getElementById("platform").value,
      description: document.getElementById("description").value,
      features: document.getElementById("features").value
        .split("\n")
        .filter(Boolean),
      deliverables: document.getElementById("deliverables").value
        .split("\n")
        .filter(Boolean),
      hyperlink: document.getElementById("hyperlink").value || "",
      screenshot:
        document.getElementById("screenshot").value ||
        "images/placeholder.png",
      rating: parseFloat(document.getElementById("rating").value),
      price: parseFloat(document.getElementById("price").value || "0"),
      purchaseLink: document.getElementById("purchase-link").value || "",
      demoUrl: "",
      fullUrl: ""
    };

    console.log("📦 App JSON:", app);

    const blob = new Blob([JSON.stringify(app, null, 2)], {
      type: "application/json"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${app.name.replace(/\s+/g, "_")}.json`;
    link.click();

    alert("✅ App JSON generated. Add it to data/apps.json");
    form.reset();
  });
});
