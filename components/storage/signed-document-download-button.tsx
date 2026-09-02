"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

// "signed-documents" PRIVATE bucket'ından bir dosyayı indirir. Bucket public olmadığı için
// düz bir <a href> ile indirilemiyor (RLS, sadece supabase-js'in oturum token'ını taşıyan
// isteklerde değerlendiriliyor) — bu yüzden .storage.download() ile blob çekip tarayıcıda
// geçici bir indirme linki oluşturuyoruz. Hem müşteri portalında (kendi imzaladığı belge) hem
// iç CRM'de (satış ekibinin müşterinin yüklediği belgeyi görmesi) aynı component kullanılıyor —
// erişim ikisinde de storage RLS'i (signed_documents_customer_select / signed_documents_staff_all)
// tarafından zaten garanti ediliyor.
export function SignedDocumentDownloadButton({ path, label = "İmzalı Belgeyi İndir" }: { path: string; label?: string }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setError("");
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data, error: downloadError } = await supabase.storage.from("signed-documents").download(path);
      if (downloadError || !data) {
        throw new Error(downloadError?.message || "Dosya indirilemedi.");
      }
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = path.split("/").pop() || "imzali-belge";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dosya indirilemedi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isLoading}
        className="inline-flex items-center gap-1.5 rounded-[8px] border border-rg-line bg-rg-surface px-3 py-1.5 text-[12px] font-semibold text-rg-ink-soft transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
      >
        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
        {label}
      </button>
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}
