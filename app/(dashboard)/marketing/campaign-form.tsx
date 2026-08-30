"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { createCampaign, type CampaignChannel, type CampaignInput } from "./actions";
import type { ProductKey } from "../sales/proposals/actions";

export const CAMPAIGN_CHANNEL_LABEL: Record<CampaignChannel, string> = {
  google_ads: "Google Reklamları",
  linkedin_ads: "LinkedIn Reklamları",
  instagram_ads: "Instagram Reklamları",
  youtube_ads: "YouTube Reklamları",
  email: "E-posta Kampanyası",
  content: "İçerik Pazarlaması",
  webinar: "Webinar",
  event: "Etkinlik",
  referral_program: "Referans Programı",
  partnership: "İş Ortaklığı",
  other: "Diğer",
};

const CAMPAIGN_CHANNEL_KEYS = Object.keys(CAMPAIGN_CHANNEL_LABEL) as CampaignChannel[];

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL) as ProductKey[];

const CURRENCIES = ["USD", "EUR", "TRY", "GBP"];

export const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
export const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export function CampaignFormFields({
  form,
  set,
  regionLocked,
}: {
  form: CampaignInput;
  set: <K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) => void;
  /** founder olmayan roller için bölge alanı kilitli — sadece kendi bölgesinde kampanya açabilir. */
  regionLocked: Region | null;
}) {
  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Kampanya Adı *</label>
        <input required value={form.name} onChange={(e) => set("name", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Kanal *</label>
        <select
          value={form.channel}
          onChange={(e) => set("channel", e.target.value as CampaignChannel)}
          className={inputClass}
        >
          {CAMPAIGN_CHANNEL_KEYS.map((c) => (
            <option key={c} value={c}>
              {CAMPAIGN_CHANNEL_LABEL[c]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Ürün</label>
        <select
          value={form.product}
          onChange={(e) => set("product", e.target.value as ProductKey | "")}
          className={inputClass}
        >
          <option value="">Genel ekosistem</option>
          {PRODUCT_KEYS.map((p) => (
            <option key={p} value={p}>
              {PRODUCT_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bölge {regionLocked ? "" : "*"}</label>
        {regionLocked ? (
          <input disabled value={REGION_LABELS_TR[regionLocked]} className={`${inputClass} opacity-60`} />
        ) : (
          <select value={form.region} onChange={(e) => set("region", e.target.value as Region | "")} className={inputClass}>
            <option value="">Global (tüm bölgeler)</option>
            <option value="tr">{REGION_LABELS_TR.tr}</option>
            <option value="global">{REGION_LABELS_TR.global}</option>
          </select>
        )}
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bütçe</label>
        <input
          type="number"
          min={0}
          value={form.budget || ""}
          onChange={(e) => set("budget", Number(e.target.value) || 0)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Para Birimi</label>
        <select value={form.currency} onChange={(e) => set("currency", e.target.value)} className={inputClass}>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Başlangıç Tarihi</label>
        <input
          type="date"
          value={form.startDate}
          onChange={(e) => set("startDate", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Bitiş Tarihi</label>
        <input
          type="date"
          value={form.endDate}
          onChange={(e) => set("endDate", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Hedef Lead Sayısı</label>
        <input
          type="number"
          min={0}
          value={form.goalLeads ?? ""}
          onChange={(e) => set("goalLeads", e.target.value ? Number(e.target.value) : null)}
          className={inputClass}
        />
      </div>
      <div className="col-span-3 flex flex-col gap-1.5">
        <label className={labelClass}>Açıklama</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} className={inputClass} />
      </div>
    </>
  );
}

export function emptyCampaign(defaultRegion: Region | null): CampaignInput {
  return {
    name: "",
    channel: "other",
    product: "",
    region: defaultRegion ?? "",
    budget: 0,
    currency: "USD",
    startDate: "",
    endDate: "",
    goalLeads: null,
    description: "",
    ownerId: null,
  };
}

export function CampaignCreateForm({ defaultRegion }: { defaultRegion: Region | null }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CampaignInput>(emptyCampaign(defaultRegion));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createCampaign(form);
      if (result.ok) {
        setForm(emptyCampaign(defaultRegion));
        setShowForm(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Vazgeç" : "Yeni Kampanya"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <CampaignFormFields form={form} set={set} regionLocked={defaultRegion} />
          <div className="col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kaydet
            </button>
            {error && <span className="text-[12px] text-destructive">{error}</span>}
          </div>
        </form>
      )}
    </div>
  );
}
