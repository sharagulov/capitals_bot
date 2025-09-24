import { Context } from "telegraf";
import { getUserInfo, toggleHardModeFlag } from "@/services/update.service";
import { prisma } from "@/prisma";
import { abortSession } from "@/utils/helpers";
import { StatsService } from "@/services/stats.service";

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
          [{ text: "⬅️ Назад", callback_data: "settings_menu" }],
        ],
      },
    }
  );
}

export async function handleModeMenu(ctx: Context) {
  await ctx.editMessageText(
    `👉 Выбери *направление*, в котором хочешь играть:`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [{ text: "Угадай столицу", callback_data: "mode_capitals" }],
          [{ text: "Угадай страну", callback_data: "mode_countries" }],
          [{ text: "⬅️ Назад", callback_data: "settings_menu" }],
        ],
      },
    }
  );
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
          [{ text: "⬅️ Назад", callback_data: "settings_menu" }],
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

  ctx.deleteMessage();
  return handleStartMenu(ctx);
}

export async function handleStartMenu(ctx: Context) {
  const userInfo = await getUserInfo(ctx);

  await ctx.reply(
    `ГЛАВНОЕ МЕНЮ\n` +
      `— 🏃 Размер круга: ${userInfo?.poolSize}\n` +
      `— 🎲 Направление: ${userInfo?.gameMode}\n` +
      `— 🌏 Регион: ${userInfo?.preferredRegion}\n` +
      `— ❓ Вопросы: ${userInfo?.questionsMode ? "Включены" : "Отключены"}\n` +
      `— 🔥 Сложный режим: ${userInfo?.hardMode ? "Включен" : "Отключен"}`,
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

  if (!ctx.from) throw new Error("ctx.from missing");
  const tgId = ctx.from.id;

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(tgId) },
    select: { hardMode: true },
  });

  const hardLabel = user?.hardMode
    ? "🔥 Сложный режим: Вкл"
    : "🔥 Сложный режим: Выкл";

  await ctx.editMessageText(
    `⚙️ НАСТРОЙКИ\n\n` +
      `— *Круг* регулирует размер группы слов, которые предлагаются для отгадываня\n\n` +
      `— *Направление* переключает страна-столица или столица-страна\n\n` +
      `— *Регион* фильтрует страны по частям света\n\n` +
      `— *Вопросы* включает кнопку под каждым словом, которая показывает верный ответ\n\n` +
      `— *Сложный режим* - это проработка слабых мест на основе статистики\n`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "🏃 Круг", callback_data: "pool_menu" },
            { text: "🎲 Направление", callback_data: "mode_menu" },
            { text: "🌏 Регион", callback_data: "region_menu" },
          ],
          [
            { text: hardLabel, callback_data: "hard_toggle" }, // 🆕
          ],
          [
            { text: "⬅️ Назад", callback_data: "main_menu" },
            { text: "❓ Вопросы", callback_data: "questions_menu" },
          ],
        ],
      },
    }
  );
}

export async function handleHardModeToggle(ctx: Context) {
  if (!ctx.from) throw new Error("ctx.from missing");

  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(ctx.from.id) },
    select: { id: true, hardMode: true, preferredRegion: true, gameMode: true },
  });
  if (!user) throw new Error("User not found");

  const result = await toggleHardModeFlag(
    user.id,
    user.preferredRegion,
    user.gameMode
  );

  if (!result.updated && result.reason === "not_available") {
    return ctx.editMessageText(
      `🔥 У тебя пока мало статистики по: ${user.preferredRegion}. ` +
        "Поиграй немного, и тогда сможешь включить Сложный режим для неё.",
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [{ text: "⬅️ Назад", callback_data: "settings_menu" }],
          ],
        },
      }
    );
  }

  return handleSettingsMenu(ctx);
}

