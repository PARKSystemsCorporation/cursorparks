import { prisma } from "./db";

let _cachedSeason: { data: { id: string; name: string; startsAt: Date; endsAt: Date }; expiresAt: number } | null = null;

export async function ensureCurrentSeason() {
  if (_cachedSeason && _cachedSeason.expiresAt > Date.now()) return _cachedSeason.data;
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59));
  const name = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}`;
  const existing = await prisma.season.findFirst({ where: { name } });
  const season = existing || await prisma.season.create({ data: { name, startsAt: start, endsAt: end } });
  _cachedSeason = { data: season, expiresAt: Date.now() + 60_000 };
  return season;
}
