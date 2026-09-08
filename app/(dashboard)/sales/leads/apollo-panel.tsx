"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search } from "lucide-react";
import type { Region } from "@/lib/roles";
import type { ApolloSearch, ApolloSearchResult } from "@/lib/apollo/domain";
import { importApollo, searchApollo } from "./apollo-actions";

const inputClass = "rounded-lg border border-rg-line bg-rg-bg px-3 py-2 text-sm text-rg-ink";
const buttonClass = "rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50";

export function ApolloPanel({ configured, isFounder, currentRegion }: { configured: boolean; isFounder: boolean; currentRegion: Region | "" }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [region, setRegion] = useState<Region | "">(currentRegion);
  const [result, setResult] = useState<ApolloSearchResult | null>(null);
  const [filters, setFilters] = useState<ApolloSearch | null>(null);
  const [selected, setSelected] = useState("");
  const [consent, setConsent] = useState(false);
  const [autoAssign, setAutoAssign] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const busy = useRef(false);

  function search(input: ApolloSearch) {
    if (busy.current) return;
    busy.current = true;
    setError(""); setMessage(""); setSelected(""); setConsent(false); setResult(null);
    startTransition(async () => {
      try {
        const response = await searchApollo(input, region);
        if (response.ok) { setResult(response.data); setFilters(input); }
        else setError(response.error);
      } catch { setError("Arama tamamlanamadı. Bağlantını kontrol edip tekrar dene."); }
      finally { busy.current = false; }
    });
  }

  function handleImport() {
    if (!selected || !consent || busy.current) return;
    busy.current = true;
    setError(""); setMessage("");
    startTransition(async () => {
      try {
        const response = await importApollo(selected, region, autoAssign, consent);
        if (!response.ok) { setError(response.error); return; }
        const data = response.data;
        if (data.status === "duplicate") setMessage("Bu kişi veya e-posta seçili bölgede zaten kayıtlı. Mevcut kayıt değiştirilmedi.");
        else {
          setMessage(data.assignment === "assigned" ? "Müşteri adayı eklendi ve satış ekibine atandı." : data.assignment === "failed" ? "Müşteri adayı eklendi; otomatik atama başarısız oldu. Sahipsizleri Otomatik Ata işlemini kullanabilirsin." : "Müşteri adayı eklendi; şu anda sahipsiz. Satış ekibine atayabilirsin.");
          router.refresh();
        }
        setSelected("");
      } catch { setError("İşlem sonucu alınamadı. Tekrar denemeden önce müşteri adaylarını ve Apollo kullanımını kontrol et."); }
      finally { setConsent(false); busy.current = false; }
    });
  }

  return (
    <section className="mb-3 rounded-[10px] border border-rg-line bg-rg-surface">
      <button type="button" aria-expanded={open} aria-controls="apollo-panel" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-3.5 py-2.5 text-[12.5px] font-semibold text-rg-ink">
        <span className="flex items-center gap-2"><Search className="h-4 w-4" aria-hidden="true" />Apollo.io ile Müşteri Adayı Bul</span>
        <ChevronDown className={`h-4 w-4 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && <div id="apollo-panel" className="space-y-4 border-t border-rg-line p-4">
        {!configured ? <p className="text-sm text-rg-ink-soft">Apollo bağlantısı henüz etkin değil. Bağlantı tamamlandığında burada kişi arayıp müşteri adaylarına ekleyebilirsin.</p> : <>
          <p className="text-sm text-rg-ink-soft">Ünvan, konum veya anahtar kelimeyle ara. Arama sonuçlarında isimler kısmen gizli olabilir. CRM bölgesi kaydın hangi ekibe ait olacağını belirler; konum filtresi ayrı çalışır.</p>
          <form onSubmit={(event) => {
            event.preventDefault();
            const values = new FormData(event.currentTarget);
            search({ keywords: String(values.get("keywords") ?? ""), title: String(values.get("title") ?? ""), location: String(values.get("location") ?? ""), page: 1 });
          }}>
            <fieldset disabled={pending} className="flex flex-wrap items-end gap-3">
              {isFounder ? <label className="flex flex-col gap-1 text-xs text-rg-ink-soft">CRM bölgesi
                <select required value={region} onChange={(e) => { setRegion(e.target.value as Region | ""); setSelected(""); setConsent(false); setResult(null); setMessage(""); setError(""); }} className={inputClass}>
                  <option value="">Bölge seç</option><option value="tr">Türkiye</option><option value="global">Global</option>
                </select>
              </label> : <p className="py-2 text-sm text-rg-ink-soft">CRM bölgesi: {currentRegion === "tr" ? "Türkiye" : currentRegion === "global" ? "Global" : "Atanmamış"}</p>}
              <label className="flex flex-col gap-1 text-xs text-rg-ink-soft">Anahtar kelime<input name="keywords" maxLength={200} placeholder="Ör. learning" className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-rg-ink-soft">Ünvan<input name="title" maxLength={200} placeholder="Ör. HR Director" className={inputClass} /></label>
              <label className="flex flex-col gap-1 text-xs text-rg-ink-soft">Kişinin konumu<input name="location" maxLength={200} placeholder="Ör. Turkey" className={inputClass} /></label>
              <button type="submit" disabled={!region} className={buttonClass}>{pending ? "İşlem sürüyor…" : "Ara"}</button>
            </fieldset>
          </form>
          {result && <>
            <div className="overflow-x-auto"><table className="w-full text-left text-sm"><caption className="pb-2 text-left text-rg-ink-soft">{result.total.toLocaleString("tr-TR")} sonuç · Sayfa {result.page}</caption>
              <thead><tr className="border-b border-rg-line text-rg-ink-faint"><th className="p-2">Seç</th><th className="p-2">Kişi</th><th className="p-2">Ünvan</th><th className="p-2">Firma</th></tr></thead>
              <tbody>{result.people.map((person) => <tr key={person.id} className="border-b border-rg-line text-rg-ink">
                <td className="p-2"><input type="radio" name="apollo-person" aria-label={`${person.name} kişisini seç`} disabled={pending || !person.company} checked={selected === person.id} onChange={() => { setSelected(person.id); setConsent(false); setError(""); setMessage(""); }} /></td>
                <td className="p-2">{person.name}</td><td className="p-2">{person.title || "—"}</td><td className="p-2">{person.company || "Firma bilgisi yok"}</td>
              </tr>)}</tbody>
            </table></div>
            {result.people.length === 0 && <p className="text-sm text-rg-ink-soft">Bu filtrelerle kişi bulunamadı.</p>}
            <div className="flex gap-2">
              <button type="button" disabled={pending || result.page <= 1} onClick={() => filters && search({ ...filters, page: result.page - 1 })} className={buttonClass}>Önceki</button>
              <button type="button" disabled={pending || result.page >= 500 || result.page * 10 >= result.total} onClick={() => filters && search({ ...filters, page: result.page + 1 })} className={buttonClass}>Sonraki</button>
            </div>
            {selected && <fieldset disabled={pending} className="space-y-3 rounded-lg bg-rg-bg p-3 text-sm text-rg-ink-soft">
              <p>Seçili kişinin iş e-postası ve firma bilgisi sorgulanır. Yalnız doğrulanmış iş e-postası bulunan kayıt eklenir. Eşleşme veya kayıt oluşmasa da sorgu Apollo kredisi kullanabilir.</p>
              <label className="flex items-start gap-2"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />Bu kişi için kredi kullanabilen zenginleştirmeyi onaylıyorum.</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={autoAssign} onChange={(e) => setAutoAssign(e.target.checked)} />Uygun satış ekibi üyesine otomatik ata</label>
              <button type="button" onClick={handleImport} disabled={!consent || pending} className={buttonClass}>{pending ? "İşlem sürüyor…" : "Zenginleştir ve CRM’e Ekle"}</button>
            </fieldset>}
          </>}
        </>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {message && <p role="status" className="text-sm text-rg-ink">{message}</p>}
      </div>}
    </section>
  );
}