function fmtPct(n: number) {
  return `${n.toFixed(1)}%`;
}
export async function handleStatsMenu(ctx: Context) {
  await abortSession(ctx);
  if (!ctx.from) throw new Error("ctx.from missing");
  const userInfo = await (
    await import("@/services/update.service")
  ).getUserInfo(ctx);
  const userId = userInfo!.id;

  const [overview, byDir, topMistakes, byRegion, daily] = await Promise.all([
    StatsService.getOverview(userId),
    StatsService.getByDirection(userId),
    StatsService.getTopMistakes(userId, 5),
    StatsService.getByRegion(userId),
    StatsService.getDaily(userId, 7),
  ]);

  const mistakesStr = topMistakes.length
    ? topMistakes
        .map(
          (m, i) =>
            `${i + 1}. ${m.country.flag ? m.country.flag + " " : ""}*${
              m.country.name
            }* — ${m.count}`
        )
        .join("\n")
    : "_Ошибок пока нет — красиво!_";

  const regionsStr = byRegion.length
    ? byRegion
        .map((r) => `• ${r.region}: ${r.total} попыток, ${fmtPct(r.acc)}`)
        .join("\n")
    : "_Пока нет данных по регионам_";

  const dailyStr = daily.buckets
    .map(
      (b) =>
        `${b.date}: ${b.total}${
          b.total ? ` (${fmtPct((b.correct / (b.total || 1)) * 100)})` : ""
        }`
    )
    .join("\n");

  const text =
    `📊 *Твоя статистика*\n\n` +
    `Всего ответов: *${overview.total}*\n` +
    `Верных: *${overview.correct}*  •  Точность: *${fmtPct(
      overview.accuracy
    )}*\n` +
    `Последние 10: *${fmtPct(overview.last10Acc)}*\n\n` +
    `*По режимам*\n` +
    `— Угадай столицу (страна→столица): ${byDir.name.total} • ${fmtPct(
      byDir.name.acc
    )}\n` +
    `— Угадай страну (столица→страна): ${byDir.capital.total} • ${fmtPct(
      byDir.capital.acc
    )}\n\n` +
    `*ТОП ошибок*\n${mistakesStr}\n\n` +
    `*По дням (7д)*\n${daily.bar}\n${dailyStr}\n\n` +
    `*По регионам*\n${regionsStr}`;

  if ("callback_query" in ctx.update) {
    await ctx.editMessageText(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️ Назад", callback_data: "main_menu" },
            { text: "🗑 Сбросить", callback_data: "stats_reset" },
          ],
        ],
      },
    });
  } else {
    await ctx.reply(text, {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [
          [
            { text: "⬅️ Назад", callback_data: "main_menu" },
            { text: "🗑 Сбросить", callback_data: "stats_reset" },
          ],
        ],
      },
    });
  }
}

export async function handleStatsReset(ctx: Context) {
  await ctx.editMessageText("❓ Точно хотите удалить всю статистику?", {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          { text: "Да", callback_data: "stats_reset_confirm" },
          { text: "Отмена", callback_data: "stats_menu" },
        ],
      ],
    },
  });
}

export async function handleStatsResetConfirm(ctx: Context) {
  if (!ctx.from) return;
  const userInfo = await getUserInfo(ctx);
  if (!userInfo) return;

  await StatsService.reset(userInfo.id);

  return handleStatsMenu(ctx);
}

export async function handleAboutMenu(ctx: Context) {
  await abortSession(ctx);
  await ctx.editMessageText(
    `ℹ️ *О проекте CAPITALS*\n\n` +
      `Это бот для тренировки знаний столиц и стран.\n` +
      `✌ *Правила простые.* Запускается сессия, создается «круг» из столиц/стран. Сессия длится, пока ты не ответишь правильно на все слова из созданного круга. При неверном ответе столица/страна будет продолжать попадаться в данной сессии. Отгадаешь все слова из круга — начнется новая сессия. \n\n` +
      `🔹 *Поддерживает два направления:*\n` +
      `— Угадай столицу по стране\n` +
      `— Угадай страну по столице\n\n` +
      `🔹 *Есть настройка размера круга* (сколько заданий за сессию)\n` +
      `🔹 *Можно выбрать регион* (Европа, Азия и т.д.)\n\n` +
      `🔹 *Сохраняется статистика*\n\n` +
      `❇ Все столицы и страны, имеющие составные названия через дефис или пробел принимаются *без разделения* или *c пробелом*, пример:\n` +
      `✅ _Сент Китс = СентКитс_\n` +
      `❌ _Сент-Китс_\n\n` +
      `⚠️ *Возможные баги*\n` +
      `— Иногда бот не показывает информацию о том, правильный ли ответ\n` +
      `— Сильная зависимость скорости работы бота от качества интернет-соединения\n` +
      `— Потеря сессии после выхода во время игры (не страшно)\n\n` +
      `_Версия: MVP. Функционал в разработке_`,
    {
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[{ text: "⬅️ Назад", callback_data: "main_menu" }]],
      },
    }
  );
}

export async function goToMainMenu(ctx: Context) {
  ctx.deleteMessage();
  return handleStartMenu(ctx);
}
