import path from "path";
import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const PRODUCT_ACCENT: Record<string, string> = {
  golms: "#2563eb",
  golxp: "#7c3aed",
  gocatalog: "#0f766e",
  gofactory: "#ea580c",
  gotools: "#0891b2",
};

const GENERAL_ACCENT = "#172554";

const REGION_LABEL: Record<string, string> = { tr: "Türkiye", global: "Global" };

// react-pdf'in Image bileşeni AVIF çözemiyor (yalnızca PNG/JPEG) — bu yüzden
// sitenin AVIF logoları/ürün görselleri PNG/JPEG olarak assets/pdf-images
// altına ayrıca dönüştürülüp gömüldü (bkz. assets/fonts'taki font kaydı ile
// aynı desen: process.cwd()/assets/... — public/ klasörü serverless
// fonksiyonda dosya sistemi üzerinden güvenilir okunamayabiliyor, assets/
// köke gömülü olduğu için build çıktısına dahil oluyor).
const imgDir = path.join(process.cwd(), "assets", "pdf-images");
const logoPath = (key: string) => path.join(imgDir, "logos", `${key}.png`);
const coverPath = (key: string) => path.join(imgDir, "covers", `${key}.jpg`);

const PRODUCT_LOGO_COLOR: Record<string, string> = {
  golms: logoPath("golms"),
  golxp: logoPath("golxp"),
  gocatalog: logoPath("gocatalog"),
  gofactory: logoPath("gofactory"),
  gotools: logoPath("gotools"),
};
const PRODUCT_LOGO_WHITE: Record<string, string> = {
  golms: logoPath("golms-white"),
  golxp: logoPath("golxp-white"),
  gocatalog: logoPath("gocatalog-white"),
  gofactory: logoPath("gofactory-white"),
  gotools: logoPath("gotools-white"),
};
const PRODUCT_COVER_IMAGE: Record<string, string> = {
  golms: coverPath("golms-dashboard"),
  golxp: coverPath("golxp-dashboard"),
  gocatalog: coverPath("gocatalog-learning"),
  gofactory: coverPath("gofactory-content"),
  gotools: coverPath("gotools-craft"),
};
const RESPONGO_LOGO_COLOR = logoPath("respongo-color");
const RESPONGO_LOGO_WHITE = logoPath("respongo-white");
const GENERAL_COVER_IMAGE = coverPath("respongo-ecosystem");

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

// Kısa, okunabilir bir teklif referans numarası — proposal.id'nin son
// bölümünden türetilir, veritabanında ayrı bir kolon gerektirmez.
function proposalReference(proposal: { id: string; created_at: string }) {
  const year = new Date(proposal.created_at).getFullYear();
  const short = proposal.id.replace(/-/g, "").slice(-6).toUpperCase();
  return `RSP-${year}-${short}`;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Roboto", fontSize: 10, color: "#171A23" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 },
  brandLogo: { width: 108, height: undefined, aspectRatio: 288 / 110 },
  brandSlogan: { fontSize: 8.5, color: "#6B7280", marginTop: 4 },
  docTitle: { fontSize: 18, fontWeight: 700, textAlign: "right" },
  docMeta: { fontSize: 9, color: "#6B7280", textAlign: "right", marginTop: 3 },
  sectionCard: { border: "1pt solid #DFE3ED", borderRadius: 8, padding: 14, marginBottom: 16 },
  sectionTitle: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, color: "#8A8FA0", marginBottom: 8 },
  fieldRow: { flexDirection: "row", marginBottom: 6 },
  fieldCol: { width: "33%" },
  fieldLabel: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#8A8FA0" },
  fieldValue: { fontSize: 10, marginTop: 2 },
  table: { border: "1pt solid #DFE3ED", borderRadius: 8, overflow: "hidden" },
  tHeadRow: { flexDirection: "row", backgroundColor: "#EEF0F6", paddingVertical: 6, paddingHorizontal: 8 },
  tRow: { flexDirection: "row", paddingVertical: 7, paddingHorizontal: 8, borderTop: "1pt solid #EEF0F6" },
  tHeadCell: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#8A8FA0" },
  tCell: { fontSize: 9.5 },
  colDesc: { width: "38%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "17%", textAlign: "right" },
  colDisc: { width: "11%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },
  productPill: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2, marginTop: 3 },
  productPillText: { fontSize: 6.8, fontWeight: 700, color: "#FFFFFF" },
  totalsBox: { alignSelf: "flex-end", marginTop: 14, width: 220, border: "1pt solid #DFE3ED", borderRadius: 8, backgroundColor: "#F8F9FC", padding: 12 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  totalsLabel: { fontSize: 8.5, color: "#6B7280" },
  totalsValue: { fontSize: 9.5, color: "#171A23", fontWeight: 700 },
  grandRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 6, paddingTop: 8, borderTop: "1pt solid #DFE3ED" },
  grandLabel: { fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#8A8FA0" },
  grandValue: { fontSize: 15, fontWeight: 700 },
  footer: { position: "absolute", bottom: 24, left: 40, right: 40, fontSize: 7.5, color: "#8A8FA0", textAlign: "center", borderTop: "1pt solid #EEF0F6", paddingTop: 8, flexDirection: "row", justifyContent: "space-between" },
});

