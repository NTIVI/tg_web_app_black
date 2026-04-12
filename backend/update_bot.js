import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
dotenv.config();

const { BOT_TOKEN: token, WEB_APP_URL: url } = process.env;

if (!token || !url) {
    console.error('Missing BOT_TOKEN or WEB_APP_URL');
    process.exit(1);
}

const bot = new TelegramBot(token);

(async () => {
    try {
        console.log(`Setting Menu Button to: ${url}`);
        await bot.setChatMenuButton({
            menu_button: { type: 'web_app', text: 'YourTurn', web_app: { url } }
        });
        console.log('✅ Success! Bot Menu Button updated.');
    } catch (e) {
        console.error('❌ Failed:', e.message);
    }
})();
