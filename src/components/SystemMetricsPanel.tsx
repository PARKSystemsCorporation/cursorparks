import { useMemo } from "react";

type DigestMetrics = {
  lastRunAt: number;
  lastDurationMs: number;
  errorCount: number;
  runs: number;
  inFlight: boolean;
};

export type SystemMetrics = {
  online: number;
  totalVisitors: number;
  server: { startedAt: number; uptimeSec: number };
  digest: DigestMetrics;
};

type GaugeProps = {
  label: string;
  value: string;
  percent: number;
  color: string;
  subLabel?: string;
};

function Gauge({ label, value, percent, color, subLabel }: GaugeProps) {
  const safePercent = Math.max(0, Math.min(1, percent));
  const angle = Math.round(safePercent * 360);
  const bg = useMemo(
    () => ({
      background: `conic-gradient(${color} ${angle}deg, rgba(255,255,255,0.08) 0deg)`
    }),
    [color, angle]
  );
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[9px] uppercase tracking-[0.25em] text-white/60">{label}</div>
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full" style={bg} />
        <div className="absolute inset-2 rounded-full bg-bg-void/90 border border-white/5" />
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-mono text-sm font-semibold text-white">{value}</div>
          {subLabel && <div className="text-[9px] text-white/60">{subLabel}</div>}
        </div>
      </div>
    </div>
  );
}

type BarProps = {
  label: string;
  value: string;
  percent: number;
  color: string;
  hint?: string;
};

function MetricBar({ label, value, percent, color, hint }: BarProps) {
  const safePercent = Math.max(0, Math.min(1, percent));
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
      <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-white/60">
        <span>{label}</span>
        <span className="text-white/80">{value}</span>
      </div>
      <div className="mt-2 h-2 w-full rounded-full bg-white/10 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${safePercent * 100}%`, background: color }} />
      </div>
      {hint && <div className="mt-1 text-[9px] text-white/50">{hint}</div>}
    </div>
  );
}

export function SystemMetricsPanel({ metrics }: { metrics: SystemMetrics | null }) {
  if (!metrics) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-center text-[11px] text-white/60">
        Initializing system telemetry...
      </div>
    );
  }

  const now = Date.now();
  const lastRunAgeSec = metrics.digest.lastRunAt ? Math.max(0, Math.floor((now - metrics.digest.lastRunAt) / 1000)) : null;
  const lastRunLabel = metrics.digest.lastRunAt ? `${lastRunAgeSec}s ago` : "pending";
  const durationMs = metrics.digest.lastDurationMs || 0;
  const durationPercent = Math.min(1, durationMs / 1000);
  const reliability = metrics.digest.runs > 0 ? Math.max(0, 1 - metrics.digest.errorCount / metrics.digest.runs) : 1;
  const activity = metrics.online > 0 ? Math.min(1, metrics.online / Math.max(1, Math.sqrt(metrics.totalVisitors))) : 0.05;
  const uptimeHours = Math.floor((metrics.server?.uptimeSec || 0) / 3600);
  const uptimeLabel = uptimeHours > 0 ? `${uptimeHours}h` : `${Math.floor((metrics.server?.uptimeSec || 0) / 60)}m`;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Gauge
          label="Online"
          value={`${metrics.online}`}
          percent={activity}
          color="#00f0ff"
          subLabel="live users"
        />
        <Gauge
          label="Visitors"
          value={`${metrics.totalVisitors}`}
          percent={Math.min(1, metrics.totalVisitors / 10000)}
          color="#7afcff"
          subLabel="all time"
        />
        <Gauge
          label="Digest"
          value={`${Math.round(reliability * 100)}%`}
          percent={reliability}
          color={reliability > 0.99 ? "#67ffb3" : reliability > 0.9 ? "#ffb86b" : "#ff6b6b"}
          subLabel={lastRunLabel}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <MetricBar
          label="Digest Duration"
          value={`${durationMs} ms`}
          percent={durationPercent}
          color={durationMs > 500 ? "#ff6b6b" : "#67ffb3"}
          hint="Target under 500ms"
        />
        <MetricBar
          label="Uptime"
          value={uptimeLabel}
          percent={Math.min(1, (metrics.server?.uptimeSec || 0) / 86400)}
          color="#7afcff"
          hint={`Started ${new Date(metrics.server?.startedAt || now).toLocaleString()}`}
        />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 text-[10px] uppercase tracking-[0.2em] text-white/60">
        <div className="flex flex-wrap items-center gap-3">
          <span>Runs {metrics.digest.runs}</span>
          <span>Errors {metrics.digest.errorCount}</span>
          <span>Status {metrics.digest.inFlight ? "running" : "idle"}</span>
          <span>Last {lastRunLabel}</span>
        </div>
      </div>
    </div>
  );
}
