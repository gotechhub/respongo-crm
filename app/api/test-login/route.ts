import { NextResponse } from "next/server";

// GÜVENLİK NEDENİYLE KALICI OLARAK DEVRE DIŞI (08.09.2026):
// Bu rota, service_role anahtarını kullanarak HERHANGİ BİR ziyaretçiyi
// e-posta/şifre olmadan tek istekle info@respongo.com olarak oturum
// açtırıyordu. Repo public olduğu için bu, canlı sitede herkesin
// kullanabileceği bir kimlik doğrulama atlatma açığıydı — kaldırıldı.
// Farklı rollerde test yapmak için: Süper Admin > Sistem Ayarları >
// "Master Admin View-As" panelini kullan (gerçek, denetimli oturum
// devralma — bkz. lib/view-as/actions.ts).
export async function GET() {
  return new NextResponse("Not found", { status: 404 });
}
