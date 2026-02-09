"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function MobileSheet({ children }: Props) {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40">
      <div className="rounded-t-2xl border-t border-white/5 bg-bg-panel/95 shadow-glass backdrop-blur">
        {children}
      </div>
    </div>
  );
}
