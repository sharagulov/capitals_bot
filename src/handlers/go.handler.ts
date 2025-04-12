import { Context } from "telegraf";
import { clearSession, getSession, setSession } from "@/redis/session";
import { getPool } from "@/services/pool.service";
import { getUserInfo } from "@/services/update.service";
import {
  delay,
  formatToAdd,
  getRandomEmoji,
  getTimeDiffFormatted,
  randomInt,
} from "@/utils/helpers";
import { startHandler } from "./start.handler";

export async function goHandler(ctx: Context) {
  const userInfo = await getUserInfo(ctx);
  const session = await getSession(ctx.from!.id);
  if (session) return;
  const pool = await getPool(userInfo!.preferredRegion, userInfo!.poolSize);

  let currentIndex = randomInt(0, pool.length - 1);

  // Ключи для режима
  const askForMap: Record<string, keyof (typeof pool)[number]> = {
    "Угадай столицу": "name",
    "Угадай страну": "capital",
  };

  const askKey = askForMap[userInfo!.gameMode];

  const showFlagInQuestion = userInfo!.gameMode === "Угадай столицу";
  const flag =
    showFlagInQuestion && pool[currentIndex].flag
      ? `${pool[currentIndex].flag} `
      : "";
  const currentAsk = `${flag}${pool[currentIndex][askKey]}`;

  await setSession(ctx.from!.id, {
    pool,
    currentIndex,
    correct: [],
    incorrect: [],
    askMessageId: null,
  });

  const message = await ctx.reply(`*${currentAsk}*`, {
    parse_mode: "Markdown",
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: `${userInfo?.questionsMode ? "❓" : ""}`,
            callback_data: "force_callback",
          },
        ],
      ],
    },
  });

  await setSession(ctx.from!.id, {
    pool,
    dateStart: Date.now(),
    currentIndex,
    correct: [],
    incorrect: [],
    askMessageId: message.message_id,
  });
}

export async function sessionWatch(ctx: Context, forcedAnswer?: string) {
  const isTextMessage = ctx.message && "text" in ctx.message;
  const userAnswer =
    forcedAnswer ??
    (isTextMessage ? ctx.message.text?.trim().toLowerCase() : undefined);
  if (!userAnswer) return;

  const session = await getSession(ctx.from!.id);
  if (!session) {
    const reply = await ctx.reply("⏳ Кажется, нет активных сессий", {
      parse_mode: "Markdown",
    });
    await delay(2000);
    await ctx.deleteMessage(reply.message_id);
    return startHandler(ctx);
  }

  const { pool, dateStart, currentIndex, correct, incorrect, askMessageId } =
    session;
  const userInfo = await getUserInfo(ctx);

  const askForMap: Record<string, keyof (typeof pool)[number]> = {
    "Угадай столицу": "name",
    "Угадай страну": "capital",
  };
  const answerForMap: Record<string, keyof (typeof pool)[number]> = {
    "Угадай столицу": "capital",
    "Угадай страну": "name",
  };

  const askKey = askForMap[userInfo!.gameMode];
  const answerKey = answerForMap[userInfo!.gameMode];

  const correctAnswerRaw = pool[currentIndex][answerKey];
  const correctAnswer = correctAnswerRaw.trim().toLowerCase();

  const answerDisplay =
    userInfo!.gameMode === "Угадай страну" && pool[currentIndex].flag
      ? `${pool[currentIndex].flag} ${correctAnswerRaw}`
      : correctAnswerRaw;

  const isCorrect =
    userAnswer === correctAnswer ||
    (pool[currentIndex][formatToAdd(answerKey)] &&
      userAnswer ===
        pool[currentIndex][formatToAdd(answerKey)].trim().toLowerCase());

  if (isCorrect) {
    correct.push(pool[currentIndex]);

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `✅ Правильно, *${answerDisplay}*${
        pool[currentIndex][formatToAdd(answerKey)]
          ? ` (${pool[currentIndex][formatToAdd(answerKey)]})`
          : ""
      }`,
      { parse_mode: "Markdown" }
    );
    // Если ответ верный, удаляем текущий вопрос из пула
    pool.splice(currentIndex, 1);
  } else {
    incorrect.push(pool[currentIndex]);

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `❌ Правильный ответ: *${answerDisplay}*${
        pool[currentIndex][formatToAdd(answerKey)]
          ? ` (${pool[currentIndex][formatToAdd(answerKey)]})`
          : ""
      }`,
      { parse_mode: "Markdown" }
    );
  }

  await delay(2000);

  if (!forcedAnswer) {
    try {
      await ctx.deleteMessage();
    } catch (e) {
      console.warn("Ошибка удаления сообщения:", e);
    }
  }

  if (pool.length !== 0) {
    const nextIndex = randomInt(0, pool.length - 1);
    await setSession(ctx.from!.id, {
      ...session,
      currentIndex: nextIndex,
      correct,
      incorrect,
    });

    const showFlagInQuestion = userInfo!.gameMode === "Угадай столицу";
    const nextFlag =
      showFlagInQuestion && pool[nextIndex].flag
        ? `${pool[nextIndex].flag} `
        : "";
    const nextAsk = `${nextFlag}${pool[nextIndex][askKey]}`;
    const nextAskAdd = pool[nextIndex][formatToAdd(askKey)];

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `*${nextAsk}*${nextAskAdd ? ` (${nextAskAdd})` : ""}`,
      {
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: `${userInfo?.questionsMode ? "❓" : ""}`,
                callback_data: "force_callback",
              },
            ],
          ],
        },
      }
    );
  } else {
    const timeDifference = getTimeDiffFormatted(
      new Date(dateStart),
      new Date(Date.now())
    );
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `*${getRandomEmoji()} Молодец!* Круг завершен за ${timeDifference}, ошибки: ${
        incorrect.length
      }`,
      { parse_mode: "Markdown" }
    );
    clearSession(ctx.from!.id);
    goHandler(ctx);
  }
}
