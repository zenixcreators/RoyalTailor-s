// server/controllers/uploadsController.js
// Handles file upload logic (cloth reference images via Cloudinary or local disk)
const path = require('path');

exports.uploadImage = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  // If Cloudinary is configured the multer-cloudinary middleware provides secure_url
  if (req.file.path && req.file.path.startsWith('http')) {
    return res.json({ url: req.file.path });
  }

  // Fallback: local disk upload → return a relative URL
  const filename = path.basename(req.file.path);
  res.json({ url: `/uploads/${filename}` });
};
