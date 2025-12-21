const express = require("express");
const multer = require("multer");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const app = express();

// Enable CORS for frontend-backend communication
app.use(cors());

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
  limits: { fileSize: 500 * 1024 * 1024 }
});

// Serve static files from the "uploads" folder
app.use("/uploads", express.static(uploadDir));

// File upload endpoint
app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const PORT = process.env.PORT || 3000;
  const HOST = process.env.HOST || "http://localhost";
  const BASE_URL = process.env.BASE_URL || `${HOST}:${PORT}`;
  const fileUrl = `${BASE_URL}/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
