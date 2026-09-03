"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { REGION_LABELS_TR, type Region } from "@/lib/roles";
import { createSocialPost, updateSocialPost, type SocialPostInput } from "./actions";
import { SOCIAL_PLATFORM_LABEL, SOCIAL_PLATFORM_KEYS } from "./labels";
import type { ProductKey } from "../../sales/proposals/actions";

const PRODUCT_LABEL: Record<ProductKey, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};
const PRODUCT_KEYS = Object.keys(PRODUCT_LABEL) as ProductKey[];

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";
const labelClass = "text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint";

export function emptyPost(defaultRegion: Region | null): SocialPostInput {
  return {
    title: "",
    contentText: "",
    platform: "other",
    product: "",
    region: defaultRegion ?? "",
    scheduledAt: "",
    linkUrl: "",
    notes: "",
    ownerId: null,
  };
}

function PostFormFields({
  form,
  set,
  regionLocked,
}: {
  form: SocialPostInput;
  set: <K extends keyof SocialPostInput>(key: K, value: SocialPostInput[K]) => void;
  regionLocked: Region | null;
}) {
  return (
    <>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label className={labelClass}>Başlık *</label>
        <input required value={form.title} onChange={(e) => set("title", e.target.value)} className={inputClass} />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>Platform *</label>
        <select
          value={form.platform}
          onChange={(e) => set("platform", e.target.value as SocialPostInput["platform"])}
          className={inputClass}
        >
          {SOCIAL_PLATFORM_KEYS.map((p) => (
            <option key={p} value={p}>
              {SOCIAL_PLATFORM_LABEL[p]}
            </option>
          ))}
        </select>
      </div>
      <div className="col-span-3 flex flex-col gap-1.5">
        <label className={labelClass}>İçerik / Metin</label>
        <textarea
          value={form.contentText}
          onChange={(e) => set("contentText", e.target.value)}
          rows={3}
          className={inputClass}
        />
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
        <label className={labelClass}>Bölge {regionLocked ? "" : ""}</label>
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
        <label className={labelClass}>Planlanan Tarih/Saat</label>
        <input
          type="datetime-local"
          value={form.scheduledAt}
          onChange={(e) => set("scheduledAt", e.target.value)}
          className={inputClass}
        />
      </div>
      <div className="col-span-2 flex flex-col gap-1.5">
        <label className={labelClass}>Yayın Linki (yayınlandıysa)</label>
        <input value={form.linkUrl} onChange={(e) => set("linkUrl", e.target.value)} className={inputClass} />
      </div>
      <div className="col-span-3 flex flex-col gap-1.5">
        <label className={labelClass}>Notlar</label>
        <input value={form.notes} onChange={(e) => set("notes", e.target.value)} className={inputClass} />
      </div>
    </>
  );
}

export function PostCreateForm({ defaultRegion }: { defaultRegion: Region | null }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SocialPostInput>(emptyPost(defaultRegion));
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof SocialPostInput>(key: K, value: SocialPostInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await createSocialPost(form);
      if (result.ok) {
        setForm(emptyPost(defaultRegion));
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
          {showForm ? "Vazgeç" : "Yeni Gönderi"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-3 gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <PostFormFields form={form} set={set} regionLocked={defaultRegion} />
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

export function PostEditForm({
  postId,
  initial,
  regionLocked,
  onDone,
}: {
  postId: string;
  initial: SocialPostInput;
  regionLocked: Region | null;
  onDone: () => void;
}) {
  const [form, setForm] = useState<SocialPostInput>(initial);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function set<K extends keyof SocialPostInput>(key: K, value: SocialPostInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const result = await updateSocialPost(postId, form);
      if (result.ok) {
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-3 gap-3 rounded-2xl border border-primary/40 bg-rg-surface p-5 shadow-rg"
    >
      <PostFormFields form={form} set={set} regionLocked={regionLocked} />
      <div className="col-span-3 flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Güncelle
        </button>
        <button
          type="button"
          onClick={onDone}
          className="text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
        >
          Vazgeç
        </button>
        {error && <span className="text-[12px] text-destructive">{error}</span>}
      </div>
    </form>
  );
}
