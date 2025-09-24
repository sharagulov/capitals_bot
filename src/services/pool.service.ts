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

type Direction = "name" | "capital";
export async function getHardPool(
  userId: number,
  region: string,
  direction: Direction,
  limit: number,
  k1 = 1,
  k2 = 3
) {
  const countryWhere = region === "Все" ? {} : { region };
  const countries = await prisma.country.findMany({
    where: countryWhere,
    select: {
      id: true,
      name: true,
      capital: true,
      flag: true,
      region: true,
      addName: true,
      addCapital: true,
    },
  });
  if (!countries.length) return [];

  const ids = countries.map((c) => c.id);

  const totals = await prisma.sessionStat.groupBy({
    by: ["countryId"],
    where: { userId, direction, countryId: { in: ids } },
    _count: { countryId: true },
  });

  const errors = await prisma.sessionStat.groupBy({
    by: ["countryId"],
    where: { userId, direction, isCorrect: false, countryId: { in: ids } },
    _count: { countryId: true },
  });

  const totalMap = new Map<number, number>();
  const errorMap = new Map<number, number>();
  totals.forEach((t) => totalMap.set(t.countryId, t._count.countryId));
  errors.forEach((e) => errorMap.set(e.countryId, e._count.countryId));

  const scored = countries.map((c) => {
    const total = totalMap.get(c.id) ?? 0;
    const err = errorMap.get(c.id) ?? 0;
    const score = err * k1 + (1 / (total + 1)) * k2;
    return { id: c.id, name: c.name, capital: c.capital, total, err, score };
  });

  scored.sort((a, b) =>
    b.score !== a.score
      ? b.score - a.score
      : b.err !== a.err
      ? b.err - a.err
      : a.total - b.total
  );

  const top = scored.slice(0, limit);
  const topIds = top.map((x) => x.id);

  const topCountries = await prisma.country.findMany({
    where: { id: { in: topIds } },
  });
  const order = new Map<number, number>();
  topIds.forEach((id, idx) => order.set(id, idx));
  topCountries.sort((a, b) => order.get(a.id)! - order.get(b.id)!);

  return topCountries;
}

function fisherYatesShuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
