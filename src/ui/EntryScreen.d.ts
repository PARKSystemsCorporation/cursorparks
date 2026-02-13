declare module "@/src/ui/EntryScreen" {
  import type { FC } from "react";
  export interface EntryScreenProps {
    onEnter: (arg: { type: "handle"; handle: string } | { type: "guest" }) => void;
    onFirstTimeIntro?: () => void;
  }
  const EntryScreen: FC<EntryScreenProps>;
  export default EntryScreen;
}
