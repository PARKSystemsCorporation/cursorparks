declare module "@/src/ui/BondSelection" {
  import type { FC } from "react";

  export interface BondSelectionDeployPayload {
    gender: string;
    type: string;
  }

  export interface BondSelectionProps {
    onDeploy?: (payload: BondSelectionDeployPayload) => void | Promise<void>;
    onCancel?: (() => void) | undefined;
  }

  const BondSelection: FC<BondSelectionProps>;
  export default BondSelection;
}
