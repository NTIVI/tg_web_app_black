# NTIVI STUDIO - Dating Mini App

Modern, stylish 16+ Telegram Mini-App for dating.

## Tech Stack
- **Frontend:** React, Vite, TailwindCSS, Framer Motion, Lucide React
- **Backend:** Node.js, Express, Prisma ORM, PostgreSQL (Neon/Render)
- **Bot:** `node-telegram-bot-api`

## Core Features
- **Onboarding:** Multi-step registration with intent, gender, and photo uploads.
- **Feed:** Swipe mechanics with matching algorithm (city-priority).
- **Match Animation:** Beautiful fullscreen "It's a Match!" animation with coin rewards.
- **Bonus System:** Daily rewards for active users.
- **Profile:** Leveling system and coin balance.
- **Chats:** Direct messaging between mutual matches.
- **Admin Panel:** User moderation and content management.

## Deployment
- **Frontend:** Deployed on Vercel.
- **Backend:** Deployed on Render.
- **Database:** Hosted on Render/Neon.

## Recent Updates
- Implemented **Daily Bonus** system (+5 coins per day).
- Added **Edit Profile** functionality.
- Enhanced **Match UX** with a dedicated modal and +10 coins reward.
- Fixed **Vercel API Proxying** by hardcoding production URL and updating `vercel.json`.

## How to Run Locally
1. Install dependencies: `npm run install-all`
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`
