import { cn } from "@/lib/utils";

export type LeadStatus = "yeni" | "gorusme" | "teklif" | "musteri";

const LABEL: Record<LeadStatus, string> = {
  yeni: "Yeni",
  gorusme: "Görüşme",
  teklif: "Teklif",
  musteri: "Müşteri",
};

const CLASS: Record<LeadStatus, string> = {
  yeni: "bg-golms-tint text-golms",
  gorusme: "bg-gocatalog-tint text-gocatalog",
  teklif: "bg-golxp-tint text-golxp",
  musteri: "bg-gofactory-tint text-gofactory",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold",
        CLASS[status]
      )}
    >
      {LABEL[status]}
    </span>
  );
}
