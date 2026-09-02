import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const METHOD_LABEL: Record<string, string> = {
  bank_transfer: "Banka Havalesi",
  credit_card: "Kredi Kartı",
  cash: "Nakit",
  other: "Diğer",
};

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
  colDate: { width: "22%" },
  colMethod: { width: "26%" },
  colRef: { width: "30%" },
  colAmount: { width: "22%", textAlign: "right" },
  colItemDesc: { width: "40%" },
  colItemQty: { width: "12%", textAlign: "right" },
  colItemUnitPrice: { width: "18%", textAlign: "right" },
  colItemVat: { width: "12%", textAlign: "right" },
  colItemTotal: { width: "18%", textAlign: "right" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 14 },
  totalBox: { border: "1pt solid #DFE3ED", borderRadius: 8, backgroundColor: "#EEF0F6", padding: "10 16", alignItems: "flex-end", minWidth: 130 },
  totalBoxAlt: { border: "1pt solid #F0D69B", borderRadius: 8, backgroundColor: "#FCF1DC", padding: "10 16", alignItems: "flex-end", minWidth: 130 },
  totalLabel: { fontSize: 8, fontWeight: 700, textTransform: "uppercase", color: "#8A8FA0" },
  totalValue: { fontSize: 16, fontWeight: 700, marginTop: 2 },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, fontSize: 7.5, color: "#8A8FA0", textAlign: "center", borderTop: "1pt solid #EEF0F6", paddingTop: 8 },
});

export type InvoicePdfPayment = {
  id: string;
  amount: number;
  currency: string;
  method: string;
  paid_at: string;
  reference_no: string | null;
};

export type InvoicePdfItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  vat_rate: number;
  line_total: number;
};

