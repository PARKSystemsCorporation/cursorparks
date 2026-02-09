export type ExecutionInputs = {
  mid: number;
  spread: number;
  size: number;
  liquidity: number;
  volatility: number;
  side: "buy" | "sell";
};

export function calcFillPrice({
  mid,
  spread,
  size,
  liquidity,
  volatility,
  side
}: ExecutionInputs) {
  const dir = side === "buy" ? 1 : -1;
  const slippage = Math.max(0.01, (size / 1000) * (1 / Math.max(0.2, liquidity)) * (0.4 + volatility));
  return mid + dir * (spread / 2 + slippage);
}
