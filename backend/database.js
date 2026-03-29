import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        
        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id TEXT UNIQUE,
            username TEXT,
            phone TEXT,
            email TEXT,
            balance INTEGER DEFAULT 0,
            registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating users table', err);
        });

        // Create Purchases table
        db.run(`CREATE TABLE IF NOT EXISTS purchases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            item_name TEXT,
            price INTEGER,
            purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )`, (err) => {
            if (err) console.error('Error creating purchases table', err);
        });

        // Create Settings table
        db.run(`CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )`, (err) => {
            if (err) {
                console.error('Error creating settings table', err);
            } else {
                // Initialize default ad settings if they don't exist
                const defaultSettings = [
                    { key: 'ads_enabled', value: 'true' },
                    { key: 'ads_client_id', value: 'ca-pub-5854666775312114' },
                    { key: 'ads_slot_id', value: '9141571659' }, // Using the rewarded unit ID as a placeholder slot
                    { key: 'adsgram_block_id', value: '' },
                    { key: 'rewarded_ad_provider', value: 'google' }
                ];
                
                const stmt = db.prepare(`INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)`);
                defaultSettings.forEach(setting => {
                    stmt.run(setting.key, setting.value);
                });
                stmt.finalize();
            }
        });
    }
});

export default db;
