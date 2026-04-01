import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import './database.js'; // Initialize MongoDB connection
import { User, Purchase, Setting } from './models.js';

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
app.post('/api/auth', async (req, res) => {
    const { initData, initDataUnsafe } = req.body;

    if (initData && !verifyInitData(initData)) {
        return res.status(401).json({ error: 'Invalid initData' });
    }

    const tgUser = initDataUnsafe?.user || { id: 'mock_123', username: 'Guest' };
    const telegramId = tgUser.id.toString();

    try {
        const user = await User.findOneAndUpdate(
            { telegram_id: telegramId },
            {
                username: tgUser.username || '',
                first_name: tgUser.first_name || '',
                last_name: tgUser.last_name || '',
                photo_url: tgUser.photo_url || '',
                last_seen: new Date()
            },
            { upsert: true, new: true }
        );
        res.json({ user });
    } catch (err) {
        console.error("Auth DB Error:", err);
        res.status(500).json({ error: 'Database error' });
    }
});

// Proxy for Telegram Avatars
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

app.post('/api/watch-ad', async (req, res) => {
    const { telegramId } = req.body;
    try {
        const user = await User.findOneAndUpdate(
            { telegram_id: telegramId },
            { $inc: { balance: 50 } },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.post('/api/buy', async (req, res) => {
    const { telegramId, itemName, price } = req.body;
    try {
        const user = await User.findOne({ telegram_id: telegramId });
        if (!user || user.balance < price) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        user.balance -= price;
        user.last_seen = new Date();
        await user.save();

        await Purchase.create({
            user_id: user._id,
            item_name: itemName,
            price: price
        });

        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'Purchase error' });
    }
});

// Admin routes
app.get('/api/admin/users', async (req, res) => {
    try {
        const users = await User.find().sort({ last_seen: -1 });
        res.json({ users });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.get('/api/admin/purchases', async (req, res) => {
    try {
        const purchases = await Purchase.find().populate('user_id').sort({ purchased_at: -1 });
        const formatted = purchases.map(p => ({
            ...p.toObject(),
            username: p.user_id?.username,
            telegram_id: p.user_id?.telegram_id
        }));
        res.json({ purchases: formatted });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.post('/api/admin/user/balance', async (req, res) => {
    const { telegramId, amount, action } = req.body;
    const value = parseInt(amount);
    if (isNaN(value)) return res.status(400).json({ error: 'Invalid amount' });

    try {
        let user;
        if (action === 'add') {
            user = await User.findOneAndUpdate({ telegram_id: telegramId }, { $inc: { balance: value } }, { new: true });
        } else {
            user = await User.findOne({ telegram_id: telegramId });
            if (user) {
                user.balance = Math.max(0, user.balance - value);
                await user.save();
            }
        }
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, newBalance: user.balance });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.get('/api/settings/ads', async (req, res) => {
    try {
        const rows = await Setting.find();
        const settings = {};
        rows.forEach(r => settings[r.key] = r.value);
        res.json({ settings });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.post('/api/admin/settings/ads', async (req, res) => {
    const s = req.body;
    try {
        const updates = [
            { key: 'ads_enabled', value: s.ads_enabled ? 'true' : 'false' },
            { key: 'ads_client_id', value: s.ads_client_id || '' },
            { key: 'ads_slot_id', value: s.ads_slot_id || '' },
            { key: 'adsgram_block_id', value: s.adsgram_block_id || '' },
            { key: 'rewarded_ad_provider', value: s.rewarded_ad_provider || 'adsgram' }
        ];
        for (const item of updates) {
            await Setting.findOneAndUpdate({ key: item.key }, { value: item.value }, { upsert: true });
        }
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.post('/api/admin/purchase/status', async (req, res) => {
    const { purchaseId, status } = req.body;
    try {
        const purchase = await Purchase.findByIdAndUpdate(purchaseId, { status }, { new: true });
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
        res.json({ success: true, purchase });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.delete('/api/admin/purchase/:id', async (req, res) => {
    try {
        const purchase = await Purchase.findByIdAndDelete(req.params.id);
        if (!purchase) return res.status(404).json({ error: 'Purchase not found' });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'DB error' });
    }
});

app.listen(port, () => console.log(`Backend running on port ${port}`));
