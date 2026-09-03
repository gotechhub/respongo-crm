"use client";

import { useState, useTransition } from "react";
import { Check, ExternalLink, Loader2, Pencil, Trash2 } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { deleteSocialPost, updateSocialPostStatus, type SocialPlatform, type SocialPostInput, type SocialPostStatus } from "./actions";
import { SOCIAL_PLATFORM_LABEL, SOCIAL_STATUS_CLASS, SOCIAL_STATUS_LABEL } from "./labels";
import { PostEditForm } from "./post-form";
import type { ProductKey } from "../../sales/proposals/actions";

export type SocialPostRow = {
  id: string;
  title: string;
  content_text: string | null;
  platform: SocialPlatform;
  product: ProductKey | null;
  region: Region | null;
  status: SocialPostStatus;
  scheduled_at: string | null;
  published_at: string | null;
  link_url: string | null;
  notes: string | null;
  owner_id: string | null;
};

const STATUS_ACTIONS: Record<SocialPostStatus, { to: SocialPostStatus; label: string }[]> = {
  draft: [{ to: "scheduled", label: "Planla" }, { to: "cancelled", label: "İptal Et" }],
  scheduled: [{ to: "published", label: "Yayınlandı İşaretle" }, { to: "draft", label: "Taslağa Al" }, { to: "cancelled", label: "İptal Et" }],
  published: [],
  cancelled: [{ to: "draft", label: "Taslağa Geri Al" }],
};

function fmtDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function toInputRow(row: SocialPostRow): SocialPostInput {
  return {
    title: row.title,
    contentText: row.content_text ?? "",
    platform: row.platform,
    product: row.product ?? "",
    region: row.region ?? "",
    scheduledAt: row.scheduled_at ? row.scheduled_at.slice(0, 16) : "",
    linkUrl: row.link_url ?? "",
    notes: row.notes ?? "",
    ownerId: row.owner_id,
  };
}

function PostCard({ row, ownerName, regionLocked }: { row: SocialPostRow; ownerName: string; regionLocked: Region | null }) {
  const [status, setStatus] = useState<SocialPostStatus>(row.status);
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  function handleStatus(next: SocialPostStatus) {
    setError("");
    startTransition(async () => {
      const result = await updateSocialPostStatus(row.id, next);
      if (result.ok) {
        setStatus(next);
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      } else {
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    setError("");
    startTransition(async () => {
      const result = await deleteSocialPost(row.id);
      if (!result.ok) setError(result.error);
    });
  }

  if (editing) {
    return (
      <PostEditForm
        postId={row.id}
        initial={toInputRow(row)}
        regionLocked={regionLocked}
        onDone={() => setEditing(false)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-rg-line bg-rg-surface p-4 shadow-rg">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[13px] font-bold text-rg-ink">{row.title}</div>
          <div className="mt-0.5 text-[11.5px] text-rg-ink-faint">
            {SOCIAL_PLATFORM_LABEL[row.platform]} · {row.region ? REGION_LABELS_TR[row.region] : "Global"} · {ownerName}
          </div>
        </div>
        <span className={"inline-flex shrink-0 items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold " + SOCIAL_STATUS_CLASS[status]}>
          {SOCIAL_STATUS_LABEL[status]}
        </span>
      </div>
      {row.content_text && <p className="text-[12.5px] text-rg-ink-soft">{row.content_text}</p>}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11.5px] text-rg-ink-faint">
        <span>Planlanan: {fmtDateTime(row.scheduled_at)}</span>
        {row.status === "published" && <span>Yayın: {fmtDateTime(row.published_at)}</span>}
        {row.link_url && (
          <a href={row.link_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
            <ExternalLink className="h-3 w-3" /> Gönderiyi gör
          </a>
        )}
      </div>
      {row.notes && <div className="text-[11.5px] text-rg-ink-faint">Not: {row.notes}</div>}
      <div className="mt-1 flex flex-wrap items-center gap-2">
        {STATUS_ACTIONS[status].map((action) => (
          <button
            key={action.to}
            onClick={() => handleStatus(action.to)}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            {action.label}
          </button>
        ))}
        <button
          onClick={() => setEditing(true)}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line px-3 py-1.5 text-[11.5px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary"
        >
          <Pencil className="h-3 w-3" /> Düzenle
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-[11.5px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <Trash2 className="h-3 w-3" /> Sil
        </button>
        {saved && <Check className="h-4 w-4 text-gofactory" />}
      </div>
      {error && <div className="text-[11.5px] text-destructive">{error}</div>}
    </div>
  );
}

export function CalendarBoard({
  rows,
  ownerNames,
  regionLocked,
}: {
  rows: SocialPostRow[];
  ownerNames: Record<string, string>;
  regionLocked: Region | null;
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-2xl border border-rg-line bg-rg-surface p-8 text-center text-[12.5px] text-rg-ink-faint shadow-rg">
        Henüz içerik takvimine eklenmiş bir gönderi yok — &quot;Yeni Gönderi&quot; ile ilkini ekle.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {rows.map((row) => (
        <PostCard
          key={row.id}
          row={row}
          ownerName={row.owner_id ? ownerNames[row.owner_id] ?? "—" : "Atanmamış"}
          regionLocked={regionLocked}
        />
      ))}
    </div>
  );
}
