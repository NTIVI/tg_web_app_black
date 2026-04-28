const TelegramBot = require('node-telegram-bot-api');
const token = '8798417025:AAEt4SpgZWHlm4J7id0tryXrqTAyT2CYFno';
const webAppUrl = 'https://tg-web-app-black.vercel.app/';
const bot = new TelegramBot(token);

bot.setChatMenuButton({
  menu_button: {
    type: 'web_app',
    text: 'Открыть',
    web_app: { url: webAppUrl }
  }
}).then(() => {
  console.log("Menu button updated successfully.");
  process.exit(0);
}).catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
