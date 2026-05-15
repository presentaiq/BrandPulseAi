const express = require('express');
const router = express.Router();
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/auth');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Multer config - store in memory, process with sharp
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only image files are allowed (JPEG, PNG, WebP, GIF)'));
  },
});

// POST /api/uploads/image
router.post('/image', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No image provided' });

    const filename = `${uuidv4()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    // Process with sharp: convert to webp, max 2000px wide, quality 85
    await sharp(req.file.buffer)
      .resize({ width: 2000, height: 2000, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(filepath);

    const stats = fs.statSync(filepath);
    const url = `/uploads/${filename}`;

    res.json({
      success: true,
      url,
      filename,
      size: stats.size,
      originalName: req.file.originalname,
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Upload failed' });
  }
});

// POST /api/uploads/design - save canvas JSON + export as image
router.post('/design', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No design image provided' });

    const filename = `design-${uuidv4()}.webp`;
    const filepath = path.join(uploadsDir, filename);

    await sharp(req.file.buffer).webp({ quality: 90 }).toFile(filepath);

    res.json({ success: true, url: `/uploads/${filename}`, filename });
  } catch (err) {
    console.error('Design save error:', err);
    res.status(500).json({ success: false, message: 'Failed to save design' });
  }
});

module.exports = router;
