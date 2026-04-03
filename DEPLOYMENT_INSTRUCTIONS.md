# Инструкция по деплою (Render + Vercel)

Ваш Telegram Web App проект готов. Чтобы разместить его на бесплатных хостингах, следуйте этой инструкции:

## 1. Размещение Backend на Render.com
Render идеально подходит для Node.js приложений.

1. Загрузите код из папки `backend` в свой репозиторий на **GitHub**.
2. В **Render.com** нажмите **"New + Web Service"**.
3. Подключите свой GitHub и выберите репозиторий с бэкендом.
4. В настройках укажите:
   - **Environment:** Node
   - **Root Directory:** `backend` (или оставить пустым, если репозиторий только для бэкенда)
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. В разделе **Environment Variables**:
   - `BOT_TOKEN` = `8571178556:AAGLgH9mAaT8PUOa4iLy_KKU0k0h_IeUI00`
   - `WEB_APP_URL` = (Ссылка на ваш фронтенд после деплоя на Vercel).
6. **Persistence (Важно!):** 
   - На бесплатном тарифе Render файлы (включая SQLite) удаляются после перезагрузки. 
   - Чтобы сохранить данные, в настройках Render перейдите в **Disks** и примонтируйте диск (например, `/data`), но это доступно только на платных тарифах ($7/мес). 
   - На бесплатном тарифе база будет сбрасываться при каждом обновлении кода. (Если нужна вечная бесплатная база, лучше вернуться к MongoDB Atlas).

## 2. Размещение Frontend на Vercel
1. Загрузите папку `frontend` в GitHub.
2. В коде фронтенда (`src/config.ts`) убедитесь, что `API_URL` указывает на ваш бэкенд на Render.
3. В **Vercel** нажмите **"Add New Project"** и выберите репозиторий.
4. Укажите `Root Directory` как `frontend`.
5. Нажмите **Deploy**. Vercel выдаст вам ссылку.

## 3. Adsgram Конфигурация
В репозитории уже настроен новый Block ID: `26661`. 
- **Callback URL:** `https://tg-web-app-black.onrender.com/api/adsgram-reward?user=[userId]` (нужно указать в Adsgram Panel).
- **Compliance:** В приложении настроен принудительный интервал в **2 минуты** между показами рекламы для соответствия правилам модерации Adsgram.

---
*Сделано с помощью Antigravity AI*
