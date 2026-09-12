"use client";

import Image from "next/image";
import { CalendarClock, Eye, FileDown, Landmark, LifeBuoy, PenLine, ShieldCheck } from "lucide-react";
import {
  PREVIEW_BANK_INFO,
  PREVIEW_CUSTOMER,
  formatPreviewPrice,
  previewLines,
  previewVatRate,
} from "@/lib/proposals/preview-data";
import { studioProduct } from "@/lib/proposals/template-studio";
import { PRODUCT_LOGO, RESPONGO_LOGO } from "@/lib/product-logos";
import type { V2Section, V2Template } from "./v2-templates-panel";

function text(section: V2Section | undefined, language: "tr" | "en", fallback: string) {
  return (language === "tr" ? section?.body_tr : section?.body_en) || fallback;
}
function title(section: V2Section | undefined, language: "tr" | "en", fallback: string) {
  return (language === "tr" ? section?.title_tr : section?.title_en) || fallback;
}
function scope(section: V2Section | undefined, language: "tr" | "en", field: "included" | "excluded", fallback: string[]) {
  const value = section?.content?.[`${field}_${language}`];
  const cleaned =
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  return cleaned.length > 0 ? cleaned : fallback;
}
function listContent(section: V2Section | undefined, language: "tr" | "en", key: string, fallback: string[]) {
  const value = section?.content?.[`${key}_${language}`];
  const cleaned =
    Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
  return cleaned.length > 0 ? cleaned : fallback;
}

/** Kapak gibi her zaman koyu zeminli alanlarda kullanılan logo — sayfa temasından
 * (light/dark mode) bağımsız olarak her zaman "white" varyantı gösterir. */
function LogoOnDark({ product, className }: { product: "respongo" | keyof typeof PRODUCT_LOGO; className?: string }) {
  const pair = product === "respongo" ? RESPONGO_LOGO : PRODUCT_LOGO[product];
  if (!pair) return null;
  return (
    <Image
      src={pair.dark.src}
      alt={product}
      width={pair.dark.width}
      height={pair.dark.height}
      className={`max-w-full shrink-0 object-contain ${className ?? ""}`}
    />
  );
}

/** Beyaz kağıt zeminli alanlarda kullanılan logo — her zaman renkli/açık varyant. */
function LogoOnLight({ product, className }: { product: "respongo" | keyof typeof PRODUCT_LOGO; className?: string }) {
  const pair = product === "respongo" ? RESPONGO_LOGO : PRODUCT_LOGO[product];
  if (!pair) return null;
  return (
    <Image
      src={pair.light.src}
      alt={product}
      width={pair.light.width}
      height={pair.light.height}
      className={`max-w-full shrink-0 object-contain ${className ?? ""}`}
    />
  );
}

