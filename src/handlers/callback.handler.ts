import { Context } from "telegraf";
import { CallbackQuery } from "telegraf/typings/core/types/typegram";
import { updateMode, updatePoolSize } from "@/services/update.service";
import { handleModeMenu, handlePoolSizeMenu } from "@/utils/menu.handler";

// callbackRouter.ts
const routes = {
  pool: updatePoolSize,
  mode: updateMode,
};

export async function handleCallback(ctx: Context) {
  await ctx.answerCbQuery();
  
  const data = (ctx.callbackQuery as CallbackQuery.DataQuery).data;
  
  await ctx.deleteMessage();
  if (data === "pool_menu") return handlePoolSizeMenu(ctx);
  if (data === "mode_menu") return handleModeMenu(ctx);

  const [key, value] = data.split("_");

  const handler = routes[key as keyof typeof routes];
  console.log("callback_data:", data);
  if (handler) return handler(ctx, value);
}
