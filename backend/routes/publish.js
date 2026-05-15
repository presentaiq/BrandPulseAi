const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────

const getConnection = async (userId, platform) => {
  const res = await pool.query(
    'SELECT * FROM social_connections WHERE user_id = $1 AND platform = $2',
    [userId, platform]
  );
  return res.rows[0] || null;
};

const logPublishResult = async (postId, platform, status, platformPostId = null, error = null) => {
  await pool.query(
    `INSERT INTO publish_logs (post_id, platform, status, platform_post_id, error, published_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (post_id, platform) DO UPDATE
     SET status = $3, platform_post_id = $4, error = $5, published_at = NOW()`,
    [postId, platform, status, platformPostId, error]
  );
};

// ─────────────────────────────────────────
// INSTAGRAM PUBLISHING (Meta Graph API)
// ─────────────────────────────────────────

const publishToInstagram = async (connection, imageUrl, caption) => {
  const { access_token, platform_user_id } = connection;
  const baseUrl = 'https://graph.facebook.com/v18.0';

  // Step 1: Create media container
  const containerRes = await axios.post(
    `${baseUrl}/${platform_user_id}/media`,
    { image_url: imageUrl, caption, access_token }
  );
  const containerId = containerRes.data.id;

  // Step 2: Wait a moment then publish
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: Publish container
  const publishRes = await axios.post(
    `${baseUrl}/${platform_user_id}/media_publish`,
    { creation_id: containerId, access_token }
  );

  return publishRes.data.id;
};

// ─────────────────────────────────────────
// LINKEDIN PUBLISHING (LinkedIn API v2)
// ─────────────────────────────────────────

const publishToLinkedIn = async (connection, imageUrl, caption) => {
  const { access_token, platform_user_id } = connection;
  const headers = {
    'Authorization': `Bearer ${access_token}`,
    'Content-Type': 'application/json',
    'X-Restli-Protocol-Version': '2.0.0',
  };

  // Register image upload
  const registerRes = await axios.post(
    'https://api.linkedin.com/v2/assets?action=registerUpload',
    {
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: `urn:li:person:${platform_user_id}`,
        serviceRelationships: [{ relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }],
      },
    },
    { headers }
  );

  const uploadUrl = registerRes.data.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerRes.data.value.asset;

  // Upload the image
  const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  await axios.put(uploadUrl, imgRes.data, {
    headers: { 'Authorization': `Bearer ${access_token}`, 'Content-Type': 'image/png' },
  });

  // Create the post
  const postRes = await axios.post(
    'https://api.linkedin.com/v2/ugcPosts',
    {
      author: `urn:li:person:${platform_user_id}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: { text: caption },
          shareMediaCategory: 'IMAGE',
          media: [{
            status: 'READY',
            description: { text: caption.slice(0, 200) },
            media: asset,
          }],
        },
      },
      visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
    },
    { headers }
  );

  return postRes.data.id;
};

// ─────────────────────────────────────────
// GET /api/publish/status/:postId
// ─────────────────────────────────────────
router.get('/status/:postId', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM publish_logs WHERE post_id = $1',
      [req.params.postId]
    );
    res.json({ success: true, logs: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/publish
// Body: { postId, platforms, caption, imageUrl, scheduledAt? }
// ─────────────────────────────────────────
router.post('/', authMiddleware, async (req, res) => {
  const { postId, platforms, caption, imageUrl, scheduledAt } = req.body;

  if (!postId || !platforms?.length || !caption || !imageUrl) {
    return res.status(400).json({ success: false, message: 'Missing required fields: postId, platforms, caption, imageUrl' });
  }

  try {
    // If scheduled, save and return
    if (scheduledAt) {
      await pool.query(
        `UPDATE posts SET status = 'scheduled', scheduled_at = $1, caption = $2, platforms = $3, updated_at = NOW()
         WHERE id = $4 AND user_id = $5`,
        [scheduledAt, caption, platforms, postId, req.user.id]
      );
      return res.json({
        success: true,
        message: `Post scheduled for ${new Date(scheduledAt).toLocaleString()}`,
        status: 'scheduled',
      });
    }

    // Publish immediately
    const results = {};
    const errors = {};

    await pool.query(
      `UPDATE posts SET status = 'publishing', caption = $1, platforms = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4`,
      [caption, platforms, postId, req.user.id]
    );

    for (const platform of platforms) {
      try {
        const connection = await getConnection(req.user.id, platform);

        if (!connection) {
          errors[platform] = `${platform} account not connected. Please connect it in Account Settings.`;
          await logPublishResult(postId, platform, 'failed', null, errors[platform]);
          continue;
        }

        let platformPostId;
        if (platform === 'instagram') {
          platformPostId = await publishToInstagram(connection, imageUrl, caption);
        } else if (platform === 'linkedin') {
          platformPostId = await publishToLinkedIn(connection, imageUrl, caption);
        } else {
          // For Facebook, WhatsApp, Twitter — mark as pending integration
          errors[platform] = `${platform} publishing coming soon`;
          await logPublishResult(postId, platform, 'pending', null, errors[platform]);
          continue;
        }

        results[platform] = platformPostId;
        await logPublishResult(postId, platform, 'published', platformPostId);
      } catch (err) {
        const msg = err.response?.data?.error?.message || err.message;
        errors[platform] = msg;
        await logPublishResult(postId, platform, 'failed', null, msg);
      }
    }

    // Update overall post status
    const allFailed = Object.keys(results).length === 0;
    await pool.query(
      `UPDATE posts SET
        status = $1,
        published_at = CASE WHEN $1 = 'published' THEN NOW() ELSE published_at END,
        updated_at = NOW()
       WHERE id = $2`,
      [allFailed ? 'failed' : 'published', postId]
    );

    res.json({
      success: !allFailed,
      published: results,
      errors,
      message: allFailed
        ? 'Publishing failed for all platforms'
        : `Published to: ${Object.keys(results).join(', ')}`,
    });
  } catch (err) {
    console.error('Publish error:', err);
    res.status(500).json({ success: false, message: 'Server error during publishing' });
  }
});

// ─────────────────────────────────────────
// POST /api/publish/connect/:platform
// Saves OAuth token after user connects account
// ─────────────────────────────────────────
router.post('/connect/:platform', authMiddleware, async (req, res) => {
  const { platform } = req.params;
  const { access_token, platform_user_id, platform_username } = req.body;

  if (!access_token || !platform_user_id) {
    return res.status(400).json({ success: false, message: 'access_token and platform_user_id are required' });
  }

  try {
    await pool.query(
      `INSERT INTO social_connections (user_id, platform, access_token, platform_user_id, platform_username)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, platform) DO UPDATE
       SET access_token = $3, platform_user_id = $4, platform_username = $5, connected_at = NOW()`,
      [req.user.id, platform, access_token, platform_user_id, platform_username]
    );
    res.json({ success: true, message: `${platform} connected successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/publish/connections
router.get('/connections', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT platform, platform_username, connected_at FROM social_connections WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ success: true, connections: result.rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/publish/connect/:platform
router.delete('/connect/:platform', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM social_connections WHERE user_id = $1 AND platform = $2',
      [req.user.id, req.params.platform]
    );
    res.json({ success: true, message: `${req.params.platform} disconnected` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
