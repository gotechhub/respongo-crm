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

export function InvoicePdfDocument({
  invoice,
  customerName,
  proposalTitle,
  payments,
  paidTotal,
  remaining,
}: {
  invoice: {
    id: string;
    invoice_number: string | null;
    amount: number;
    currency: string;
    status: string;
    issue_date: string | null;
    due_date: string | null;
    notes: string | null;
  };
  customerName: string | null;
  proposalTitle: string | null;
  payments: InvoicePdfPayment[];
  paidTotal: number;
  remaining: number;
}) {
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
            <Text style={styles.docMeta}>{invoice.invoice_number ?? "—"}</Text>
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
