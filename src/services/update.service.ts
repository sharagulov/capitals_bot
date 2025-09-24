import { Context } from "telegraf";
import { prisma } from "@/prisma";
import { handleSettingsMenu, handleStartMenu } from "@/services/menu.service";
import { relative } from "path/posix";
import { StatsService } from "./stats.service";

export async function updatePoolSize(ctx: Context, value: string) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;
  const newPoolSize = Number(value);

  await prisma.user.update({
    where: { telegramId: id },
    data: { poolSize: newPoolSize },
  });
  ctx.deleteMessage();
  return handleSettingsMenu(ctx);
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

  if (value === "hard") return handleSettingsMenu(ctx);

  await prisma.user.update({
    where: { telegramId: id },
    data: { gameMode: gameModeRu },
  });
  ctx.deleteMessage();
  return handleSettingsMenu(ctx);
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
  return handleSettingsMenu(ctx);
}

export async function toggleHardModeFlag(
  userId: number,
  preferredRegion: string,
  gameMode: string
) {
  const direction =
    gameMode === "Угадай столицу" ? "name" : ("capital" as const);

  const available = await StatsService.hardModeAvailable(
    userId,
    preferredRegion,
    direction,
    3
  );
  if (!available) {
    return { updated: false, reason: "not_available" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { hardMode: true },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { hardMode: !user?.hardMode },
  });

  return { updated: true };
}

export async function getUserInfo(ctx: Context) {
  if (!ctx.from) throw new Error("ctx.from missing");
  const { id, first_name, username } = ctx.from;

  return await prisma.user.findUnique({
    where: { telegramId: id },
  });
}
