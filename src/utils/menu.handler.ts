import { Context } from "telegraf";

export async function handlePoolSizeMenu(ctx: Context) {
  await ctx.reply(`Выбери, сколько слов будет в одном круге:\n`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "10", callback_data: "pool_10" }],
        [{ text: "15", callback_data: "pool_15" }],
        [{ text: "20", callback_data: "pool_20" }],
      ],
    },
  });
}

export async function handleModeMenu(ctx: Context) {
  await ctx.reply(`Выбери режим, в котором хочешь играть:\n`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Столица → Страна", callback_data: "mode_true" }],
        [{ text: "Страна → Столица", callback_data: "mode_false" }],
      ],
    },
  });
}
