const express = require('express');
const router = express.Router();
const axios = require('axios');
const { pool } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ─────────────────────────────────────────
// Call Anthropic Claude API for recommendations
// ─────────────────────────────────────────
const getClaudeRecommendations = async (analyticsData, userContext) => {
  const prompt = `You are a social media marketing expert AI for BrandPulse AI platform.

Analyse this user's social media performance data and provide actionable recommendations.

USER CONTEXT:
- Brand: ${userContext.brand_name || 'Small Business'}
- Plan: ${userContext.plan}
- Total posts: ${analyticsData.total_posts}
- Period: Last 30 days

PERFORMANCE DATA:
- Total Reach: ${analyticsData.total_reach}
- Total Impressions: ${analyticsData.total_impressions}
- Engagement Rate: ${analyticsData.engagement_rate}%
- Total Likes: ${analyticsData.total_likes}
- Total Comments: ${analyticsData.total_comments}
- Total Shares: ${analyticsData.total_shares}

TOP PERFORMING POSTS:
${JSON.stringify(analyticsData.top_posts || [], null, 2)}

PLATFORM BREAKDOWN:
${JSON.stringify(analyticsData.platform_breakdown || {}, null, 2)}

Respond ONLY with a valid JSON object in exactly this format (no markdown, no explanation):
{
  "recommendations": [
    {
      "id": "1",
      "title": "Short action title",
      "description": "2-3 sentence actionable insight based on the data",
      "impact": "high|medium|low",
      "category": "timing|content|format|hashtags|platform|engagement",
      "metric": "Specific metric this improves",
      "action": "One clear next action the user should take"
    }
  ],
  "content_mix": {
    "visuals": 40,
    "carousels": 25,
    "text_posts": 20,
    "videos": 15
  },
  "best_posting_times": [
    { "day": "Monday", "time": "9AM-11AM", "engagement": "high" },
    { "day": "Wednesday", "time": "6PM-8PM", "engagement": "high" },
    { "day": "Friday", "time": "12PM-2PM", "engagement": "medium" }
  ],
  "summary": "One sentence summary of overall performance"
}`;

  const res = await axios.post(
    'https://api.anthropic.com/v1/messages',
    {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    },
    {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
    }
  );

  const text = res.data.content[0].text.trim();
  return JSON.parse(text);
};

// ─────────────────────────────────────────
// Fallback rule-based recommendations (when no API key)
// ─────────────────────────────────────────
const getRuleBasedRecommendations = (stats) => {
  const recs = [];

  if (stats.total_posts < 5) {
    recs.push({
      id: '1', title: 'Post More Consistently',
      description: 'You\'ve posted fewer than 5 times this month. Brands that post 3-5 times per week see 3× higher engagement rates. Build a content calendar to stay consistent.',
      impact: 'high', category: 'content',
      metric: 'Engagement Rate',
      action: 'Create a weekly content calendar with 3 posts planned in advance',
    });
  }

  if (parseFloat(stats.engagement_rate) < 3) {
    recs.push({
      id: '2', title: 'Use More Visual Content',
      description: 'Your engagement rate is below the 3% benchmark. Posts with bold, high-contrast visuals outperform text-only posts by 94%. Try carousel posts or infographics.',
      impact: 'high', category: 'format',
      metric: 'Engagement Rate',
      action: 'Create a carousel post this week using the BrandPulse template library',
    });
  }

  if (stats.total_reach < 1000) {
    recs.push({
      id: '3', title: 'Optimise Your Hashtags',
      description: 'Your reach is under 1,000. Using a mix of niche (10K-100K posts) and broad hashtags can increase discoverability by up to 30%. Avoid overly saturated tags.',
      impact: 'medium', category: 'hashtags',
      metric: 'Total Reach',
      action: 'Research 5 niche hashtags in your industry and use them on your next post',
    });
  }

  recs.push({
    id: '4', title: 'Post at Peak Hours',
    description: 'Data shows social media engagement peaks between 9-11AM and 6-8PM on weekdays. Scheduling posts during these windows can increase reach by up to 2.3×.',
    impact: 'medium', category: 'timing',
    metric: 'Reach & Impressions',
    action: 'Schedule your next 3 posts between 9-11AM on Monday, Wednesday, and Friday',
  });

  recs.push({
    id: '5', title: 'Engage With Your Audience',
    description: 'Replying to comments within the first hour of posting signals to algorithms that your content is valuable, boosting distribution by up to 50%.',
    impact: 'medium', category: 'engagement',
    metric: 'Comments & Reach',
    action: 'Set a reminder to reply to all comments within 1 hour of publishing',
  });

  return {
    recommendations: recs,
    content_mix: { visuals: 40, carousels: 25, text_posts: 20, videos: 15 },
    best_posting_times: [
      { day: 'Monday', time: '9AM–11AM', engagement: 'high' },
      { day: 'Wednesday', time: '6PM–8PM', engagement: 'high' },
      { day: 'Friday', time: '12PM–2PM', engagement: 'medium' },
      { day: 'Sunday', time: '7PM–9PM', engagement: 'low' },
    ],
    summary: stats.total_posts === 0
      ? 'Start publishing content to get personalised AI recommendations.'
      : `Your content is reaching ${stats.total_reach.toLocaleString()} people with a ${stats.engagement_rate}% engagement rate.`,
  };
};

