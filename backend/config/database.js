const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'brandpulse',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

// Test connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Connected to PostgreSQL');
    release();
  }
});

// Create all tables if they don't exist
const initDB = async () => {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        full_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255),
        brand_name VARCHAR(255),
        plan VARCHAR(50) DEFAULT 'free',
        profile_photo TEXT,
        onboarded BOOLEAN DEFAULT false,
        google_id VARCHAR(255),
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMP,
        email_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS social_connections (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        access_token TEXT,
        refresh_token TEXT,
        platform_user_id VARCHAR(255),
        platform_username VARCHAR(255),
        connected_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, platform)
      );

      CREATE TABLE IF NOT EXISTS posts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        title VARCHAR(500),
        caption TEXT,
        image_url TEXT,
        canvas_json JSONB,
        platforms TEXT[],
        status VARCHAR(50) DEFAULT 'draft',
        scheduled_at TIMESTAMP,
        published_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS post_analytics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        platform VARCHAR(50),
        reach INTEGER DEFAULT 0,
        impressions INTEGER DEFAULT 0,
        likes INTEGER DEFAULT 0,
        comments INTEGER DEFAULT 0,
        shares INTEGER DEFAULT 0,
        fetched_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(post_id, platform)
      );

      CREATE TABLE IF NOT EXISTS publish_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
        platform VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        platform_post_id VARCHAR(255),
        error TEXT,
        published_at TIMESTAMP,
        UNIQUE(post_id, platform)
      );

      CREATE TABLE IF NOT EXISTS templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        platform VARCHAR(50),
        category VARCHAR(100),
        thumbnail_url TEXT,
        template_data JSONB,
        is_premium BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database tables ready');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  } finally {
    client.release();
  }
};

module.exports = { pool, initDB };
