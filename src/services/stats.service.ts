import { prisma } from "@/prisma";

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

  static async getSummary(userId: number) {
    const total = await prisma.sessionStat.count({ where: { userId } });
    const correct = await prisma.sessionStat.count({
      where: { userId, isCorrect: true },
    });

    return {
      total,
      correct,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
    };
  }

  static async getRecent(userId: number, limit = 10) {
    return prisma.sessionStat.findMany({
      where: { userId },
      include: { country: true },
      orderBy: { timestamp: "desc" },
      take: limit,
    });
  }
}
