import { clearSession, getSession } from "@/redis/session";
import { Context } from "telegraf";

export function escapeMarkdown(text: string) {
  return text.replace(/[_*[\]()~`>#+=|{}.!-]/g, "\\$&");
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function formatToAdd(str: any) {
  return "add" + str[0].toUpperCase() + str.slice(1);
}

export function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getTimeDiffFormatted(date1: Date, date2: Date): string {
  const diffMs = Math.abs(date1.getTime() - date2.getTime());

  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
  const seconds = Math.floor((diffMs / 1000) % 60);

  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function getRandomEmoji(): string {
  const emojis = [
    "😊",
    "😁",
    "😉",
    "🔥",
    "🎯",
    "😘",
    "✨",
    "💎",
    "💌",
    "😻",
    "😏",
    "😽",
    "💫",
    "❤",
    "🎉",
    "🎀",
    "🍪",
    "🍒",
    "🌹",
    "🌸",
  ];
  const index = Math.floor(Math.random() * emojis.length);
  return emojis[index];
}

export async function abortSession(ctx: Context) {
  const session = await getSession(ctx.from!.id);
  if (!session) return;
  const { pool, dateStart, currentIndex, correct, incorrect, askMessageId } =
    session;
  ctx.deleteMessage(askMessageId);
  clearSession(ctx.from!.id);
}