export type ProposalPdfItem = {
  id: string;
  product: string;
  description: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  line_total: number;
};

export type ProposalPdfTarget = {
  company_name: string;
  contact_name?: string | null;
  contact_email?: string | null;
  primary_contact_name?: string | null;
  primary_contact_email?: string | null;
} | null;

// Teklif Şablonları 2.0 (Faz 5 / V2 Revizeler bölüm A) — proposal_template_sections'tan gelen
// bölüm bazlı, çift dilli içerik. Bu prop verilmezse (eski/legacy teklifler) sadece yukarıdaki
// tek sayfalık basit PDF üretilir — geriye dönük uyumluluk korunur.
export type ProposalPdfSection = {
  section_type: string;
  legal_region: "tr" | "us" | null;
  title_tr: string | null;
  title_en: string | null;
  body_tr: string | null;
  body_en: string | null;
  content: Record<string, unknown>;
};

const extraStyles = StyleSheet.create({
  coverPage: { padding: 0, fontFamily: "Roboto", fontSize: 10, color: "#FFFFFF" },
  coverBgImage: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0.55 },
  coverOverlay: { position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "#0b1633", opacity: 0.72 },
  coverContent: { flex: 1, padding: 48, justifyContent: "space-between" },
  coverTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  coverRespongoLogo: { width: 118, height: undefined, aspectRatio: 288 / 110 },
  coverProductLogo: { width: 110, height: undefined, aspectRatio: 3.6, marginTop: 2 },
  coverEyebrow: { fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,0.65)" },
  coverPreparedFor: { fontSize: 10, color: "rgba(255,255,255,0.7)", marginTop: 40 },
  coverTitle: { fontSize: 27, fontWeight: 700, marginTop: 6, lineHeight: 1.2 },
  coverBody: { fontSize: 11, color: "rgba(255,255,255,0.88)", marginTop: 14, lineHeight: 1.5, maxWidth: 380 },
  coverMetaRow: { flexDirection: "row", marginTop: 34 },
  coverMetaCol: { marginRight: 34 },
  coverMetaLabel: { fontSize: 7.5, textTransform: "uppercase", letterSpacing: 0.6, color: "rgba(255,255,255,0.55)" },
  coverMetaValue: { fontSize: 10.5, fontWeight: 700, marginTop: 3, color: "#FFFFFF" },
  coverFooter: { fontSize: 8, color: "rgba(255,255,255,0.55)" },

  extraPage: { padding: 40, fontFamily: "Roboto", fontSize: 10, color: "#171A23" },
  extraTitle: { fontSize: 16, fontWeight: 700, marginBottom: 16, color: "#2454C7" },
  extraBody: { fontSize: 10, lineHeight: 1.55, color: "#171A23" },
  listHeading: { fontSize: 10.5, fontWeight: 700, marginTop: 14, marginBottom: 6 },
  listItem: { fontSize: 9.8, marginBottom: 4, paddingLeft: 4 },
  bankGrid: { flexDirection: "row", flexWrap: "wrap", marginTop: 14 },
  bankField: { width: "45%", marginBottom: 10, marginRight: 20 },
  sigBlock: { marginTop: 40, flexDirection: "row", justifyContent: "space-between" },
  sigLine: { width: "42%", borderTop: "1pt solid #171A23", paddingTop: 6 },

  introMetaCard: { flexDirection: "row", flexWrap: "wrap", border: "1pt solid #DFE3ED", borderRadius: 8, padding: 14, marginBottom: 16 },
  introMetaCol: { width: "33%", marginBottom: 8 },
  introLead: { fontSize: 11, lineHeight: 1.6, color: "#2C3040", marginBottom: 4 },
  productLegendRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4, marginBottom: 4 },
  productLegendChip: { flexDirection: "row", alignItems: "center", border: "1pt solid #DFE3ED", borderRadius: 6, paddingVertical: 6, paddingHorizontal: 10 },
  productLegendLogo: { width: 62, height: undefined, aspectRatio: 3.6 },
});

