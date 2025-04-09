import { Context } from "telegraf";
import { getCountryPool } from "@/services/country.service";
import { setSession } from "@/redis/session";
import { registerUser } from "@/services/register.service";
import { ADMIN_PASS } from "@/config/config";

export async function startHandler(ctx: Context) {
  if (!("text" in ctx.message!)) return;

  const currentUsername = ctx.from!.username;
  const currentId = ctx.from!.id;
  const isAdmin = ctx.message?.text?.split(" ").slice(1)[0] === ADMIN_PASS;

  const { user, newUser, adminGiven } = await registerUser(ctx, isAdmin);

  if (newUser) {
    await ctx.reply(
      `Привет, *${ctx.from?.username}${adminGiven ? "_admin" : ""}*\n` +
        `Давай вместе учить столицы стран мира.\n` +
        `Перед началом рекомедую настроить игру:\n` +
        `Круг — кол-во стран или столиц, которые нужно отгадать за один игровой круг. Советую начать с 10.\n` +
        `Режим — угадать страну по столице или наоборот`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Круг", callback_data: "pool_menu" }],
            [{ text: "Режим", callback_data: "mode_menu" }],
          ],
        },
      }
    );
  } else {
    await ctx.reply(
      `Привет, *${ctx.from?.username}${adminGiven ? "_admin" : ""}*.\n` +
        `Твоя статистика: 90 столиц отгадано. Так держать.`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "Круг", callback_data: "pool_menu" }],
            [{ text: "Режим", callback_data: "mode_menu" }],
          ],
        },
      }
    );
  }
}
