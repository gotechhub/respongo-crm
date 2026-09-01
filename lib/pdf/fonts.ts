// Sunucu tarafında (Node.js route handler) PDF oluştururken kullanılan Türkçe
// karakter destekli font kaydı. @react-pdf/renderer'ın varsayılan Helvetica
// fontu ğ/ş/ı/İ/ö/ü/ç karakterlerini desteklemiyor (WinAnsi encoding Türkçe
// karakterleri kapsamıyor) — bu yüzden tam Roboto Regular/Bold (woff) dosyaları
// assets/fonts altında repo'ya gömülü, network'e bağımlılık yok.
// ÖNEMLİ (doğrulanmış, bir daha denenmesin): Google Fonts'un "latin" ve
// "latin-ext" olarak ikiye böldüğü subset dosyaları YETERSİZ — "latin" alt
// kümesinde ı (dotless-i, U+0131) var ama ğ/ş/İ yok; "latin-ext" alt kümesinde
// ğ/ş/İ var ama ı yok. @react-pdf/renderer tek bir Text içinde iki fontu
// otomatik karıştırmıyor, bu yüzden HER İKİ küme de tek dosyada olmalı — bu
// yüzden "roboto-fontface" npm paketinin bölünmemiş, tüm Latin Extended
// karakterleri TEK dosyada barındıran Roboto-Regular.woff/Roboto-Bold.woff
// dosyaları kullanılıyor (@fontsource/roboto'nun subset dosyaları DEĞİL).
// woff2 DENENDİ, fontkit'in glyph encode aşamasında hataya düşüyor — woff
// formatı güvenilir çalışıyor (bkz. Faz 4/Adım 3 doğrulama notu, DERS 22).
import path from "path";
import { Font } from "@react-pdf/renderer";

let registered = false;

export function registerPdfFonts() {
  if (registered) return;
  const dir = path.join(process.cwd(), "assets", "fonts");
  Font.register({
    family: "Roboto",
    fonts: [
      { src: path.join(dir, "roboto-regular.woff"), fontWeight: 400 },
      { src: path.join(dir, "roboto-bold.woff"), fontWeight: 700 },
    ],
  });
  registered = true;
}
