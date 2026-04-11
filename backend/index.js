import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DB } from './models.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // Limit each IP to 100 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 20, // 20 attempts
    message: { error: 'Too many login attempts.' }
});

const jwtSecret = process.env.JWT_SECRET || 'fallback_secret_donotuseinprod';

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
        const isValid = crypto.createHmac('sha256', memoizedSecretKey).update(dataCheckString).digest('hex') === hash;
        
        if (isValid) {
            // Check auth_date to prevent replay attacks (optional but good, e.g. within 24h)
            const authDate = parseInt(urlParams.get('auth_date') || '0');
            const now = Math.floor(Date.now() / 1000);
            if (now - authDate > 86400) return false;
        }
        
        return isValid;
    } catch { return false; }
};

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

const bot = token ? new TelegramBot(token, { polling: { interval: 300, autoStart: true, params: { timeout: 10 } } }) : null;
if (bot) {
    console.log('Bot initialized successfully');
    bot.on('message', (msg) => {
        console.log('Received message:', msg.text, 'from', msg.from?.username);
    });
    bot.onText(/\/start/, (msg) => {
        console.log('Start command received from:', msg.from?.username);
        bot.sendMessage(msg.chat.id, 'Welcome to YourTurn! 🎮', {
            reply_markup: { inline_keyboard: [[{ text: 'Open App', web_app: { url: process.env.WEB_APP_URL || '' } }]] }
        }).then(() => console.log('Start message sent')).catch(err => console.error('Error sending start message:', err));
    });
    bot.on('polling_error', (error) => {
        console.error('Polling error:', error.code, error.message);
    });
} else {
    console.warn('Bot token not provided, bot disabled');
}

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', botInitialized: !!bot, time: new Date() }));

// API Routes
app.post('/api/auth', authLimiter, async (req, res) => {
    const { initData, initDataUnsafe } = req.body;
    
    // STRICT BOT CHECK: In production, initData MUST be present and valid
    const isMock = !initData && process.env.NODE_ENV !== 'production';
    if (!isMock && (!initData || !verifyInitData(initData))) {
        console.warn('Bot attempt or invalid auth detected');
        return res.status(403).json({ error: 'Access denied: Valid Telegram authentication required' });
    }

    const tgUser = initDataUnsafe?.user || { id: 'mock_123', username: 'mock_user' };
    const tid = tgUser.id.toString();

    try {
        console.log('Authenticating user:', tid);
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
        
        // Fetch additional user data for bundling
        const purchases = await DB.all('SELECT * FROM purchases WHERE telegram_id = ? ORDER BY purchased_at DESC', [tid]);
        const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ? ORDER BY purchased_at DESC', [tid]);
        
        // Generate Token
        const token = jwt.sign({ id: user.telegram_id, username: user.username }, jwtSecret, { expiresIn: '7d' });
        
        res.json({ 
            user, 
            token,
            purchases: purchases || [],
            nfts: nfts || []
        });
    } catch (err) { console.error('Auth error:', err); res.status(500).json({ error: 'DB error' }); }
});

app.post('/api/watch-ad', requireAuth, limiter, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT last_ad_watch FROM users WHERE telegram_id = ?', [telegramId]);
        if (user?.last_ad_watch) {
            const lastWatchStr = typeof user.last_ad_watch === 'string' ? user.last_ad_watch : user.last_ad_watch.toISOString();
            const lastWatch = new Date(lastWatchStr + (lastWatchStr.endsWith('Z') ? '' : 'Z'));
            const diff = (new Date() - lastWatch) / 1000;
            if (diff < 30) return res.status(429).json({ error: 'Cooldown active', timeLeft: 30 - diff });
        }

        await DB.run(`
            UPDATE users 
            SET balance = balance + 35, 
                xp = xp + 50, 
                level = FLOOR((xp + 50) / 1000) + 1,
                last_ad_watch = CURRENT_TIMESTAMP,
                stock_multiplier = COALESCE(stock_multiplier, 1.0) + 0.015,
                last_stock_penalty = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
        `, [telegramId]);
        const updatedUser = await DB.get('SELECT balance, xp, level, last_ad_watch FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance, xp: updatedUser?.xp, level: updatedUser?.level, last_ad_watch: updatedUser?.last_ad_watch });
    } catch (err) { 
        console.error('Watch ad error:', err);
        res.status(500).json({ error: 'Error' }); 
    }
});

