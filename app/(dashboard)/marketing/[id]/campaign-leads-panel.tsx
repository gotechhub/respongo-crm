"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Link2, Loader2, Search, Unlink } from "lucide-react";
import {
  attachLeadToCampaign,
  detachLeadFromCampaign,
  searchLeadsForAttach,
  type LeadSearchRow,
} from "../actions";

export type AttachedLead = {
  id: string;
  company_name: string;
  contact_name: string | null;
  status: string;
  converted_customer_id: string | null;
};

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

export function CampaignLeadsPanel({ campaignId, attached }: { campaignId: string; attached: AttachedLead[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LeadSearchRow[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  function handleSearch() {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setSearching(true);
    setError("");
    startTransition(async () => {
      const rows = await searchLeadsForAttach(query);
      setResults(rows);
      setSearching(false);
    });
  }

  function handleAttach(leadId: string) {
    setError("");
    startTransition(async () => {
      const result = await attachLeadToCampaign(leadId, campaignId);
      if (result.ok) {
        setResults((r) => r.filter((row) => row.id !== leadId));
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDetach(leadId: string) {
    setError("");
    startTransition(async () => {
      const result = await detachLeadFromCampaign(leadId, campaignId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-4 text-[13px] font-bold text-rg-ink">Bağlı Lead&apos;ler</div>

      <div className="mb-3 flex items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="Şirket adıyla lead ara ve bağla..."
          className={`${inputClass} flex-1`}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isPending}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-rg-surface-alt px-3 py-2 text-[11.5px] font-semibold text-rg-ink transition-colors hover:bg-rg-line disabled:opacity-50"
        >
          {searching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
          Ara
        </button>
      </div>

      {results.length > 0 && (
        <div className="mb-4 flex flex-col gap-1.5 rounded-[10px] border border-rg-line p-2">
          {results.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-[8px] px-2 py-1.5 hover:bg-rg-surface-alt">
              <div className="text-[12px] text-rg-ink">
                {lead.company_name}
                {lead.contact_name && <span className="ml-1.5 text-rg-ink-faint">· {lead.contact_name}</span>}
              </div>
              <button
                type="button"
                onClick={() => handleAttach(lead.id)}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-[7px] bg-primary/10 px-2 py-1 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
              >
                <Link2 className="h-3 w-3" />
                Bağla
              </button>
            </div>
          ))}
        </div>
      )}
      {query && !searching && results.length === 0 && (
        <div className="mb-4 text-[11.5px] text-rg-ink-faint">Eşleşen, henüz bağlanmamış lead bulunamadı.</div>
      )}

      {attached.length === 0 ? (
        <p className="text-[12px] text-rg-ink-faint">
          Bu kampanyaya henüz lead bağlanmadı — yukarıdan arayıp bağlayabilirsin.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {attached.map((lead) => (
            <div key={lead.id} className="flex items-center justify-between rounded-[8px] px-2 py-1.5">
              <Link href="/sales/leads" className="text-[12.5px] font-semibold text-rg-ink hover:text-primary">
                {lead.company_name}
                {lead.contact_name && (
                  <span className="ml-1.5 text-[11px] font-normal text-rg-ink-faint">{lead.contact_name}</span>
                )}
              </Link>
              <div className="flex items-center gap-2">
                {lead.converted_customer_id && (
                  <span className="rounded-full bg-gofactory-tint px-2 py-0.5 text-[10.5px] font-bold text-gofactory">
                    Müşteriye dönüştü
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleDetach(lead.id)}
                  disabled={isPending}
                  className="inline-flex items-center gap-1 text-rg-ink-faint transition-colors hover:text-destructive disabled:opacity-50"
                  title="Kampanyadan kaldır"
                >
                  <Unlink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-3 text-[12px] text-destructive">{error}</div>}
    </div>
  );
}
