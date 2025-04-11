import { Context } from "telegraf";
import { prisma } from "@/prisma";
import { handleStartMenu } from "@/services/menu.service";
import { relative } from "path/posix";

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

  const gameModeRecord: Record<string, string> = {
    capitals: "Угадай столицу",
    countries: "Угадай страну",
    hard: "Сложный",
    undefined: "Неизвестно",
  };
  const gameModeRu = gameModeRecord[value ?? "Неизвестно"];

  if (value === "hard") return handleStartMenu(ctx);

  await prisma.user.update({
    where: { telegramId: id },
    data: { gameMode: gameModeRu },
  });
  ctx.deleteMessage();
  return handleStartMenu(ctx);
}

export async function updateRegion(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;

  const regionRecord: Record<string, string> = {
    europe: "Европа",
    asia: "Азия",
    africa: "Африка",
    north: "Северная Америка",
    south: "Южная Америка",
    oceania: "Океания",
    all: "Все",
    undefined: "Неизвестно",
  };
  const regionRu = regionRecord[value ?? "Неизвестно"];

  await prisma.user.update({
    where: { telegramId: id },
    data: { preferredRegion: regionRu },
  });
  ctx.deleteMessage();
  return handleStartMenu(ctx);
}

export async function getUserInfo(ctx: Context) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;

  return await prisma.user.findUnique({
    where: { telegramId: id },
  });
}
