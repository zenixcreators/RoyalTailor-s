const fs = require('fs');
const path = require('path');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;

// Local upload folder path
const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure the local uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, 'tailor-image-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Configure Cloudinary if keys are present
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isCloudinaryEnabled = !!(cloudName && apiKey && apiSecret);

if (isCloudinaryEnabled) {
  try {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret
    });
    console.log('Cloudinary Storage Service Initialized Successfully.');
  } catch (err) {
    console.error('Failed to configure Cloudinary. Falling back to Local Static File storage.', err.message);
  }
} else {
  console.log('Cloudinary credentials not configured. Using Local Static File storage.');
}

// Upload file function
async function handleFileUpload(file) {
  if (!file) return null;

  if (isCloudinaryEnabled) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'royal-tailor'
      });
      // Delete temporary local file after uploading to Cloudinary
      fs.unlinkSync(file.path);
      return result.secure_url;
    } catch (err) {
      console.error('Cloudinary upload failed, falling back to local static URL:', err.message);
      // Fallback: return the local static path
      return `/uploads/${file.filename}`;
    }
  } else {
    // Return local static path
    return `/uploads/${file.filename}`;
  }
}

module.exports = {
  upload,
  handleFileUpload,
  isCloudinaryActive() {
    return isCloudinaryEnabled;
  }
};
