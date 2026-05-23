require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve local static uploaded images
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ─── Cloudinary (optional) ──────────────────────────────────────────────────
let cloudinaryUpload = null;
const isCloudinaryConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  const cloudinary = require('cloudinary').v2;
  const { CloudinaryStorage } = require('multer-storage-cloudinary');
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  const cloudStorage = new CloudinaryStorage({
    cloudinary,
    params: { folder: 'royal-tailor', allowed_formats: ['jpg', 'jpeg', 'png', 'webp'] }
  });
  cloudinaryUpload = multer({ storage: cloudStorage });
}

// ─── Local Multer fallback ───────────────────────────────────────────────────
const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
    cb(null, unique);
  }
});
const localUpload = multer({ storage: localStorage });

const activeUpload = cloudinaryUpload || localUpload;

// ─── Routes ──────────────────────────────────────────────────────────────────

// Health / status check
app.get('/api/status', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'RoyalTailor Image Server',
    cloudinary: isCloudinaryConfigured,
    timestamp: new Date().toISOString()
  });
});

// Image upload endpoint
app.post('/api/upload', activeUpload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }
  // Cloudinary sets req.file.path to the secure_url
  const url = req.file.path && req.file.path.startsWith('http')
    ? req.file.path
    : `/uploads/${path.basename(req.file.path)}`;
  res.json({ url });
});

// ─── Serve compiled React frontend (production) ──────────────────────────────
const CLIENT_DIST = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(CLIENT_DIST));

app.get('*', (req, res) => {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(CLIENT_DIST, 'index.html'));
});

// ─── Start ───────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ RoyalTailor server running on port ${PORT}`);
  console.log(`   Cloudinary: ${isCloudinaryConfigured ? '✅ active' : '⚠️  using local disk fallback'}`);
});