// ─────────────────────────────────────────
// GET /api/recommendations
// ─────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Get user info
    const userRes = await pool.query(
      'SELECT full_name, brand_name, plan FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = userRes.rows[0];

    // Get analytics
    const statsRes = await pool.query(
      `SELECT
        COALESCE(SUM(pa.reach), 0) as total_reach,
        COALESCE(SUM(pa.impressions), 0) as total_impressions,
        COALESCE(SUM(pa.likes), 0) as total_likes,
        COALESCE(SUM(pa.comments), 0) as total_comments,
        COALESCE(SUM(pa.shares), 0) as total_shares,
        COUNT(DISTINCT p.id) as total_posts
       FROM posts p
       LEFT JOIN post_analytics pa ON pa.post_id = p.id
       WHERE p.user_id = $1 AND p.created_at >= NOW() - INTERVAL '30 days'`,
      [req.user.id]
    );
    const stats = statsRes.rows[0];
    stats.engagement_rate = stats.total_impressions > 0
      ? ((parseInt(stats.total_likes) + parseInt(stats.total_comments)) / parseInt(stats.total_impressions) * 100).toFixed(2)
      : '0.00';

    // Get top posts
    const topPostsRes = await pool.query(
      `SELECT p.title, p.platforms, pa.reach, pa.likes, pa.comments
       FROM posts p
       JOIN post_analytics pa ON pa.post_id = p.id
       WHERE p.user_id = $1 AND p.status = 'published'
       ORDER BY pa.reach DESC LIMIT 5`,
      [req.user.id]
    );

    const analyticsData = {
      ...stats,
      top_posts: topPostsRes.rows,
    };

    let recommendations;

    // Try Claude API first, fall back to rule-based
    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      try {
        recommendations = await getClaudeRecommendations(analyticsData, user);
      } catch (err) {
        console.warn('Claude API error, falling back to rule-based:', err.message);
        recommendations = getRuleBasedRecommendations(stats);
      }
    } else {
      recommendations = getRuleBasedRecommendations(stats);
    }

    res.json({
      success: true,
      ...recommendations,
      stats: analyticsData,
      generated_at: new Date(),
      powered_by: process.env.ANTHROPIC_API_KEY ? 'claude-ai' : 'rule-based',
    });
  } catch (err) {
    console.error('Recommendations error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ─────────────────────────────────────────
// POST /api/recommendations/generate-caption
// AI caption generation for a post
// ─────────────────────────────────────────
router.post('/generate-caption', authMiddleware, async (req, res) => {
  const { prompt, platform, tone, hashtags } = req.body;

  if (!prompt) return res.status(400).json({ success: false, message: 'Prompt is required' });

  try {
    let caption;

    if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'your_anthropic_api_key_here') {
      const aiRes = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-20250514',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Write a ${tone || 'professional'} social media caption for ${platform || 'Instagram'}.

Context: ${prompt}
${hashtags ? 'Include relevant hashtags.' : 'No hashtags.'}

Requirements:
- Engaging and authentic
- Appropriate length for ${platform || 'Instagram'}
- Include a clear call to action
- ${tone === 'casual' ? 'Conversational and friendly tone' : 'Professional but approachable'}

Return ONLY the caption text, nothing else.`,
          }],
        },
        {
          headers: {
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json',
          },
        }
      );
      caption = aiRes.data.content[0].text.trim();
    } else {
      caption = `✨ ${prompt}\n\nWe're excited to share this with our community! Drop a comment below and let us know your thoughts. 👇\n\n#BrandPulse #Marketing #ContentCreation`;
    }

    res.json({ success: true, caption });
  } catch (err) {
    console.error('Caption generation error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate caption' });
  }
});

module.exports = router;
