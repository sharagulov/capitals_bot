import { Context } from "telegraf";
import { prisma } from "@/prisma";
import { handleStartMenu } from "@/services/menu.service";

export async function updatePoolSize(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;
  const newPoolSize = Number(value);

  await prisma.user.update({
    where: { telegramId: id },
    data: { poolSize: newPoolSize },
  });
  ctx.deleteMessage();
  return handleStartMenu(ctx);
}

export async function updateMode(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;
  const newMode = Boolean(value === "true" ? "true" : "false");

  await prisma.user.update({
    where: { telegramId: id },
    data: { gameMode: newMode },
  });
  ctx.deleteMessage();
  return handleStartMenu(ctx);
}
