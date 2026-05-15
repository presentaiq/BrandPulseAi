const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/posts - get user's posts
router.get('/', authMiddleware, async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const offset = (page - 1) * limit;
  try {
    let q = 'SELECT * FROM posts WHERE user_id = $1';
    const params = [req.user.id];
    if (status) { q += ' AND status = $2'; params.push(status); }
    q += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);
    const result = await pool.query(q, params);
    res.json({ success: true, posts: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/posts - create/save a design
router.post('/', authMiddleware, async (req, res) => {
  const { title, caption, image_url, canvas_json, platforms, status, scheduled_at } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, title, caption, image_url, canvas_json, platforms, status, scheduled_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [req.user.id, title, caption, image_url,
       canvas_json ? JSON.stringify(canvas_json) : null,
       platforms || [], status || 'draft',
       scheduled_at || null]
    );
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (err) {
    console.error('Create post error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PUT /api/posts/:id
router.put('/:id', authMiddleware, async (req, res) => {
  const { title, caption, image_url, canvas_json, platforms, status, scheduled_at } = req.body;
  try {
    const result = await pool.query(
      `UPDATE posts SET
        title = COALESCE($1, title),
        caption = COALESCE($2, caption),
        image_url = COALESCE($3, image_url),
        canvas_json = COALESCE($4, canvas_json),
        platforms = COALESCE($5, platforms),
        status = COALESCE($6, status),
        scheduled_at = COALESCE($7, scheduled_at),
        updated_at = NOW()
       WHERE id = $8 AND user_id = $9
       RETURNING *`,
      [title, caption, image_url,
       canvas_json ? JSON.stringify(canvas_json) : null,
       platforms, status, scheduled_at,
       req.params.id, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Post not found' });
    res.json({ success: true, post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/posts/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await pool.query('DELETE FROM posts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
