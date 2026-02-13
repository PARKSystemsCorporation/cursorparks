declare module "@/src/ui/IntroTrainer" {
  import type { FC } from "react";
  export interface IntroTrainerProps {
    visible?: boolean;
    onComplete?: () => void;
  }
  const IntroTrainer: FC<IntroTrainerProps>;
  export default IntroTrainer;
}
