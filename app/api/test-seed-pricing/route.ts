import { NextResponse } from "next/server";

// GÜVENLİK NEDENİYLE KALICI OLARAK DEVRE DIŞI (08.09.2026):
// Bu rota, kimlik doğrulaması olmadan (service_role ile) veritabanına
// fiyat listesi satırı ekliyordu — herkese açık bir yazma uç noktasıydı,
// kaldırıldı. Fiyat listesi/örnek veri eklemek için Supabase migration'ları
// veya founder-only server action'lar kullanılmalı.
export async function GET() {
  return new NextResponse("Not found", { status: 404 });
}
