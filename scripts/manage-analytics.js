document.addEventListener("DOMContentLoaded", async () => {
  if (!window.AppAnalytics) return;

  const countryEl = document.getElementById("visitor-country");
  const totalVisitsEl = document.getElementById("total-visits");
  const totalVisitorsEl = document.getElementById("total-visitors");
  const totalDownloadsEl = document.getElementById("total-downloads");
  const downloadsListEl = document.getElementById("visitor-downloads");
  const historyListEl = document.getElementById("analytics-history");
  const rangeEl = document.getElementById("history-range");
  if (!countryEl || !historyListEl) return;

  async function render(range) {
    const summary = await window.AppAnalytics.getSummary(range || "1m");
    const detectedCountry = await window.AppAnalytics.requestCountry();
    const country = summary?.visitor?.country && summary.visitor.country !== "Unknown"
      ? summary.visitor.country
      : detectedCountry;

    countryEl.textContent = country || "Unknown";
    totalVisitsEl.textContent = String(summary.totalVisits || 0);
    totalVisitorsEl.textContent = String(summary.totalVisitors || 0);
    totalDownloadsEl.textContent = String(summary.totalDownloads || 0);

    const visitorDownloads = summary.visitor?.downloads || [];
    downloadsListEl.innerHTML = "";
    if (!visitorDownloads.length) {
      downloadsListEl.innerHTML = "<li>No downloads yet.</li>";
    } else {
      visitorDownloads.forEach((name) => {
        const li = document.createElement("li");
        li.textContent = name;
        downloadsListEl.appendChild(li);
      });
    }

    const history = Array.isArray(summary.history) ? summary.history.slice(0, 200) : [];
    historyListEl.innerHTML = "";
    if (!history.length) {
      historyListEl.innerHTML = "<li>No history for selected range.</li>";
      return;
    }

    history.forEach((entry) => {
      const li = document.createElement("li");
      const action = entry.type === "download" ? `downloaded ${entry.appName || "an app"}` : "visited the site";
      const countryName = entry.country || "Unknown";
      const when = entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "Unknown time";
      li.textContent = `${countryName} visitor ${action} on ${when}`;
      historyListEl.appendChild(li);
    });
  }

  try {
    await window.AppAnalytics.trackVisit("manage-apps");
    await render(rangeEl ? rangeEl.value : "1m");
    if (rangeEl) {
      rangeEl.addEventListener("change", async () => {
        historyListEl.innerHTML = "<li>Loading history...</li>";
        await render(rangeEl.value);
      });
    }
  } catch (_) {
    countryEl.textContent = "Unknown";
    historyListEl.innerHTML = "<li>Unable to load analytics right now.</li>";
  }
});
