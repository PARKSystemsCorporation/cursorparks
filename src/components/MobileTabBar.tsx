"use client";

type TabDef = { id: string; label: string; badge?: string };

type Props = {
  tabs: ReadonlyArray<TabDef>;
  active: string;
  onChange: (id: string) => void;
};

export function MobileTabBar({ tabs, active, onChange }: Props) {
  return (
    <div className="border-t border-white/5 bg-bg-panel/95 backdrop-blur">
      <div className="safe-bottom flex items-center justify-between px-2 py-2">
        {tabs.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`flex min-h-[44px] flex-1 flex-col items-center justify-center gap-0.5 rounded-md px-1 text-[11px] font-semibold uppercase tracking-[0.18em] transition-all duration-200 ${
                isActive
                  ? "bg-white/10 text-white shadow-glow-cyan"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="rounded border border-neon-cyan/30 bg-neon-cyan/10 px-1.5 py-0.5 text-[9px] text-neon-cyan">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
