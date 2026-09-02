import { Target } from "lucide-react";

export type PartnerTargetData = {
  targetRevenue: number | null;
  targetMeetings: number | null;
  currency: string;
  actualRevenue: number;
  actualMeetings: number;
  monthLabel: string;
};

function fmtAmount(n: number, currency: string) {
  return currency + " " + n.toLocaleString("tr-TR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-rg-surface-alt">
      <div
        className="h-full rounded-full bg-primary transition-[width]"
        style={{ width: pct + "%" }}
      />
    </div>
  );
}

export function TargetWidget({ data }: { data: PartnerTargetData }) {
  const hasTarget = data.targetRevenue != null || data.targetMeetings != null;

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3.5 flex items-center gap-2">
        <Target className="h-4 w-4 text-primary" />
        <div className="text-[13px] font-bold text-rg-ink">Aylık Hedefim — {data.monthLabel}</div>
      </div>

      {!hasTarget ? (
        <p className="text-[12px] text-rg-ink-faint">Bu ay için henüz bir hedef belirlenmedi.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {data.targetRevenue != null && (
            <div>
              <div className="mb-1 flex items-baseline justify-between text-[12px]">
                <span className="text-rg-ink-soft">Ciro Hedefi</span>
                <span className="font-semibold text-rg-ink">
                  {fmtAmount(data.actualRevenue, data.currency)} / {fmtAmount(data.targetRevenue, data.currency)}
                </span>
              </div>
              <ProgressBar value={data.actualRevenue} max={data.targetRevenue} />
            </div>
          )}
          {data.targetMeetings != null && (
            <div>
              <div className="mb-1 flex items-baseline justify-between text-[12px]">
                <span className="text-rg-ink-soft">Toplantı Hedefi</span>
                <span className="font-semibold text-rg-ink">
                  {data.actualMeetings} / {data.targetMeetings}
                </span>
              </div>
              <ProgressBar value={data.actualMeetings} max={data.targetMeetings} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
