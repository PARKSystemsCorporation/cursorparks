"use client";

import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
};

export function MobileSheet({ children }: Props) {
  return (
    <div className="lg:hidden w-full">
      <div className="border-t border-white/5 bg-bg-panel/95 backdrop-blur">
        {children}
      </div>
    </div>
  );
}
