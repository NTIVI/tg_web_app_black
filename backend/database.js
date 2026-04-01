import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // Core users table with professional fields
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        telegram_id TEXT UNIQUE,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        photo_url TEXT,
        balance INTEGER DEFAULT 0,
        phone TEXT,
        email TEXT,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Robust Migration: Add missing columns sequentially
    const migrations = [
        "ALTER TABLE users ADD COLUMN first_name TEXT",
        "ALTER TABLE users ADD COLUMN last_name TEXT",
        "ALTER TABLE users ADD COLUMN photo_url TEXT",
        "ALTER TABLE users ADD COLUMN last_seen DATETIME DEFAULT CURRENT_TIMESTAMP"
    ];

    migrations.forEach(sql => {
        db.run(sql, (err) => {
            // Silently ignore "duplicate column name" errors
            if (err && !err.message.includes("duplicate column name")) {
                console.error("Migration Error:", err.message);
            }
        });
    });

    db.run(`CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        item_name TEXT,
        price INTEGER,
        purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE,
        value TEXT
    )`);

    // Initial settings
    const defaultSettings = [
        ['ads_enabled', 'true'],
        ['ads_client_id', 'ca-pub-5854666775312114'],
        ['ads_slot_id', '9448831633'],
        ['adsgram_block_id', '3830'],
        ['rewarded_ad_provider', 'adsgram']
    ];

    defaultSettings.forEach(s => {
        db.run(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`, s);
    });
});

export default db;