function pick(lang: "tr" | "en", tr: string | null | undefined, en: string | null | undefined): string {
  if (lang === "tr") return tr || en || "";
  return en || tr || "";
}

function pickList(lang: "tr" | "en", content: Record<string, unknown>, key: string): string[] {
  const value = content[`${key}_${lang}`];
  return Array.isArray(value) ? value.filter((v): v is string => typeof v === "string" && v.trim().length > 0) : [];
}

// V6 (2026-09-12) — teknik özellikler artık kategorilere ayrılmış olabilir (content.groups).
// Eski (kategorisiz) şablonlarda content.groups yoksa düz items_tr/items_en tek kategori olarak
// gösterilir — hiçbir zaman boş kalmaz.
function pickGroups(lang: "tr" | "en", content: Record<string, unknown>): { label: string; items: string[] }[] {
  const groups = content.groups;
  if (Array.isArray(groups) && groups.length > 0) {
    return (groups as Array<Record<string, unknown>>)
      .map((g) => ({
        label: String((lang === "tr" ? g.label_tr : g.label_en) ?? ""),
        items: Array.isArray(g[`items_${lang}`])
          ? (g[`items_${lang}`] as unknown[]).filter((v): v is string => typeof v === "string")
          : [],
      }))
      .filter((g) => g.items.length > 0);
  }
  const flat = pickList(lang, content, "items");
  return flat.length > 0 ? [{ label: "", items: flat }] : [];
}

