import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DB, initDB } from './database.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;
const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';

// Middleware
app.use(cors());
app.use(express.json());
app.use(helmet({ contentSecurityPolicy: false }));
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 1000 });
const authLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 200 });

// Auth Helpers
let memoizedKey = null;
const verifyTG = (data) => {
    if (!token || !data) return process.env.NODE_ENV !== 'production';
    try {
        const params = new URLSearchParams(data);
        const hash = params.get('hash');
        params.delete('hash');
        params.sort();
        const checkString = Array.from(params.entries()).map(([k, v]) => `${k}=${v}`).join('\n');
        if (!memoizedKey) memoizedKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
        return crypto.createHmac('sha256', memoizedKey).update(checkString).digest('hex') === hash;
    } catch { return false; }
};

const requireAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    try {
        req.user = jwt.verify(token, jwtSecret);
        next();
    } catch { res.status(401).json({ error: 'Auth failed' }); }
};

// Bot
const bot = token ? new TelegramBot(token, { polling: true }) : null;
if (bot) {
    bot.onText(/\/start/, (msg) => {
        bot.sendMessage(msg.chat.id, 'Welcome to YourTurn! 🎮', {
            reply_markup: { inline_keyboard: [[{ text: 'Open App', web_app: { url: process.env.WEB_APP_URL || '' } }]] }
        });
    });
}

// Routes
app.get('/api/health', (req, res) => res.json({ status: 'ok', bot: !!bot }));

app.post('/api/auth', authLimiter, async (req, res) => {
    const { initData, initDataUnsafe } = req.body;
    if (!verifyTG(initData)) return res.status(403).json({ error: 'Auth failed' });

    const tgUser = initDataUnsafe?.user || { id: 'mock', username: 'user' };
    const tid = tgUser.id.toString();

    const user = await DB.run(`
        INSERT INTO users (telegram_id, username, first_name, last_name, photo_url)
        VALUES (?, ?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET 
        username=excluded.username, last_seen=CURRENT_TIMESTAMP RETURNING *
    `, [tid, tgUser.username, tgUser.first_name, tgUser.last_name, tgUser.photo_url]);

    const activeUser = await DB.get('SELECT * FROM users WHERE telegram_id = ?', [tid]);
    const purchases = await DB.all('SELECT * FROM purchases WHERE telegram_id = ? ORDER BY purchased_at DESC', [tid]);
    const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [tid]);
    
    res.json({ user: activeUser, nfts, purchases, token: jwt.sign({ id: tid, username: tgUser.username }, jwtSecret, { expiresIn: '7d' }) });
});

// Ads & Economy
app.post('/api/:type-ad', requireAuth, limiter, async (req, res) => {
    const { type } = req.params; // watch or surf
    const reward = type === 'watch' ? 35 : 6;
    const xp = type === 'watch' ? 50 : 10;
    const mult = type === 'watch' ? 0.015 : 0.005;
    const col = type === 'watch' ? 'last_ad_watch' : 'last_surf_watch';

    const user = await DB.get(`SELECT ${col} FROM users WHERE telegram_id = ?`, [req.user.id]);
    if (user?.[col]) {
        const diff = (new Date() - new Date(user[col])) / 1000;
        const cooldown = type === 'watch' ? 30 : 5;
        if (diff < cooldown) return res.status(429).json({ error: 'Cooldown', wait: cooldown - diff });
    }

    await DB.run(`
        UPDATE users SET balance = balance + ?, xp = xp + ?, level = FLOOR((xp + ?) / 1000) + 1,
        ${col} = CURRENT_TIMESTAMP, last_ad_watch = CURRENT_TIMESTAMP,
        stock_multiplier = COALESCE(stock_multiplier, 1.0) + ? WHERE telegram_id = ?
    `, [reward, xp, xp, mult, req.user.id]);

    res.json({ success: true, ...(await DB.get('SELECT balance, xp, level FROM users WHERE telegram_id = ?', [req.user.id])) });
});

app.get('/api/user/stocks', requireAuth, async (req, res) => {
    const user = await DB.get('SELECT stock_multiplier, last_ad_watch, registered_at FROM users WHERE telegram_id = ?', [req.user.id]);
    let m = user?.stock_multiplier || 1.0;
    const last = user?.last_ad_watch || user?.registered_at;
    if (last && (new Date() - new Date(last)) / (1000 * 3600) >= 24) {
        m = 1.0;
        await DB.run('UPDATE users SET stock_multiplier = 1.0 WHERE telegram_id = ?', [req.user.id]);
    }
    res.json({ multiplier: m });
});

