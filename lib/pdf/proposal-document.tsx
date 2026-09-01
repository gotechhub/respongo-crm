import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const PRODUCT_LABEL: Record<string, string> = {
  golms: "GOLMS",
  golxp: "GOLXP",
  gocatalog: "GOCATALOG",
  gofactory: "GOFACTORY",
  gotools: "GOTOOLS",
};

const REGION_LABEL: Record<string, string> = { tr: "Türkiye", global: "Global" };

function fmtDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function fmtMoney(n: number, currency: string) {
  return `${Number(n).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} ${currency}`;
}

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: "Roboto", fontSize: 10, color: "#171A23" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 },
  brandMark: { fontSize: 18, fontWeight: 700, color: "#2454C7" },
  brandSlogan: { fontSize: 8.5, color: "#6B7280", marginTop: 2 },
  docTitle: { fontSize: 20, fontWeight: 700, textAlign: "right" },
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
  colDesc: { width: "42%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colDisc: { width: "12%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 14 },
  totalBox: { border: "1pt solid #DFE3ED", borderRadius: 8, backgroundColor: "#EEF0F6", padding: "10 16", alignItems: "flex-end" },
  totalLabel: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#8A8FA0" },
  totalValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7.5, color: "#8A8FA0", textAlign: "center", borderTop: "1pt solid #EEF0F6", paddingTop: 8 },
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

export function ProposalPdfDocument({
  proposal,
  items,
  target,
  ownerName,
}: {
  proposal: {
    id: string;
    title: string;
    currency: string;
    total_amount: number;
    valid_until: string | null;
    region: string | null;
    created_at: string;
    sent_at: string | null;
  };
  items: ProposalPdfItem[];
  target: ProposalPdfTarget;
  ownerName: string | null;
}) {
  const contactName = target?.contact_name ?? target?.primary_contact_name ?? null;
  const contactEmail = target?.contact_email ?? target?.primary_contact_email ?? null;

  return (
    <Document title={`Respongo Teklif - ${proposal.title}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandMark}>RESPONGO</Text>
            <Text style={styles.brandSlogan}>Kurumsal Öğrenme ve Yetenek Teknolojileri</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>TEKLİF</Text>
            <Text style={styles.docMeta}>{proposal.title}</Text>
            <Text style={styles.docMeta}>Tarih: {fmtDate(proposal.sent_at ?? proposal.created_at)}</Text>
            <Text style={styles.docMeta}>Geçerlilik: {fmtDate(proposal.valid_until)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Müşteri Bilgileri</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Firma</Text>
              <Text style={styles.fieldValue}>{target?.company_name ?? "—"}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>İlgili Kişi</Text>
              <Text style={styles.fieldValue}>{contactName ?? "—"}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>E-posta</Text>
              <Text style={styles.fieldValue}>{contactEmail ?? "—"}</Text>
            </View>
          </View>
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Bölge</Text>
              <Text style={styles.fieldValue}>{proposal.region ? REGION_LABEL[proposal.region] ?? proposal.region : "—"}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Para Birimi</Text>
              <Text style={styles.fieldValue}>{proposal.currency}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Hazırlayan</Text>
              <Text style={styles.fieldValue}>{ownerName ?? "—"}</Text>
            </View>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, styles.colDesc]}>Kalem</Text>
            <Text style={[styles.tHeadCell, styles.colQty]}>Adet</Text>
            <Text style={[styles.tHeadCell, styles.colUnit]}>Birim Fiyat</Text>
            <Text style={[styles.tHeadCell, styles.colDisc]}>İskonto</Text>
            <Text style={[styles.tHeadCell, styles.colTotal]}>Toplam</Text>
          </View>
          {items.map((item) => (
            <View key={item.id} style={styles.tRow}>
              <View style={styles.colDesc}>
                <Text style={styles.tCell}>{item.description || "—"}</Text>
                <Text style={{ fontSize: 7.5, color: "#8A8FA0", marginTop: 2 }}>
                  {PRODUCT_LABEL[item.product] ?? item.product}
                </Text>
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
              <Text style={styles.tCell}>Bu teklifte kalem yok.</Text>
            </View>
          )}
        </View>

        <View style={styles.totalRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Genel Toplam</Text>
            <Text style={styles.totalValue}>{fmtMoney(proposal.total_amount, proposal.currency)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Bu teklif Respongo CRM üzerinden otomatik oluşturulmuştur · respongo.com{"\n"}
          Bu belge bağlayıcı bir sözleşme değildir; nihai şartlar taraflarca imzalanacak sözleşmede belirlenir.
        </Text>
      </Page>
    </Document>
  );
}
