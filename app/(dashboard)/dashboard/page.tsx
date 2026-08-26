import { Topbar } from "@/components/layout/topbar";
import { KpiCard } from "@/components/shared/kpi-card";

export default function DashboardPage() {
  return (
    <>
      <Topbar
        title="Master Dashboard"
        subtitle="Hoş geldin Selçuk — bugün şirketinde neler oluyor, tek ekranda."
      />
      <div className="grid grid-cols-4 gap-4">
        <KpiCard
          label="Açık Teklifler"
          value="18"
          delta="%12 bu ay"
          trend="up"
          ringColor="hsl(var(--primary))"
          ringPercent={64}
        />
        <KpiCard
          label="Pipeline Değeri"
          value="$284K"
          delta="%8 bu ay"
          trend="up"
          ringColor="#238F00"
          ringPercent={76}
        />
        <KpiCard
          label="Aktif Projeler"
          value="9"
          delta="2 gecikmede"
          trend="down"
          ringColor="#B9790E"
          ringPercent={45}
        />
        <KpiCard
          label="Bu Ay Kapanan"
          value="6"
          delta="%20 bu ay"
          trend="up"
          ringColor="#5E17EB"
          ringPercent={55}
        />
      </div>
    </>
  );
}
