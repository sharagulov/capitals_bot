import express from "express";
import { Context, Telegraf } from "telegraf";
import { BOT_TOKEN } from "@/config/config";
import { startHandler } from "@/handlers/start.handler";
import { handleCallback } from "@/handlers/callback.handler";
import { sessionWatch } from "@/handlers/go.handler";

const bot = new Telegraf(BOT_TOKEN);
const app = express();

bot.start(startHandler);

bot.on("callback_query", handleCallback);

bot.on("text", async (Context) => {
  await sessionWatch(Context);
});

app.use(bot.webhookCallback("/capitals"));

bot.telegram.setWebhook("https://voocaboolary.site/capitals");

app.listen(3000, () => {
  console.log("Webhook сервер поднят на 3000 порту");
});
