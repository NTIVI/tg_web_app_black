import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import TelegramBot from 'node-telegram-bot-api';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Telegram Bot Setup
const botToken = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL || 'https://tg-web-app-black.vercel.app';

if (botToken) {
  const bot = new TelegramBot(botToken, { polling: true });

  // Set the menu button for the bot
  bot.setChatMenuButton({
    menu_button: {
      type: 'web_app',
      text: 'Открыть NTIVI',
      web_app: { url: webAppUrl }
    }
  }).catch(err => console.error('Error setting menu button:', err));

  bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Добро пожаловать в NTIVI STUDIO 🖤\n\nПриложение для тех, кто ищет стиль и искренность. Найди свою идеальную пару прямо сейчас.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: '🔥 Открыть NTIVI STUDIO', web_app: { url: webAppUrl } }]
        ]
      }
    });
  });

  console.log('🤖 Telegram bot is running with new token...');
} else {
  console.warn('⚠️ BOT_TOKEN is missing. Telegram bot not started.');
}

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Auth / User Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { telegramId, firstName, lastName } = req.body;
    
    let user = await prisma.user.findUnique({
      where: { telegramId },
      include: { photos: true }
    });

    if (!user) {
      const userCount = await prisma.user.count();
      user = await prisma.user.create({
        data: {
          telegramId,
          firstName,
          lastName,
          isAdmin: userCount === 0, // First user is admin
        },
        include: { photos: true }
      });
    } else {
      user = await prisma.user.update({
        where: { telegramId },
        data: {
          isOnline: true,
          lastSeen: new Date(),
        },
        include: { photos: true }
      });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { intent, gender, birthDate, city, bio, timeSpent } = req.body;
    
    const user = await prisma.user.update({
      where: { id },
      data: {
        intent,
        gender,
        birthDate: birthDate ? new Date(birthDate) : null,
        city,
        bio,
        timeSpent: timeSpent !== undefined ? timeSpent : undefined,
        lastSeen: new Date(),
        isOnline: true,
      }
    });
    
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/users/:id/claim-daily', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id } });
    
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const now = new Date();
    const lastClaim = user.lastBonusClaim;
    
    if (lastClaim) {
      const isToday = lastClaim.toDateString() === now.toDateString();
      if (isToday) {
        return res.status(400).json({ error: 'Вы уже получили сегодняшний бонус!' });
      }
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        coins: { increment: 5 },
        lastBonusClaim: now
      }
    });
    
    res.json({ success: true, coins: updatedUser.coins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upload Photos Route
app.post('/api/users/:id/photos', async (req, res) => {
  try {
    const { id } = req.params;
    const { photos } = req.body; // array of { url, isAvatar, order }
    
    // delete existing photos
    await prisma.photo.deleteMany({ where: { userId: id } });
    
    const createdPhotos = await Promise.all(
      photos.map((p: any) => 
        prisma.photo.create({
          data: {
            url: p.url,
            isAvatar: p.isAvatar,
            order: p.order,
            userId: id
          }
        })
      )
    );
    
    res.json(createdPhotos);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Feed
app.get('/api/feed/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const currentUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetGender = currentUser.gender === 'male' ? 'female' : 'male';
    
    // Auto-offline users who haven't been seen for 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // Find users of target gender, not already liked by current user
    const users = await prisma.user.findMany({
      where: {
        id: { not: userId },
        gender: targetGender,
        isBlocked: false,
        likesReceived: {
          none: {
            fromUserId: userId
          }
        }
      },
      include: {
        photos: true
      },
      orderBy: {
        lastSeen: 'desc'
      },
      take: 20
    });

    // Update isOnline flag in memory for the response
    const usersWithOnlineStatus = users.map(u => ({
      ...u,
      isOnline: u.lastSeen > fiveMinutesAgo
    }));

    // In a real app we'd sort by city -> nearest -> other. 
    // For demo, sort in memory:
    const sameCity = usersWithOnlineStatus.filter(u => u.city === currentUser.city);
    const otherCity = usersWithOnlineStatus.filter(u => u.city !== currentUser.city);

    res.json([...sameCity, ...otherCity]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Like Action
app.post('/api/likes', async (req, res) => {
  try {
    const { fromUserId, toUserId } = req.body;
    
    // Check if reverse like exists
    const reverseLike = await prisma.like.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: toUserId,
          toUserId: fromUserId
        }
      }
    });

    const isMutual = !!reverseLike;

    const like = await prisma.like.create({
      data: {
        fromUserId,
        toUserId,
        isMutual
      }
    });

    if (isMutual) {
      // update reverse like to mutual
      await prisma.like.update({
        where: { id: reverseLike.id },
        data: { isMutual: true }
      });
      
      // create chat
      const chat = await prisma.chat.create({
        data: {
          user1Id: fromUserId,
          user2Id: toUserId
        }
      });
      
      // Add coins to both
      await prisma.user.update({ where: { id: fromUserId }, data: { coins: { increment: 10 } } });
      await prisma.user.update({ where: { id: toUserId }, data: { coins: { increment: 10 } } });

      return res.json({ mutual: true, chat });
    }

    res.json({ mutual: false, like });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get Chats
app.get('/api/users/:id/chats', async (req, res) => {
  try {
    const { id } = req.params;
    const chats = await prisma.chat.findMany({
      where: {
        OR: [
          { user1Id: id },
          { user2Id: id }
        ]
      },
      include: {
        user1: { include: { photos: true } },
        user2: { include: { photos: true } },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });
    res.json(chats);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send Message
app.post('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { senderId, text } = req.body;

    const message = await prisma.message.create({
      data: {
        chatId,
        senderId,
        text
      }
    });

    // Add XP/Level for sending message
    await prisma.user.update({
      where: { id: senderId },
      data: {
        level: { increment: 1 }
      }
    });

    res.json(message);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin Route
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: { photos: true }
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/users/:id/block', async (req, res) => {
  try {
    const { id } = req.params;
    const { isBlocked } = req.body;
    const user = await prisma.user.update({
      where: { id },
      data: { isBlocked }
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/photos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.photo.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the React app
let frontendPath = path.join(__dirname, '../../frontend/dist');

// Fallback for different deployment environments
if (!fs.existsSync(frontendPath)) {
  frontendPath = path.join(process.cwd(), 'frontend/dist');
}
if (!fs.existsSync(frontendPath)) {
  frontendPath = path.join(process.cwd(), '../frontend/dist');
}

console.log(`📂 Serving static files from: ${frontendPath}`);
app.use(express.static(frontendPath));

// Catch-all middleware for SPA routing
app.use((req, res, next) => {
  // If it's an API request, let it through to 404 handler
  if (req.path.startsWith('/api')) {
    return next();
  }
  // Otherwise serve index.html
  res.sendFile(path.resolve(frontendPath, 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Backend running on port ${port}`);
});
