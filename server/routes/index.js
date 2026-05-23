// server/routes/index.js
// Route definitions will be registered here
const express = require('express');
const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'RoyalTailor API', timestamp: new Date().toISOString() });
});

module.exports = router;
