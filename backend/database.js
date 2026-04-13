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
            last_surf_watch TIMESTAMP,
            total_bets_count INTEGER DEFAULT 0,
            total_bets_sum BIGINT DEFAULT 0,
            total_wins_sum BIGINT DEFAULT 0
        )`);

        // Update Users Table: Remove stock columns if they exist, add stats columns if they don't
        try {
            await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS stock_multiplier`);
            await client.query(`ALTER TABLE users DROP COLUMN IF EXISTS last_stock_penalty`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bets_count INTEGER DEFAULT 0`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bets_sum BIGINT DEFAULT 0`);
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_wins_sum BIGINT DEFAULT 0`);
        } catch (e) {}

        // Purchases Table
        await client.query(`CREATE TABLE IF NOT EXISTS purchases (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            item_name TEXT,
            price BIGINT,
            purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Game History Table
        await client.query(`CREATE TABLE IF NOT EXISTS game_history (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            game_name TEXT,
            bet_amount BIGINT,
            win_amount BIGINT,
            multiplier REAL,
            result_data JSONB,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Quests Table
        await client.query(`CREATE TABLE IF NOT EXISTS quests (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT,
            reward BIGINT,
            target_value INTEGER,
            type TEXT, -- 'daily' or 'weekly'
            category TEXT -- 'games', 'ads', 'shop'
        )`);

        // User Quests Progress Table
        await client.query(`CREATE TABLE IF NOT EXISTS user_quests (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            quest_id TEXT REFERENCES quests(id),
            current_value INTEGER DEFAULT 0,
            is_completed BOOLEAN DEFAULT FALSE,
            claimed_at TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(telegram_id, quest_id)
        )`);

        // Bonuses Claimed Table
        await client.query(`CREATE TABLE IF NOT EXISTS bonuses_claimed (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT,
            bonus_id TEXT,
            claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Active Games (for multi-turn games like Blackjack, Mines)
        await client.query(`CREATE TABLE IF NOT EXISTS active_games (
            id SERIAL PRIMARY KEY,
            telegram_id TEXT UNIQUE,
            game_name TEXT,
            bet_amount BIGINT,
            state JSONB,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Settings Table
        await client.query(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
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

        // Shop Items Table
        await client.query(`CREATE TABLE IF NOT EXISTS shop_items (
            id SERIAL PRIMARY KEY,
            category TEXT NOT NULL,
            name TEXT NOT NULL,
            price BIGINT NOT NULL,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        // Default Shop Items
        const { rows: shopRows } = await client.query('SELECT COUNT(*) FROM shop_items');
        if (parseInt(shopRows[0].count) === 0) {
            const defaultItems = [
                ['Телефоны', 'iPhone 15 Pro', 128000, 'https://images.unsplash.com/photo-1696446701796-da61225697cc?w=500&q=80'],
                ['Телефоны', 'Samsung S24 Ultra', 135000, 'https://images.unsplash.com/photo-1707148705001-f1eb98f8287e?w=500&q=80'],
                ['Гаджеты', 'Apple Watch Ultra', 85000, 'https://images.unsplash.com/photo-1664144822550-934a34bba7ca?w=500&q=80'],
                ['Гаджеты', 'AirPods Max', 54000, 'https://images.unsplash.com/photo-1613040809024-b4ef7ba99bc3?w=500&q=80'],
                ['Приставки', 'PS5 Slim', 55000, 'https://images.unsplash.com/photo-1606144042876-0bfdc6463990?w=500&q=80'],
                ['Приставки', 'Nintendo Switch OLED', 35000, 'https://images.unsplash.com/photo-1578303005324-44c138245862?w=500&q=80'],
                ['ПК', 'MacBook Air M3', 145000, 'https://images.unsplash.com/photo-1517336714731-489689fd1ca4?w=500&q=80'],
                ['ПК', 'Gaming Desktop RTX 4090', 450000, 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=500&q=80'],
                ['Мониторы', 'Samsung Odyssey G9', 120000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&q=80'],
                ['ТВ', 'LG OLED C3 65"', 220000, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&q=80'],
                ['Планшеты', 'iPad Pro M4', 115000, 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&q=80']
            ];
            for (const [cat, name, price, img] of defaultItems) {
                await client.query('INSERT INTO shop_items (category, name, price, image_url) VALUES ($1, $2, $3, $4)', [cat, name, price, img]);
            }
        }

        // Default Quests
        const { rows: questRows } = await client.query('SELECT COUNT(*) FROM quests');
        if (parseInt(questRows[0].count) === 0) {
            const defaultQuests = [
                ['daily_games_10', 'Мастер азарта', 'Сыграйте в любые игры 10 раз', 500, 10, 'daily', 'games'],
                ['daily_win_5', 'Везунчик', 'Выиграйте в играх 5 раз', 1000, 5, 'daily', 'games'],
                ['daily_ads_5', 'Зритель', 'Посмотрите 5 рекламных роликов', 750, 5, 'daily', 'ads'],
                ['daily_bet_1000', 'Крупный игрок', 'Поставьте в сумме более 1000 монет', 1500, 1000, 'daily', 'games'],
                ['weekly_games_100', 'Легенда казино', 'Сыграйте 100 раз за неделю', 5000, 100, 'weekly', 'games'],
                ['weekly_win_50', 'Король удачи', 'Выиграйте 50 раз за неделю', 10000, 50, 'weekly', 'games'],
                ['weekly_ads_30', 'Фанат рекламы', 'Посмотрите 30 рекламных роликов за неделю', 4000, 30, 'weekly', 'ads'],
                ['weekly_spend_10000', 'Шопоголик', 'Потратьте в магазине 10,000 монет', 8000, 10000, 'weekly', 'shop']
            ];
            for (const [id, title, desc, reward, target, type, cat] of defaultQuests) {
                await client.query('INSERT INTO quests (id, title, description, reward, target_value, type, category) VALUES ($1, $2, $3, $4, $5, $6, $7)', [id, title, desc, reward, target, type, cat]);
            }
        }

        // Default Ads & Settings
        const defaults = [
            ['ads_enabled', 'true'],
            ['ads_client_id', 'ca-pub-5854666775312114'],
            ['ads_slot_id', '9448831633'],
            ['monetag_zone_id', '9609'],
            ['rewarded_ad_provider', 'monetag'],
            ['social_tiktok_url', 'https://www.tiktok.com/@just___000'],
            ['social_telegram_url', 'https://t.me/YourTurn_APP'],
            ['social_youtube_url', 'https://www.youtube.com/@YourTurn_Arm'],
            ['social_instagram_url', 'https://www.instagram.com/yourturn_arm/'],
            ['social_facebook_url', 'https://www.facebook.com/yourturn.arm/'],
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
