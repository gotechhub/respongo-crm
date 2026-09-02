"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, FileUp, Loader2, MessageSquareWarning, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  customerAcceptProposal,
  customerAcceptProposalWithSignedDocument,
  customerRejectProposal,
  customerRequestProposalRevision,
} from "../../../../(dashboard)/sales/proposals/actions";

const inputClass =
  "rounded-[8px] border border-rg-line bg-rg-surface px-3 py-2 text-[12.8px] text-rg-ink outline-none focus:border-primary";

// Müşterinin "sent" durumundaki bir teklife verdiği gerçek karar — bu ekran
// sadece status === "sent" iken render ediliyor (bkz. page.tsx).
// approvalMethod === "signed_upload" ise "Kabul Ediyorum" elektronik onay YERİNE
// imzalanmış belgeyi Supabase Storage'a (signed-documents bucket) yükleme akışı gösterilir —
// Reddet/Revizyon her iki yöntemde de aynı şekilde çalışır.
export function CustomerDecisionPanel({
  proposalId,
  approvalMethod,
}: {
  proposalId: string;
  approvalMethod: "e_approval" | "signed_upload";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [revisionOpen, setRevisionOpen] = useState(false);
  const [note, setNote] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAccept() {
    setError("");
    startTransition(async () => {
      const result = await customerAcceptProposal(proposalId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleReject() {
    if (!confirm("Bu teklifi reddetmek istediğine emin misin?")) return;
    setError("");
    startTransition(async () => {
      const result = await customerRejectProposal(proposalId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  function handleRequestRevision() {
    if (!note.trim()) {
      setError("Ne değişmesini istediğini kısaca yazman gerekiyor.");
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await customerRequestProposalRevision(proposalId, note);
      if (result.ok) {
        setNote("");
        setRevisionOpen(false);
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  }

  async function handleUploadSigned() {
    if (!selectedFile) {
      setError("Önce imzalanmış belgeyi seçmen gerekiyor.");
      return;
    }
    setError("");
    setIsUploading(true);
    try {
      const supabase = createClient();
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `proposals/${proposalId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await supabase.storage
        .from("signed-documents")
        .upload(path, selectedFile, { upsert: false });
      if (uploadError) {
        throw new Error(uploadError.message);
      }
      const result = await customerAcceptProposalWithSignedDocument(proposalId, path);
      if (!result.ok) {
        throw new Error(result.error);
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Belge yüklenemedi.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg">
      <div className="mb-3 text-[13px] font-bold text-rg-ink">Bu teklif için kararın nedir?</div>

      {approvalMethod === "signed_upload" ? (
        <div className="mb-3 rounded-[10px] bg-golxp-tint px-4 py-3 text-[12.2px] text-golxp">
          Bu teklif <b>imzalı onay</b> gerektiriyor — kabul etmek için teklifi indirip imzalanmış halini
          (PDF/görsel) buradan yüklemen gerekiyor.
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        {approvalMethod === "signed_upload" ? (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3.5 py-2.5 text-[12.8px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
            >
              <FileUp className="h-3.5 w-3.5" />
              {selectedFile ? selectedFile.name : "Belge Seç"}
            </button>
            <button
              type="button"
              onClick={handleUploadSigned}
              disabled={isUploading || !selectedFile}
              className="inline-flex items-center gap-1.5 rounded-[8px] bg-gofactory px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {isUploading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <CheckCircle2 className="h-3.5 w-3.5" />
              Yükle ve Onayla
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={handleAccept}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 rounded-[8px] bg-gofactory px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            <CheckCircle2 className="h-3.5 w-3.5" />
            Kabul Ediyorum
          </button>
        )}
        <button
          type="button"
          onClick={() => setRevisionOpen((v) => !v)}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-4 py-2.5 text-[12.8px] font-semibold text-rg-ink transition-colors hover:bg-rg-surface-alt disabled:opacity-50"
        >
          <MessageSquareWarning className="h-3.5 w-3.5" />
          Revizyon İstiyorum
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-[12.8px] font-semibold text-destructive transition-colors hover:bg-destructive/10 disabled:opacity-50"
        >
          <XCircle className="h-3.5 w-3.5" />
          Reddediyorum
        </button>
      </div>

      {revisionOpen && (
        <div className="mt-3 flex flex-col gap-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            placeholder="Teklifte ne değişmesini istiyorsun? (ör. fiyat, kapsam, süre)"
            className={`${inputClass} resize-y`}
          />
          <button
            type="button"
            onClick={handleRequestRevision}
            disabled={isPending}
            className="inline-flex w-fit items-center gap-1.5 rounded-[8px] bg-gotools px-3.5 py-2 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Talebi Gönder
          </button>
        </div>
      )}

      {error && <p className="mt-3 text-[12px] text-destructive">{error}</p>}
    </div>
  );
}
