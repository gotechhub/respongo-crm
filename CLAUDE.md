# Respongo CRM - Master AI Coding Standards

## Proje Tanımı
Respongo CRM - B2B Müşteri, Lead, Teklif ve Satış Pipeline Yönetim Sistemi.

## Teknoloji Yığını
- **Frontend / Framework:** Next.js 15 (App Router), React 19, TailwindCSS, Shadcn UI
- **Backend / DB:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Dil:** TypeScript (Strict Mode)
- **Entegrasyonlar:** Apollo.io API, Brevo (Email Outreach), n8n Webhooks, Firecrawl MCP

## Kodlama ve Mimari Kurallar
1. **%100 TypeScript Strict:** `any` kullanımı yasaktır. Interface/Type tanımları `src/types/` altında toplanır.
2. **Supabase & RLS:** Tüm veritabanı işlemlerinde Row Level Security (RLS) şarttır.
3. **TDD Yaklaşımı:** Yeni modül eklenmeden önce test taslağı hazırlanır.
4. **Jeton Optimizasyonu:** Modüller sorgulanırken Graphify / Knowledge Graph mantığı kullanılır.


* yeni skil eklemeler


# Respongo CRM - Master AI Coding Standards

## Proje Tanımı
Respongo CRM - B2B Müşteri, Lead, Teklif ve Satış Pipeline Yönetim Sistemi.

## Teknoloji Yığını
- **Frontend / Framework:** Next.js 15 (App Router), React 19, TailwindCSS, Shadcn UI
- **Backend / DB:** Supabase (PostgreSQL, Auth, RLS, Storage)
- **Dil:** TypeScript (Strict Mode)
- **Entegrasyonlar:** Apollo.io API, Brevo (Email Outreach), n8n Webhooks, Firecrawl MCP

## Kodlama ve Mimari Kurallar
1. **%100 TypeScript Strict:** `any` kullanımı yasaktır. Interface/Type tanımları `src/types/` altında toplanır.
2. **Supabase & RLS:** Tüm veritabanı işlemlerinde Row Level Security (RLS) şarttır.
3. **TDD Yaklaşımı:** Yeni modül eklenmeden önce test taslağı hazırlanır.
4. **Jeton Optimizasyonu:** Modüller sorgulanırken Graphify / Knowledge Graph mantığı kullanılır.

## Yetenekler (Skills)
Projede tanımlı özel geliştirme kuralları ve yetenekleri `.claude/skills/` klasörü içerisinde yer almaktadır. Claude, ilgili görevlerde (veritabanı, UI/UX, entegrasyon, test vb.) bu dizindeki alt dosyaları rehber olarak almalıdır.

