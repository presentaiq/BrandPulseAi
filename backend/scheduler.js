const cron = require('node-cron');
const axios = require('axios');
const { pool } = require('./config/database');

// Run every minute — check for scheduled posts due to publish
const startScheduler = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const result = await pool.query(
        `SELECT p.*, u.id as uid
         FROM posts p
         JOIN users u ON u.id = p.user_id
         WHERE p.status = 'scheduled'
           AND p.scheduled_at <= NOW()
           AND p.scheduled_at > NOW() - INTERVAL '5 minutes'`
      );

      if (result.rows.length === 0) return;

      console.log(`⏰ Scheduler: ${result.rows.length} post(s) due to publish`);

      for (const post of result.rows) {
        // Call our own publish API internally
        try {
          await axios.post(`http://localhost:${process.env.PORT || 5000}/api/publish`, {
            postId: post.id,
            platforms: post.platforms,
            caption: post.caption,
            imageUrl: post.image_url,
          }, {
            headers: { 'x-internal-scheduler': 'true', 'x-user-id': post.uid }
          });
          console.log(`✅ Scheduler published post ${post.id}`);
        } catch (err) {
          console.error(`❌ Scheduler failed for post ${post.id}:`, err.message);
          await pool.query(
            `UPDATE posts SET status = 'failed', updated_at = NOW() WHERE id = $1`,
            [post.id]
          );
        }
      }
    } catch (err) {
      console.error('Scheduler error:', err.message);
    }
  });

  console.log('⏰ Post scheduler started (checking every minute)');
};

module.exports = { startScheduler };
