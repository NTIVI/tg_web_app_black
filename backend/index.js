import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { DB } from './models.js';
import fetch from 'node-fetch';
import * as GamesLogic from './games.js';

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
    limit: 1000, // Limit each IP to 1000 requests per window
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 200, // 200 attempts
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

const requireAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
    
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, jwtSecret);
        if (!decoded.isAdmin && decoded.id !== 'admin') return res.status(403).json({ error: 'Access denied: Admin only' });
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
        const quests = await DB.all('SELECT q.*, uq.current_value, uq.is_completed, uq.claimed_at FROM quests q LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.telegram_id = ?', [tid]);
        
        // Update streak if missed a day
        if (user.last_daily_claim) {
            const now = new Date();
            const lastClaim = new Date(user.last_daily_claim + (user.last_daily_claim.toString().endsWith('Z') ? '' : 'Z'));
            const diffHours = (now - lastClaim) / (1000 * 60 * 60);
            if (diffHours >= 48) {
                await DB.run('UPDATE users SET daily_streak = 0 WHERE telegram_id = ?', [tid]);
            }
        }

        // Generate Token
        const token = jwt.sign({ id: user.telegram_id, username: user.username }, jwtSecret, { expiresIn: '7d' });
        
        res.json({ 
            user, 
            token,
            purchases: purchases || [],
            quests: quests || []
        });
    } catch (err) { console.error('Auth error:', err); res.status(500).json({ error: 'DB error' }); }
});

// QUEST HELPERS
const updateQuestProgress = async (telegramId, category, increment = 1) => {
    try {
        const activeQuests = await DB.all('SELECT id, target_value FROM quests WHERE category = ?', [category]);
        for (const quest of activeQuests) {
            await DB.run(`
                INSERT INTO user_quests (telegram_id, quest_id, current_value, is_completed)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(telegram_id, quest_id) DO UPDATE SET
                    current_value = LEAST(user_quests.current_value + ?, quests.target_value),
                    is_completed = CASE WHEN user_quests.current_value + ? >= quests.target_value THEN TRUE ELSE user_quests.is_completed END,
                    updated_at = CURRENT_TIMESTAMP
            `, [telegramId, quest.id, increment, increment >= quest.target_value, increment, increment]);
        }
    } catch (err) { console.error('Quest update error:', err); }
};

