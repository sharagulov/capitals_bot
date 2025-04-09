import { Context } from "telegraf";
import { prisma } from "@/prisma";

export async function registerUser(ctx: Context, isAdmin: boolean) {
  if (!ctx.from) throw new Error("ctx.from missing");

  const { id, first_name, username } = ctx.from;

  const existing = await prisma.user.findUnique({
    where: { telegramId: id },
  });

  if (existing && isAdmin) {
    // ап до админа
    await prisma.user.update({
      where: { telegramId: id },
      data: { isAdmin: true },
    });

    return { user: existing, newUser: false, adminGiven: true };
  }

  if (existing && !isAdmin) {
    // челик просто написал /start
    await prisma.user.update({
      where: { telegramId: id },
      data: { isAdmin: false },
    });

    return { user: existing, newUser: false, adminGiven: false };
  }

  if (!existing) { // чел еще ни разу не заходил
    const created = await prisma.user.create({
      data: {
        username: username ?? `user${id}`,
        shortName: first_name,
        telegramId: id,
        isAdmin,
      },
    });

    return { user: created, newUser: true, adminGiven: isAdmin };
  }

  throw new Error("registerUser(): unreachable state");

}
