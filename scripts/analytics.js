(function initAnalytics() {
  const VISITOR_ID_KEY = "analytics_visitor_id";
  const COUNTRY_KEY = "analytics_country";
  const LOCAL_DATA_KEY = "analytics_local_data";
  const API_ENDPOINT =
    window.location.protocol === "file:"
      ? "http://localhost:3000/api/analytics"
      : "/api/analytics";

  function readLocalData() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_DATA_KEY) || "{}");
      return {
        totalVisits: Number(parsed.totalVisits) || 0,
        totalDownloads: Number(parsed.totalDownloads) || 0,
        visitors: parsed.visitors && typeof parsed.visitors === "object" ? parsed.visitors : {},
        history: Array.isArray(parsed.history) ? parsed.history : [],
      };
    } catch (_) {
      return { totalVisits: 0, totalDownloads: 0, visitors: {}, history: [] };
    }
  }

  function writeLocalData(data) {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  }

  function getVisitorId() {
    let visitorId = localStorage.getItem(VISITOR_ID_KEY);
    if (!visitorId) {
      visitorId = "v_" + Date.now() + "_" + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
    }
    return visitorId;
  }

  function inferCountryFromLocale() {
    try {
      const locale = navigator.language || "";
      const region = locale.includes("-") ? locale.split("-")[1].toUpperCase() : "";
      if (!region) return "Unknown";
      if (typeof Intl !== "undefined" && typeof Intl.DisplayNames === "function") {
        const display = new Intl.DisplayNames([locale], { type: "region" }).of(region);
        return display || region;
      }
      return region;
    } catch (_) {
      return "Unknown";
    }
  }

  async function requestCountry() {
    const cached = localStorage.getItem(COUNTRY_KEY);
    if (cached && cached !== "Unknown") return cached;

    try {
      const response = await fetch("https://ipapi.co/json/", { cache: "no-store" });
      if (!response.ok) throw new Error("country lookup failed");
      const data = await response.json();
      const country = data.country_name || inferCountryFromLocale();
      localStorage.setItem(COUNTRY_KEY, country);
      return country;
    } catch (_) {
      const fallbackCountry = inferCountryFromLocale();
      localStorage.setItem(COUNTRY_KEY, fallbackCountry);
      return fallbackCountry;
    }
  }

  async function postRemote(payload) {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    });
    if (!response.ok) {
      throw new Error("remote analytics failed");
    }
  }

  async function saveLocalEvent(payload) {
    const data = readLocalData();
    const now = new Date().toISOString();
    const visitor = data.visitors[payload.visitorId] || {
      visitorId: payload.visitorId,
      country: payload.country || "Unknown",
      visitCount: 0,
      downloads: [],
      lastSeen: now,
    };

    if (payload.country && payload.country !== "Unknown") {
      visitor.country = payload.country;
    }

    if (payload.type === "visit") {
      data.totalVisits += 1;
      visitor.visitCount += 1;
    }

    if (payload.type === "download" && payload.appName) {
      data.totalDownloads += 1;
      if (!visitor.downloads.includes(payload.appName)) {
        visitor.downloads.push(payload.appName);
      }
    }

    visitor.lastSeen = now;
    data.visitors[payload.visitorId] = visitor;
    data.history.push({
      ...payload,
      timestamp: now,
    });
    if (data.history.length > 200) {
      data.history = data.history.slice(-200);
    }
    writeLocalData(data);
  }

  async function pushEvent(type, extraData) {
    const visitorId = getVisitorId();
    const country = await requestCountry();
    const payload = {
      type,
      visitorId,
      country,
      page: window.location.pathname || "/",
      ...extraData,
    };

    try {
      await postRemote(payload);
    } catch (_) {
      await saveLocalEvent(payload);
    }
  }

  async function getSummary(range) {
    const visitorId = getVisitorId();
    const selectedRange = range || "1m";
    try {
      const response = await fetch(
        `${API_ENDPOINT}?visitorId=${encodeURIComponent(visitorId)}&range=${encodeURIComponent(selectedRange)}`,
        { cache: "no-store" }
      );
      if (!response.ok) throw new Error("remote summary failed");
      return await response.json();
    } catch (_) {
      const data = readLocalData();
      return {
        totalVisits: data.totalVisits,
        totalVisitors: Object.keys(data.visitors).length,
        totalDownloads: data.totalDownloads,
        visitor: data.visitors[visitorId] || null,
        history: data.history.slice(-500).reverse(),
      };
    }
  }

  window.AppAnalytics = {
    getVisitorId,
    requestCountry,
    trackVisit: function trackVisit(page) {
      return pushEvent("visit", { page: page || window.location.pathname || "/" });
    },
    trackDownload: function trackDownload(appName) {
      return pushEvent("download", { appName: appName || "Unknown App" });
    },
    getSummary,
  };
})();
