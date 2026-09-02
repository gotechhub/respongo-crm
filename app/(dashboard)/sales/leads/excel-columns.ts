// Lead Excel import/export şablon başlıkları — tek doğru kaynak. Hem şablon
// indirme hem içe aktarma bu AYNI başlık metinlerini kullanmalı, aksi halde
// dışa aktarılan/indirilen bir dosya tekrar içe aktarılamaz.
export const LEAD_EXCEL_HEADERS = [
  "Firma Adı",
  "İletişim Adı",
  "E-posta",
  "Telefon",
  "Bölge (tr/global)",
  "Değer Tahmini",
  "Para Birimi (USD/EUR/TRY/GBP)",
  "Sahip E-postası (opsiyonel)",
  "Dış Referans (Apollo ID vb.)",
] as const;

export const LEAD_EXCEL_EXAMPLE_ROW = [
  "Örnek A.Ş.",
  "Ayşe Yılmaz",
  "ayse@ornek.com",
  "+90 555 000 00 00",
  "tr",
  "10000",
  "USD",
  "",
  "",
];
