// callback.handler.ts

import { Context } from "telegraf";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { updateMode, updatePoolSize } from "@/services/update.service";
import {
  handleModeMenu,
  handlePoolSizeMenu,
  handleAboutMenu,
  handleStatsMenu,
  handleSettingsMenu,
} from "@/services/menu.service";

const staticRoutes: Record<string, (ctx: Context) => Promise<any>> = {
  start_menu: handlePoolSizeMenu,
  stats_menu: handleStatsMenu,
  settings_menu: handleSettingsMenu,
  about_menu: handleAboutMenu,
  mode_menu: handleModeMenu,
  pool_menu: handlePoolSizeMenu,
};

const dynamicRoutes: Record<string, (ctx: Context, value: string) => Promise<any>> = {
  pool: updatePoolSize,
  mode: updateMode,
};


export async function handleCallback(ctx: Context) {
  await ctx.answerCbQuery();

  const data = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
  if (!data) return;

  if (staticRoutes[data]) {
    return staticRoutes[data](ctx);
  }

  const [key, value] = data.split("_");
  const handler = dynamicRoutes[key];
  if (handler) {
    return handler(ctx, value);
  }

  console.warn("❗ Неизвестный callback_data:", data);
  return ctx.reply("⛔ Неизвестная команда");
}