app.post('/api/surf-ad', requireAuth, limiter, async (req, res) => {
    const telegramId = req.user.id;
    try {
        // Cooldown mechanism for surf ad (5 seconds)
        const user = await DB.get('SELECT last_surf_watch FROM users WHERE telegram_id = ?', [telegramId]);
        if (user?.last_surf_watch) {
            const lastSurfStr = typeof user.last_surf_watch === 'string' ? user.last_surf_watch : user.last_surf_watch.toISOString();
            const lastWatch = new Date(lastSurfStr + (lastSurfStr.endsWith('Z') ? '' : 'Z'));
            const diff = (new Date() - lastWatch) / 1000;
            if (diff < 5) return res.status(429).json({ error: 'Cooldown active', timeLeft: 5 - diff });
        }

        await DB.run(`
            UPDATE users 
            SET balance = balance + 6, 
                xp = xp + 10, 
                level = FLOOR((xp + 10) / 1000) + 1,
                last_surf_watch = CURRENT_TIMESTAMP,
                last_ad_watch = CURRENT_TIMESTAMP,
                stock_multiplier = COALESCE(stock_multiplier, 1.0) + 0.005
            WHERE telegram_id = ?
        `, [telegramId]);
        const updatedUser = await DB.get('SELECT balance, xp, level, last_surf_watch FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance, xp: updatedUser?.xp, level: updatedUser?.level, last_surf_watch: updatedUser?.last_surf_watch });
    } catch (err) { 
        console.error('Surf ad error:', err);
        res.status(500).json({ error: 'Error' }); 
    }
});

app.get('/api/user/stocks', requireAuth, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT stock_multiplier, last_ad_watch, last_stock_penalty, registered_at FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        let multiplier = user.stock_multiplier || 1.0;
        
        // Base time on last ad watch or registration 
        const adTimeStr = user.last_ad_watch || user.registered_at;
        const lastAdWatch = adTimeStr ? new Date(typeof adTimeStr === 'string' ? adTimeStr + (adTimeStr.endsWith('Z') ? '' : 'Z') : adTimeStr.toISOString()) : null;
        
        if (lastAdWatch) {
            const now = new Date();
            const hoursSinceAd = (now.getTime() - lastAdWatch.getTime()) / (1000 * 60 * 60);
            
            if (hoursSinceAd >= 24 && multiplier > 1.0) {
                multiplier = 1.0;
                await DB.run(`UPDATE users SET stock_multiplier = 1.0 WHERE telegram_id = ?`, [telegramId]);
            }
        }
        
        res.json({ multiplier });
    } catch (err) { 
        console.error('Stocks error:', err);
        res.status(500).json({ error: 'Failed to fetch stocks' }); 
    }
});
app.post('/api/buy', requireAuth, async (req, res) => {
    const { itemName, price } = req.body;
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < price) return res.status(400).json({ error: 'No funds' });
        
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [price, telegramId]);
        await DB.run('INSERT INTO purchases (telegram_id, item_name, price) VALUES (?,?,?)', [telegramId, itemName, price]);
        
        const purchases = await DB.all('SELECT * FROM purchases WHERE telegram_id = ? ORDER BY purchased_at DESC', [telegramId]);
        res.json({ success: true, newBalance: user.balance - price, purchases });
    } catch { res.status(500).json({ error: 'Buy error' }); }
});

app.get('/api/top', requireAuth, async (req, res) => {
    try {
        const users = await DB.all('SELECT telegram_id, username, first_name, photo_url, balance, level FROM users ORDER BY balance DESC LIMIT 100');
        res.json({ users });
    } catch (err) { res.status(500).json({ error: 'Top query error' }); }
});

