import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const token = process.env.BOT_TOKEN;
const webAppUrl = process.env.WEB_APP_URL;

if (!token || !webAppUrl) {
    console.error('Error: BOT_TOKEN or WEB_APP_URL not found in .env');
    process.exit(1);
}

const bot = new TelegramBot(token);

async function updateBot() {
    try {
        console.log(`Updating bot configuration...`);
        console.log(`Token: ${token.substring(0, 5)}...`);
        console.log(`URL: ${webAppUrl}`);

        // Set Menu Button
        await bot.setChatMenuButton({
            menu_button: {
                type: 'web_app',
                text: 'YourTurn',
                web_app: { url: webAppUrl }
            }
        });
        console.log('✅ Menu Button update command sent.');
        const currentMenu = await bot.getChatMenuButton();
        console.log('Current Menu Status:', JSON.stringify(currentMenu, null, 2));

        // Optional: Send a test message to the developer (if chatId was known)
        // For now, we just update the global settings.

        console.log('🚀 Bot is now pointing to the correct URL.');
    } catch (e) {
        console.error('❌ Error updating bot:', e.message);
    }
}

updateBot();
