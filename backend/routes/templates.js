const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ── Seed template data ──
const TEMPLATES = [
  // LinkedIn
  { name: 'Data Insights Carousel', platform: 'linkedin', category: 'carousel', gradient: 'linear-gradient(135deg,#003060,#0077B5)', emoji: '📊', size: '1080×1080', is_premium: false },
  { name: 'Startup Story Slides', platform: 'linkedin', category: 'carousel', gradient: 'linear-gradient(135deg,#001A40,#2563EB)', emoji: '🚀', size: '1080×1080', is_premium: false },
  { name: 'Tips & Tricks Series', platform: 'linkedin', category: 'carousel', gradient: 'linear-gradient(135deg,#002040,#0EA5E9)', emoji: '💡', size: '1080×1080', is_premium: false },
  { name: 'Case Study Deck', platform: 'linkedin', category: 'carousel', gradient: 'linear-gradient(135deg,#001828,#0077B5)', emoji: '📈', size: '1080×1080', is_premium: true },
  { name: 'Professional Thought', platform: 'linkedin', category: 'post', gradient: 'linear-gradient(135deg,#003040,#00D4A8)', emoji: '💼', size: '1200×628', is_premium: false },
  { name: 'Achievement Milestone', platform: 'linkedin', category: 'post', gradient: 'linear-gradient(135deg,#1A1A00,#FFB800)', emoji: '🏆', size: '1200×628', is_premium: false },
  { name: 'Job Announcement', platform: 'linkedin', category: 'post', gradient: 'linear-gradient(135deg,#001A40,#1877F2)', emoji: '📣', size: '1200×628', is_premium: false },
  { name: 'Behind the Scenes', platform: 'linkedin', category: 'story', gradient: 'linear-gradient(135deg,#0A0060,#5B4CF5)', emoji: '✨', size: '1080×1920', is_premium: false },
  { name: 'Quick Tip Story', platform: 'linkedin', category: 'story', gradient: 'linear-gradient(135deg,#003040,#00D4A8)', emoji: '🎯', size: '1080×1920', is_premium: false },
  { name: 'Lead Gen Ad', platform: 'linkedin', category: 'ads', gradient: 'linear-gradient(135deg,#1A0050,#5B4CF5)', emoji: '🎯', size: '1200×628', is_premium: true },
  { name: 'Recruitment Ad', platform: 'linkedin', category: 'ads', gradient: 'linear-gradient(135deg,#002040,#0077B5)', emoji: '💼', size: '1200×628', is_premium: true },
  { name: 'Brand Campaign', platform: 'linkedin', category: 'ads', gradient: 'linear-gradient(135deg,#001830,#0EA5E9)', emoji: '📊', size: '1200×628', is_premium: true },

  // Instagram
  { name: 'Bold Product Launch', platform: 'instagram', category: 'post', gradient: 'linear-gradient(135deg,#1A0050,#5B4CF5)', emoji: '🌟', size: '1080×1080', is_premium: false },
  { name: 'Quote Card', platform: 'instagram', category: 'post', gradient: 'linear-gradient(135deg,#200040,#FF4F81)', emoji: '❤️', size: '1080×1080', is_premium: false },
  { name: 'Lifestyle Brand', platform: 'instagram', category: 'post', gradient: 'linear-gradient(135deg,#003040,#00D4A8)', emoji: '🌿', size: '1080×1080', is_premium: false },
  { name: 'Sale Offer', platform: 'instagram', category: 'post', gradient: 'linear-gradient(135deg,#1A1000,#FF8C00)', emoji: '🛒', size: '1080×1080', is_premium: false },
  { name: 'Brand Story Slides', platform: 'instagram', category: 'carousel', gradient: 'linear-gradient(135deg,#0A0A2A,#5B4CF5,#FF4F81)', emoji: '🎨', size: '1080×1080', is_premium: false },
  { name: 'How-To Tutorial', platform: 'instagram', category: 'carousel', gradient: 'linear-gradient(135deg,#1A0030,#9D50BB)', emoji: '💡', size: '1080×1080', is_premium: false },
  { name: 'Sale Countdown', platform: 'instagram', category: 'story', gradient: 'linear-gradient(135deg,#400030,#FF4F81)', emoji: '🎉', size: '1080×1920', is_premium: false },
  { name: 'New Drop Teaser', platform: 'instagram', category: 'story', gradient: 'linear-gradient(135deg,#0A0A2A,#5B4CF5)', emoji: '✨', size: '1080×1920', is_premium: false },
  { name: 'Poll / Q&A Story', platform: 'instagram', category: 'story', gradient: 'linear-gradient(135deg,#1A1000,#FFB800)', emoji: '🌟', size: '1080×1920', is_premium: false },
  { name: 'Reel Thumbnail', platform: 'instagram', category: 'reel', gradient: 'linear-gradient(135deg,#1A0050,#FF4F81)', emoji: '🎬', size: '1080×1920', is_premium: false },
  { name: 'Conversion Ad', platform: 'instagram', category: 'ads', gradient: 'linear-gradient(135deg,#200040,#5B4CF5)', emoji: '🎯', size: '1080×1080', is_premium: true },
  { name: 'Product Showcase Ad', platform: 'instagram', category: 'ads', gradient: 'linear-gradient(135deg,#1A0030,#FF4F81)', emoji: '🛍', size: '1080×1080', is_premium: true },

  // Facebook
  { name: 'Community Post', platform: 'facebook', category: 'post', gradient: 'linear-gradient(135deg,#001A40,#1877F2)', emoji: '📘', size: '1200×630', is_premium: false },
  { name: 'Event Announcement', platform: 'facebook', category: 'post', gradient: 'linear-gradient(135deg,#002050,#3B82F6)', emoji: '📣', size: '1200×630', is_premium: false },
  { name: 'Offer / Discount', platform: 'facebook', category: 'post', gradient: 'linear-gradient(135deg,#1A1000,#F59E0B)', emoji: '🛒', size: '1200×630', is_premium: false },
  { name: 'Story Promo', platform: 'facebook', category: 'story', gradient: 'linear-gradient(135deg,#001A40,#1877F2)', emoji: '📱', size: '1080×1920', is_premium: false },
  { name: 'Traffic Ad', platform: 'facebook', category: 'ads', gradient: 'linear-gradient(135deg,#001A40,#2563EB)', emoji: '🎯', size: '1200×628', is_premium: true },
  { name: 'Retargeting Ad', platform: 'facebook', category: 'ads', gradient: 'linear-gradient(135deg,#1A0030,#7C3AED)', emoji: '💰', size: '1200×628', is_premium: true },
  { name: 'Page Cover Photo', platform: 'facebook', category: 'cover', gradient: 'linear-gradient(135deg,#001A40,#1877F2)', emoji: '🖼', size: '820×312', is_premium: false },

  // WhatsApp
  { name: 'Business Update', platform: 'whatsapp', category: 'status', gradient: 'linear-gradient(135deg,#003A20,#25D366)', emoji: '💬', size: '1080×1920', is_premium: false },
  { name: 'Offer Alert', platform: 'whatsapp', category: 'status', gradient: 'linear-gradient(135deg,#002A18,#128C7E)', emoji: '🎉', size: '1080×1920', is_premium: false },
  { name: 'Flash Sale Message', platform: 'whatsapp', category: 'promo', gradient: 'linear-gradient(135deg,#003A20,#25D366)', emoji: '🛍', size: '800×800', is_premium: false },
  { name: 'Channel Announcement', platform: 'whatsapp', category: 'channel', gradient: 'linear-gradient(135deg,#002A18,#128C7E)', emoji: '📣', size: '1200×628', is_premium: false },

  // Twitter/X
  { name: 'Tweet Graphic', platform: 'twitter', category: 'post', gradient: 'linear-gradient(135deg,#001020,#1DA1F2)', emoji: '🐦', size: '1200×675', is_premium: false },
  { name: 'Quote Tweet Card', platform: 'twitter', category: 'post', gradient: 'linear-gradient(135deg,#000A18,#0F172A)', emoji: '💬', size: '1200×675', is_premium: false },
  { name: 'Profile Header', platform: 'twitter', category: 'header', gradient: 'linear-gradient(135deg,#001020,#1DA1F2)', emoji: '🖼', size: '1500×500', is_premium: false },
  { name: 'Thread Slide', platform: 'twitter', category: 'thread', gradient: 'linear-gradient(135deg,#001020,#1DA1F2)', emoji: '📄', size: '1200×675', is_premium: false },
];