app.get('/api/bonuses/:id', requireAuth, async (req, res) => {
    try {
        const rows = await DB.all('SELECT bonus_id FROM bonuses_claimed WHERE telegram_id = ?', [req.params.id]);
        res.json({ claimed: rows.map(r => r.bonus_id) });
    } catch (err) { res.status(500).json({ error: 'Bonuses fetch error' }); }
});

app.post('/api/bonus/claim', requireAuth, async (req, res) => {
    const { bonusId, reward } = req.body;
    const telegramId = req.user.id;
    try {
        const existing = await DB.get('SELECT id FROM bonuses_claimed WHERE telegram_id = ? AND bonus_id = ?', [telegramId, bonusId]);
        if (existing) return res.status(400).json({ error: 'Already claimed' });
        
        await DB.run('INSERT INTO bonuses_claimed (telegram_id, bonus_id) VALUES (?, ?)', [telegramId, bonusId]);
        const xpBoost = 100; // Fixed XP for bonus
        await DB.run(`
            UPDATE users SET 
                balance = balance + ?, 
                xp = xp + ?, 
                level = FLOOR((xp + ?) / 1000) + 1 
            WHERE telegram_id = ?
        `, [reward, xpBoost, xpBoost, telegramId]);
        
        const updated = await DB.get('SELECT balance, xp, level FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, balance: updated.balance, xp: updated.xp, level: updated.level });
    } catch (err) { res.status(500).json({ error: 'Claim error' }); }
});

app.get('/api/bonus/daily-check/:id', requireAuth, async (req, res) => {
    const telegramId = req.params.id;
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaimVal = user.last_daily_claim; const lastClaimStr = lastClaimVal ? (typeof lastClaimVal === "string" ? lastClaimVal : lastClaimVal.toISOString()) : null; const lastClaim = lastClaimStr ? new Date(lastClaimStr + (lastClaimStr.endsWith('Z') ? '' : 'Z')) : null;
        let canClaim = true;
        
        if (lastClaim) {
            const diffHours = (now - lastClaim) / (1000 * 60 * 60);
            canClaim = diffHours >= 24;
        }
        
        res.json({ canClaim, currentStreak: user.daily_streak || 0 });
    } catch (err) { res.status(500).json({ error: 'Daily check error' }); }
});

app.post('/api/bonus/daily-claim', requireAuth, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaimVal = user.last_daily_claim; const lastClaimStr = lastClaimVal ? (typeof lastClaimVal === "string" ? lastClaimVal : lastClaimVal.toISOString()) : null; const lastClaim = lastClaimStr ? new Date(lastClaimStr + (lastClaimStr.endsWith('Z') ? '' : 'Z')) : null;
        
        if (lastClaim) {
            const diffHours = (now - lastClaim) / (1000 * 60 * 60);
            if (diffHours < 24) return res.status(400).json({ error: 'Too early' });
            
            // Increment streak if within 48h, else reset to 1
            const newStreak = diffHours < 48 ? (user.daily_streak || 0) + 1 : 1;
            const rewards = [5000, 10, 30, 50, 70, 100, 150];
            const reward = rewards[Math.min(newStreak - 1, rewards.length - 1)];
            
            await DB.run('UPDATE users SET balance = balance + ?, daily_streak = ?, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, newStreak, telegramId]);
            res.json({ success: true, reward, newStreak });
        } else {
            // First time claim
            const reward = 5000;
            await DB.run('UPDATE users SET balance = balance + ?, daily_streak = 1, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, telegramId]);
            res.json({ success: true, reward, newStreak: 1 });
        }
    } catch (err) { res.status(500).json({ error: 'Daily claim error' }); }
});

