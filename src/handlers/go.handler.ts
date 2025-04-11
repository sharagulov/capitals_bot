import { Context } from "telegraf";
import { clearSession, getSession, setSession } from "@/redis/session";
import { getPool } from "@/services/pool.service";
import { getUserInfo } from "@/services/update.service";
import { randomInt } from "@/utils/helpers";

export async function goHandler(ctx: Context) {
  ctx.deleteMessage();
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
  });

  await ctx.reply(`*${currentAsk}*`, { parse_mode: "Markdown" });
}

export async function sessionWatch(ctx: Context) {
  if (!("text" in ctx.message!)) return;

  const session = await getSession(ctx.from!.id);
  if (!session) return;

  const { pool, currentIndex, correct, incorrect } = session;
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

  const userAnswer = ctx.message?.text.trim().toLowerCase();
  const isCorrect = userAnswer === correctAnswer.trim().toLowerCase();

  if (isCorrect) {
    correct.push(pool[currentIndex]);
    await ctx.reply(`✅ Правильно, ${correctAnswer}!`, {
      parse_mode: "Markdown",
    });
    pool.splice(currentIndex, 1);
    console.log(pool)
  } else {
    incorrect.push(pool[currentIndex]);
    await ctx.reply(`❌ Правильный ответ: ${correctAnswer}!`, {
      parse_mode: "Markdown",
    });
  }

  const nextIndex = randomInt(0, pool.length - 1);

  if (pool.length !== 0) {
    await setSession(ctx.from!.id, {
      ...session,
      currentIndex: nextIndex,
      correct,
      incorrect,
    });

    const currentAsk = pool[nextIndex][askKey];
    ctx.reply(`*${currentAsk}*`, { parse_mode: "Markdown" });
  } else {
    clearSession(ctx.from!.id);
    goHandler(ctx);
    console.log("END")
  }
}
