import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { DB } from './models.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;

app.use(cors());
app.use(express.json());

let memoizedSecretKey = null;
const verifyInitData = (initData) => {
    if (!token) return true;
    try {
        const urlParams = new URLSearchParams(initData);
        const hash = urlParams.get('hash');
        urlParams.delete('hash');
        urlParams.sort();
        let dataCheckString = '';
        for (const [key, value] of urlParams.entries()) dataCheckString += `${key}=${value}\n`;
        dataCheckString = dataCheckString.slice(0, -1);
        if (!memoizedSecretKey) {
            memoizedSecretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
        }
        return crypto.createHmac('sha256', memoizedSecretKey).update(dataCheckString).digest('hex') === hash;
    } catch { return false; }
};

const bot = token ? new TelegramBot(token, { polling: { interval: 300, autoStart: true } }) : null;
if (bot) {
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Welcome to YourTurn! 🎮', {
            reply_markup: { inline_keyboard: [[{ text: 'Open App', web_app: { url: process.env.WEB_APP_URL || '' } }]] }
        });
    });
}

// API Routes
app.post('/api/auth', async (req, res) => {
    const { initData, initDataUnsafe } = req.body;
    if (initData && !verifyInitData(initData)) return res.status(401).json({ error: 'Invalid auth' });
    const tgUser = initDataUnsafe?.user || { id: 'mock_123' };
    const tid = tgUser.id.toString();

    try {
        await DB.run(`
            INSERT INTO users (telegram_id, username, first_name, last_name, photo_url, last_seen)
            VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(telegram_id) DO UPDATE SET
                username=excluded.username,
                first_name=excluded.first_name,
                last_name=excluded.last_name,
                photo_url=excluded.photo_url,
                last_seen=excluded.last_seen
        `, [tid, tgUser.username || '', tgUser.first_name || '', tgUser.last_name || '', tgUser.photo_url || '']);

        const user = await DB.get('SELECT * FROM users WHERE telegram_id = ?', [tid]);
        res.json({ user });
    } catch (err) { console.error(err); res.status(500).json({ error: 'DB error' }); }
});

app.post('/api/watch-ad', async (req, res) => {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });
    try {
        await DB.run('UPDATE users SET balance = balance + 50 WHERE telegram_id = ?', [telegramId]);
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!user, newBalance: user?.balance });
    } catch (err) { 
        console.error('Watch ad error:', err);
        res.status(500).json({ error: 'Error' }); 
    }
});

// Adsgram Server-to-Server reward callback
app.get('/api/adsgram-reward', async (req, res) => {
    const { user } = req.query;
    if (!user) return res.status(400).send('Missing user');
    
    try {
        // Standard reward is 50
        await DB.run('UPDATE users SET balance = balance + 50 WHERE telegram_id = ?', [user]);
        console.log(`Rewarded user ${user} via Adsgram s2s`);
        res.send('OK');
    } catch (err) {
        console.error('Adsgram reward error:', err);
        res.status(500).send('Error');
    }
});

app.post('/api/buy', async (req, res) => {
    const { telegramId, itemName, price } = req.body;
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < price) return res.status(400).json({ error: 'No funds' });
        
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [price, telegramId]);
        await DB.run('INSERT INTO purchases (telegram_id, item_name, price) VALUES (?,?,?)', [telegramId, itemName, price]);
        res.json({ success: true, newBalance: user.balance - price });
    } catch { res.status(500).json({ error: 'Buy error' }); }
});

app.get('/api/top', async (req, res) => {
    try {
        const users = await DB.all('SELECT username, first_name, photo_url, balance, level FROM users ORDER BY balance DESC LIMIT 50');
        res.json({ users });
    } catch (err) { res.status(500).json({ error: 'Top query error' }); }
});

app.get('/api/bonuses/:telegramId', async (req, res) => {
    try {
        const claimed = await DB.all('SELECT bonus_id FROM bonuses_claimed WHERE telegram_id = ?', [req.params.telegramId]);
        res.json({ claimed: claimed.map(c => c.bonus_id) });
    } catch (err) { res.status(500).json({ error: 'Bonuses fetch error' }); }
});

