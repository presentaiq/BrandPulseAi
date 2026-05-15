const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────
// Fetch Instagram insights for a post
// ─────────────────────────────────────────
const fetchInstagramInsights = async (platformPostId, accessToken) => {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/v18.0/${platformPostId}/insights`,
      {
        params: {
          metric: 'impressions,reach,likes,comments,shares',
          access_token: accessToken,
        },
      }
    );
    const data = {};
    res.data.data.forEach(m => { data[m.name] = m.values?.[0]?.value || 0; });
    return data;
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────
// Fetch LinkedIn post stats
// ─────────────────────────────────────────
const fetchLinkedInStats = async (platformPostId, accessToken) => {
  try {
    const res = await axios.get(
      `https://api.linkedin.com/v2/socialMetadata/${encodeURIComponent(platformPostId)}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    return {
      likes: res.data.likesSummary?.totalLikes || 0,
      comments: res.data.commentsSummary?.totalFirstLevelComments || 0,
      impressions: 0, reach: 0, shares: 0,
    };
  } catch {
    return null;
  }
};

// ─────────────────────────────────────────
// GET /api/analytics/overview
// Returns aggregated stats for user's account
// ─────────────────────────────────────────
router.get('/overview', authMiddleware, async (req, res) => {
  const { period = '30' } = req.query; // days
  try {
    // Get aggregated post analytics
    const stats = await pool.query(
      `SELECT
        COALESCE(SUM(pa.reach), 0) as total_reach,
        COALESCE(SUM(pa.impressions), 0) as total_impressions,
        COALESCE(SUM(pa.likes), 0) as total_likes,
        COALESCE(SUM(pa.comments), 0) as total_comments,
        COALESCE(SUM(pa.shares), 0) as total_shares,
        COUNT(DISTINCT p.id) as total_posts
       FROM posts p
       LEFT JOIN post_analytics pa ON pa.post_id = p.id
       WHERE p.user_id = $1
         AND p.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
         AND p.status = 'published'`,
      [req.user.id]
    );

    // Get previous period for comparison
    const prev = await pool.query(
      `SELECT
        COALESCE(SUM(pa.reach), 0) as total_reach,
        COALESCE(SUM(pa.impressions), 0) as total_impressions,
        COALESCE(SUM(pa.likes), 0) as total_likes
       FROM posts p
       LEFT JOIN post_analytics pa ON pa.post_id = p.id
       WHERE p.user_id = $1
         AND p.created_at >= NOW() - INTERVAL '${parseInt(period) * 2} days'
         AND p.created_at < NOW() - INTERVAL '${parseInt(period)} days'
         AND p.status = 'published'`,
      [req.user.id]
    );

    const current = stats.rows[0];
    const previous = prev.rows[0];

    const pctChange = (curr, prev) => {
      if (!prev || prev == 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    res.json({
      success: true,
      period: parseInt(period),
      stats: {
        total_reach: parseInt(current.total_reach),
        total_impressions: parseInt(current.total_impressions),
        total_likes: parseInt(current.total_likes),
        total_comments: parseInt(current.total_comments),
        total_shares: parseInt(current.total_shares),
        total_posts: parseInt(current.total_posts),
        engagement_rate: current.total_impressions > 0
          ? ((parseInt(current.total_likes) + parseInt(current.total_comments)) / parseInt(current.total_impressions) * 100).toFixed(2)
          : '0.00',
      },
      changes: {
        reach: pctChange(current.total_reach, previous.total_reach),
        impressions: pctChange(current.total_impressions, previous.total_impressions),
        likes: pctChange(current.total_likes, previous.total_likes),
      },
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/analytics/posts
// Per-post performance table
// ─────────────────────────────────────────
router.get('/posts', authMiddleware, async (req, res) => {
  const { period = '30', platform } = req.query;
  try {
    let q = `
      SELECT
        p.id, p.title, p.caption, p.image_url, p.platforms,
        p.status, p.published_at, p.created_at,
        COALESCE(SUM(pa.reach), 0) as reach,
        COALESCE(SUM(pa.impressions), 0) as impressions,
        COALESCE(SUM(pa.likes), 0) as likes,
        COALESCE(SUM(pa.comments), 0) as comments,
        COALESCE(SUM(pa.shares), 0) as shares
      FROM posts p
      LEFT JOIN post_analytics pa ON pa.post_id = p.id
      WHERE p.user_id = $1
        AND p.created_at >= NOW() - INTERVAL '${parseInt(period)} days'
    `;
    const params = [req.user.id];
    if (platform) { q += ` AND $${params.length + 1} = ANY(p.platforms)`; params.push(platform); }
    q += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT 50';

    const result = await pool.query(q, params);
    res.json({ success: true, posts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// GET /api/analytics/chart
// Daily reach data for chart
// ─────────────────────────────────────────
router.get('/chart', authMiddleware, async (req, res) => {
  const { period = '30' } = req.query;
  try {
    const result = await pool.query(
      `SELECT
        DATE(p.published_at) as date,
        p.platforms,
        COALESCE(SUM(pa.reach), 0) as reach,
        COALESCE(SUM(pa.impressions), 0) as impressions,
        COALESCE(SUM(pa.likes), 0) as likes
       FROM posts p
       LEFT JOIN post_analytics pa ON pa.post_id = p.id
       WHERE p.user_id = $1
         AND p.status = 'published'
         AND p.published_at >= NOW() - INTERVAL '${parseInt(period)} days'
       GROUP BY DATE(p.published_at), p.platforms
       ORDER BY date ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/analytics/sync
// Pull fresh metrics from platforms
// ─────────────────────────────────────────
router.post('/sync', authMiddleware, async (req, res) => {
  try {
    const publishedPosts = await pool.query(
      `SELECT pl.post_id, pl.platform, pl.platform_post_id, sc.access_token
       FROM publish_logs pl
       JOIN social_connections sc ON sc.user_id = $1 AND sc.platform = pl.platform
       JOIN posts p ON p.id = pl.post_id AND p.user_id = $1
       WHERE pl.status = 'published' AND pl.platform_post_id IS NOT NULL`,
      [req.user.id]
    );

    let synced = 0;
    for (const row of publishedPosts.rows) {
      let metrics = null;
      if (row.platform === 'instagram') metrics = await fetchInstagramInsights(row.platform_post_id, row.access_token);
      else if (row.platform === 'linkedin') metrics = await fetchLinkedInStats(row.platform_post_id, row.access_token);

      if (metrics) {
        await pool.query(
          `INSERT INTO post_analytics (post_id, platform, reach, impressions, likes, comments, shares, fetched_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
           ON CONFLICT (post_id, platform) DO UPDATE
           SET reach = $3, impressions = $4, likes = $5, comments = $6, shares = $7, fetched_at = NOW()`,
          [row.post_id, row.platform,
           metrics.reach || 0, metrics.impressions || 0,
           metrics.likes || 0, metrics.comments || 0, metrics.shares || 0]
        );
        synced++;
      }
    }

    res.json({ success: true, message: `Synced metrics for ${synced} posts` });
  } catch (err) {
    console.error('Analytics sync error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
