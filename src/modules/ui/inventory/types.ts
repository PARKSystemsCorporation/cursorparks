export type ItemType = "capsule" | "token" | "part" | "scrap";

export interface InventoryItem {
  id: string;
  type: ItemType;
  /** For capsule: robot id or "training" */
  variant?: string;
  /** For capsule: chosen at bond selection (male | female) */
  gender?: "male" | "female";
  /** For token: amount */
  amount?: number;
}

export type PocketId = "pocketA" | "pocketB" | "cargoC" | "cargoD";

export const POCKET_SLOTS: Record<PocketId, number> = {
  pocketA: 2,
  pocketB: 1, // wallet
  cargoC: 4,
  cargoD: 4,
};

export interface DragState {
  item: InventoryItem;
  pocket: PocketId;
  slotIndex: number;
  /** True when drag started from EXOKIN device (bond), not quick bar */
  fromBond?: boolean;
}