// NEWS ROUTES
app.get('/api/news/banners', async (req, res) => {
    try {
        const banners = await DB.all('SELECT * FROM news_banners ORDER BY created_at DESC');
        res.json({ banners });
    } catch (err) { 
        console.error('Banners fetch error:', err);
        res.status(500).json({ error: 'DB error' }); 
    }
});
app.get('/api/news/posts', async (req, res) => {
    try {
        const posts = await DB.all('SELECT * FROM news_posts ORDER BY created_at DESC');
        res.json({ posts });
    } catch (err) { 
        console.error('Posts fetch error:', err);
        res.status(500).json({ error: 'DB error' }); 
    }
});
app.post('/api/admin/news/banners', requireAdmin, async (req, res) => {
    const { imageUrl, linkUrl } = req.body;
    try {
        await DB.run('INSERT INTO news_banners (image_url, link_url) VALUES (?, ?)', [imageUrl, linkUrl || '']);
        const banners = await DB.all('SELECT * FROM news_banners ORDER BY created_at DESC');
        res.json({ success: true, banners });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});
app.delete('/api/admin/news/banners/:id', requireAdmin, async (req, res) => {
    try {
        await DB.run('DELETE FROM news_banners WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});
app.post('/api/admin/news/posts', requireAdmin, async (req, res) => {
    const { title, content, imageUrl } = req.body;
    try {
        await DB.run('INSERT INTO news_posts (title, content, image_url) VALUES (?, ?, ?)', [title, content || '', imageUrl || '']);
        const posts = await DB.all('SELECT * FROM news_posts ORDER BY created_at DESC');
        res.json({ success: true, posts });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});
app.delete('/api/admin/news/posts/:id', requireAdmin, async (req, res) => {
    try {
        await DB.run('DELETE FROM news_posts WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

// SHOP ROUTES
app.get('/api/shop/items', async (req, res) => {
    try {
        const items = await DB.all('SELECT * FROM shop_items ORDER BY category ASC, created_at DESC');
        res.json({ items });
    } catch (err) { res.status(500).json({ error: 'DB error' }); }
});

app.post('/api/admin/shop/items', requireAdmin, async (req, res) => {
    const { id, category, name, price, imageUrl } = req.body;
    try {
        if (id) {
            await DB.run('UPDATE shop_items SET category=?, name=?, price=?, image_url=? WHERE id=?', [category, name, price, imageUrl, id]);
        } else {
            await DB.run('INSERT INTO shop_items (category, name, price, image_url) VALUES (?, ?, ?, ?)', [category, name, price, imageUrl]);
        }
        const items = await DB.all('SELECT * FROM shop_items ORDER BY category ASC, created_at DESC');
        res.json({ success: true, items });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.delete('/api/admin/shop/items/:id', requireAdmin, async (req, res) => {
    try {
        await DB.run('DELETE FROM shop_items WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
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
                last_ad_watch = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
        `, [telegramId]);

        await updateQuestProgress(telegramId, 'ads', 1);

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
                last_ad_watch = CURRENT_TIMESTAMP
            WHERE telegram_id = ?
        `, [telegramId]);

        await updateQuestProgress(telegramId, 'ads', 1);

        const updatedUser = await DB.get('SELECT balance, xp, level, last_surf_watch FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: !!updatedUser, newBalance: updatedUser?.balance, xp: updatedUser?.xp, level: updatedUser?.level, last_surf_watch: updatedUser?.last_surf_watch });
    } catch (err) { 
        console.error('Surf ad error:', err);
        res.status(500).json({ error: 'Error' }); 
    }
});

// QUEST ROUTES
app.get('/api/quests', requireAuth, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const quests = await DB.all(`
            SELECT q.*, uq.current_value, uq.is_completed, uq.claimed_at 
            FROM quests q 
            LEFT JOIN user_quests uq ON q.id = uq.quest_id AND uq.telegram_id = ?
        `, [telegramId]);
        res.json({ quests });
    } catch (err) { res.status(500).json({ error: 'Fetch quests error' }); }
});

app.post('/api/quests/claim', requireAuth, async (req, res) => {
    const { questId } = req.body;
    const telegramId = req.user.id;
    try {
        const userQuest = await DB.get('SELECT * FROM user_quests WHERE telegram_id = ? AND quest_id = ?', [telegramId, questId]);
        if (!userQuest || !userQuest.is_completed) return res.status(400).json({ error: 'Quest not completed' });
        if (userQuest.claimed_at) return res.status(400).json({ error: 'Rewards already claimed' });

        const quest = await DB.get('SELECT reward FROM quests WHERE id = ?', [questId]);
        
        await DB.run('UPDATE user_quests SET claimed_at = CURRENT_TIMESTAMP WHERE telegram_id = ? AND quest_id = ?', [telegramId, questId]);
        await DB.run('UPDATE users SET balance = balance + ? WHERE telegram_id = ?', [quest.reward, telegramId]);
        
        const updated = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, balance: updated.balance });
    } catch (err) { res.status(500).json({ error: 'Claim error' }); }
});

// GAME ROUTES
app.post('/api/games/play', requireAuth, async (req, res) => {
    const { game, bet, data } = req.body; // data contains game-specific info (e.g., chosen spots)
    const telegramId = req.user.id;
    
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (user.balance < bet) return res.status(400).json({ error: 'Insufficient funds' });

        let winAmount = 0;
        let multiplier = 0;
        let resultData = {};

        // Server-side RNG logic for each game
        if (game === 'slots') {
            const reels = [
                Math.floor(Math.random() * 7),
                Math.floor(Math.random() * 7),
                Math.floor(Math.random() * 7)
            ];
            resultData = { reels };
            if (reels[0] === reels[1] && reels[1] === reels[2]) {
                multiplier = reels[0] === 0 ? 50 : 10; // Jackpot or standard
            } else if (reels[0] === reels[1] || reels[1] === reels[2] || reels[0] === reels[2]) {
                multiplier = 2;
            }
        } else if (game === 'dice') {
            const roll = Math.floor(Math.random() * 100) + 1;
            const isOver = data.target === 'over';
            const value = data.value;
            const won = isOver ? roll > value : roll < value;
            resultData = { roll };
            if (won) {
                const probability = isOver ? (100 - value) / 100 : value / 100;
                multiplier = 0.95 / probability; // House edge included
            }
        } else if (game === 'coinflip') {
            const roll = Math.random() > 0.5 ? 'heads' : 'tails';
            resultData = { roll };
            if (roll === data.guess) multiplier = 2;
        } else if (game === 'mines') {
            // Mines logic is multi-step, but here we can handle the final reveal if the user cashes out
            if (data.action === 'cashout') {
                multiplier = data.multiplier;
            } else {
                // Return immediate result if they hit a mine
                const isMine = Math.random() < (data.mineCount / 25);
                if (isMine) multiplier = 0;
                else multiplier = 1; // placeholder for progress
            }
        } else if (game === 'roulette') {
            const roll = Math.floor(Math.random() * 37);
            resultData = { roll };
            const betType = data.type; // 'number', 'color', 'evenodd'
            if (betType === 'number' && roll === data.value) multiplier = 36;
            else if (betType === 'color' && ((data.value === 'red' && [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36].includes(roll)) || (data.value === 'black' && [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35].includes(roll)))) multiplier = 2;
            else if (betType === 'evenodd' && ((data.value === 'even' && roll !== 0 && roll % 2 === 0) || (data.value === 'odd' && roll % 2 !== 0))) multiplier = 2;
        } else if (game === 'crash') {
            // Server determines crash point
            const crashPoint = Math.max(1, (0.99 / (1 - Math.random())).toFixed(2));
            resultData = { crashPoint };
            if (data.cashout <= crashPoint) multiplier = data.cashout;
            else multiplier = 0;
        } else if (game === 'plinko') {
            const outcomes = [0.2, 0.5, 1, 1.5, 2, 5, 10]; // Example buckets
            multiplier = outcomes[Math.floor(Math.random() * outcomes.length)];
        } else if (game === 'blackjack') {
            const playerVal = Math.floor(Math.random() * 10) + 12; // Simple mock
            const dealerVal = Math.floor(Math.random() * 10) + 15;
            if (playerVal > 21) multiplier = 0;
            else if (dealerVal > 21 || playerVal > dealerVal) multiplier = 2;
            else if (playerVal === dealerVal) multiplier = 1;
            resultData = { playerVal, dealerVal };
        } else if (game === 'hilo') {
            const won = Math.random() > 0.6; // High difficulty
            if (won) multiplier = 1.8;
        } else if (game === 'wheel') {
            const multiArr = [0, 0.5, 1, 1.5, 2, 5, 0, 10];
            multiplier = multiArr[Math.floor(Math.random() * multiArr.length)];
        }

        winAmount = Math.floor(bet * multiplier);
        const profit = winAmount - bet;

        await DB.run('UPDATE users SET balance = balance + ?, total_bets_count = total_bets_count + 1, total_bets_sum = total_bets_sum + ?, total_wins_sum = total_wins_sum + ? WHERE telegram_id = ?', [profit, bet, winAmount, telegramId]);
        await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)', [telegramId, game, bet, winAmount, multiplier, JSON.stringify(resultData)]);
        
        // Update Quests
        await updateQuestProgress(telegramId, 'games', 1);
        if (winAmount > 0) await updateQuestProgress(telegramId, 'win', 1);
        if (bet >= 1000) await updateQuestProgress(telegramId, 'bet1000', 1);

        const updatedUser = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ success: true, balance: updatedUser.balance, winAmount, multiplier, resultData });

    } catch (err) { console.error('Play error:', err); res.status(500).json({ error: 'Game error' }); }
});
app.post('/api/buy', requireAuth, async (req, res) => {
    const { itemName, price } = req.body;
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const currentBalance = Number(user.balance);
        const itemPrice = Number(price);
        
        if (isNaN(currentBalance) || isNaN(itemPrice)) {
            return res.status(500).json({ error: 'Invalid balance or price format' });
        }

        if (currentBalance < itemPrice) {
            console.log(`Purchase failed: User ${telegramId} has ${currentBalance}, needs ${itemPrice}`);
            return res.status(400).json({ error: 'Недостаточно средств на балансе' });
        }
        
        await DB.run('UPDATE users SET balance = balance - ? WHERE telegram_id = ?', [itemPrice, telegramId]);
        await DB.run('INSERT INTO purchases (telegram_id, item_name, price) VALUES (?,?,?)', [telegramId, itemName, itemPrice]);
        
        await updateQuestProgress(telegramId, 'shop', itemPrice);

        const purchases = await DB.all('SELECT * FROM purchases WHERE telegram_id = ? ORDER BY purchased_at DESC', [telegramId]);
        res.json({ success: true, newBalance: currentBalance - itemPrice, purchases });
    } catch (err) { 
        console.error('Buy error:', err);
        res.status(500).json({ error: 'Ошибка при обработке покупки' }); 
    }
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

const DAILY_REWARDS = [10, 20, 50, 100, 150, 200, 500];

app.get('/api/bonus/daily-check/:id', requireAuth, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaimVal = user.last_daily_claim; 
        const lastClaimStr = lastClaimVal ? (typeof lastClaimVal === "string" ? lastClaimVal : lastClaimVal.toISOString()) : null; 
        const lastClaim = lastClaimStr ? new Date(lastClaimStr + (lastClaimStr.endsWith('Z') ? '' : 'Z')) : null;
        
        let canClaim = true;
        let diffHours = 48; // default to reset if no last claim
        
        if (lastClaim) {
            diffHours = (now - lastClaim) / (1000 * 60 * 60);
            canClaim = diffHours >= 24;
        }
        
        const nextStreak = diffHours < 48 ? (user.daily_streak || 0) + 1 : 1;
        const nextReward = DAILY_REWARDS[Math.min(nextStreak - 1, DAILY_REWARDS.length - 1)];
        
        res.json({ canClaim, currentStreak: user.daily_streak || 0, nextReward });
    } catch (err) { res.status(500).json({ error: 'Daily check error' }); }
});

app.post('/api/bonus/daily-claim', requireAuth, async (req, res) => {
    const telegramId = req.user.id;
    try {
        const user = await DB.get('SELECT last_daily_claim, daily_streak FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        const now = new Date();
        const lastClaimVal = user.last_daily_claim; 
        const lastClaimStr = lastClaimVal ? (typeof lastClaimVal === "string" ? lastClaimVal : lastClaimVal.toISOString()) : null; 
        const lastClaim = lastClaimStr ? new Date(lastClaimStr + (lastClaimStr.endsWith('Z') ? '' : 'Z')) : null;
        
        let diffHours = 48;
        if (lastClaim) {
            diffHours = (now - lastClaim) / (1000 * 60 * 60);
            if (diffHours < 24) return res.status(400).json({ error: 'Too early' });
        }
        
        const newStreak = diffHours < 48 ? (user.daily_streak || 0) + 1 : 1;
        const reward = DAILY_REWARDS[Math.min(newStreak - 1, DAILY_REWARDS.length - 1)];
        
        await DB.run('UPDATE users SET balance = balance + ?, daily_streak = ?, last_daily_claim = CURRENT_TIMESTAMP WHERE telegram_id = ?', [reward, newStreak, telegramId]);
        res.json({ success: true, reward, newStreak });
    } catch (err) { res.status(500).json({ error: 'Daily claim error' }); }
});

// --- Games API ---
app.post('/api/games/play', requireAuth, async (req, res) => {
    const { game, bet, betOn, risk } = req.body;
    const telegramId = req.user.id;

    try {
        const user = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
        if (!user || user.balance < bet) return res.status(400).json({ error: 'Недостаточно баланса' });

        let result;
        if (game === 'slots') result = GamesLogic.handleSlots(bet);
        else if (game === 'roulette') result = GamesLogic.handleRoulette(bet, betOn);
        else if (game === 'dice') result = GamesLogic.handleDice(bet, req.body.target, req.body.type);
        else if (game === 'coinflip') result = GamesLogic.handleCoinFlip(bet, betOn);
        else if (game === 'plinko') result = GamesLogic.handlePlinko(bet, risk);
        else if (game === 'wheel') result = GamesLogic.handleWheelSpin(bet);
        else if (game === 'crash') {
            const state = GamesLogic.handleCrashStart(bet);
            await DB.run('INSERT INTO active_games (telegram_id, game_name, bet_amount, state) VALUES (?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET game_name=excluded.game_name, bet_amount=excluded.bet_amount, state=excluded.state', 
                [telegramId, 'crash', bet, JSON.stringify(state)]);
            await DB.run('UPDATE users SET balance = balance - ?, total_bets_count = total_bets_count + 1, total_bets_sum = total_bets_sum + ? WHERE telegram_id = ?', [bet, bet, telegramId]);
            return res.json({ success: true, status: 'playing', startTime: state.startTime });
        }
        else if (game === 'hilo') {
            const state = GamesLogic.handleHiLoStart(bet);
            await DB.run('INSERT INTO active_games (telegram_id, game_name, bet_amount, state) VALUES (?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET game_name=excluded.game_name, bet_amount=excluded.bet_amount, state=excluded.state', 
                [telegramId, 'hilo', bet, JSON.stringify(state)]);
            await DB.run('UPDATE users SET balance = balance - ?, total_bets_count = total_bets_count + 1, total_bets_sum = total_bets_sum + ? WHERE telegram_id = ?', [bet, bet, telegramId]);
            return res.json({ success: true, status: 'playing', currentCard: state.currentCard });
        }
        else if (game === 'mines') {
            const mineCount = req.body.mineCount || 3;
            const state = GamesLogic.handleMinesStart(bet, mineCount);
            await DB.run('INSERT INTO active_games (telegram_id, game_name, bet_amount, state) VALUES (?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET game_name=excluded.game_name, bet_amount=excluded.bet_amount, state=excluded.state', 
                [telegramId, 'mines', bet, JSON.stringify(state)]);
            await DB.run('UPDATE users SET balance = balance - ?, total_bets_count = total_bets_count + 1, total_bets_sum = total_bets_sum + ? WHERE telegram_id = ?', [bet, bet, telegramId]);
            return res.json({ success: true, status: 'playing', mineCount, revealed: [] });
        }
        else if (game === 'blackjack') {
             // Blackjack handles its own state
             const deck = GamesLogic.createDeck();
             const playerHand = [deck.pop(), deck.pop()];
             const dealerHand = [deck.pop(), deck.pop()];
             const playerSum = GamesLogic.calculateHand(playerHand);
             
             const state = { deck, playerHand, dealerHand, status: 'playing' };
             await DB.run('INSERT INTO active_games (telegram_id, game_name, bet_amount, state) VALUES (?, ?, ?, ?) ON CONFLICT(telegram_id) DO UPDATE SET game_name=excluded.game_name, bet_amount=excluded.bet_amount, state=excluded.state', 
                [telegramId, 'blackjack', bet, JSON.stringify(state)]);
             
             // Deduct bet immediately for Blackjack
             await DB.run('UPDATE users SET balance = balance - ?, total_bets_count = total_bets_count + 1, total_bets_sum = total_bets_sum + ? WHERE telegram_id = ?', [bet, bet, telegramId]);
             
             return res.json({ success: true, playerHand, dealerHand: [dealerHand[0], { hidden: true }], playerSum, status: 'playing' });
        }
        else return res.status(400).json({ error: 'Unknown game' });

        // For single-turn games:
        const winAmount = result.winAmount || 0;
        const netChange = winAmount - bet;

        await DB.run(\`
            UPDATE users SET 
                balance = balance + ?, 
                total_bets_count = total_bets_count + 1, 
                total_bets_sum = total_bets_sum + ?,
                total_wins_sum = total_wins_sum + ?,
                xp = xp + ?,
                level = FLOOR((xp + ?) / 1000) + 1
            WHERE telegram_id = ?
        \`, [netChange, bet, winAmount, Math.floor(bet/10), Math.floor(bet/10), telegramId]);

        await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)',
            [telegramId, game, bet, winAmount, result.multiplier, JSON.stringify(result)]);

        if (winAmount > bet) updateQuestProgress(telegramId, 'wins', 1);
        updateQuestProgress(telegramId, 'games', 1);
        const updated = await DB.get('SELECT balance, xp, level FROM users WHERE telegram_id = ?', [telegramId]);
        res.json({ ...result, ...updated });

    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Game error' }); 
    }
});

app.post('/api/games/action', requireAuth, async (req, res) => {
    const { action } = req.body;
    const telegramId = req.user.id;

    try {
        const active = await DB.get('SELECT * FROM active_games WHERE telegram_id = ?', [telegramId]);
        if (!active) return res.status(400).json({ error: 'No active game' });

        const state = JSON.parse(active.state);
        const bet = active.bet_amount;

        if (active.game_name === 'blackjack') {
            if (action === 'hit') {
                state.playerHand.push(state.deck.pop());
                const sum = GamesLogic.calculateHand(state.playerHand);
                if (sum > 21) {
                    // Bust
                    await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                    return res.json({ playerHand: state.playerHand, playerSum: sum, status: 'bust', winAmount: 0 });
                }
                await DB.run('UPDATE active_games SET state = ? WHERE telegram_id = ?', [JSON.stringify(state), telegramId]);
                return res.json({ playerHand: state.playerHand, playerSum: sum, status: 'playing' });
            } 
            else if (action === 'stand') {
                // Dealer plays
                let dealerSum = GamesLogic.calculateHand(state.dealerHand);
                while (dealerSum < 17) {
                    state.dealerHand.push(state.deck.pop());
                    dealerSum = GamesLogic.calculateHand(state.dealerHand);
                }
                
                const playerSum = GamesLogic.calculateHand(state.playerHand);
                let winAmount = 0;
                let multiplier = 0;

                if (dealerSum > 21 || playerSum > dealerSum) {
                    winAmount = bet * 2;
                    multiplier = 2;
                } else if (playerSum === dealerSum) {
                    winAmount = bet;
                    multiplier = 1;
                }

                await DB.run('UPDATE users SET balance = balance + ?, total_wins_sum = total_wins_sum + ? WHERE telegram_id = ?', [winAmount, winAmount, telegramId]);
                await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)',
                    [telegramId, 'blackjack', bet, winAmount, multiplier, JSON.stringify({ playerHand: state.playerHand, dealerHand: state.dealerHand })]);
                if (winAmount > bet) updateQuestProgress(telegramId, 'wins', 1);
                updateQuestProgress(telegramId, 'games', 1);

                const updated = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
                return res.json({ dealerHand: state.dealerHand, dealerSum, status: winAmount > bet ? 'win' : winAmount === bet ? 'push' : 'lose', winAmount, balance: updated.balance });
            }
        } else if (active.game_name === 'mines') {
            if (action === 'open') {
                const idx = req.body.index;
                if (state.mines[idx]) {
                    // Hit a mine
                    await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                    return res.json({ status: 'lose', mines: state.mines, winAmount: 0 });
                }
                if (!state.revealed.includes(idx)) state.revealed.push(idx);
                const multiplier = GamesLogic.getMinesMultiplier(state.revealed.length, state.mines.filter(m => m).length);
                await DB.run('UPDATE active_games SET state = ? WHERE telegram_id = ?', [JSON.stringify(state), telegramId]);
                return res.json({ status: 'playing', revealed: state.revealed, currentMultiplier: multiplier });
            } else if (action === 'cashout') {
                if (state.revealed.length === 0) return res.status(400).json({ error: 'Open at least one cell' });
                const multiplier = GamesLogic.getMinesMultiplier(state.revealed.length, state.mines.filter(m => m).length);
                const winAmount = Math.floor(bet * multiplier);
                
                await DB.run('UPDATE users SET balance = balance + ?, total_wins_sum = total_wins_sum + ? WHERE telegram_id = ?', [winAmount, winAmount, telegramId]);
                await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)',
                    [telegramId, 'mines', bet, winAmount, multiplier, JSON.stringify(state)]);
                
                const updated = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
                if (winAmount > bet) updateQuestProgress(telegramId, 'wins', 1);
                updateQuestProgress(telegramId, 'games', 1);
                return res.json({ status: 'win', winAmount, balance: updated.balance, mines: state.mines });
            }
        } else if (active.game_name === 'crash') {
            if (action === 'cashout') {
                const now = Date.now();
                const elapsedSeconds = (now - state.startTime) / 1000;
                // Multiplier formula: e^(0.06 * seconds)
                const currentMultiplier = Math.pow(Math.E, 0.06 * elapsedSeconds);
                
                if (currentMultiplier > state.crashPoint) {
                    await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                    return res.json({ status: 'crashed', crashPoint: state.crashPoint, winAmount: 0 });
                }
                
                const winAmount = Math.floor(bet * currentMultiplier);
                await DB.run('UPDATE users SET balance = balance + ?, total_wins_sum = total_wins_sum + ? WHERE telegram_id = ?', [winAmount, winAmount, telegramId]);
                await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)',
                    [telegramId, 'crash', bet, winAmount, currentMultiplier, JSON.stringify(state)]);
                
                const updated = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
                if (winAmount > bet) updateQuestProgress(telegramId, 'wins', 1);
                updateQuestProgress(telegramId, 'games', 1);
                return res.json({ status: 'win', winAmount, balance: updated.balance, multiplier: currentMultiplier });
            }
        } else if (active.game_name === 'hilo') {
            if (action === 'guess') {
                const guess = req.body.guess; // 'higher', 'lower', 'same'
                const nextCard = state.deck.pop();
                const val1 = GamesLogic.getCardValue(state.currentCard);
                const val2 = GamesLogic.getCardValue(nextCard);
                
                let win = false;
                if (guess === 'higher' && val2 > val1) win = true;
                else if (guess === 'lower' && val2 < val1) win = true;
                else if (guess === 'same' && val2 === val1) win = true;
                
                if (!win) {
                    await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                    return res.json({ status: 'lose', nextCard, winAmount: 0 });
                }
                
                // Multiplier logic for Hi-Lo (simplified)
                state.multiplier *= 1.5; 
                state.currentCard = nextCard;
                await DB.run('UPDATE active_games SET state = ? WHERE telegram_id = ?', [JSON.stringify(state), telegramId]);
                return res.json({ status: 'playing', currentCard: nextCard, currentMultiplier: state.multiplier });
            } else if (action === 'cashout') {
                const winAmount = Math.floor(bet * state.multiplier);
                await DB.run('UPDATE users SET balance = balance + ?, total_wins_sum = total_wins_sum + ? WHERE telegram_id = ?', [winAmount, winAmount, telegramId]);
                await DB.run('DELETE FROM active_games WHERE telegram_id = ?', [telegramId]);
                await DB.run('INSERT INTO game_history (telegram_id, game_name, bet_amount, win_amount, multiplier, result_data) VALUES (?, ?, ?, ?, ?, ?)',
                    [telegramId, 'hilo', bet, winAmount, state.multiplier, JSON.stringify(state)]);
                
                const updated = await DB.get('SELECT balance FROM users WHERE telegram_id = ?', [telegramId]);
                if (winAmount > bet) updateQuestProgress(telegramId, 'wins', 1);
                updateQuestProgress(telegramId, 'games', 1);
                return res.json({ status: 'win', winAmount, balance: updated.balance });
            }
        }
        res.status(400).json({ error: 'Invalid action' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Action error' });
    }
});

// Admin Routes
app.post('/api/admin/auth', authLimiter, async (req, res) => {
    const { password } = req.body;
    if (password === 'NTIVI') {
        const token = jwt.sign({ id: 'admin', username: 'admin', isAdmin: true }, jwtSecret, { expiresIn: '24h' });
        return res.json({ token });
    }
    res.status(401).json({ error: 'Invalid passcode' });
});

app.get('/api/admin/users', requireAdmin, async (req, res) => {
    try {
        const users = await DB.all('SELECT * FROM users ORDER BY last_seen DESC');
        res.json({ users });
    } catch (err) { res.status(500).json({ error: 'Admin error' }); }
});

app.get('/api/admin/purchases', requireAdmin, async (req, res) => {
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

app.post('/api/admin/user/balance', requireAdmin, async (req, res) => {
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

app.post('/api/admin/settings/ads', requireAdmin, async (req, res) => {
    const { ads_enabled, ads_client_id, ads_slot_id, monetag_zone_id } = req.body;
    try {
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_enabled', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_enabled.toString()]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_client_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_client_id]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('ads_slot_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [ads_slot_id]);
        await DB.run("INSERT INTO settings (key, value) VALUES ('monetag_zone_id', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [monetag_zone_id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Admin settings error' }); }
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

    const headers = { 
        'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
        'Accept-Language': 'en-US,en;q=0.9'
    };

    // Scrape Telegram
    if (urls.telegram) {
        try {
            const res = await fetch(urls.telegram, { headers });
            const html = await res.text();
            const match = html.match(/<div class="tgme_page_extra">([\d\s,]+)\s+/);
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
            // Broader regex for subscriberCountText or accessibility label
            const match = html.match(/"subscriberCountText":\s*\{\s*"simpleText":\s*"([^"]+)"/i) || 
                          html.match(/"label":\s*"([^"]+)\s+(subscribers|подписчиков)/i) ||
                          html.match(/([\d.]+[KMBТМ]?)\s+(subscribers|подписчиков|отметки)/i);
            if (match) {
                const text = (match[1]).toUpperCase().replace(/,/g, '');
                let countMatch = text.match(/[\d.]+/);
                if (countMatch) {
                    let count = parseFloat(countMatch[0]);
                    if (text.includes('K') || text.includes('ТЫС')) count *= 1000;
                    else if (text.includes('M') || text.includes('МЛН')) count *= 1000000;
                    else if (text.includes('B') || text.includes('МЛРД')) count *= 1000000000;
                    await DB.run("INSERT INTO settings (key, value) VALUES ('social_youtube_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [Math.round(count).toString()]);
                }
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

    // Scrape Instagram
    if (urls.instagram) {
        try {
            const res = await fetch(urls.instagram, { headers });
            const html = await res.text();
            const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
            if (ogDesc) {
                const content = ogDesc[1].toUpperCase();
                const match = content.match(/([\d.,KMBТМ]+)\s*(FOLLOWERS|ПОДПИСЧИКОВ)/i);
                if (match) {
                    let countText = match[1].replace(/[\s,]/g, '').replace('ТЫС', 'K').replace('МЛН', 'M');
                    let count = parseFloat(countText);
                    if (countText.includes('K')) count *= 1000;
                    else if (countText.includes('M')) count *= 1000000;
                    await DB.run("INSERT INTO settings (key, value) VALUES ('social_instagram_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [Math.round(count).toString()]);
                }
            }
        } catch (e) { console.error('Instagram scrape error:', e.message); }
    }

    // Scrape Facebook
    if (urls.facebook) {
        try {
            const res = await fetch(urls.facebook, { headers });
            const html = await res.text();
            const ogDesc = html.match(/<meta property="og:description" content="([^"]+)"/i);
            if (ogDesc) {
                const content = ogDesc[1].toUpperCase();
                const match = content.match(/([\d.,KMBТМ]+)\s*(FOLLOWERS|ПОДПИСЧИКОВ|ОТМЕТКИ)/i);
                if (match) {
                    let countText = match[1].replace(/[\s,]/g, '').replace('ТЫС', 'K').replace('МЛН', 'M');
                    let count = parseFloat(countText);
                    if (countText.includes('K')) count *= 1000;
                    else if (countText.includes('M')) count *= 1000000;
                    await DB.run("INSERT INTO settings (key, value) VALUES ('social_facebook_current', ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value", [Math.round(count).toString()]);
                }
            }
        } catch (e) { console.error('Facebook scrape error:', e.message); }
    }
    
    console.log('Social stats scraping completed.');
};

// Initial scrape and hourly schedule
setTimeout(scrapeSocialStats, 5000); 
setInterval(scrapeSocialStats, 60 * 60 * 1000);

app.post('/api/admin/social-stats', requireAdmin, async (req, res) => {
    const { stats } = req.body;
    try {
        for (const net of Object.keys(stats)) {
            await DB.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [`social_${net}_current`, stats[net].current.toString()]);
            await DB.run('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value', [`social_${net}_target`, stats[net].target.toString()]);
        }
        res.json({ success: true });
    } catch { res.status(500).json({ error: 'Stats update error' }); }
});

app.post('/api/admin/social-stats/refresh', requireAdmin, async (req, res) => {
    try {
        await scrapeSocialStats();
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Refresh failed' });
    }
});

app.listen(port, () => console.log(`PostgreSQL Server on ${port}`));
