import { Context } from "telegraf";
import { registerUser } from "./register.service";
import { ADMIN_PASS } from "@/config/config";
import { getUserInfo } from "./update.service";
import { prisma } from "@/prisma";
import { clearSession } from "@/redis/session";
import { abortSession } from "@/utils/helpers";

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
          ],
          [
            { text: "Океания", callback_data: "region_oceania" },
            { text: "⭐ Все", callback_data: "region_all" },
          ],
        ],
      },
    }
  );
}

export async function handleQuestionsMenu(ctx: Context) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id } = ctx.from;

  const user = await prisma.user.findUnique({
    where: { telegramId: id },
    select: { questionsMode: true },
  });

  if (!user) throw new Error("User not found");

  const newMode = !user.questionsMode;

  await prisma.user.update({
    where: { telegramId: id },
    data: { questionsMode: newMode },
  });

  ctx.deleteMessage()
  return handleStartMenu(ctx);
}

export async function handleStartMenu(ctx: Context) {
  const userInfo = await getUserInfo(ctx);

  await ctx.reply(
    `ТЕКУЩИЕ УСТАНОВКИ\n` +
      `— 🏃 Размер круга: ${userInfo?.poolSize}\n` +
      `— 🎲 Режим игры: ${userInfo?.gameMode}\n` +
      `— 🌏 Регион: ${userInfo?.preferredRegion}\n` +
      `— ❓ Вопросы: ${userInfo?.questionsMode ? "Включены" : "Отключены"}`,
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
  await abortSession(ctx);
  await ctx.editMessageText(
    `⚙️ НАСТРОЙКИ\n\n` +
      `— *Круг* регулирует размер группы слов, которые предлагаются для отгадываня\n\n` +
      `— *Режим* переключает режим игры\n\n` +
      `— *Регион* фильтрует страны по частям света\n\n` +
      `— *Вопросы* включает кнопку под каждым словом, которая показывает верный ответ\n\n`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "Круг", callback_data: "pool_menu" },
            { text: "Режим", callback_data: "mode_menu" },
            { text: "Регион", callback_data: "region_menu" },
          ],
          [{ text: "Вопросы", callback_data: "questions_menu" }],
        ],
      },
    }
  );
}

export async function handleStatsMenu(ctx: Context) {
  await abortSession(ctx);
  await ctx.editMessageText(`😩 УПС! Этот раздел находится в разработке`, {
    parse_mode: "Markdown",
  });

  return handleStartMenu(ctx);
}

export async function handleAboutMenu(ctx: Context) {
  await abortSession(ctx);
  await ctx.reply(
    `ℹ️ *О проекте CAPITALS*\n\n` +
      `Это бот для тренировки знаний столиц и стран.\n` +
      `✌ *Правила простые.* Запускается сессия, создается «круг» из столиц/стран. Сессия длится, пока ты не ответишь правильно на все слова из созданного круга. При неверном ответе столица/страна будет продолжать попадаться в данной сессии. Отгадаешь все слова из круга — начнется новая сессия. \n` +
      `🔹 *Поддерживает два режима:*\n` +
      `— Угадай столицу по стране\n` +
      `— Угадай страну по столице\n\n` +
      `🔹 *Есть настройка размера круга* (сколько заданий за сессию)\n` +
      `🔹 *Можно выбрать регион* (Европа, Азия и т.д.)\n\n` +
      `🔹 *Сохраняется статистика* (в процессе доработки)\n\n` +
      `❇ Все столицы и страны, имеющие составные названия через дефис или пробел принимаются *без разделения* или *c пробелом*, пример:\n` +
      `✅ _Сент Китс = СентКитс_\n` +
      `❌ _Сент-Китс_\n\n` +
      `⚠️ *Возможные баги*\n` +
      `— Иногда бот не показывает информацию о том, правильный ли ответ\n` +
      `— Сильная зависимость скорости работы бота от качества интернет-соединения\n` +
      `— Потеря сесии после выхода во время игры (не страшно)\n\n` +
      `_Версия: MVP. Функционал в разработке_`,
    {
      parse_mode: "Markdown",
    }
  );

  return handleStartMenu(ctx);
}
