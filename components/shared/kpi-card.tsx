import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  delta,
  trend,
  ringColor = "hsl(var(--primary))",
  ringPercent = 60,
}: {
  label: string;
  value: string;
  delta: string;
  trend: "up" | "down";
  ringColor?: string;
  ringPercent?: number;
}) {
  const circumference = 2 * Math.PI * 15.5;
  const offset = circumference * (1 - ringPercent / 100);

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3.5 flex items-start justify-between">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
            {label}
          </div>
          <div className="font-display text-[26px] font-bold leading-none text-rg-ink">
            {value}
          </div>
        </div>
        <svg width="38" height="38" viewBox="0 0 36 36" className="shrink-0">
          <circle cx="18" cy="18" r="15.5" fill="none" stroke="#EEF0F8" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="15.5"
            fill="none"
            stroke={ringColor}
            strokeWidth="4"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 18 18)"
          />
        </svg>
      </div>
      <div
        className={cn(
          "text-[11.5px] font-semibold",
          trend === "up" ? "text-gofactory" : "text-destructive"
        )}
      >
        {trend === "up" ? "▲" : "▼"} {delta}
      </div>
    </div>
  );
}
