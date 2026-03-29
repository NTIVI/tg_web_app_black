import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import db from './database.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://example.com'; 

app.use(cors());
app.use(express.json());

// Telegram Bot Setup
const bot = new TelegramBot(token, { polling: true });

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const telegramId = msg.from.id.toString();
    const username = msg.from.username || '';

    // Register user if strictly visiting via bot
    db.run(`INSERT OR IGNORE INTO users (telegram_id, username) VALUES (?, ?)`, [telegramId, username], (err) => {
        if (err) console.error('Bot init user error', err);
    });

    bot.sendMessage(chatId, 'Welcome to the Black Design Web App! Click below to start playing.', {
        reply_markup: {
            inline_keyboard: [
                [{ text: 'Open App', web_app: { url: webAppUrl } }]
            ]
        }
    });
});

// API Routes
app.post('/api/auth', (req, res) => {
    // Authenticate initData (Telegram) - simplified for prototyping
    const { initDataUnsafe } = req.body;
    if (!initDataUnsafe || !initDataUnsafe.user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const tgUser = initDataUnsafe.user;
    const telegramId = tgUser.id.toString();
    const username = tgUser.username || '';

    // Upsert user
    db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId], (err, user) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        
        if (!user) {
            db.run(`INSERT INTO users (telegram_id, username) VALUES (?, ?)`, [telegramId, username], function(err) {
                if (err) return res.status(500).json({ error: 'DB error' });
                res.json({ user: { id: this.lastID, telegram_id: telegramId, username, balance: 0, phone: null, email: null } });
            });
        } else {
            res.json({ user });
        }
    });
});

app.post('/api/register', (req, res) => {
    const { telegramId, phone, email } = req.body;
    db.run(`UPDATE users SET phone = ?, email = ? WHERE telegram_id = ?`, [phone, email, telegramId], function(err) {
        if (err) return res.status(500).json({ error: 'DB update error' });
        
        db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
            if (err) return res.status(500).json({ error: 'DB fetch error' });
            res.json({ success: true, user: row });
        });
    });
});

app.post('/api/watch-ad', (req, res) => {
    const { telegramId } = req.body;
    const reward = 50; // Award 50 coins per watch
    
    db.run(`UPDATE users SET balance = balance + ? WHERE telegram_id = ?`, [reward, telegramId], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        
        db.get(`SELECT balance FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json({ success: true, newBalance: row.balance });
        });
    });
});

app.post('/api/buy', (req, res) => {
    const { telegramId, itemName, price } = req.body;
    
    db.get(`SELECT id, balance FROM users WHERE telegram_id = ?`, [telegramId], (err, user) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        if (!user || user.balance < price) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        db.serialize(() => {
            db.run(`UPDATE users SET balance = balance - ? WHERE id = ?`, [price, user.id]);
            db.run(`INSERT INTO purchases (user_id, item_name, price) VALUES (?, ?, ?)`, [user.id, itemName, price]);
            res.json({ success: true, newBalance: user.balance - price });
        });
    });
});

app.get('/api/admin/users', (req, res) => {
    // In a real app, protect this route! For now it's accessible for the MVP admin panel
    db.all(`SELECT * FROM users ORDER BY registered_at DESC`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ users: rows });
    });
});

app.get('/api/admin/purchases', (req, res) => {
    db.all(`
        SELECT p.id, p.item_name, p.price, p.purchased_at, u.username, u.telegram_id 
        FROM purchases p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.purchased_at DESC
    `, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        res.json({ purchases: rows });
    });
});

app.get('/api/settings/ads', (req, res) => {
    db.all(`SELECT key, value FROM settings WHERE key IN ('ads_enabled', 'ads_client_id', 'ads_slot_id', 'adsgram_block_id', 'rewarded_ad_provider')`, [], (err, rows) => {
        if (err) return res.status(500).json({ error: 'DB error' });
        
        const settings = {};
        rows.forEach(row => {
            settings[row.key] = row.value;
        });
        
        res.json({ settings });
    });
});

app.post('/api/admin/settings/ads', (req, res) => {
    const { ads_enabled, ads_client_id, ads_slot_id, adsgram_block_id, rewarded_ad_provider } = req.body;
    
    db.serialize(() => {
        const stmt = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
        stmt.run(ads_enabled ? 'true' : 'false', 'ads_enabled');
        stmt.run(ads_client_id || '', 'ads_client_id');
        stmt.run(ads_slot_id || '', 'ads_slot_id');
        stmt.run(adsgram_block_id || '', 'adsgram_block_id');
        stmt.run(rewarded_ad_provider || 'adsgram', 'rewarded_ad_provider');
        stmt.finalize((err) => {
            if (err) return res.status(500).json({ error: 'DB error' });
            res.json({ success: true, message: 'Settings updated successfully' });
        });
    });
});

app.listen(port, () => {
    console.log(`Backend running on port ${port}`);
});