app.post('/api/bonus/claim', async (req, res) => {
    const { telegramId, bonusId, reward } = req.body;
    try {
        const existing = await DB.get('SELECT id FROM bonuses_claimed WHERE telegram_id = ? AND bonus_id = ?', [telegramId, bonusId]);
        if (existing) return res.status(400).json({ error: 'Already claimed' });
        
        await DB.run('INSERT INTO bonuses_claimed (telegram_id, bonus_id) VALUES (?, ?)', [telegramId, bonusId]);
        await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [reward, telegramId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Claim error' }); }
});

app.get('/api/bonus/daily/:telegramId', async (req, res) => {
    try {
        const user = await DB.get('SELECT last_daily_claim FROM users WHERE telegram_id = ?', [req.params.telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastMidnight = new Date(now);
        lastMidnight.setUTCHours(0,0,0,0);
        const lastNoon = new Date(now);
        lastNoon.setUTCHours(12,0,0,0);

        let windowStart, nextWindow;
        if (now >= lastNoon) {
            windowStart = lastNoon;
            nextWindow = new Date(lastMidnight);
            nextWindow.setUTCDate(nextWindow.getUTCDate() + 1);
        } else {
            windowStart = lastMidnight;
            nextWindow = lastNoon;
        }

        const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim + 'Z') : null;
        const canClaim = !lastClaim || lastClaim < windowStart;
        const timeLeft = canClaim ? 0 : nextWindow - now;
        
        res.json({ canClaim, timeLeft, lastClaim: user.last_daily_claim });
    } catch (err) { res.status(500).json({ error: 'Daily check error' }); }
});

app.post('/api/bonus/daily/claim', async (req, res) => {
    const { telegramId } = req.body;
    try {
        const user = await DB.get('SELECT last_daily_claim FROM users WHERE telegram_id = ?', [telegramId]);
        
        const now = new Date();
        const lastMidnight = new Date(now);
        lastMidnight.setUTCHours(0,0,0,0);
        const lastNoon = new Date(now);
        lastNoon.setUTCHours(12,0,0,0);

        let windowStart, nextWindow;
        if (now >= lastNoon) {
            windowStart = lastNoon;
            nextWindow = new Date(lastMidnight);
            nextWindow.setUTCDate(nextWindow.getUTCDate() + 1);
        } else {
            windowStart = lastMidnight;
            nextWindow = lastNoon;
        }

        const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim + 'Z') : null;
        if (lastClaim && lastClaim >= windowStart) {
            return res.status(400).json({ error: 'Too early' });
        }
        
        const reward = 250; 
        await DB.run('UPDATE users SET balance = balance + ?, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, telegramId]);
        
        // Return same status as GET
        res.json({ success: true, reward, canClaim: false, timeLeft: nextWindow - now });
    } catch (err) { res.status(500).json({ error: 'Daily claim error' }); }
});

// Admin Routes
app.get('/api/admin/users', async (req, res) => res.json({ users: await DB.all('SELECT * FROM users ORDER BY last_seen DESC') }));

app.get('/api/admin/purchases', async (req, res) => {
  const p = await DB.all('SELECT p.*, u.username, u.first_name, u.photo_url FROM purchases p LEFT JOIN users u ON p.telegram_id = u.telegram_id ORDER BY purchased_at DESC');
  res.json({ purchases: p });
});

app.post('/api/admin/user/balance', async (req, res) => {
    const { telegramId, amount, action } = req.body;
    const val = parseInt(amount);
    try {
        if (action === 'add') await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [val, telegramId]);
        else await DB.run('UPDATE users SET balance = MAX(0, balance - ?) WHERE telegram_id = ?', [val, telegramId]);
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, newBalance: user?.balance });
    } catch { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/settings/ads', async (req, res) => {
    const rows = await DB.all('SELECT * FROM settings');
    res.json({ settings: Object.fromEntries(rows.map(r => [r.key, r.value])) });
});

app.post('/api/admin/settings/ads', async (req, res) => {
    const s = req.body;
    const items = [
        ['ads_enabled', s.ads_enabled ? 'true' : 'false'],
        ['ads_client_id', s.ads_client_id || ''],
        ['ads_slot_id', s.ads_slot_id || ''],
        ['adsgram_block_id', s.adsgram_block_id || ''],
        ['rewarded_ad_provider', s.rewarded_ad_provider || 'adsgram']
    ];
    for (const [k, v] of items) await DB.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', [k, v]);
    res.json({ success: true });
});

app.listen(port, () => console.log(`SQLite Server on ${port}`));
