// callback.handler.ts

import { Context } from "telegraf";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { updateMode, updatePoolSize, updateRegion } from "@/services/update.service";
import {
  handleModeMenu,
  handlePoolSizeMenu,
  handleAboutMenu,
  handleStatsMenu,
  handleSettingsMenu,
  handleRegionMenu,
} from "@/services/menu.service";
import { goHandler } from "@/handlers/go.handler";

const staticRoutes: Record<string, (ctx: Context) => Promise<any>> = {
  start_menu: goHandler,
  stats_menu: handleStatsMenu,
  settings_menu: handleSettingsMenu,
  about_menu: handleAboutMenu,
  mode_menu: handleModeMenu,
  pool_menu: handlePoolSizeMenu,
  region_menu: handleRegionMenu,
};

const dynamicRoutes: Record<string, (ctx: Context, value: string) => Promise<any>> = {
  pool: updatePoolSize,
  mode: updateMode,
  region: updateRegion,
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
