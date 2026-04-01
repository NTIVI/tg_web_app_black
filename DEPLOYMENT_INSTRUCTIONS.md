# Инструкция по деплою (Бесплатный хостинг)

Ваш Telegram Web App проект готов. Чтобы разместить его на бесплатных хостингах, следуйте этой инструкции:

## 1. База данных (MongoDB Atlas)
Так как мы перешли на MongoDB, вам нужна облачная база данных.

1. Зарегистрируйтесь на [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Создайте новый кластер (бесплатный тариф "M0").
3. В разделе "Network Access" добавьте IP-адрес `0.0.0.0/0` (разрешить всем).
4. В разделе "Database Access" создайте пользователя и пароль.
5. Нажмите "Connect" -> "Drivers" и скопируйте строку подключения (URI). Она выглядит примерно так: `mongodb+srv://<user>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority`.

## 2. Размещение Backend на Render.com
Render идеально подходит для Node.js приложений.

1. Загрузите код из папки `backend` в свой репозиторий на **GitHub**.
2. В **Render.com** нажмите **"New + Web Service"**.
3. Подключите свой GitHub и выберите репозиторий с бэкендом.
4. В настройках укажите:
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. В разделе **Environment Variables** (обязательно!):
   - `MONGODB_URI` = (Ваша строка из MongoDB Atlas).
   - `BOT_TOKEN` = `8571178556:AAGLgH9mAaT8PUOa4iLy_KKU0k0h_IeUI00`
   - `WEB_APP_URL` = (Ссылка на ваш фронтенд после деплоя).
6. Нажмите **"Create Web Service"**.

## 3. Размещение Frontend на Vercel
1. Загрузите папку `frontend` в GitHub.
2. В коде фронтенда (`src/config.ts`) убедитесь, что `API_URL` указывает на ваш бэкенд на Render.
3. В **Vercel** нажмите **"Add New Project"** и выберите репозиторий.
4. Нажмите **Deploy**. Vercel выдаст вам ссылку (например, `https://my-frontend.vercel.app`).

## 4. Финальная связка
1. Вернитесь в **Render** -> Environment Variables.
2. Обновите `WEB_APP_URL` на вашу новую Vercel-ссылку.
3. Откройте Telegram бота и отправьте `/start`.
