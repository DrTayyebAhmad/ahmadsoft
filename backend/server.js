const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// Enable CORS for frontend-backend communication
app.use(cors());
app.use(express.json());

// Set up file uploads using multer
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 1024, // 1 GB
  },
});

const analyticsFilePath = path.join(__dirname, "analytics-history.json");

function getDefaultAnalytics() {
  return {
    totalVisits: 0,
    totalDownloads: 0,
    visitors: {},
    history: [],
  };
}

function readAnalytics() {
  if (!fs.existsSync(analyticsFilePath)) {
    return getDefaultAnalytics();
  }

  try {
    const raw = fs.readFileSync(analyticsFilePath, "utf8");
    const parsed = JSON.parse(raw);
    return {
      ...getDefaultAnalytics(),
      ...parsed,
      visitors: parsed.visitors && typeof parsed.visitors === "object" ? parsed.visitors : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
    };
  } catch (_) {
    return getDefaultAnalytics();
  }
}

function writeAnalytics(data) {
  fs.writeFileSync(analyticsFilePath, JSON.stringify(data, null, 2), "utf8");
}

function getRangeStart(range) {
  const now = Date.now();
  const ranges = {
    today: 1 * 24 * 60 * 60 * 1000,
    "1w": 7 * 24 * 60 * 60 * 1000,
    "1m": 30 * 24 * 60 * 60 * 1000,
    "3m": 90 * 24 * 60 * 60 * 1000,
    "6m": 180 * 24 * 60 * 60 * 1000,
    "1y": 365 * 24 * 60 * 60 * 1000,
  };
  const ms = ranges[range];
  return ms ? now - ms : null;
}

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(uploadDir));

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }
  const fileUrl = `http://localhost:3000/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

app.get("/api/analytics", (req, res) => {
  const analytics = readAnalytics();
  const visitorId = typeof req.query.visitorId === "string" ? req.query.visitorId : "";
  const range = typeof req.query.range === "string" ? req.query.range : "1m";
  const rangeStart = getRangeStart(range);
  const visitor = visitorId ? analytics.visitors[visitorId] : null;
  const filteredHistory = analytics.history.filter((item) => {
    if (!rangeStart) return true;
    const ts = Date.parse(item.timestamp);
    return !Number.isNaN(ts) && ts >= rangeStart;
  });

  res.json({
    totalVisits: analytics.totalVisits,
    totalVisitors: Object.keys(analytics.visitors).length,
    totalDownloads: analytics.totalDownloads,
    visitor: visitor || null,
    history: filteredHistory.slice(-500).reverse(),
  });
});

app.post("/api/analytics", (req, res) => {
  const { type, visitorId, country, appName, page } = req.body || {};
  if (!type || !visitorId) {
    return res.status(400).json({ error: "type and visitorId are required" });
  }

  if (type !== "visit" && type !== "download") {
    return res.status(400).json({ error: "invalid analytics type" });
  }

  const analytics = readAnalytics();
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

  writeAnalytics(analytics);
  res.json({ success: true });
});

// Start the server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
