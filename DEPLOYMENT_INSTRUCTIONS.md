# Инструкция по деплою (Бесплатный хостинг)

Ваш Telegram Web App проект готов. Чтобы разместить его на бесплатных хостингах, следуйте этой инструкции:

## 1. Размещение Backend и Бота на Render.com
Render предоставляет бесплатные веб-сервисы, которые идеально подходят для Node.js с SQLite.

1. Загрузите код из папки `backend` в свой репозиторий на **GitHub**.
2. Зарегистрируйтесь на [Render.com](https://render.com) и нажмите **"New + Web Service"**.
3. Подключите свой GitHub и выберите репозиторий с бэкендом.
4. В настройках укажите:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. В разделе **Environment Variables** добавьте:
   - `BOT_TOKEN` = `8571178556:AAGLgH9mAaT8PUOa4iLy_KKU0k0h_IeUI00`
   - `WEB_APP_URL` = (Оставьте пока пустым или вставьте ссылку на фронтенд после деплоя).
6. Нажмите **"Create Web Service"**. Render выдаст вам ссылку (например, `https://my-backend-app.onrender.com`).

> **Важно для SQLite**: На бесплатном тарифе Render файловая система эфемерна (может стираться при перезагрузке). Для продакшена стоит использовать PostgreSQL на Render или Supabase.

## 2. Размещение Frontend на Vercel
Vercel отлично подходит для бесплатного хостинга React приложений.

1. Загрузите код из папки `frontend` в отдельный репозиторий на **GitHub**.
2. В коде фронтенда (`src/App.tsx`, `src/pages/Start.tsx` и др.) найдите все адреса `http://localhost:3000` и **замените их** на ваш URL от Render (например, `https://my-backend-app.onrender.com`).
3. Перейдите на [Vercel](https://vercel.com) и авторизуйтесь через GitHub.
4. Нажмите **"Add New Project"**, выберите свой репозиторий с фронтендом.
5. Vercel автоматически определит, что это проект на **Vite**. Нажмите **Deploy**.
6. Vercel выдаст вам фронтенд ссылку (например, `https://my-frontend.vercel.app`).

## 3. Финальная связка
1. Вернитесь в **Render** (бэкенд) -> Settings -> Environment Variables.
2. Обновите порт `WEB_APP_URL` на вашу новую Vercel-ссылку (например, `https://my-frontend.vercel.app`).
3. Откройте Telegram бота, отправьте `/start`.
4. Бот пришлет кнопку **"Open App"**, которая откроет ваше красивое чёрное приложение!

---
Для запуска локально во время разработки (в двух терминалах):
- Бэкенд: `cd tg_web_app_black/backend && npm install && node index.js`
- Фронтенд: `cd tg_web_app_black/frontend && npm install && npm run dev`
