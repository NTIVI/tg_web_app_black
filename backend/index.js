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
let tradeState = {
    currentPrice: 7000,
    history: [7000],
    manualTicks: [],
    nextTickTime: Date.now() + 300000
};

const tickTrade = () => {
    let changePercent;
    if (tradeState.manualTicks.length > 0) {
        changePercent = tradeState.manualTicks.shift();
    } else {
        const isUp = Math.random() > 0.5;
        changePercent = (Math.random() * 3 + 2) * (isUp ? 1 : -1);
    }
    
    tradeState.currentPrice = Math.round(tradeState.currentPrice * (1 + changePercent / 100));
    tradeState.history.push(tradeState.currentPrice);
    if (tradeState.history.length > 20) tradeState.history.shift();
    
    const nextIn = Math.floor(Math.random() * (300000 - 180000) + 180000); // 3-5 mins
    tradeState.nextTickTime = Date.now() + nextIn;
    setTimeout(tickTrade, nextIn);
};
setTimeout(tickTrade, 300000);

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
app.post('/api/auth', async (req, res) => {
    const { initData, initDataUnsafe } = req.body;
    if (initData && !verifyInitData(initData)) return res.status(401).json({ error: 'Invalid auth' });
    const tgUser = initDataUnsafe?.user || { id: 'mock_123' };
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
        console.log('User authenticated:', user?.username);
        res.json({ user });
    } catch (err) { console.error('Auth error:', err); res.status(500).json({ error: 'DB error' }); }
});

app.post('/api/watch-ad', async (req, res) => {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });
    try {
        const user = await DB.get('SELECT last_ad_watch FROM users WHERE telegram_id = ?', [telegramId]);
        if (user?.last_ad_watch) {
            const lastWatch = new Date(user.last_ad_watch + 'Z');
            const diff = (new Date() - lastWatch) / 1000;
            if (diff < 120) return res.status(429).json({ error: 'Cooldown active', timeLeft: 120 - diff });
        }

        await DB.run('UPDATE users SET balance = balance + 50, last_ad_watch = CURRENT_TIMESTAMP WHERE telegram_id = ?', [telegramId]);
        const updatedUser = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance });
    } catch (err) { 
        console.error('Watch ad error:', err);
        res.status(500).json({ error: 'Error' }); 
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

app.get('/api/bonus/daily-status/:telegramId', async (req, res) => {
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [req.params.telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim + (user.last_daily_claim.endsWith('Z') ? '' : 'Z')) : null;
        
        let canClaim = false;
        let currentStreak = user.daily_streak || 0;
        
        if (!lastClaim) {
            canClaim = true;
        } else {
            const diffMs = now - lastClaim;
            const diffHours = diffMs / (1000 * 60 * 60);
            
            if (diffHours >= 24) {
                canClaim = true;
                // If more than 48 hours passed, reset streak
                if (diffHours >= 48) {
                    currentStreak = 0;
                }
            }
        }
        
        const rewards = [10, 20, 50, 100, 150, 200, 500];
        const nextReward = rewards[Math.min(currentStreak, rewards.length - 1)];
        
        res.json({ canClaim, currentStreak, nextReward });
    } catch (err) { res.status(500).json({ error: 'Daily check error' }); }
});

app.post('/api/bonus/daily-claim', async (req, res) => {
    const { telegramId } = req.body;
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaim = user.last_daily_claim ? new Date(user.last_daily_claim + (user.last_daily_claim.endsWith('Z') ? '' : 'Z')) : null;
        
        if (lastClaim) {
            const diffHours = (now - lastClaim) / (1000 * 60 * 60);
            if (diffHours < 24) return res.status(400).json({ error: 'Too early' });
            
            // Increment streak if within 48h, else reset to 1
            const newStreak = diffHours < 48 ? (user.daily_streak || 0) + 1 : 1;
            const rewards = [10, 20, 50, 100, 150, 200, 500];
            const reward = rewards[Math.min(newStreak - 1, rewards.length - 1)];
            
            await DB.run('UPDATE users SET balance = balance + ?, daily_streak = ?, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, newStreak, telegramId]);
            res.json({ success: true, reward, newStreak });
        } else {
            // First time claim
            const reward = 10;
            await DB.run('UPDATE users SET balance = balance + ?, daily_streak = 1, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, telegramId]);
            res.json({ success: true, reward, newStreak: 1 });
        }
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
        ['monetag_zone_id', s.monetag_zone_id || '9609'],
        ['rewarded_ad_provider', s.rewarded_ad_provider || 'monetag']
    ];
    for (const [k, v] of items) await DB.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', [k, v]);
    res.json({ success: true });
});

// New Trade Routes
app.get('/api/trade/status', (req, res) => {
    res.json(tradeState);
});

app.post('/api/trade/bet', async (req, res) => {
    const { telegramId, amount, direction, duration } = req.body;
    const startPrice = tradeState.currentPrice;
    
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < amount) return res.status(400).json({ error: 'No funds' });

        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [amount, telegramId]);
        
        setTimeout(async () => {
            const endPrice = tradeState.currentPrice;
            const won = (direction === 'up' && endPrice > startPrice) || (direction === 'down' && endPrice < startPrice);
            let resultMessage = won ? 'WIN' : (endPrice === startPrice ? 'DRAW' : 'LOSS');
            let payout = 0;

            if (won) {
                const multiplier = Math.random() * (2.3 - 1.9) + 1.9;
                payout = Math.round(amount * multiplier);
                await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [payout, telegramId]);
            } else if (endPrice === startPrice) {
                payout = amount;
                await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [payout, telegramId]);
            }
            
            // Bot notification removed per user request for privacy
        }, duration * 1000);

        res.json({ success: true, startPrice });
    } catch (err) { res.status(500).json({ error: 'Bet error' }); }
});

app.get('/api/trade/admin/status', (req, res) => {
    res.json(tradeState);
});

app.post('/api/trade/admin/override', (req, res) => {
    const { ticks } = req.body; // e.g. "+3 -2 +5"
    if (typeof ticks === 'string') {
        const parsed = ticks.split(/\s+/).map(v => parseFloat(v)).filter(v => !isNaN(v));
        tradeState.manualTicks = parsed;
    }
    res.json({ success: true, manualTicks: tradeState.manualTicks });
});

app.listen(port, () => console.log(`SQLite Server on ${port}`));
