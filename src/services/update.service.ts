import { Context } from "telegraf";
import { prisma } from "@/prisma";

export async function updatePoolSize(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;
  const newPoolSize = Number(value);

  return await prisma.user.update({
    where: { telegramId: id },
    data: { poolSize: newPoolSize },
  });
}

export async function updateMode(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;
  const newMode = Boolean(value === "true" ? "true" : "false");

  return await prisma.user.update({
    where: { telegramId: id },
    data: { gameMode: newMode },
  });
}