// Admin Routes
app.get('/api/admin/users', requireAuth, async (req, res) => {
    try {
        const users = await DB.all('SELECT * FROM users ORDER BY last_seen DESC');
        res.json({ users });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.get('/api/admin/purchases', requireAuth, async (req, res) => {
    try {
        const purchases = await DB.all(`
            SELECT p.*, u.username, u.first_name, u.photo_url 
            FROM purchases p 
            JOIN users u ON p.telegram_id = u.telegram_id 
            ORDER BY p.purchased_at DESC
        `);
        res.json({ purchases });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.post('/api/admin/user/balance', requireAuth, async (req, res) => {
    const { telegramId, amount, action } = req.body;
    try {
        const op = action === 'add' ? '+' : '-';
        await DB.run(`UPDATE users SET balance = balance ${op} ? WHERE telegram_id = ?`, [amount * 100, telegramId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.get('/api/settings/:key', async (req, res) => {
    try {
        const row = await DB.get('SELECT value FROM settings WHERE key = ?', [req.params.key]);
        res.json({ value: row?.value || null });
    } catch (err) { res.status(500).json({ error: 'Settings error' }); }
});

app.get('/api/settings/ads', async (req, res) => {
    try {
        const rows = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'ads_%' OR key = 'monetag_zone_id'");
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json({ settings });
    } catch (err) { res.status(500).json({ error: 'Settings error' }); }
});

app.post('/api/admin/settings/ads', requireAuth, async (req, res) => {
    const { ads_enabled, ads_client_id, ads_slot_id, monetag_zone_id } = req.body;
    try {
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_enabled', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_enabled.toString()]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_client_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_client_id]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_slot_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_slot_id]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('monetag_zone_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [monetag_zone_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin settings error' }); }
});

app.get('/api/nft/rates', async (req, res) => {
    try {
        const rows = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'brand%'");
        const rates = {};
        rows.forEach(r => rates[r.key] = parseFloat(r.value) || 0);
        res.json({ rates });
    } catch (err) { res.status(500).json({ error: 'Failed to fetch rates' }); }
});

app.post('/api/admin/nft/rates', requireAuth, async (req, res) => {
    const { rates } = req.body;
    try {
        for (const k of Object.keys(rates)) {
            await DB.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [k, rates[k].toString()]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.get('/api/admin/nft/stats', requireAuth, async (req, res) => {
    try {
        const stats = await DB.all(`
            SELECT u.telegram_id, u.username, u.first_name, un.nft_id, COUNT(*) as total_qty, MAX(un.purchased_at) as last_purchase
            FROM user_nfts un
            JOIN users u ON un.telegram_id = u.telegram_id
            GROUP BY u.telegram_id, un.nft_id
            ORDER BY last_purchase DESC
        `);
        res.json({ stats });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.get('/api/social-stats', async (req, res) => {
    try {
        const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%'");
        const stats = {
            tiktok: { current: 0, target: 10000, url: '' },
            instagram: { current: 0, target: 5000, url: '' },
            telegram: { current: 0, target: 3000, url: '' },
            facebook: { current: 0, target: 2000, url: '' },
            youtube: { current: 0, target: 10000, url: '' }
        };
        settings.forEach(s => {
            const parts = s.key.split('_'); // social_network_type
            if (parts.length === 3) {
                const network = parts[1];
                const type = parts[2];
                if (stats[network]) {
                    if (type === 'current' || type === 'target') {
                        stats[network][type] = parseInt(s.value) || 0;
                    } else if (type === 'url') {
                        stats[network][type] = s.value;
                    }
                }
            }
        });
        res.json({ stats });
    } catch (err) { res.status(500).json({ error: 'Stats error' }); }
});

const scrapeSocialStats = async () => {
    console.log('Starting social stats scraping...');
    const settings = await DB.all("SELECT key, value FROM settings WHERE key LIKE 'social_%_url'");
    const urls = {};
    settings.forEach(s => {
        const net = s.key.split('_')[1];
        urls[net] = s.value;
    });

    const headers = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' };

    // Scrape Telegram
    if (urls.telegram) {
        try {
            const res = await fetch(urls.telegram, { headers });
            const html = await res.text();
            const match = html.match(/<div class="tgme_page_extra">([\d\s,]+)\s+members<\/div>/) || html.match(/<div class="tgme_page_extra">([\d\s,]+)\s+subscriber/);
            if (match) {
                const count = parseInt(match[1].replace(/[\s,]/g, ''));
                await DB.run("INSERT INTO settings (key, value) VALUES ('social_telegram_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [count.toString()]);
            }
        } catch (e) { console.error('Telegram scrape error:', e.message); }
    }

    // Scrape YouTube
    if (urls.youtube) {
        try {
            const res = await fetch(urls.youtube, { headers });
            const html = await res.text();
            const match = html.match(/"subscriberCountText":\{"simpleText":"([\d.KMB]+)\s+subscriber/i);
            if (match) {
                let text = match[1].toUpperCase();
                let count = parseFloat(text);
                if (text.includes('K')) count *= 1000;
                else if (text.includes('M')) count *= 1000000;
                else if (text.includes('B')) count *= 1000000000;
                await DB.run("INSERT INTO settings (key, value) VALUES ('social_youtube_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [Math.round(count).toString()]);
            }
        } catch (e) { console.error('YouTube scrape error:', e.message); }
    }

    // Scrape TikTok
    if (urls.tiktok) {
        try {
            const res = await fetch(urls.tiktok, { headers });
            const html = await res.text();
            const match = html.match(/"followerCount":(\d+)/);
            if (match) {
                await DB.run("INSERT INTO settings (key, value) VALUES ('social_tiktok_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [match[1]]);
            }
        } catch (e) { console.error('TikTok scrape error:', e.message); }
    }
    
    // Instagram and Facebook are significantly harder without specialized scrapers/proxies
    // but we have placeholders for them.
    
    console.log('Social stats scraping completed.');
};

// Initial scrape and hourly schedule
setTimeout(scrapeSocialStats, 5000); 
setInterval(scrapeSocialStats, 60 * 60 * 1000);

app.post('/api/admin/social-stats', requireAuth, async (req, res) => {
    const { stats } = req.body;
    try {
        for (const net of Object.keys(stats)) {
            await DB.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [`social_${net}_current`, stats[net].current.toString()]);
            await DB.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [`social_${net}_target`, stats[net].target.toString()]);
        }
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Stats update error' }); }
});

app.post('/api/nft/buy', requireAuth, async (req, res) => {
    const { nftId, price } = req.body;
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < price) return res.status(400).json({ error: 'Insufficient funds' });
        
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [price, telegramId]);
        await DB.run('INSERT INTO user_nfts (telegram_id, nft_id, purchase_price) VALUES (?,?,?)', [telegramId, nftId, price]);
        
        const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, newBalance: user.balance - price, nfts });
    } catch { res.status(500).json({ error: 'Purchase error' }); }
});

app.post('/api/nft/sell', requireAuth, async (req, res) => {
    const { nftId, price } = req.body;
    const telegramId = req.user.id;
    try {
        const nft = await DB.get('SELECT id FROM user_nfts WHERE telegram_id = ? AND nft_id = ? ORDER BY purchased_at ASC LIMIT 1', [telegramId, nftId]);
        if (!nft) return res.status(400).json({ error: 'You do not own this share' });
        
        await DB.run('DELETE FROM user_nfts WHERE id = ?', [nft.id]);
        await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [price, telegramId]);
        
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, newBalance: user.balance, nfts });
    } catch { res.status(500).json({ error: 'Sell error' }); }
});

app.get('/api/nft/my/:telegramId', requireAuth, async (req, res) => {
    const requestedId = req.params.telegramId;
    // Security: and optionally check if requestedId === req.user.id
    try {
        const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [requestedId]);
        res.json({ nfts });
    } catch { res.status(500).json({ error: 'My NFTs error' }); }
});

app.listen(port, () => console.log(`PostgreSQL Server on ${port}`));
