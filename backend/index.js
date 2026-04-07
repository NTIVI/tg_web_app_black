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
            if (diff < 30) return res.status(429).json({ error: 'Cooldown active', timeLeft: 30 - diff });
        }

        await DB.run('UPDATE users SET balance = balance + 50, xp = xp + 50, last_ad_watch = CURRENT_TIMESTAMP WHERE telegram_id = ?', [telegramId]);
        const updatedUser = await DB.get('SELECT balance, xp FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance });
    } catch (err) { 
        console.error('Watch ad error:', err);
        res.status(500).json({ error: 'Error' }); 
    }
});

app.post('/api/surf-ad', async (req, res) => {
    const { telegramId } = req.body;
    if (!telegramId) return res.status(400).json({ error: 'Missing telegramId' });
    try {
        // Cooldown mechanism for surf ad (5 seconds)
        const user = await DB.get('SELECT last_surf_watch FROM users WHERE telegram_id = ?', [telegramId]);
        if (user?.last_surf_watch) {
            const lastWatch = new Date(user.last_surf_watch + 'Z');
            const diff = (new Date() - lastWatch) / 1000;
            if (diff < 5) return res.status(429).json({ error: 'Cooldown active', timeLeft: 5 - diff });
        }

        await DB.run('UPDATE users SET balance = balance + 10, xp = xp + 10, last_surf_watch = CURRENT_TIMESTAMP WHERE telegram_id = ?', [telegramId]);
        const updatedUser = await DB.get('SELECT balance, xp FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance });
    } catch (err) { 
        console.error('Surf ad error:', err);
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
        
        const rewards = [5000, 10, 30, 50, 70, 100, 150];
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

app.post('/api/admin/nft/rates', async (req, res) => {
    const { rates } = req.body;
    try {
        await DB.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', ['nft_rates', JSON.stringify(rates)]);
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Rates error' }); }
});

app.get('/api/admin/nft/status', async (req, res) => {
    try {
        const row = await DB.get('SELECT value FROM settings WHERE key = ?', ['nft_rates']);
        let rates = {};
        if (row && row.value) {
            try { rates = JSON.parse(row.value); } catch(e){}
        }
        res.json({ rates });
    } catch { res.status(500).json({ error: 'Status error' }); }
});

app.get('/api/social-stats', async (req, res) => {
    try {
        const row = await DB.get('SELECT value FROM settings WHERE key = ?', ['social_stats']);
        let stats = {
            tiktok: { current: 8450, target: 10000 },
            instagram: { current: 4200, target: 5000 },
            telegram: { current: 2310, target: 3000 },
            facebook: { current: 1540, target: 2000 }
        };
        if (row && row.value) {
            try { stats = { ...stats, ...JSON.parse(row.value) }; } catch(e){}
        }
        res.json({ stats });
    } catch { res.status(500).json({ error: 'Stats error' }); }
});

app.post('/api/admin/social-stats', async (req, res) => {
    const { stats } = req.body;
    try {
        await DB.run('INSERT OR REPLACE INTO settings (key, value) VALUES (?,?)', ['social_stats', JSON.stringify(stats)]);
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Stats update error' }); }
});

app.post('/api/nft/buy', async (req, res) => {
    const { telegramId, nftId, name, price } = req.body;
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < price) return res.status(400).json({ error: 'Insufficient funds' });
        
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [price, telegramId]);
        // await DB.run('INSERT INTO purchases (telegram_id, item_name, price) VALUES (?,?,?)', [telegramId, name, price]); // Removed so it doesn't show in Shop purchases
        await DB.run('INSERT INTO user_nfts (telegram_id, nft_id, purchase_price) VALUES (?,?,?)', [telegramId, nftId, price]);
        res.json({ success: true, newBalance: user.balance - price });
    } catch { res.status(500).json({ error: 'Purchase error' }); }
});

app.post('/api/nft/sell', async (req, res) => {
    const { telegramId, nftId, price } = req.body;
    try {
        const nft = await DB.get('SELECT id FROM user_nfts WHERE telegram_id = ? AND nft_id = ? ORDER BY purchased_at ASC LIMIT 1', [telegramId, nftId]);
        if (!nft) return res.status(400).json({ error: 'You do not own this share' });
        
        await DB.run('DELETE FROM user_nfts WHERE id = ?', [nft.id]);
        await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [price, telegramId]);
        
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, newBalance: user.balance });
    } catch { res.status(500).json({ error: 'Sell error' }); }
});

app.get('/api/nft/my/:telegramId', async (req, res) => {
    try {
        const nfts = await DB.all('SELECT * FROM user_nfts WHERE telegram_id = ?', [req.params.telegramId]);
        res.json({ nfts });
    } catch { res.status(500).json({ error: 'My NFTs error' }); }
});

app.get('/api/admin/nft/stats', async (req, res) => {
    try {
        const stats = await DB.all(`
            SELECT 
                u.username, u.first_name,
                n.nft_id,
                SUM(n.quantity) as total_qty,
                MAX(n.purchased_at) as last_purchase
            FROM user_nfts n
            LEFT JOIN users u ON n.telegram_id = u.telegram_id
            GROUP BY n.telegram_id, n.nft_id
            ORDER BY last_purchase DESC
        `);
        res.json({ stats });
    } catch { res.status(500).json({ error: 'Stats error' }); }
});

app.listen(port, () => console.log(`SQLite Server on ${port}`));