function PageFooter({ lang }: { lang: "tr" | "en" }) {
  return (
    <View style={styles.footer} fixed>
      <Text>
        {lang === "tr"
          ? "Bu belge bağlayıcı bir sözleşme değildir; nihai şartlar taraflarca imzalanacak sözleşmede belirlenir."
          : "This document is not a binding contract; final terms are governed by the parties' signed agreement."}
      </Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

export function ProposalPdfDocument({
  proposal,
  items,
  target,
  ownerName,
  sections,
  templateProduct,
}: {
  proposal: {
    id: string;
    title: string;
    currency: string;
    total_amount: number;
    vat_rate?: number | null;
    valid_until: string | null;
    region: string | null;
    created_at: string;
    sent_at: string | null;
    language?: "tr" | "en" | null;
  };
  items: ProposalPdfItem[];
  target: ProposalPdfTarget;
  ownerName: string | null;
  sections?: ProposalPdfSection[];
  /** Teklifin bağlı olduğu şablonun ürünü (proposal_templates.product) — kapak
   * görseli ve ürün logosu seçimi için. null/undefined ise Genel Ekosistem kapağı kullanılır. */
  templateProduct?: string | null;
}) {
  const contactName = target?.contact_name ?? target?.primary_contact_name ?? null;
  const contactEmail = target?.contact_email ?? target?.primary_contact_email ?? null;

  // Şablon dili, bölgeden bağımsız bir teklif kararıdır. Örneğin Türkiye'deki
  // uluslararası müşteriye İngilizce teklif verilebilir; bu durumda bölgeye
  // bakmak yanlış belge dilini üretirdi.
  const lang: "tr" | "en" = proposal.language === "en" ? "en" : "tr";
  const legalRegion: "tr" | "us" = proposal.region === "global" ? "us" : "tr";
  const byType = (type: string) => sections?.find((s) => s.section_type === type) ?? null;
  const coverSection = byType("cover");
  const scopeSection = byType("scope");
  const productSection = byType("product_info");
  const technicalSection = byType("technical_specs");
  const timelineSection = byType("implementation_timeline");
  const supportSection = byType("support_sla");
  const legalSection = sections?.find((s) => s.section_type === "legal_terms" && s.legal_region === legalRegion) ?? null;
  const bankSection = byType("bank_info");
  const signatureSection = byType("signature");

  const reference = proposalReference(proposal);
  const coverImage = templateProduct ? PRODUCT_COVER_IMAGE[templateProduct] ?? GENERAL_COVER_IMAGE : GENERAL_COVER_IMAGE;
  const productWhiteLogo = templateProduct ? PRODUCT_LOGO_WHITE[templateProduct] : null;

  // Bu teklifte geçen ürünlerin (kalemlerden türetilen) benzersiz listesi —
  // "ön yazı" sayfasında ürün logolarını bir şerit halinde göstermek için.
  const distinctProducts = Array.from(new Set(items.map((i) => i.product))).filter((p) => PRODUCT_LOGO_COLOR[p]);

  const subtotal = items.reduce((sum, item) => sum + Number(item.line_total ?? 0), 0);
  const totalDiscount = items.reduce(
    (sum, item) => sum + item.quantity * item.unit_price - item.line_total,
    0
  );
  const vatRate = Number(proposal.vat_rate ?? 0);
  const vatAmount = subtotal * (vatRate / 100);

  return (
    <Document title={`Respongo Teklif - ${proposal.title}`}>
      {/* SAYFA 1 — KAPAK: ürün/Respongo logoları, kapak görseli, teklif başlığı ve kısa tanıtım metni. */}
      <Page size="A4" style={extraStyles.coverPage}>
        <Image src={coverImage} style={extraStyles.coverBgImage} />
        <View style={extraStyles.coverOverlay} />
        <View style={extraStyles.coverContent}>
          <View style={extraStyles.coverTopRow}>
            <Image src={RESPONGO_LOGO_WHITE} style={extraStyles.coverRespongoLogo} />
            {productWhiteLogo && <Image src={productWhiteLogo} style={extraStyles.coverProductLogo} />}
          </View>
          <View>
            <Text style={extraStyles.coverEyebrow}>{lang === "tr" ? "RESPONGO · TEKLİF" : "RESPONGO · PROPOSAL"} · {reference}</Text>
            <Text style={extraStyles.coverPreparedFor}>{lang === "tr" ? "MÜŞTERİ BİLGİLERİ" : "PREPARED FOR"}</Text>
            <Text style={extraStyles.coverTitle}>{target?.company_name ?? proposal.title}</Text>
            <Text style={extraStyles.coverBody}>
              {coverSection
                ? pick(lang, coverSection.body_tr, coverSection.body_en)
                : proposal.title}
            </Text>
            <View style={extraStyles.coverMetaRow}>
              <View style={extraStyles.coverMetaCol}>
                <Text style={extraStyles.coverMetaLabel}>{lang === "tr" ? "Hazırlayan" : "Prepared by"}</Text>
                <Text style={extraStyles.coverMetaValue}>{ownerName ?? "Respongo"}</Text>
              </View>
              <View style={extraStyles.coverMetaCol}>
                <Text style={extraStyles.coverMetaLabel}>{lang === "tr" ? "Tarih" : "Date"}</Text>
                <Text style={extraStyles.coverMetaValue}>{fmtDate(proposal.sent_at ?? proposal.created_at)}</Text>
              </View>
              <View style={extraStyles.coverMetaCol}>
                <Text style={extraStyles.coverMetaLabel}>{lang === "tr" ? "Geçerlilik" : "Valid until"}</Text>
                <Text style={extraStyles.coverMetaValue}>{fmtDate(proposal.valid_until)}</Text>
              </View>
            </View>
          </View>
          <Text style={extraStyles.coverFooter}>
            Respongo · Kurumsal Öğrenme ve Yetenek Teknolojileri · respongo.com · {reference}
          </Text>
        </View>
      </Page>

      {/* SAYFA 2 — ÖN YAZI / TEKLİF DETAYLARI: müşteri bilgileri, teklif meta verisi, giriş yazısı, kapsanan ürünler. */}
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Image src={RESPONGO_LOGO_COLOR} style={styles.brandLogo} />
            <Text style={styles.brandSlogan}>Kurumsal Öğrenme ve Yetenek Teknolojileri</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{lang === "tr" ? "TEKLİF DETAYLARI" : "PROPOSAL DETAILS"}</Text>
            <Text style={styles.docMeta}>{reference} · {proposal.title}</Text>
            <Text style={styles.docMeta}>
              {(lang === "tr" ? "Tarih: " : "Date: ") + fmtDate(proposal.sent_at ?? proposal.created_at)}
            </Text>
            <Text style={styles.docMeta}>
              {(lang === "tr" ? "Geçerlilik: " : "Valid until: ") + fmtDate(proposal.valid_until)}
            </Text>
          </View>
        </View>

        {coverSection && (
          <View style={{ marginBottom: 16 }}>
            <Text style={styles.sectionTitle}>{lang === "tr" ? "Ön Yazı" : "Cover Letter"}</Text>
            <Text style={extraStyles.introLead}>{pick(lang, coverSection.body_tr, coverSection.body_en)}</Text>
          </View>
        )}

        <View style={extraStyles.introMetaCard}>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "Firma" : "Company"}</Text>
            <Text style={styles.fieldValue}>{target?.company_name ?? "—"}</Text>
          </View>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "İlgili Kişi" : "Contact"}</Text>
            <Text style={styles.fieldValue}>{contactName ?? "—"}</Text>
          </View>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "E-posta" : "Email"}</Text>
            <Text style={styles.fieldValue}>{contactEmail ?? "—"}</Text>
          </View>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "Bölge" : "Region"}</Text>
            <Text style={styles.fieldValue}>{proposal.region ? REGION_LABEL[proposal.region] ?? proposal.region : "—"}</Text>
          </View>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "Para Birimi" : "Currency"}</Text>
            <Text style={styles.fieldValue}>{proposal.currency}</Text>
          </View>
          <View style={extraStyles.introMetaCol}>
            <Text style={styles.fieldLabel}>{lang === "tr" ? "Hazırlayan" : "Prepared by"}</Text>
            <Text style={styles.fieldValue}>{ownerName ?? "—"}</Text>
          </View>
        </View>

        {distinctProducts.length > 0 && (
          <View style={{ marginBottom: 4 }}>
            <Text style={styles.sectionTitle}>{lang === "tr" ? "Bu Teklif Kapsamındaki Ürünler" : "Products Covered in This Proposal"}</Text>
            <View style={extraStyles.productLegendRow}>
              {distinctProducts.map((p) => (
                <View key={p} style={extraStyles.productLegendChip}>
                  <Image src={PRODUCT_LOGO_COLOR[p]} style={extraStyles.productLegendLogo} />
                </View>
              ))}
            </View>
          </View>
        )}

        <PageFooter lang={lang} />
      </Page>

      {/* SAYFA 3 — ÜRÜN VE HİZMET DETAYLARI: kalem tablosu + ara toplam/KDV/genel toplam. */}
      <Page size="A4" style={styles.page}>
        <Text style={[styles.sectionTitle, { fontSize: 13, textTransform: "none", color: "#171A23", marginBottom: 12 }]}>
          {lang === "tr" ? "Ürün ve Hizmet Detayları" : "Products & Services"}
        </Text>
        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, styles.colDesc]}>{lang === "tr" ? "Kalem" : "Item"}</Text>
            <Text style={[styles.tHeadCell, styles.colQty]}>{lang === "tr" ? "Adet" : "Qty"}</Text>
            <Text style={[styles.tHeadCell, styles.colUnit]}>{lang === "tr" ? "Birim Fiyat" : "Unit Price"}</Text>
            <Text style={[styles.tHeadCell, styles.colDisc]}>{lang === "tr" ? "İskonto" : "Discount"}</Text>
            <Text style={[styles.tHeadCell, styles.colTotal]}>{lang === "tr" ? "Toplam" : "Total"}</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tCell}>{item.description || "—"}</Text>
                <View style={[styles.productPill, { backgroundColor: PRODUCT_ACCENT[item.product] ?? GENERAL_ACCENT }]}>
                  <Text style={styles.productPillText}>{PRODUCT_LABEL[item.product] ?? item.product}</Text>
                </View>
              </View>
              <Text style={[styles.tCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tCell, styles.colUnit]}>{fmtMoney(item.unit_price, proposal.currency)}</Text>
              <Text style={[styles.tCell, styles.colDisc]}>
                {item.discount_percent > 0 ? `%${item.discount_percent}` : "—"}
              </Text>
              <Text style={[styles.tCell, styles.colTotal]}>{fmtMoney(item.line_total, proposal.currency)}</Text>
            </View>
          ))}
          {items.length === 0 && (
            <View style={styles.tRow}>
              <Text style={styles.tCell}>{lang === "tr" ? "Bu teklifte kalem yok." : "This proposal has no items."}</Text>
            </View>
          )}
        </View>

        <View style={styles.totalsBox}>
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{lang === "tr" ? "Ara Toplam" : "Subtotal"}</Text>
            <Text style={styles.totalsValue}>{fmtMoney(subtotal + totalDiscount, proposal.currency)}</Text>
          </View>
          {totalDiscount > 0.004 && (
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>{lang === "tr" ? "Toplam İskonto" : "Total Discount"}</Text>
              <Text style={styles.totalsValue}>-{fmtMoney(totalDiscount, proposal.currency)}</Text>
            </View>
          )}
          <View style={styles.totalsRow}>
            <Text style={styles.totalsLabel}>{lang === "tr" ? `KDV (%${vatRate})` : `VAT (${vatRate}%)`}</Text>
            <Text style={styles.totalsValue}>{fmtMoney(vatAmount, proposal.currency)}</Text>
          </View>
          <View style={styles.grandRow}>
            <Text style={styles.grandLabel}>{lang === "tr" ? "Genel Toplam" : "Grand Total"}</Text>
            <Text style={styles.grandValue}>{fmtMoney(proposal.total_amount, proposal.currency)}</Text>
          </View>
        </View>

        <PageFooter lang={lang} />
      </Page>

      {scopeSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, scopeSection.title_tr, scopeSection.title_en)}</Text>
          <Text style={extraStyles.listHeading}>{lang === "tr" ? "Kapsam dahilinde" : "Included in scope"}</Text>
          {(lang === "tr" ? scopeSection.content.included_tr : scopeSection.content.included_en) instanceof Array &&
            ((lang === "tr" ? scopeSection.content.included_tr : scopeSection.content.included_en) as string[]).map(
              (line, i) => (
                <Text key={i} style={extraStyles.listItem}>
                  • {line}
                </Text>
              )
            )}
          <Text style={extraStyles.listHeading}>{lang === "tr" ? "Kapsam dışında" : "Excluded from scope"}</Text>
          {(lang === "tr" ? scopeSection.content.excluded_tr : scopeSection.content.excluded_en) instanceof Array &&
            ((lang === "tr" ? scopeSection.content.excluded_tr : scopeSection.content.excluded_en) as string[]).map(
              (line, i) => (
                <Text key={i} style={extraStyles.listItem}>
                  • {line}
                </Text>
              )
            )}
          <PageFooter lang={lang} />
        </Page>
      )}

      {productSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          {templateProduct && PRODUCT_LOGO_COLOR[templateProduct] && (
            <Image src={PRODUCT_LOGO_COLOR[templateProduct]} style={{ width: 110, height: undefined, aspectRatio: 3.6, marginBottom: 16 }} />
          )}
          <Text style={extraStyles.extraTitle}>{pick(lang, productSection.title_tr, productSection.title_en)}</Text>
          <Text style={extraStyles.extraBody}>{pick(lang, productSection.body_tr, productSection.body_en)}</Text>
          <PageFooter lang={lang} />
        </Page>
      )}

      {technicalSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, technicalSection.title_tr, technicalSection.title_en)}</Text>
          {pickGroups(lang, technicalSection.content).map((group, gi) => (
            <View key={gi} style={{ marginBottom: 10 }}>
              {group.label ? <Text style={extraStyles.listHeading}>{group.label}</Text> : null}
              {group.items.map((line, i) => (
                <Text key={i} style={extraStyles.listItem}>
                  • {line}
                </Text>
              ))}
            </View>
          ))}
          <PageFooter lang={lang} />
        </Page>
      )}

      {timelineSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, timelineSection.title_tr, timelineSection.title_en)}</Text>
          {pickList(lang, timelineSection.content, "phases").map((line, i) => (
            <Text key={i} style={extraStyles.listItem}>
              • {line}
            </Text>
          ))}
          <PageFooter lang={lang} />
        </Page>
      )}

      {supportSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, supportSection.title_tr, supportSection.title_en)}</Text>
          {pickList(lang, supportSection.content, "tiers").map((line, i) => (
            <Text key={i} style={extraStyles.listItem}>
              • {line}
            </Text>
          ))}
          <PageFooter lang={lang} />
        </Page>
      )}

      {legalSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, legalSection.title_tr, legalSection.title_en)}</Text>
          <Text style={extraStyles.extraBody}>{pick(lang, legalSection.body_tr, legalSection.body_en)}</Text>
          <PageFooter lang={lang} />
        </Page>
      )}

      {bankSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, bankSection.title_tr, bankSection.title_en)}</Text>
          <Text style={extraStyles.extraBody}>{pick(lang, bankSection.body_tr, bankSection.body_en)}</Text>
          <View style={extraStyles.bankGrid}>
            <View style={extraStyles.bankField}>
              <Text style={styles.fieldLabel}>{lang === "tr" ? "Banka" : "Bank"}</Text>
              <Text style={styles.fieldValue}>{String(bankSection.content.bank_name || "—")}</Text>
            </View>
            <View style={extraStyles.bankField}>
              <Text style={styles.fieldLabel}>{lang === "tr" ? "Hesap Adı" : "Account Name"}</Text>
              <Text style={styles.fieldValue}>{String(bankSection.content.account_name || "—")}</Text>
            </View>
            <View style={extraStyles.bankField}>
              <Text style={styles.fieldLabel}>IBAN</Text>
              <Text style={styles.fieldValue}>{String(bankSection.content.iban || "—")}</Text>
            </View>
            <View style={extraStyles.bankField}>
              <Text style={styles.fieldLabel}>SWIFT</Text>
              <Text style={styles.fieldValue}>{String(bankSection.content.swift || "—")}</Text>
            </View>
          </View>
          <PageFooter lang={lang} />
        </Page>
      )}

      {signatureSection && (
        <Page size="A4" style={extraStyles.extraPage}>
          <Text style={extraStyles.extraTitle}>{pick(lang, signatureSection.title_tr, signatureSection.title_en)}</Text>
          <Text style={extraStyles.extraBody}>{pick(lang, signatureSection.body_tr, signatureSection.body_en)}</Text>
          <View style={extraStyles.sigBlock}>
            <View style={extraStyles.sigLine}>
              <Text style={{ fontSize: 8.5, color: "#8A8FA0" }}>
                {lang === "tr" ? "Respongo Yetkilisi — Ad / Tarih" : "Respongo Representative — Name / Date"}
              </Text>
            </View>
            <View style={extraStyles.sigLine}>
              <Text style={{ fontSize: 8.5, color: "#8A8FA0" }}>
                {lang === "tr" ? "Müşteri Yetkilisi — Ad / Tarih" : "Customer Representative — Name / Date"}
              </Text>
            </View>
          </View>
          <PageFooter lang={lang} />
        </Page>
      )}

      {!sections && (
        <Page size="A4" style={{ padding: 0 }}>
          {/* Şablonsuz (legacy) teklifler için tek sayfalık basit özet — kapak/kapsam/ürün
              bilgisi/hukuki metin yok, ama logo ve KDV kırılımı burada da tutarlı görünür. */}
          <View style={styles.page}>
            <View style={styles.brandRow}>
              <View>
                <Image src={RESPONGO_LOGO_COLOR} style={styles.brandLogo} />
                <Text style={styles.brandSlogan}>Kurumsal Öğrenme ve Yetenek Teknolojileri</Text>
              </View>
              <View>
                <Text style={styles.docTitle}>{lang === "tr" ? "TEKLİF" : "PROPOSAL"}</Text>
                <Text style={styles.docMeta}>{reference} · {proposal.title}</Text>
                <Text style={styles.docMeta}>
                  {(lang === "tr" ? "Tarih: " : "Date: ") + fmtDate(proposal.sent_at ?? proposal.created_at)}
                </Text>
                <Text style={styles.docMeta}>
                  {(lang === "tr" ? "Geçerlilik: " : "Valid until: ") + fmtDate(proposal.valid_until)}
                </Text>
              </View>
            </View>

            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>{lang === "tr" ? "Müşteri Bilgileri" : "Customer Details"}</Text>
              <View style={styles.fieldRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "Firma" : "Company"}</Text>
                  <Text style={styles.fieldValue}>{target?.company_name ?? "—"}</Text>
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "İlgili Kişi" : "Contact"}</Text>
                  <Text style={styles.fieldValue}>{contactName ?? "—"}</Text>
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "E-posta" : "Email"}</Text>
                  <Text style={styles.fieldValue}>{contactEmail ?? "—"}</Text>
                </View>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "Bölge" : "Region"}</Text>
                  <Text style={styles.fieldValue}>{proposal.region ? REGION_LABEL[proposal.region] ?? proposal.region : "—"}</Text>
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "Para Birimi" : "Currency"}</Text>
                  <Text style={styles.fieldValue}>{proposal.currency}</Text>
                </View>
                <View style={styles.fieldCol}>
                  <Text style={styles.fieldLabel}>{lang === "tr" ? "Hazırlayan" : "Prepared by"}</Text>
                  <Text style={styles.fieldValue}>{ownerName ?? "—"}</Text>
                </View>
              </View>
            </View>

            <View style={styles.table}>
              <View style={styles.tHeadRow}>
                <Text style={[styles.tHeadCell, styles.colDesc]}>{lang === "tr" ? "Kalem" : "Item"}</Text>
                <Text style={[styles.tHeadCell, styles.colQty]}>{lang === "tr" ? "Adet" : "Qty"}</Text>
                <Text style={[styles.tHeadCell, styles.colUnit]}>{lang === "tr" ? "Birim Fiyat" : "Unit Price"}</Text>
                <Text style={[styles.tHeadCell, styles.colDisc]}>{lang === "tr" ? "İskonto" : "Discount"}</Text>
                <Text style={[styles.tHeadCell, styles.colTotal]}>{lang === "tr" ? "Toplam" : "Total"}</Text>
              </View>
              {items.map((item) => (
                <View key={item.id} style={styles.tRow}>
                  <View style={styles.colDesc}>
                    <Text style={styles.tCell}>{item.description || "—"}</Text>
                    <View style={[styles.productPill, { backgroundColor: PRODUCT_ACCENT[item.product] ?? GENERAL_ACCENT }]}>
                      <Text style={styles.productPillText}>{PRODUCT_LABEL[item.product] ?? item.product}</Text>
                    </View>
                  </View>
                  <Text style={[styles.tCell, styles.colQty]}>{item.quantity}</Text>
                  <Text style={[styles.tCell, styles.colUnit]}>{fmtMoney(item.unit_price, proposal.currency)}</Text>
                  <Text style={[styles.tCell, styles.colDisc]}>
                    {item.discount_percent > 0 ? `%${item.discount_percent}` : "—"}
                  </Text>
                  <Text style={[styles.tCell, styles.colTotal]}>{fmtMoney(item.line_total, proposal.currency)}</Text>
                </View>
              ))}
              {items.length === 0 && (
                <View style={styles.tRow}>
                  <Text style={styles.tCell}>{lang === "tr" ? "Bu teklifte kalem yok." : "This proposal has no items."}</Text>
                </View>
              )}
            </View>

            <View style={styles.totalsBox}>
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{lang === "tr" ? "Ara Toplam" : "Subtotal"}</Text>
                <Text style={styles.totalsValue}>{fmtMoney(subtotal + totalDiscount, proposal.currency)}</Text>
              </View>
              {totalDiscount > 0.004 && (
                <View style={styles.totalsRow}>
                  <Text style={styles.totalsLabel}>{lang === "tr" ? "Toplam İskonto" : "Total Discount"}</Text>
                  <Text style={styles.totalsValue}>-{fmtMoney(totalDiscount, proposal.currency)}</Text>
                </View>
              )}
              <View style={styles.totalsRow}>
                <Text style={styles.totalsLabel}>{lang === "tr" ? `KDV (%${vatRate})` : `VAT (${vatRate}%)`}</Text>
                <Text style={styles.totalsValue}>{fmtMoney(vatAmount, proposal.currency)}</Text>
              </View>
              <View style={styles.grandRow}>
                <Text style={styles.grandLabel}>{lang === "tr" ? "Genel Toplam" : "Grand Total"}</Text>
                <Text style={styles.grandValue}>{fmtMoney(proposal.total_amount, proposal.currency)}</Text>
              </View>
            </View>

            <PageFooter lang={lang} />
          </View>
        </Page>
      )}
    </Document>
  );
}
