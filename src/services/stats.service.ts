// src/services/stats.service.ts
import { prisma } from "@/prisma";
import { subDays, startOfDay, endOfDay } from "date-fns";

const blocks = ["▁", "▂", "▃", "▄", "▅", "▆", "▇", "█"];
function spark(values: number[]) {
  if (!values.length) return "";
  const max = Math.max(...values);
  if (max === 0) return blocks[0].repeat(values.length);
  return values
    .map(
      (v) =>
        blocks[
          Math.min(
            blocks.length - 1,
            Math.floor((v / max) * (blocks.length - 1))
          )
        ]
    )
    .join("");
}

type Direction = "name" | "capital";

export class StatsService {
  static async addMany(
    userId: number,
    answers: { countryId: number; isCorrect: boolean; direction: string }[]
  ) {
    if (!answers?.length) return { count: 0 };
    return prisma.sessionStat.createMany({
      data: answers.map((a) => ({
        userId,
        countryId: a.countryId,
        isCorrect: a.isCorrect,
        direction: a.direction,
      })),
    });
  }

  static async getOverview(userId: number) {
    const total = await prisma.sessionStat.count({ where: { userId } });
    const correct = await prisma.sessionStat.count({
      where: { userId, isCorrect: true },
    });
    const last10 = await prisma.sessionStat.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: { isCorrect: true },
    });
    const last10Acc =
      last10.length === 0
        ? 0
        : (last10.filter((x) => x.isCorrect).length / last10.length) * 100;

    return {
      total,
      correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      last10Acc,
    };
  }

  static async getByDirection(userId: number) {
    const totalName = await prisma.sessionStat.count({
      where: { userId, direction: "name" },
    });
    const correctName = await prisma.sessionStat.count({
      where: { userId, direction: "name", isCorrect: true },
    });

    const totalCapital = await prisma.sessionStat.count({
      where: { userId, direction: "capital" },
    });
    const correctCapital = await prisma.sessionStat.count({
      where: { userId, direction: "capital", isCorrect: true },
    });

    return {
      name: {
        total: totalName,
        correct: correctName,
        acc: totalName ? (correctName / totalName) * 100 : 0,
      },
      capital: {
        total: totalCapital,
        correct: correctCapital,
        acc: totalCapital ? (correctCapital / totalCapital) * 100 : 0,
      },
    };
  }

  static async getTopMistakes(userId: number, limit = 5) {
    const groups = await prisma.sessionStat.groupBy({
      by: ["countryId"],
      where: { userId, isCorrect: false },
      _count: { countryId: true },
      orderBy: { _count: { countryId: "desc" } },
      take: limit,
    });

    if (!groups.length) return [];

    const ids = groups.map((g) => g.countryId);
    const countries = await prisma.country.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, capital: true, flag: true, region: true },
    });

    return groups.map((g) => {
      const c = countries.find((x) => x.id === g.countryId)!;
      return {
        count: g._count.countryId,
        country: c,
      };
    });
  }

  static async getByRegion(userId: number) {
    const regions = [
      "Европа",
      "Азия",
      "Африка",
      "Северная Америка",
      "Южная Америка",
      "Океания",
    ];
    const result: {
      region: string;
      total: number;
      correct: number;
      acc: number;
    }[] = [];

    for (const region of regions) {
      const total = await prisma.sessionStat.count({
        where: { userId, country: { region } },
      });
      const correct = await prisma.sessionStat.count({
        where: { userId, isCorrect: true, country: { region } },
      });
      result.push({
        region,
        total,
        correct,
        acc: total ? (correct / total) * 100 : 0,
      });
    }
    return result.filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }

  static async getDaily(userId: number, days = 7) {
    const today = new Date();
    const buckets: { date: string; total: number; correct: number }[] = [];

    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(today, i);
      const from = startOfDay(day);
      const to = endOfDay(day);

      const total = await prisma.sessionStat.count({
        where: { userId, timestamp: { gte: from, lte: to } },
      });
      const correct = await prisma.sessionStat.count({
        where: { userId, isCorrect: true, timestamp: { gte: from, lte: to } },
      });

      buckets.push({
        date: from.toISOString().slice(5, 10),
        total,
        correct,
      });
    }

    const totals = buckets.map((b) => b.total);
    const bar = spark(totals);

    return { buckets, bar };
  }

  static async reset(userId: number) {
    const deleted = await prisma.sessionStat.deleteMany({
      where: { userId },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { hardMode: false },
    });

    return deleted.count;
  }

  // pool stuff

  static async hardModeAvailable(
    userId: number,
    region: string,
    direction: Direction,
    minCountries = 20
  ) {
    const countryWhere = region === "Все" ? {} : { region };
    const countries = await prisma.country.findMany({
      where: countryWhere,
      select: { id: true },
    });
    if (!countries.length) return false;
    const ids = countries.map((c) => c.id);

    const totals = await prisma.sessionStat.groupBy({
      by: ["countryId"],
      where: {
        userId,
        direction,
        countryId: { in: ids },
      },
      _count: { countryId: true },
    });

    const nonZero = totals.filter((t) => t._count.countryId > 0);
    return nonZero.length >= minCountries;
  }
}