export function InvoicePdfDocument({
  invoice,
  customerName,
  proposalTitle,
  items,
  payments,
  paidTotal,
  remaining,
}: {
  invoice: {
    id: string;
    invoice_number: string | null;
    parasut_invoice_no: string | null;
    amount: number;
    currency: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    notes: string | null;
  };
  customerName: string | null;
  proposalTitle: string | null;
  items: InvoicePdfItem[];
  payments: InvoicePdfPayment[];
  paidTotal: number;
  remaining: number;
}) {
  const kdvTotal = items.reduce((sum, it) => sum + (Number(it.line_total) || 0) * (Number(it.vat_rate) || 0) / 100, 0);
  const itemsSubtotal = items.reduce((sum, it) => sum + (Number(it.line_total) || 0), 0);
  const grandTotal = itemsSubtotal + kdvTotal;
  return (
    <Document title={`Respongo Fatura - ${invoice.invoice_number ?? invoice.id}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brandMark}>RESPONGO</Text>
            <Text style={styles.brandSlogan}>Kurumsal Öğrenme ve Yetenek Teknolojileri</Text>
          </View>
          <View>
            <Text style={styles.docTitle}>FATURA</Text>
            <Text style={styles.docMeta}>{invoice.parasut_invoice_no ?? invoice.invoice_number ?? "—"}</Text>
            {invoice.parasut_invoice_no && invoice.invoice_number && (
              <Text style={styles.docMeta}>Dahili Referans: {invoice.invoice_number}</Text>
            )}
            <Text style={styles.docMeta}>Fatura Tarihi: {fmtDate(invoice.issue_date)}</Text>
            <Text style={styles.docMeta}>Vade Tarihi: {fmtDate(invoice.due_date)}</Text>
          </View>
        </View>

        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Fatura Bilgileri</Text>
          <View style={styles.fieldRow}>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Müşteri</Text>
              <Text style={styles.fieldValue}>{customerName ?? "—"}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Kaynak Teklif</Text>
              <Text style={styles.fieldValue}>{proposalTitle ?? "Doğrudan fatura"}</Text>
            </View>
            <View style={styles.fieldCol}>
              <Text style={styles.fieldLabel}>Tutar</Text>
              <Text style={styles.fieldValue}>{fmtMoney(invoice.amount, invoice.currency)}</Text>
            </View>
          </View>
          {invoice.notes && (
            <View style={styles.fieldRow}>
              <View style={{ width: "100%" }}>
                <Text style={styles.fieldLabel}>Not</Text>
                <Text style={styles.fieldValue}>{invoice.notes}</Text>
              </View>
            </View>
          )}
        </View>

        {items.length > 0 && (
          <View style={[styles.table, { marginBottom: 16 }]}>
            <View style={styles.tHeadRow}>
              <Text style={[styles.tHeadCell, styles.colItemDesc]}>Açıklama</Text>
              <Text style={[styles.tHeadCell, styles.colItemQty]}>Miktar</Text>
              <Text style={[styles.tHeadCell, styles.colItemUnitPrice]}>Birim Fiyat</Text>
              <Text style={[styles.tHeadCell, styles.colItemVat]}>KDV %</Text>
              <Text style={[styles.tHeadCell, styles.colItemTotal]}>Tutar</Text>
            </View>
            {items.map((it) => (
              <View key={it.id} style={styles.tRow}>
                <Text style={[styles.tCell, styles.colItemDesc]}>{it.description}</Text>
                <Text style={[styles.tCell, styles.colItemQty]}>{it.quantity}</Text>
                <Text style={[styles.tCell, styles.colItemUnitPrice]}>{fmtMoney(it.unit_price, invoice.currency)}</Text>
                <Text style={[styles.tCell, styles.colItemVat]}>{it.vat_rate}</Text>
                <Text style={[styles.tCell, styles.colItemTotal]}>{fmtMoney(it.line_total, invoice.currency)}</Text>
              </View>
            ))}
            <View style={[styles.tRow, { justifyContent: "flex-end", gap: 16 }]}>
              <Text style={[styles.tCell, { fontWeight: 700 }]}>Ara Toplam: {fmtMoney(itemsSubtotal, invoice.currency)}</Text>
              <Text style={[styles.tCell, { fontWeight: 700 }]}>KDV: {fmtMoney(kdvTotal, invoice.currency)}</Text>
              <Text style={[styles.tCell, { fontWeight: 700 }]}>Genel Toplam: {fmtMoney(grandTotal, invoice.currency)}</Text>
            </View>
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tHeadRow}>
            <Text style={[styles.tHeadCell, styles.colDate]}>Tarih</Text>
            <Text style={[styles.tHeadCell, styles.colMethod]}>Yöntem</Text>
            <Text style={[styles.tHeadCell, styles.colRef]}>Referans</Text>
            <Text style={[styles.tHeadCell, styles.colAmount]}>Tutar</Text>
          </View>
          {payments.map((p) => (
            <View key={p.id} style={styles.tRow}>
              <Text style={[styles.tCell, styles.colDate]}>{fmtDate(p.paid_at)}</Text>
              <Text style={[styles.tCell, styles.colMethod]}>{METHOD_LABEL[p.method] ?? p.method}</Text>
              <Text style={[styles.tCell, styles.colRef]}>{p.reference_no || "—"}</Text>
              <Text style={[styles.tCell, styles.colAmount]}>{fmtMoney(p.amount, p.currency)}</Text>
            </View>
          ))}
          {payments.length === 0 && (
            <View style={styles.tRow}>
              <Text style={styles.tCell}>Bu faturaya henüz ödeme kaydedilmedi.</Text>
            </View>
          )}
        </View>

        <View style={styles.totalsRow}>
          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>Tahsil Edilen</Text>
            <Text style={styles.totalValue}>{fmtMoney(paidTotal, invoice.currency)}</Text>
          </View>
          <View style={remaining > 0 ? styles.totalBoxAlt : styles.totalBox}>
            <Text style={styles.totalLabel}>Kalan</Text>
            <Text style={styles.totalValue}>{fmtMoney(remaining, invoice.currency)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Bu fatura Respongo CRM üzerinden otomatik oluşturulmuştur · respongo.com
        </Text>
      </Page>
    </Document>
  );
}
