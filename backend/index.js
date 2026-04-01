import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import db from './database.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;

app.use(cors());
app.use(express.json());

// HMAC-SHA256 Verification for Telegram initData
const verifyInitData = (initData) => {
    if (!token) return true; // Skip if no token (for dev)
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        urlParams.sort();

        let dataCheckString = '';
        for (const [key, value] of urlParams.entries()) {
            dataCheckString += `${key}=${value}\n`;
        }
        dataCheckString = dataCheckString.slice(0, -1);

        const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
        const calculatedHash = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

        return calculatedHash === hash;
    } catch (e) {
        return false;
    }
};

// Telegram Bot Setup
const bot = token ? new TelegramBot(token, { polling: true }) : null;

if (bot) {
    bot.onText(/\/start/, (msg) => {
        const chatId = msg.chat.id;
        const webAppUrl = process.env.WEB_APP_URL || 'https://your-frontend-url.com';
        bot.sendMessage(chatId, 'Welcome to YourTurn! 🎮', {
            reply_markup: {
                inline_keyboard: [[{ text: 'Open App', web_app: { url: webAppUrl } }]]
            }
        });
    });
}

// API Routes
app.post('/api/auth', (req, res) => {
    const { initData, initDataUnsafe } = req.body;

    if (initData && !verifyInitData(initData)) {
        return res.status(401).json({ error: 'Invalid initData' });
    }

    const tgUser = initDataUnsafe?.user || { id: 'mock_123', username: 'Guest' };
    const telegramId = tgUser.id.toString();

    // Insert or Update user profile (Pro Sync)
    const sql = `
        INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, last_seen)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(telegram_id) DO UPDATE SET
            username = excluded.username,
            first_name = excluded.first_name,
            last_name = excluded.last_name,
            photo_url = excluded.photo_url,
            last_seen = CURRENT_TIMESTAMP
    `;
    
    const params = [
        telegramId, 
        tgUser.username || '', 
        tgUser.first_name || '', 
        tgUser.last_name || '', 
        tgUser.photo_url || ''
    ];

    db.run(sql, params, function(err) {
        if (err) {
            console.error("Auth DB Error:", err);
            // Fallback: try to just select if insert fails
            db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
                if (row) return res.json({ user: row });
                res.status(500).json({ error: 'Database record error' });
            });
        } else {
            db.get(`SELECT * FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
                res.json({ user: row });
            });
        }
    });
});

// Proxy for Telegram Avatars (avoids CORS and expired URLs)
app.get('/api/avatar/:telegram_id', async (req, res) => {
    if (!bot) return res.status(501).send();
    try {
        const photos = await bot.getUserProfilePhotos(req.params.telegram_id, { limit: 1 });
        if (photos.total_count > 0) {
            const fileId = photos.photos[0][0].file_id;
            const fileLink = await bot.getFileLink(fileId);
            const response = await fetch(fileLink);
            const buffer = Buffer.from(await response.arrayBuffer());
            res.set('Content-Type', 'image/jpeg');
            res.send(buffer);
        } else {
            res.status(404).send('No avatar');
        }
    } catch (e) {
        res.status(500).send('Error fetching avatar');
    }
});

app.post('/api/watch-ad', (req, res) => {
    const { telegramId } = req.body;
    db.run(`UPDATE users SET balance = balance + 50 WHERE telegram_id = ?`, [telegramId], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        db.get(`SELECT balance FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
            res.json({ success: true, newBalance: row.balance });
        });
    });
});

app.post('/api/buy', (req, res) => {
    const { telegramId, itemName, price } = req.body;
    db.get(`SELECT id, balance FROM users WHERE telegram_id = ?`, [telegramId], (err, user) => {
        if (!user || user.balance < price) return res.status(400).json({ error: 'Insufficient funds' });
        db.serialize(() => {
            db.run(`UPDATE users SET balance = balance - ?, last_seen = CURRENT_TIMESTAMP WHERE id = ?`, [price, user.id]);
            db.run(`INSERT INTO purchases (user_id, item_name, price) VALUES (?, ?, ?)`, [user.id, itemName, price]);
            res.json({ success: true, newBalance: user.balance - price });
        });
    });
});

// Admin routes
app.get('/api/admin/users', (req, res) => {
    db.all(`SELECT * FROM users ORDER BY last_seen DESC`, [], (err, rows) => {
        res.json({ users: rows });
    });
});

app.get('/api/admin/purchases', (req, res) => {
    db.all(`
        SELECT p.*, u.username, u.telegram_id 
        FROM purchases p 
        JOIN users u ON p.user_id = u.id 
        ORDER BY p.purchased_at DESC
    `, [], (err, rows) => {
        res.json({ purchases: rows });
    });
});

app.post('/api/admin/user/balance', (req, res) => {
    const { telegramId, amount, action } = req.body;
    const value = parseInt(amount);
    
    if (isNaN(value)) return res.status(400).json({ error: 'Invalid amount' });

    const sql = action === 'add' 
        ? `UPDATE users SET balance = balance + ? WHERE telegram_id = ?`
        : `UPDATE users SET balance = MAX(0, balance - ?) WHERE telegram_id = ?`;

    db.run(sql, [value, telegramId], function(err) {
        if (err) return res.status(500).json({ error: 'DB error' });
        db.get(`SELECT balance FROM users WHERE telegram_id = ?`, [telegramId], (err, row) => {
            res.json({ success: true, newBalance: row.balance });
        });
    });
});

app.get('/api/settings/ads', (req, res) => {
    db.all(`SELECT key, value FROM settings`, [], (err, rows) => {
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json({ settings });
    });
});

app.post('/api/admin/settings/ads', (req, res) => {
    const s = req.body;
    db.serialize(() => {
        const stmt = db.prepare(`UPDATE settings SET value = ? WHERE key = ?`);
        stmt.run(s.ads_enabled ? 'true' : 'false', 'ads_enabled');
        stmt.run(s.ads_client_id || '', 'ads_client_id');
        stmt.run(s.ads_slot_id || '', 'ads_slot_id');
        stmt.run(s.adsgram_block_id || '', 'adsgram_block_id');
        stmt.run(s.rewarded_ad_provider || 'adsgram', 'rewarded_ad_provider');
        stmt.finalize(() => res.json({ success: true }));
    });
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