export function TemplatePreview({ template, language = "tr" }: { template: V2Template; language?: "tr" | "en" }) {
  const product = studioProduct(template.product);
  const tr = language === "tr";
  const find = (sectionType: string) => template.sections.find((section) => section.section_type === sectionType);

  const rows = previewLines(template.product);
  const currencies = Array.from(new Set(rows.map((row) => row.currency)));

  const coverLetter = text(
    find("cover"),
    language,
    tr ? `Kurumunuza özel ${product.label} çözüm önerisi` : `A tailored ${product.label} solution proposal`
  );
  const included = scope(
    find("scope"),
    language,
    "included",
    tr
      ? ["Kuruma özel keşif ve çözüm tasarımı", "Yönetici başlangıç eğitimi", "Canlıya geçiş ve başarı takibi"]
      : ["Discovery and solution design", "Administrator onboarding", "Go-live and success follow-up"]
  );
  const excluded = scope(
    find("scope"),
    language,
    "excluded",
    tr
      ? ["Kapsam dışı özel geliştirmeler", "Üçüncü taraf lisans ve altyapı bedelleri"]
      : ["Out-of-scope custom development", "Third-party license and infrastructure fees"]
  );

  const technicalItems = listContent(
    find("technical_specs"),
    language,
    "items",
    tr
      ? ["Bulut tabanlı, kurulum gerektirmeyen erişim", "Aktarımda ve beklemede endüstri standardı şifreleme"]
      : ["Cloud-based, no-install access", "Industry-standard encryption in transit and at rest"]
  );
  const implementationPhases = listContent(
    find("implementation_timeline"),
    language,
    "phases",
    tr
      ? ["1. Hafta — Keşif ve plan", "2–3. Hafta — Kurulum ve test", "4. Hafta — Canlıya geçiş"]
      : ["Week 1 — Discovery", "Weeks 2–3 — Configuration", "Week 4 — Go-live"]
  );
  const supportTiers = listContent(
    find("support_sla"),
    language,
    "tiers",
    tr
      ? ["Kritik (P1): 7/24, ilk yanıt 2 saat içinde", "Normal (P3): ilk yanıt 1 iş günü içinde"]
      : ["Critical (P1): 24/7, first response within 2 hours", "Normal (P3): first response within 1 business day"]
  );

  const legalSection = template.sections.find(
    (s) => s.section_type === "legal_terms" && s.legal_region === (tr ? "tr" : "us")
  );
  const bankSection = find("bank_info");
  const bankContent = (bankSection?.content ?? {}) as Record<string, unknown>;
  const bankName = String(bankContent.bank_name || "") || PREVIEW_BANK_INFO.bankName;
  const accountName = String(bankContent.account_name || "") || PREVIEW_BANK_INFO.accountName;
  const iban = String(bankContent.iban || "") || PREVIEW_BANK_INFO.iban;
  const swift = String(bankContent.swift || "") || PREVIEW_BANK_INFO.swift;

  const distinctProductKeys = Array.from(new Set(rows.map(() => template.product).filter(Boolean))) as Array<
    keyof typeof PRODUCT_LOGO
  >;

  return (
    <section className="overflow-hidden rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-rg-line bg-rg-surface-alt px-5 py-3">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary" />
          <div>
            <h2 className="text-[13px] font-bold text-rg-ink">Tam belge önizlemesi</h2>
            <p className="text-[11px] text-rg-ink-faint">Örnek müşteri, fiyat ve kapsam verisiyle HTML teklif görünümü</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-lg border border-rg-line bg-rg-surface px-3 py-1.5 text-[11px] font-semibold text-rg-ink-soft">
          <FileDown className="h-3.5 w-3.5" />
          PDF çıktısında aynı yapı kullanılır
        </span>
      </header>

      <div className="bg-slate-100 p-4 sm:p-7">
        <article className="mx-auto max-w-[760px] overflow-hidden rounded-sm bg-white shadow-[0_12px_35px_rgba(15,23,42,.16)]">
          {/* KAPAK — kapak görseli, Respongo + ürün logosu, teklif başlığı */}
          <div className="relative min-h-[300px] overflow-hidden bg-[#0c1938] p-7 text-white sm:p-10">
            {product.coverImage && (
              <Image src={product.coverImage} alt="" fill sizes="760px" className="object-cover opacity-25" />
            )}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0b1633] via-[#0b1633]/75 to-transparent" />
            <div className="relative flex min-h-[250px] flex-col justify-between">
              <div className="flex items-center gap-5">
                <LogoOnDark product="respongo" className="h-9 w-auto" />
                {template.product && <LogoOnDark product={template.product} className="h-7 w-auto opacity-90" />}
              </div>
              <div>
                <div className="text-[10px] font-bold tracking-[.18em] text-white/65">
                  RESPONGO · {PREVIEW_CUSTOMER.reference}
                </div>
                <p className="mt-6 text-[12px] text-white/70">{tr ? "HAZIRLANAN" : "PREPARED FOR"}</p>
                <h3 className="mt-2 font-display text-3xl font-bold leading-tight">{PREVIEW_CUSTOMER.company}</h3>
                <p className="mt-6 max-w-md text-[14px] leading-6 text-white/85">{coverLetter}</p>
                <div className="mt-8 flex gap-8 text-[11px] text-white/65">
                  <span>
                    {tr ? "Hazırlayan" : "Prepared by"}
                    <strong className="mt-1 block text-white">{PREVIEW_CUSTOMER.preparedBy}</strong>
                  </span>
                  <span>
                    {tr ? "Geçerlilik" : "Valid until"}
                    <strong className="mt-1 block text-white">{PREVIEW_CUSTOMER.validUntil}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-9 p-7 sm:p-10">
            {/* 01 — ÖN YAZI & TEKLİF DETAYLARI */}
            <section>
              <div className="mb-4 flex items-center gap-3">
                <LogoOnLight product="respongo" className="h-7 w-auto" />
                <span className="text-[10px] font-semibold text-rg-ink-faint">
                  {tr ? "Kurumsal Öğrenme ve Yetenek Teknolojileri" : "Enterprise Learning & Talent Technologies"}
                </span>
              </div>
              <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                01 · {tr ? "ÖN YAZI VE TEKLİF DETAYLARI" : "COVER LETTER & PROPOSAL DETAILS"}
              </p>
              <p className="mt-3 text-[13px] leading-6 text-slate-600">{coverLetter}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "Kurum" : "Organisation"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{PREVIEW_CUSTOMER.company}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "İlgili Kişi" : "Contact"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{PREVIEW_CUSTOMER.contact}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "E-posta" : "Email"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{PREVIEW_CUSTOMER.contactEmail}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "Tarih" : "Date"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{PREVIEW_CUSTOMER.preparedDate}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "Para Birimi" : "Currency"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{currencies.join(" / ")}</strong>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <span className="text-[10px] text-slate-500">{tr ? "Hazırlayan" : "Prepared by"}</span>
                  <strong className="mt-1 block text-[13px] text-slate-800">{PREVIEW_CUSTOMER.preparedBy}</strong>
                </div>
              </div>
              {distinctProductKeys.length > 0 && (
                <div className="mt-4">
                  <span className="text-[10px] font-semibold uppercase tracking-[.1em] text-slate-400">
                    {tr ? "Bu teklif kapsamındaki ürünler" : "Products covered in this proposal"}
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {distinctProductKeys.map((key) => (
                      <div key={key} className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <LogoOnLight product={key} className="h-4 w-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* 02 — ÇÖZÜM ÖZETİ */}
            <section>
              <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                02 · {title(find("product_info"), language, tr ? "ÇÖZÜM ÖZETİ" : "SOLUTION OVERVIEW")}
              </p>
              {template.product && (
                <div className="mt-3">
                  <LogoOnLight product={template.product} className="h-6 w-auto" />
                </div>
              )}
              <h4 className="mt-3 font-display text-xl font-bold text-slate-900">
                {tr ? product.trName : product.enName}
              </h4>
              <p className="mt-2 whitespace-pre-wrap text-[13px] leading-6 text-slate-600">
                {text(
                  find("product_info"),
                  language,
                  tr
                    ? `${product.trName}, öğrenme stratejinizi ölçülebilir iş sonuçlarına bağlayan bütünleşik bir deneyim sunar.`
                    : `${product.enName} connects your learning strategy to measurable business outcomes.`
                )}
              </p>
            </section>

            {/* KAPSAM — dahil / hariç */}
            <section className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <h4 className="text-[12px] font-bold text-emerald-800">{tr ? "Teklife dahil" : "Included"}</h4>
                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-emerald-950">
                  {included.map((item) => (
                    <li key={item}>✓ {item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border border-amber-100 bg-amber-50/50 p-4">
                <h4 className="text-[12px] font-bold text-amber-800">{tr ? "Teklife dahil değil" : "Excluded"}</h4>
                <ul className="mt-3 space-y-2 text-[12px] leading-5 text-amber-950">
                  {excluded.map((item) => (
                    <li key={item}>– {item}</li>
                  ))}
                </ul>
              </div>
            </section>

            {/* 03 — ÜRÜN VE HİZMET DETAYLARI (kalemler + KDV kırılımlı toplamlar) */}
            <section>
              <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                03 · {tr ? "ÜRÜN VE HİZMET DETAYLARI" : "PRODUCTS & SERVICES"}
              </p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-3 py-2">{tr ? "Kalem" : "Item"}</th>
                      <th className="px-3 py-2 text-center">{tr ? "Adet" : "Qty"}</th>
                      <th className="px-3 py-2 text-right">{tr ? "Birim Fiyat" : "Unit Price"}</th>
                      <th className="px-3 py-2 text-right">{tr ? "İskonto" : "Discount"}</th>
                      <th className="px-3 py-2 text-right">{tr ? "Tutar" : "Amount"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => {
                      const gross = row.quantity * row.unitPrice;
                      const net = gross * (1 - (row.discountPercent ?? 0) / 100);
                      return (
                        <tr key={row.name} className="border-t border-slate-100">
                          <td className="px-3 py-3">
                            <strong className="block text-[12px] text-slate-800">{row.name}</strong>
                            <span className="text-[10px] text-slate-500">{row.description}</span>
                          </td>
                          <td className="px-3 py-3 text-center text-[12px] text-slate-600">{row.quantity}</td>
                          <td className="px-3 py-3 text-right text-[12px] text-slate-600">
                            {formatPreviewPrice(row.unitPrice, row.currency)}
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] text-slate-600">
                            {row.discountPercent ? `%${row.discountPercent}` : "—"}
                          </td>
                          <td className="px-3 py-3 text-right text-[12px] font-semibold text-slate-800">
                            {formatPreviewPrice(net, row.currency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 flex flex-wrap justify-end gap-3">
                {currencies.map((currency) => {
                  const currencyRows = rows.filter((row) => row.currency === currency);
                  const gross = currencyRows.reduce((sum, row) => sum + row.quantity * row.unitPrice, 0);
                  const net = currencyRows.reduce(
                    (sum, row) => sum + row.quantity * row.unitPrice * (1 - (row.discountPercent ?? 0) / 100),
                    0
                  );
                  const discount = gross - net;
                  const vatRate = previewVatRate(currency);
                  const vatAmount = net * (vatRate / 100);
                  const grandTotal = net + vatAmount;
                  return (
                    <div key={currency} className="min-w-[220px] rounded-xl bg-slate-900 px-4 py-3 text-white">
                      <div className="space-y-1 text-[11px] text-slate-300">
                        <div className="flex items-center justify-between">
                          <span>{tr ? "Ara Toplam" : "Subtotal"}</span>
                          <span>{formatPreviewPrice(gross, currency)}</span>
                        </div>
                        {discount > 0.5 && (
                          <div className="flex items-center justify-between">
                            <span>{tr ? "İskonto" : "Discount"}</span>
                            <span>-{formatPreviewPrice(discount, currency)}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <span>{tr ? `KDV (%${vatRate})` : `VAT (${vatRate}%)`}</span>
                          <span>{formatPreviewPrice(vatAmount, currency)}</span>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between border-t border-white/15 pt-2">
                        <span className="text-[10px] uppercase text-slate-300">
                          {tr ? "Genel Toplam" : "Grand Total"}
                        </span>
                        <strong className="text-[15px]">{formatPreviewPrice(grandTotal, currency)}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
              {tr && currencies.includes("TRY") && (
                <p className="mt-2 text-right text-[10px] text-slate-400">
                  Yurt içi kalemlerde varsayılan %20 KDV gösterilir; ihracat/yurt dışı kalemlerde KDV istisnası (%0)
                  uygulanır. Gerçek teklifte oran her zaman düzenlenebilir.
                </p>
              )}
            </section>

            {/* 04 — TEKNİK ÖZELLİKLER VE GÜVENLİK */}
            <section>
              <div className="mb-1 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                  04 · {title(find("technical_specs"), language, tr ? "TEKNİK ÖZELLİKLER VE GÜVENLİK" : "TECHNICAL SPECIFICATIONS & SECURITY")}
                </p>
              </div>
              <ul className="mt-3 grid gap-x-6 gap-y-2 text-[12px] leading-5 text-slate-600 sm:grid-cols-2">
                {technicalItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 05 — UYGULAMA PLANI */}
            <section>
              <div className="mb-1 flex items-center gap-2">
                <CalendarClock className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                  05 · {title(find("implementation_timeline"), language, tr ? "UYGULAMA PLANI" : "IMPLEMENTATION PLAN")}
                </p>
              </div>
              {/* Tailwind'in JIT tarayıcısı dinamik olarak birleştirilmiş sınıf adlarını (`sm:grid-cols-${n}`)
                  YAKALAYAMAZ — bu yüzden olası sütun sayıları burada sabit, tam yazılmış sınıf adlarıyla
                  bir haritada tutuluyor (aksi halde faz sayısı 3'ten farklı olan şablonlarda sütunlar hiç
                  uygulanmaz, sessizce tek sütuna düşerdi). */}
              <div
                className={`mt-3 grid gap-2 text-center text-[11px] ${
                  { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4" }[
                    Math.min(implementationPhases.length, 4) || 1
                  ]
                }`}
              >
                {implementationPhases.map((phase) => {
                  const [head, ...rest] = phase.split("—").map((part) => part.trim());
                  return (
                    <div key={phase} className="rounded-lg bg-slate-50 p-3">
                      <strong className="block text-primary">{head}</strong>
                      {rest.length > 0 && <span className="mt-1 block text-slate-500">{rest.join(" — ")}</span>}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 06 — DESTEK VE SLA */}
            <section>
              <div className="mb-1 flex items-center gap-2">
                <LifeBuoy className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold tracking-[.14em] text-primary">
                  06 · {title(find("support_sla"), language, tr ? "DESTEK VE HİZMET SEVİYESİ (SLA)" : "SUPPORT & SERVICE LEVEL AGREEMENT")}
                </p>
              </div>
              <ul className="mt-3 space-y-2 text-[12px] leading-5 text-slate-600">
                {supportTiers.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </section>

            {/* 05 — ÖDEME BİLGİLERİ */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex gap-2">
                <Landmark className="h-4 w-4 shrink-0 text-primary" />
                <div className="w-full">
                  <h4 className="text-[12px] font-bold text-slate-800">
                    {title(bankSection, language, tr ? "Ödeme Bilgileri" : "Payment Details")}
                  </h4>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <div>
                      <span className="text-[10px] text-slate-500">{tr ? "Banka" : "Bank"}</span>
                      <strong className="mt-0.5 block text-[12.5px] text-slate-800">{bankName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">{tr ? "Hesap Adı" : "Account Name"}</span>
                      <strong className="mt-0.5 block text-[12.5px] text-slate-800">{accountName}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">IBAN</span>
                      <strong className="mt-0.5 block font-mono text-[12.5px] text-slate-800">{iban}</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500">SWIFT</span>
                      <strong className="mt-0.5 block font-mono text-[12.5px] text-slate-800">{swift}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* TİCARİ ŞARTLAR VE ONAY */}
            <section className="rounded-xl border border-slate-200 p-4">
              <div className="flex gap-2">
                <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                <div>
                  <h4 className="text-[12px] font-bold text-slate-800">
                    {title(legalSection, language, tr ? "Ticari şartlar ve onay" : "Commercial terms and acceptance")}
                  </h4>
                  <p className="mt-1 text-[11px] leading-5 text-slate-600">
                    {text(
                      legalSection,
                      language,
                      tr
                        ? "Bu örnek teklif 30 gün geçerlidir. Vergiler, gerekli üçüncü taraf lisansları ve kapsam dışı işler ayrıca değerlendirilir. Nihai şartlar tarafların yazılı sözleşmesiyle kesinleşir."
                        : "This sample proposal is valid for 30 days. Taxes, required third-party licenses and out-of-scope work are assessed separately. Final terms are governed by the parties' written agreement."
                    )}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2">
                <div className="flex items-center gap-2 border-b border-dashed border-slate-300 pb-6">
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="text-[10.5px] text-slate-400">
                    {tr ? "Respongo Yetkilisi — Ad / Tarih" : "Respongo Representative — Name / Date"}
                  </span>
                </div>
                <div className="flex items-center gap-2 border-b border-dashed border-slate-300 pb-6">
                  <PenLine className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="text-[10.5px] text-slate-400">
                    {tr ? "Müşteri Yetkilisi — Ad / Tarih" : "Customer Representative — Name / Date"}
                  </span>
                </div>
              </div>
            </section>

            <footer className="border-t border-slate-100 pt-5 text-[10px] text-slate-400">
              Respongo · Learning technologies for measurable performance · {PREVIEW_CUSTOMER.reference}
            </footer>
          </div>
        </article>
      </div>
    </section>
  );
}
