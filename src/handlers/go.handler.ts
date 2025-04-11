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
import { handleStartMenu } from "@/services/menu.service";

export async function goHandler(ctx: Context) {
  const userInfo = await getUserInfo(ctx);
  const pool = await getPool(userInfo!.preferredRegion, userInfo!.poolSize);
  let currentIndex = randomInt(0, pool.length - 1);

  const askForMap: Record<string, keyof (typeof pool)[number]> = {
    "Угадай столицу": "name",
    "Угадай страну": "capital",
  };

  const askKey = askForMap[userInfo!.gameMode];
  let currentAsk = pool[currentIndex][askKey];

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
    await ctx.deleteMessage();
    ctx.deleteMessage(reply.message_id);
    return;
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
  const correctAnswer = pool[currentIndex][answerKey];
  const correctAnswerAdd = pool[currentIndex][formatToAdd(answerKey)];

  const isCorrect = userAnswer === correctAnswer.trim().toLowerCase();

  if (isCorrect) {
    correct.push(pool[currentIndex]);

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `✅ Правильно, *${correctAnswer}* ${correctAnswerAdd ? `` : ""}`,
      {
        parse_mode: "Markdown",
      }
    );
    pool.splice(currentIndex, 1);
  } else {
    incorrect.push(pool[currentIndex]);

    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `❌ Правильный ответ: *${correctAnswer}* ${correctAnswerAdd ? `` : ""}`,
      {
        parse_mode: "Markdown",
      }
    );
  }

  if (!forcedAnswer) {
    setTimeout(async () => {
      ctx.deleteMessage();
    }, 2000);
  }

  const nextIndex = randomInt(0, pool.length - 1);

  if (pool.length !== 0) {
    await setSession(ctx.from!.id, {
      ...session,
      currentIndex: nextIndex,
      correct,
      incorrect,
    });

    await delay(2000);

    const currentAsk = pool[nextIndex][askKey];
    const currentAskAdd = pool[nextIndex][formatToAdd(askKey)];
    await ctx.telegram.editMessageText(
      ctx.chat!.id,
      askMessageId,
      undefined,
      `*${currentAsk}* ${currentAskAdd ? `` : ""}`,
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
      {
        parse_mode: "Markdown",
      }
    );
    clearSession(ctx.from!.id);
    goHandler(ctx);
  }
}
