import { prisma } from "@/prisma";
import { getSession } from "@/redis/session";
import { Context } from "telegraf";

export async function getPool(region: string, count: number) {
  const where = region === "Все" ? {} : { region };

  const all = await prisma.country.findMany({
    where,
  });

  const shuffled = fisherYatesShuffle(all);
  return shuffled.slice(0, count);
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}