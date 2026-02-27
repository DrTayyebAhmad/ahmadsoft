import { list, put } from "@vercel/blob";

const DEFAULT_ANALYTICS = {
  totalVisits: 0,
  totalDownloads: 0,
  visitors: {},
  history: [],
};

function getRangeStart(range) {
  const now = Date.now();
  const ranges = {
    "1m": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
    "6m": 180 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
  };
  const ms = ranges[range];
  return ms ? now - ms : null;
}

async function getAnalyticsData() {
  const { blobs } = await list();
  const analyticsBlob = blobs.find((blob) => blob.pathname === "analytics.json");
  if (!analyticsBlob) {
    return { ...DEFAULT_ANALYTICS };
  }

  const response = await fetch(analyticsBlob.url, { cache: "no-store" });
  if (!response.ok) {
    return { ...DEFAULT_ANALYTICS };
  }

  const raw = await response.json();
  return {
    ...DEFAULT_ANALYTICS,
    ...raw,
    visitors: raw.visitors && typeof raw.visitors === "object" ? raw.visitors : {},
    history: Array.isArray(raw.history) ? raw.history : [],
  };
}

async function saveAnalyticsData(data) {
  await put("analytics.json", JSON.stringify(data), {
    access: "public",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

export default async function handler(req, res) {
  const ALLOWED_ORIGIN = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: "BLOB_READ_WRITE_TOKEN is missing" });
  }

  try {
    if (req.method === "GET") {
      const analytics = await getAnalyticsData();
      const visitorId = typeof req.query.visitorId === "string" ? req.query.visitorId : "";
      const range = typeof req.query.range === "string" ? req.query.range : "1m";
      const rangeStart = getRangeStart(range);
      const visitor = visitorId ? analytics.visitors[visitorId] : null;
      const filteredHistory = analytics.history.filter((item) => {
        if (!rangeStart) return true;
        const ts = Date.parse(item.timestamp);
        return !Number.isNaN(ts) && ts >= rangeStart;
      });

      return res.status(200).json({
        totalVisits: analytics.totalVisits,
        totalVisitors: Object.keys(analytics.visitors).length,
        totalDownloads: analytics.totalDownloads,
        visitor: visitor || null,
        history: filteredHistory.slice(-500).reverse(),
      });
    }

    if (req.method === "POST") {
      const { type, visitorId, country, appName, page } = req.body || {};
      if (!type || !visitorId) {
        return res.status(400).json({ error: "type and visitorId are required" });
      }
      if (type !== "visit" && type !== "download") {
        return res.status(400).json({ error: "invalid analytics type" });
      }

      const analytics = await getAnalyticsData();
      const now = new Date().toISOString();
      const visitor = analytics.visitors[visitorId] || {
        visitorId,
        country: country || "Unknown",
        visitCount: 0,
        downloads: [],
        lastSeen: now,
      };

      if (country && country !== "Unknown") {
        visitor.country = country;
      }

      if (type === "visit") {
        analytics.totalVisits += 1;
        visitor.visitCount += 1;
      }

      if (type === "download" && appName) {
        analytics.totalDownloads += 1;
        if (!visitor.downloads.includes(appName)) {
          visitor.downloads.push(appName);
        }
      }

      visitor.lastSeen = now;
      analytics.visitors[visitorId] = visitor;
      analytics.history.push({
        type,
        visitorId,
        country: visitor.country || "Unknown",
        appName: appName || null,
        page: page || null,
        timestamp: now,
      });

      const retentionStart = Date.now() - 400 * 24 * 60 * 60 * 1000;
      analytics.history = analytics.history.filter((item) => {
        const ts = Date.parse(item.timestamp);
        return !Number.isNaN(ts) && ts >= retentionStart;
      });
      if (analytics.history.length > 50000) {
        analytics.history = analytics.history.slice(-50000);
      }

      await saveAnalyticsData(analytics);
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
