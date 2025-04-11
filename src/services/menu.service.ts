import { Context } from "telegraf";
import { registerUser } from "./register.service";
import { ADMIN_PASS } from "@/config/config";
import { getUserInfo } from "./update.service";

export async function handlePoolSizeMenu(ctx: Context) {
  await ctx.editMessageText(
    `👉 Выбери, сколько слов будет в одном *круге*:\n`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "10", callback_data: "pool_10" },
            { text: "15", callback_data: "pool_15" },
            { text: "20", callback_data: "pool_20" },
          ],
        ],
      },
    }
  );
}

export async function handleModeMenu(ctx: Context) {
  await ctx.editMessageText(`👉 Выбери *режим*, в котором хочешь играть:`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [{ text: "Угадай столицу", callback_data: "mode_capitals" }],
        [{ text: "Угадай страну", callback_data: "mode_countries" }],
        [{ text: "Сложный (пока нельзя выбрать)", callback_data: "mode_hard" }],
      ],
    },
  });
}

export async function handleRegionMenu(ctx: Context) {
  await ctx.editMessageText(
    `👉 Выбери *регион* попадающихся стран (не учитывается в сложном режиме):`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Европа", callback_data: "region_europe" },
            { text: "Азия", callback_data: "region_asia" },
            { text: "Африка", callback_data: "region_africa" },
          ],
          [
            { text: "Северная Америка", callback_data: "region_north" },
            { text: "Южная Америка", callback_data: "region_south" },
            { text: "Океания", callback_data: "region_oceania" },
          ],
          [{ text: "⭐ Все", callback_data: "region_all" }],
        ],
      },
    }
  );
}

export async function handleStartMenu(ctx: Context) {
  const userInfo = await getUserInfo(ctx);

  await ctx.reply(
    `ТЕКУЩИЕ УСТАНОВКИ\n— 🎲 Размер круга: ${userInfo?.poolSize}\n— 🏃 Режим игры: ${userInfo?.gameMode}\n— 🌏 Регион: ${userInfo?.preferredRegion}`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "🚀 Начать", callback_data: "start_menu" }],
          [
            { text: "⚙️ Настройки", callback_data: "settings_menu" },
            { text: "📊 Статистика", callback_data: "stats_menu" },
          ],
          [{ text: "🤓 О боте", callback_data: "about_menu" }],
        ],
      },
    }
  );
}

export async function handleSettingsMenu(ctx: Context) {
  await ctx.editMessageText(
    `⚙️ НАСТРОЙКИ\n` +
      `— *Круг* регулирует размер группы слов, которые предлагаются для отгадываня\n` +
      `— *Режим* переключает режим игры\n`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Круг", callback_data: "pool_menu" }],
          [{ text: "Режим", callback_data: "mode_menu" }],
          [{ text: "Регион", callback_data: "region_menu" }],
        ],
      },
    }
  );
}

export async function handleStatsMenu(ctx: Context) {
  await ctx.editMessageText(`😩 УПС! Этот раздел находится в разработке`, {
    parse_mode: "Markdown",
  });

  return handleStartMenu(ctx);
}

export async function handleAboutMenu(ctx: Context) {
  await ctx.editMessageText(
    `🌍 *CAPITALS* — твой личный тренажёр по столицам мира!\n\n` +
      `🧠 Я помогаю запоминать страны и столицы в лёгком игровом формате. Просто выбирай режим, нажимай *🚀 Начать* и тренируйся каждый день.\n\n` +
      `📈 Веду твою статистику, отслеживаю ошибки и напоминаю о том, что сегодня нужно пройти хотя бы один круг :)\n\n` +
      `_Версия MVP_`,
    {
      parse_mode: "Markdown",
    }
  );

  return handleStartMenu(ctx);
}
