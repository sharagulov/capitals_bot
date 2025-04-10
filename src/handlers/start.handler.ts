import { Context } from "telegraf";
import { registerUser } from "@/services/register.service";
import { ADMIN_PASS } from "@/config/config";
import { handleStartMenu } from "@/services/menu.service";

export async function startHandler(ctx: Context) {
  if (!("text" in ctx.message!)) return;
  const isAdmin = ctx.message?.text?.split(" ").slice(1)[0] === ADMIN_PASS;

  const { user, newUser, adminGiven } = await registerUser(ctx, isAdmin);
  if (newUser) {
    await ctx.reply(
      `👋 Привет, *${ctx.from?.first_name}*\n` +
        `Я помогу тебе выучить столицы всех стран мира!\n` +
        `Это же круто!\n`,
      // +
      // `Круг — кол-во стран или столиц, которые нужно отгадать за один игровой круг. Советую начать с 10.\n` +
      // `Режим — угадать страну по столице или наоборот`,
      {
        parse_mode: "Markdown",
      }
    );
  } else {
    await ctx.reply(
      `👋 С возвращением, *${ctx.from?.first_name}*\n`,
        {
          parse_mode: "Markdown",
        }
    );
  }

  return handleStartMenu(ctx);
}
