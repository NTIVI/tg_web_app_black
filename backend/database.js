import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Helper to convert '?' placeholders to '$1, $2, ...' for PostgreSQL
const convertSQL = (sql) => {
    let count = 1;
    return sql.replace(/\?/g, () => `$${count++}`);
};

export const DB = {
    query: async (sql, params = []) => pool.query(convertSQL(sql), params),
    run: async (sql, params = []) => {
        const res = await pool.query(convertSQL(sql), params);
        return { id: res.rows?.[0]?.id || null, changes: res.rowCount };
    },
    get: async (sql, params = []) => (await pool.query(convertSQL(sql), params)).rows[0],
    all: async (sql, params = []) => (await pool.query(convertSQL(sql), params)).rows
};

export const initDB = async () => {
    const client = await pool.connect();
    try {
        console.log('Initializing PostgreSQL Database...');
        
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                telegram_id TEXT PRIMARY KEY, username TEXT, first_name TEXT, last_name TEXT, photo_url TEXT,
                balance BIGINT DEFAULT 5000, xp BIGINT DEFAULT 0, level INTEGER DEFAULT 1,
                registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_daily_claim TIMESTAMP, daily_streak INTEGER DEFAULT 0, last_ad_watch TIMESTAMP, last_surf_watch TIMESTAMP,
                stock_multiplier REAL DEFAULT 1.0, last_stock_penalty TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            `CREATE TABLE IF NOT EXISTS purchases (id SERIAL PRIMARY KEY, telegram_id TEXT, item_name TEXT, price BIGINT, purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS bonuses_claimed (id SERIAL PRIMARY KEY, telegram_id TEXT, bonus_id TEXT, claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT)`,
            `CREATE TABLE IF NOT EXISTS user_nfts (id SERIAL PRIMARY KEY, telegram_id TEXT, nft_id TEXT, quantity INTEGER DEFAULT 1, purchase_price BIGINT, purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS news_banners (id SERIAL PRIMARY KEY, image_url TEXT NOT NULL, link_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`,
            `CREATE TABLE IF NOT EXISTS news_posts (id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT, image_url TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`
        ];

        for (const sql of tables) await client.query(sql);

        // Migrations
        try { await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS yt_balance`); } catch {}
        
        const defaults = [
            ['ads_enabled', 'true'], ['ads_client_id', 'ca-pub-5854666775312114'], ['ads_slot_id', '9448831633'],
            ['monetag_zone_id', '9609'], ['rewarded_ad_provider', 'monetag'],
            ['social_tiktok_url', 'https://www.tiktok.com/@just___000'], ['social_telegram_url', 'https://t.me/YourTurn_APP'],
            ['social_youtube_url', 'https://youtube.com/@devki_keksi'], ['social_tiktok_target', '10000'],
            ['social_instagram_target', '5000'], ['social_telegram_target', '3000'], ['social_facebook_target', '2000'], ['social_youtube_target', '10000']
        ];
        
        for (const [k, v] of defaults) {
            await client.query(`INSERT INTO settings (key, value) ON CONFLICT (key) DO NOTHING VALUES ($1, $2)`, [k, v]);
        }

        console.log('Database initialized successfully.');
    } catch (err) {
        console.error('Database Error:', err.message);
    } finally {
        client.release();
    }
};

export default pool;