// Generic Data
app.get('/api/:category', async (req, res) => {
    const table = { banners: 'news_banners', posts: 'news_posts', top: 'users' }[req.params.category];
    if (!table) return res.status(404).end();
    const order = req.params.category === 'top' ? 'balance DESC LIMIT 100' : 'created_at DESC';
    res.json({ [req.params.category]: await DB.all(`SELECT * FROM ${table} ORDER BY ${order}`) });
});

// Bonuses & Daily
app.get('/api/bonus/daily-check/:id', requireAuth, async (req, res) => {
    const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [req.user.id]);
    const diff = (new Date() - (user?.last_daily_claim ? new Date(user.last_daily_claim) : 0)) / (1000 * 3600);
    const rewards = [10, 20, 50, 100, 150, 200, 500];
    res.json({ 
        canClaim: diff >= 24, 
        streak: user?.daily_streak || 0, 
        next: rewards[Math.min(diff < 48 ? (user?.daily_streak || 0) : 0, rewards.length - 1)] 
    });
});

app.post('/api/bonus/daily-claim', requireAuth, async (req, res) => {
    const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [req.user.id]);
    const diff = (new Date() - (user?.last_daily_claim ? new Date(user.last_daily_claim) : 0)) / (1000 * 3600);
    if (diff < 24) return res.status(400).json({ error: 'Too early' });
    const streak = diff < 48 ? (user?.daily_streak || 0) + 1 : 1;
    const reward = [10, 20, 50, 100, 150, 200, 500][Math.min(streak - 1, 6)];
    await DB.run('UPDATE users SET balance = balance + ?, daily_streak = ?, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, streak, req.user.id]);
    res.json({ success: true, reward, streak });
});

// Admin
app.post('/api/admin/auth', (req, res) => {
    if (req.body.password === 'NTIVI') return res.json({ token: jwt.sign({ id: 'admin', role: 'admin' }, jwtSecret, { expiresIn: '24h' }) });
    res.status(401).json({ error: 'Wrong password' });
});

app.get('/api/admin/:resource', requireAuth, async (req, res) => {
    const map = { users: 'users ORDER BY last_seen DESC', purchases: 'purchases p JOIN users u ON p.telegram_id = u.telegram_id ORDER BY purchased_at DESC' };
    if (!map[req.params.resource]) return res.status(404).end();
    res.json({ [req.params.category]: await DB.all(`SELECT * FROM ${map[req.params.resource]}`) });
});

// Social Scraper
const scrape = async () => {
    const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%_url'");
    for (const s of settings) {
        try {
            const net = s.key.split('_')[1];
            const html = await (await fetch(s.value, { headers: { 'User-Agent': 'Mozilla/5.0' } })).text();
            let count = 0;
            if (net === 'telegram') {
                const m = html.match(/tgme_page_extra">([\d\s,]+)/);
                if (m) count = parseInt(m[1].replace(/[\s,]/g, ''));
            } else if (net === 'youtube') {
                const m = html.match(/"subscriberCountText":\{"simpleText":"([\d.KMB]+)/);
                if (m) {
                    count = parseFloat(m[1]);
                    if (m[1].includes('K')) count *= 1000;
                    if (m[1].includes('M')) count *= 1000000;
                }
            }
            if (count) await DB.run(`INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`, [`social_${net}_current`, count.toString()]);
        } catch {}
    }
};
setInterval(scrape, 3600000);
setTimeout(scrape, 5000);

// Basic Actions
app.post('/api/nft/:action', requireAuth, async (req, res) => {
    const { action } = req.params;
    const { nftId, price } = req.body;
    if (action === 'buy') {
        const u = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [req.user.id]);
        if (u.balance < price) return res.status(400).json({ error: 'No funds' });
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [price, req.user.id]);
        await DB.run('INSERT INTO user_nfts (telegram_id, nft_id, purchase_price) VALUES (?,?,?)', [req.user.id, nftId, price]);
    } else {
        const item = await DB.get('SELECT id FROM user_nfts WHERE telegram_id = ? AND nft_id = ? LIMIT 1', [req.user.id, nftId]);
        if (!item) return res.status(400).json({ error: 'Not owned' });
        await DB.run('DELETE FROM user_nfts WHERE id = ?', [item.id]);
        await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [price, req.user.id]);
    }
    res.json({ success: true, balance: (await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [req.user.id])).balance, nfts: await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [req.user.id]) });
});

initDB().then(() => app.listen(port, () => console.log(`Server running on ${port}`)));
