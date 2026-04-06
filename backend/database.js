import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('SQLite connection error:', err.message);
    else {
        console.log('Connected to SQLite database.');
        initDB();
    }
});

const initDB = () => {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            telegram_id TEXT PRIMARY KEY,
            username TEXT,
            first_name TEXT,
            last_name TEXT,
            photo_url TEXT,
            balance INTEGER DEFAULT 0,
            level INTEGER DEFAULT 1,
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
            yt_balance INTEGER DEFAULT 0
        )`);

        // Migration: ensure level and daily bonus columns exist
        db.run(`ALTER TABLE users ADD COLUMN level INTEGER DEFAULT 1`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (level):", err.message);
            }
        });
        db.run(`ALTER TABLE users ADD COLUMN last_daily_claim DATETIME`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (last_daily_claim):", err.message);
            }
        });
        db.run(`ALTER TABLE users ADD COLUMN daily_streak INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (daily_streak):", err.message);
            }
        });
        db.run(`ALTER TABLE users ADD COLUMN last_ad_watch DATETIME`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (last_ad_watch):", err.message);
            }
        });
        db.run(`ALTER TABLE users ADD COLUMN yt_balance INTEGER DEFAULT 0`, (err) => {
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration error (yt_balance):", err.message);
            }
        });

        // Purchases Table
        db.run(`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT,
            item_name TEXT,
            price INTEGER,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Bonuses Claimed Table
        db.run(`CREATE TABLE IF NOT EXISTS bonuses_claimed (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT,
            bonus_id TEXT,
            claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Settings Table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`);

        // User NFTs Table
        db.run(`CREATE TABLE IF NOT EXISTS user_nfts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT,
            nft_id TEXT,
            quantity INTEGER DEFAULT 1,
            purchase_price INTEGER,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
            ['nft_manipulation_start', '0']
        ];
        defaults.forEach(([k, v]) => {
            db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, [k, v]);
        });
    });
};

export default db;
