import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const initDB = async () => {
    try {
        const client = await pool.connect();
        console.log('Connected to PostgreSQL (Neon) database.');

        // Users Table
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            telegram_id TEXT PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            photo_url TEXT,
            balance BIGINT DEFAULT 5000,
            xp BIGINT DEFAULT 0,
            level INTEGER DEFAULT 1,
            registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_daily_claim TIMESTAMP,
            daily_streak INTEGER DEFAULT 0,
            last_ad_watch TIMESTAMP,
            last_surf_watch TIMESTAMP
        )`);

        // Migration: Remove yt_balance if exists
        try {
            await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS yt_balance`);
        } catch (e) {
            // Might fail if column doesn't exist or other issues, safe to ignore in most cases
        }

        // Migration: Add stock_multiplier and last_stock_penalty
        try {
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS stock_multiplier REAL DEFAULT 1.0`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_stock_penalty TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
        } catch (e) {}

        // Purchases Table
        await client.query(`CREATE TABLE IF NOT EXISTS purchases (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            item_name TEXT,
            price BIGINT,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Bonuses Claimed Table
        await client.query(`CREATE TABLE IF NOT EXISTS bonuses_claimed (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            bonus_id TEXT,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Settings Table
        await client.query(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // User NFTs Table
        await client.query(`CREATE TABLE IF NOT EXISTS user_nfts (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            nft_id TEXT,
            quantity INTEGER DEFAULT 1,
            purchase_price BIGINT,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // News Banners
        await client.query(`CREATE TABLE IF NOT EXISTS news_banners (
            id SERIAL PRIMARY KEY,
            image_url TEXT NOT NULL,
            link_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // News Posts
        await client.query(`CREATE TABLE IF NOT EXISTS news_posts (
            id SERIAL PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Default Ads & NFT Settings
        const defaults = [
            ['ads_enabled', 'true'],
            ['ads_client_id', 'ca-pub-5854666775312114'],
            ['ads_slot_id', '9448831633'],
            ['monetag_zone_id', '9609'],
            ['rewarded_ad_provider', 'monetag'],
            ['nft_manipulation_target', '0'],
            ['nft_manipulation_duration', '0'],
            ['nft_manipulation_start', '0'],
            ['social_tiktok_url', 'https://www.tiktok.com/@just___000'],
            ['social_telegram_url', 'https://t.me/YourTurn_APP'],
            ['social_youtube_url', 'https://youtube.com/@devki_keksi'],
            ['social_instagram_url', ''],
            ['social_facebook_url', ''],
            ['social_tiktok_target', '10000'],
            ['social_instagram_target', '5000'],
            ['social_telegram_target', '3000'],
            ['social_facebook_target', '2000'],
            ['social_youtube_target', '10000']
        ];
        
        for (const [k, v] of defaults) {
            await client.query(`INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING`, [k, v]);
        }

        client.release();
        console.log('Database schema initialized.');
    } catch (err) {
        console.error('PostgreSQL connection error:', err.message);
    }
};

initDB();

export default pool;
