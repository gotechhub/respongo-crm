import Link from "next/link";
import { BookOpen } from "lucide-react";
import { KpiCard } from "@/components/shared/kpi-card";
import { PartnerTasksWidget, type PartnerTaskRow } from "./tasks-widget";
import { CommissionWidget, type MyCommissionRow } from "./commission-widget";
import { PartnerMeetingsWidget, type PartnerMeetingRow } from "./meetings-widget";
import { TargetWidget, type PartnerTargetData } from "./target-widget";
import type { PartnerProfileRow } from "./onboarding-wizard";

export type PartnerStats = {
  poolCount: number;
  openLeadCount: number;
  pipelineText: string;
  activeCustomerCount: number;
  proposalsWonText: string;
};

const STATUS_LABEL: Record<PartnerProfileRow["status"], string> = {
  pending_review: "Onay Bekliyor",
  active: "Aktif",
  suspended: "Askıya Alındı",
};

const STATUS_CLASS: Record<PartnerProfileRow["status"], string> = {
  pending_review: "bg-golxp-tint text-golxp",
  active: "bg-gofactory-tint text-gofactory",
  suspended: "bg-destructive/10 text-destructive",
};

function fmtNumber(n: number) {
  return n.toLocaleString("tr-TR");
}

export function PartnerPanel({
  partnerProfile,
  stats,
  tasks,
  resourceCount,
  commissionEntries,
  meetings,
  target,
}: {
  partnerProfile: PartnerProfileRow;
  stats: PartnerStats;
  tasks: PartnerTaskRow[];
  resourceCount: number;
  commissionEntries: MyCommissionRow[];
  meetings: PartnerMeetingRow[];
  target: PartnerTargetData;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div>
          <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
            {partnerProfile.company_name || "Firma bilgisi eksik"}
          </div>
          <div className="mt-1 flex items-center gap-2">
            <span className={"rounded-full px-[10px] py-1 text-[11px] font-bold " + STATUS_CLASS[partnerProfile.status]}>
              {STATUS_LABEL[partnerProfile.status]}
            </span>
            {partnerProfile.commission_rate != null && (
              <span className="text-[12px] text-rg-ink-soft">
                Komisyon oranı: <strong className="text-rg-ink">%{partnerProfile.commission_rate}</strong>
              </span>
            )}
          </div>
        </div>
        {partnerProfile.status === "pending_review" && (
          <div className="max-w-[360px] rounded-[10px] bg-golxp-tint px-3.5 py-2.5 text-[11.5px] text-golxp">
            Kaydın Süper Admin onayını bekliyor. Onaylandığında komisyon oranın belirlenecek.
          </div>
        )}
        {partnerProfile.status === "suspended" && (
          <div className="max-w-[360px] rounded-[10px] bg-destructive/10 px-3.5 py-2.5 text-[11.5px] text-destructive">
            Hesabın askıya alındı — sorun olduğunu düşünüyorsan Süper Admin ile iletişime geç.
          </div>
        )}
      </div>

      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Havuz Kaydı"
          value={fmtNumber(stats.poolCount)}
          delta="toplam"
          trend="up"
          ringColor="#5E17EB"
          ringPercent={Math.min(100, stats.poolCount)}
        />
        <KpiCard
          label="Açık Lead"
          value={fmtNumber(stats.openLeadCount)}
          delta="pipeline"
          trend={stats.openLeadCount > 0 ? "up" : "down"}
          ringColor="#B9790E"
          ringPercent={Math.min(100, stats.openLeadCount)}
        />
        <KpiCard
          label="Aktif Müşteri"
          value={fmtNumber(stats.activeCustomerCount)}
          delta="toplam"
          trend={stats.activeCustomerCount > 0 ? "up" : "down"}
          ringColor="#238F00"
          ringPercent={Math.min(100, stats.activeCustomerCount)}
        />
        <KpiCard
          label="Kazanılan Teklif"
          value={stats.proposalsWonText}
          delta="toplam"
          trend="up"
          ringColor="hsl(var(--primary))"
          ringPercent={60}
        />
      </div>

      <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
        <div className="text-[11.5px] font-semibold uppercase tracking-[.3px] text-rg-ink-soft">
          Pipeline Değeri (açık lead&apos;ler)
        </div>
        <div className="font-display text-[19px] font-bold text-rg-ink">{stats.pipelineText}</div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <PartnerTasksWidget tasks={tasks} />
        </div>
        <Link
          href="/sales/resources"
          className="flex flex-col justify-between rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg transition-colors hover:bg-rg-surface-alt"
        >
          <div>
            <BookOpen className="mb-2.5 h-5 w-5 text-primary" />
            <div className="text-[13px] font-bold text-rg-ink">Kaynaklar</div>
            <p className="mt-1 text-[12px] text-rg-ink-soft">
              Satış konuşması, ürün tanıtımı, hedef kitle ve sözlük materyalleri.
            </p>
          </div>
          <div className="mt-3 text-[11.5px] font-semibold text-primary">{resourceCount} kaynak →</div>
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-5">
        <div className="col-span-2">
          <PartnerMeetingsWidget meetings={meetings} />
        </div>
        <TargetWidget data={target} />
      </div>

      <CommissionWidget entries={commissionEntries} />
    </div>
  );
}
