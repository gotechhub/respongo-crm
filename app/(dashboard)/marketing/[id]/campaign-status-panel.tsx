"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Trash2, X } from "lucide-react";
import { CampaignFormFields } from "../campaign-form";
import { deleteCampaign, updateCampaign, updateCampaignStatus, type CampaignInput, type CampaignStatus } from "../actions";
import type { Region } from "@/lib/roles";

const STATUS_LABEL: Record<CampaignStatus, string> = {
  planned: "Planlandı",
  active: "Aktif",
  paused: "Duraklatıldı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

const STATUS_CLASS: Record<CampaignStatus, string> = {
  planned: "bg-rg-surface-alt text-rg-ink-faint",
  active: "bg-gofactory-tint text-gofactory",
  paused: "bg-gocatalog-tint text-gocatalog",
  completed: "bg-golxp-tint text-golxp",
  cancelled: "bg-destructive/10 text-destructive",
};

const NEXT_ACTIONS: Record<CampaignStatus, { to: CampaignStatus; label: string; cls: string }[]> = {
  planned: [
    { to: "active", label: "Başlat", cls: "bg-gofactory text-white hover:brightness-[1.08]" },
    { to: "cancelled", label: "İptal Et", cls: "bg-destructive text-white hover:brightness-[1.08]" },
  ],
  active: [
    { to: "paused", label: "Duraklat", cls: "bg-gocatalog text-white hover:brightness-[1.08]" },
    { to: "completed", label: "Tamamla", cls: "bg-golxp text-white hover:brightness-[1.08]" },
    { to: "cancelled", label: "İptal Et", cls: "bg-destructive text-white hover:brightness-[1.08]" },
  ],
  paused: [
    { to: "active", label: "Devam Ettir", cls: "bg-gofactory text-white hover:brightness-[1.08]" },
    { to: "completed", label: "Tamamla", cls: "bg-golxp text-white hover:brightness-[1.08]" },
    { to: "cancelled", label: "İptal Et", cls: "bg-destructive text-white hover:brightness-[1.08]" },
  ],
  completed: [],
  cancelled: [],
};

export function CampaignStatusPanel({
  campaignId,
  initialStatus,
  initial,
  regionLocked,
}: {
  campaignId: string;
  initialStatus: CampaignStatus;
  initial: CampaignInput;
  regionLocked: Region | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<CampaignInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof CampaignInput>(key: K, value: CampaignInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleTransition(next: CampaignStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateCampaignStatus(campaignId, next);
      if (result.ok) {
        setStatus(next);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateCampaign(campaignId, form);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirm(`"${form.name}" kampanyasını kalıcı olarak silmek istediğine emin misin?`)) return;
    setError("");
    startTransition(async () => {
      const result = await deleteCampaign(campaignId);
      if (result.ok) {
        router.push("/marketing");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={"inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold " + STATUS_CLASS[status]}>
          {STATUS_LABEL[status]}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {NEXT_ACTIONS[status].map((action) => (
            <button
              key={action.to}
              type="button"
              onClick={() => handleTransition(action.to)}
              disabled={isPending}
              className={`inline-flex items-center gap-1.5 rounded-[8px] px-3.5 py-2 text-[12px] font-semibold transition-colors disabled:opacity-50 ${action.cls}`}
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {action.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt"
          >
            {editing ? <X className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
            {editing ? "Vazgeç" : "Düzenle"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[12px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Sil
          </button>
        </div>
      </div>

      {editing && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <CampaignFormFields form={form} set={set} regionLocked={regionLocked} />
          <div className="col-span-3 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Güncelle
            </button>
          </div>
        </form>
      )}
      {error && (
        <div className="rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12px] text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
