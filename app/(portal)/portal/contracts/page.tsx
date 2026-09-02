import Link from "next/link";
import { Download } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignedDocumentDownloadButton } from "@/components/storage/signed-document-download-button";

type ContractRow = {
  id: string;
  title: string;
  total_amount: number;
  currency: string;
  created_at: string;
  approval_method: "e_approval" | "signed_upload" | null;
  signed_document_url: string | null;
};

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${n.toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

// "Sözleşmelerim" = kabul edilmiş (status='accepted') teklifler — Teklif Şablonları 2.0'ın
// çok sayfalı PDF'i (kapak/kapsam/hukuki metin/banka/imza dahil) zaten bir teklifi tam bir
// sözleşme belgesine dönüştürüyor, bu yüzden ayrı bir "contracts" tablosu açmak yerine kabul
// edilmiş teklifler bu sayfada sözleşme olarak listeleniyor. RLS (proposals_customer_select)
// zaten sadece bu müşteriye ait teklifleri döndürüyor.
export default async function PortalContractsPage() {
  const supabase = createClient();
  const { data: contractRows } = await supabase
    .from("proposals")
    .select("id, title, total_amount, currency, created_at, approval_method, signed_document_url")
    .eq("status", "accepted")
    .order("created_at", { ascending: false });

  const rows = (contractRows ?? []) as ContractRow[];

  return (
    <>
      <div className="mb-6">
        <h1 className="font-display text-[22px] font-bold text-rg-ink">Sözleşmelerim</h1>
        <p className="text-[13px] text-rg-ink-soft">
          Kabul ettiğin teklifler burada sözleşme olarak listelenir — PDF olarak indirebilir, imzalı
          yüklediğin belgeye tekrar ulaşabilirsin.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Henüz kabul edilmiş bir sözleşmen yok.
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {rows.map((row) => (
            <div key={row.id} className="rounded-2xl border border-rg-line bg-rg-surface px-5 py-4 shadow-rg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <Link href={`/portal/proposals/${row.id}`} className="text-[13.5px] font-bold text-rg-ink hover:text-primary">
                    {row.title}
                  </Link>
                  <div className="mt-0.5 text-[12px] text-rg-ink-soft">
                    {fmtMoney(row.total_amount, row.currency)} · {fmtDate(row.created_at)}
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-gofactory-tint px-[10px] py-1 text-[11px] font-bold text-gofactory">
                  Onaylandı
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <a
                  href={`/api/proposals/${row.id}/pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                  PDF İndir
                </a>
                {row.signed_document_url && (
                  <SignedDocumentDownloadButton path={row.signed_document_url} label="Yüklediğin İmzalı Belge" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
