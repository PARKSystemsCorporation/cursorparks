export const RANKS = [
  { name: "Intern", min: -Infinity },
  { name: "Analyst", min: 500 },
  { name: "Associate", min: 2_000 },
  { name: "VP", min: 8_000 },
  { name: "Director", min: 25_000 },
  { name: "Managing Director", min: 75_000 },
  { name: "Partner", min: 200_000 },
  { name: "Legend", min: 500_000 },
] as const;

export type RankInfo = {
  name: string;
  min: number;
  level: number;
  nextMin: number | null;
};

export function getRank(pnl: number): RankInfo {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (pnl >= RANKS[i].min) {
      return {
        name: RANKS[i].name,
        min: RANKS[i].min,
        level: i + 1,
        nextMin: RANKS[i + 1]?.min ?? null
      };
    }
  }
  return { name: RANKS[0].name, min: RANKS[0].min, level: 1, nextMin: RANKS[1].min };
}
