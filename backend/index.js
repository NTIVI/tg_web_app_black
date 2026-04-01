import express from 'express';
import cors from 'cors';
import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import crypto from 'crypto';
import './database.js';
import { User, Purchase, Setting } from './models.js';

dotenv.config();
const app = express();
const port = process.env.PORT || 3000;
const token = process.env.BOT_TOKEN;

app.use(cors());
app.use(express.json());

// --- Helpers ---
const verifyInitData = (initData) => {
  if (!token) return true;
  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');
    urlParams.sort();
    const dataCheckString = Array.from(urlParams.entries()).map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(token).digest();
    return crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex') === hash;
  } catch { return false; }
};

const bot = token ? new TelegramBot(token, { polling: true }) : null;
if (bot) {
  bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 'Welcome to YourTurn! 🎮', {
      reply_markup: { inline_keyboard: [[{ text: 'Open App', web_app: { url: process.env.WEB_APP_URL || '' } }]] }
    });
  });
}

// --- Public API ---
app.post('/api/auth', async (req, res) => {
  const { initData, initDataUnsafe } = req.body;
  if (initData && !verifyInitData(initData)) return res.status(401).json({ error: 'Invalid auth' });

  const tgUser = initDataUnsafe?.user || { id: 'mock_123' };
  try {
    const user = await User.findOneAndUpdate(
      { telegram_id: tgUser.id.toString() },
      { username: tgUser.username, first_name: tgUser.first_name, last_name: tgUser.last_name, photo_url: tgUser.photo_url, last_seen: new Date() },
      { upsert: true, new: true }
    );
    res.json({ user });
  } catch { res.status(500).json({ error: 'Auth error' }); }
});

app.get('/api/avatar/:id', async (req, res) => {
  if (!bot) return res.status(501).send();
  try {
    const photos = await bot.getUserProfilePhotos(req.params.id, { limit: 1 });
    if (photos.total_count === 0) return res.status(404).send();
    const file = await bot.getFile(photos.photos[0][0].file_id);
    const response = await fetch(`https://api.telegram.org/file/bot${token}/${file.file_path}`);
    res.set('Content-Type', 'image/jpeg').send(Buffer.from(await response.arrayBuffer()));
  } catch { res.status(500).send(); }
});

app.post('/api/watch-ad', async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ telegram_id: req.body.telegramId }, { $inc: { balance: 50 } }, { new: true });
    res.json({ success: !!user, newBalance: user?.balance });
  } catch { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/buy', async (req, res) => {
  const { telegramId, itemName, price } = req.body;
  try {
    const user = await User.findOne({ telegram_id: telegramId });
    if (!user || user.balance < price) return res.status(400).json({ error: 'No funds' });
    user.balance -= price;
    await user.save();
    await Purchase.create({ user_id: user._id, item_name: itemName, price });
    res.json({ success: true, newBalance: user.balance });
  } catch { res.status(500).json({ error: 'Buy error' }); }
});

// --- Settings API ---
app.get('/api/settings/ads', async (req, res) => {
  const rows = await Setting.find();
  const settings = Object.fromEntries(rows.map(r => [r.key, r.value]));
  res.json({ settings });
});

// --- Admin API ---
app.get('/api/admin/users', async (req, res) => res.json({ users: await User.find().sort({ last_seen: -1 }) }));

app.get('/api/admin/purchases', async (req, res) => {
  const purchases = await Purchase.find().populate('user_id').sort({ purchased_at: -1 });
  res.json({ purchases: purchases.map(p => ({ ...p.toObject(), username: p.user_id?.username, telegram_id: p.user_id?.telegram_id })) });
});

app.post('/api/admin/user/balance', async (req, res) => {
  const { telegramId, amount, action } = req.body;
  const val = parseInt(amount);
  try {
    const user = await User.findOne({ telegram_id: telegramId });
    if (!user) return res.status(404).json({ error: 'No user' });
    user.balance = action === 'add' ? user.balance + val : Math.max(0, user.balance - val);
    await user.save();
    res.json({ success: true, newBalance: user.balance });
  } catch { res.status(500).json({ error: 'Error' }); }
});

app.post('/api/admin/settings/ads', async (req, res) => {
  const s = req.body;
  const updates = [
    { key: 'ads_enabled', value: s.ads_enabled ? 'true' : 'false' },
    { key: 'ads_client_id', value: s.ads_client_id || '' },
    { key: 'ads_slot_id', value: s.ads_slot_id || '' },
    { key: 'adsgram_block_id', value: s.adsgram_block_id || '' },
    { key: 'rewarded_ad_provider', value: s.rewarded_ad_provider || 'adsgram' }
  ];
  for (const item of updates) await Setting.findOneAndUpdate({ key: item.key }, { value: item.value }, { upsert: true });
  res.json({ success: true });
});

app.post('/api/admin/purchase/status', async (req, res) => {
  const p = await Purchase.findByIdAndUpdate(req.body.purchaseId, { status: req.body.status }, { new: true });
  res.json({ success: !!p, purchase: p });
});

app.delete('/api/admin/purchase/:id', async (req, res) => {
  await Purchase.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.listen(port, () => console.log(`Server on ${port}`));
