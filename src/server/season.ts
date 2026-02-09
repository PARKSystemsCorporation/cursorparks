import { prisma } from "./db";

export async function ensureCurrentSeason() {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const name = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  const existing = await prisma.season.findFirst({ where: { name } });
  if (existing) return existing;
  return prisma.season.create({ data: { name, startsAt: start, endsAt: end } });
}
