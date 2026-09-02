// Satış Havuzu (customer_pool) Excel import/export şablon başlıkları — tek
// doğru kaynak, hem şablon indirme hem içe aktarma AYNI başlıkları kullanır.
export const POOL_EXCEL_HEADERS = [
  "Firma Adı",
  "İletişim Adı",
  "E-posta",
  "Telefon",
  "Ülke",
  "Bölge (tr/global)",
  "Not",
  "Sahip E-postası (opsiyonel)",
  "Dış Referans (Apollo ID vb.)",
] as const;

export const POOL_EXCEL_EXAMPLE_ROW = [
  "Örnek A.Ş.",
  "Ayşe Yılmaz",
  "ayse@ornek.com",
  "+90 555 000 00 00",
  "Türkiye",
  "tr",
  "",
  "",
  "",
];