// Seed templates into DB
const seedTemplates = async () => {
  const client = await pool.connect();
  try {
    const count = await client.query('SELECT COUNT(*) FROM templates');
    if (parseInt(count.rows[0].count) === 0) {
      for (const t of TEMPLATES) {
        await client.query(
          `INSERT INTO templates (name, platform, category, template_data, is_premium)
           VALUES ($1, $2, $3, $4, $5)`,
          [t.name, t.platform, t.category, JSON.stringify({ gradient: t.gradient, emoji: t.emoji, size: t.size }), t.is_premium]
        );
      }
      console.log(`✅ Seeded ${TEMPLATES.length} templates`);
    }
  } catch (err) {
    console.error('Template seed error:', err.message);
  } finally {
    client.release();
  }
};

seedTemplates();

// ─────────────────────────────────────────
// GET /api/templates
// Query params: platform, category, search, page, limit
// ─────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  const { platform, category, search, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;

  let query = 'SELECT * FROM templates WHERE 1=1';
  const params = [];
  let idx = 1;

  if (platform) { query += ` AND platform = $${idx++}`; params.push(platform); }
  if (category) { query += ` AND category = $${idx++}`; params.push(category); }
  if (search) { query += ` AND name ILIKE $${idx++}`; params.push(`%${search}%`); }

  query += ` ORDER BY is_premium ASC, name ASC LIMIT $${idx++} OFFSET $${idx++}`;
  params.push(limit, offset);

  try {
    const result = await pool.query(query, params);
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM templates WHERE 1=1' +
      (platform ? ` AND platform = '${platform}'` : '') +
      (category ? ` AND category = '${category}'` : '')
    );
    res.json({
      success: true,
      templates: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/templates/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM templates WHERE id = $1', [req.params.id]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Template not found' });
    res.json({ success: true, template: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/templates/meta/platforms
// Returns all platforms with their categories and counts
router.get('/meta/platforms', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT platform, category, COUNT(*) as count
       FROM templates GROUP BY platform, category ORDER BY platform, category`
    );
    const meta = {};
    result.rows.forEach(row => {
      if (!meta[row.platform]) meta[row.platform] = { categories: {}, total: 0 };
      meta[row.platform].categories[row.category] = parseInt(row.count);
      meta[row.platform].total += parseInt(row.count);
    });
    res.json({ success: true, platforms: meta });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
