import { prisma } from "@/prisma";

export async function getCountryPool(region: string, count: number) {
  const where = region === "*" ? {} : { region };
  return await prisma.country.findMany({
    where,
    take: count,
  });
}
