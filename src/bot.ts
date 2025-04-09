import express from "express";
import { Telegraf } from "telegraf";
import { BOT_TOKEN } from "@/config/config";
import { startHandler } from "@/handlers/start.handler";
import { handleCallback } from "@/handlers/callback.handler";
import { handleModeMenu, handlePoolSizeMenu } from "./utils/menu.handler";

const bot = new Telegraf(BOT_TOKEN);
const app = express();

// регистрируем хендлер
bot.start(startHandler);

bot.on("callback_query", handleCallback);

// подключаем Webhook-обработчик Telegraf
app.use(bot.webhookCallback("/capitals"));

// устанавливаем Webhook в Telegram (один раз)
bot.telegram.setWebhook("https://voocaboolary.site/capitals");

app.listen(3000, () => {
  console.log("Webhook сервер поднят на 3000 порту");
});
