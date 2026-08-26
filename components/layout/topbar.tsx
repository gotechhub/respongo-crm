import { Search, Bell } from "lucide-react";

export function Topbar({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="font-display text-[22px] font-bold text-rg-ink">{title}</h1>
        {subtitle && <div className="text-[13px] text-rg-ink-soft">{subtitle}</div>}
      </div>
      <div className="flex items-center gap-2.5">
        <div className="flex w-[220px] items-center gap-2 rounded-[10px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.5px] text-rg-ink-faint">
          <Search className="h-3.5 w-3.5" />
          Ara...
        </div>
        <div className="flex overflow-hidden rounded-[10px] border border-rg-line bg-white">
          <span className="bg-golms-tint px-[11px] py-2 text-[11.5px] font-semibold text-golms">
            TR
          </span>
          <span className="px-[11px] py-2 text-[11.5px] font-semibold text-rg-ink-faint">
            EN
          </span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-rg-line bg-rg-surface text-rg-ink-soft">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
