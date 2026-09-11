-- Faz 6 — Lead içe aktarım / otomatik atama altyapısındaki GERÇEK hatalar
--
-- Kullanıcı isteği (birebir): "tüm fonksiyon hatalarını düzelt, tüm sistem hatalarını düzelt,
-- mantık hatalarını düzelt". Kod tabanı taranırken üç bağımsız, canlıda kesinlikle patlıyor olması
-- gereken eksik bulundu — hiçbiri önceki bir migration'da yok:
--
--  1. app/api/webhooks/website-lead/route.ts, app/api/webhooks/jivochat-chat/route.ts,
--     app/(dashboard)/sales/leads/import-actions.ts, app/(dashboard)/sales/import-actions.ts ve
--     app/(dashboard)/sales/leads/apollo-actions.ts — BEŞ ayrı yer — leads tablosuna
--     `.upsert(row, { onConflict: "region,contact_email_norm" })` çağrısı yapıyor ve kodun
--     kendi yorumu "Reuse the existing region/email unique constraint" diyor — ama böyle bir
--     kolon/constraint hiçbir migration'da hiç oluşturulmamış. Bu, web sitesi form webhook'u,
--     JivoChat entegrasyonu, CSV lead içe aktarımı ve Apollo.io içe aktarımının TAMAMININ canlıda
--     "there is no unique or exclusion constraint matching the ON CONFLICT specification"
--     hatasıyla PATLIYOR olması gerektiği anlamına gelir — muhtemelen leads/customer_pool'un
--     neden boş göründüğünün gerçek nedenlerinden biri budur (sadece demo veri eksikliği değil).
--  2. leads.external_ref VE customer_pool.external_ref kolonları — export route'ları
--     (app/api/leads/export, app/api/customer-pool/export), webhook'lar ve içe aktarım
--     kodu bu kolonu okuyup yazıyor ama hiçbir migration'da tanımlı değil.
--  3. public.auto_assign_lead(p_lead_id) RPC fonksiyonu — apollo-actions.ts ve import-actions.ts
--     (2 yerde) bunu çağırıyor ("en az iş yüküne sahip aktif sales_inhouse üyesine ata") ama
--     fonksiyonun kendisi hiç yazılmamış.
--
-- Bu migration üçünü de canlı koda TAM UYUMLU şekilde tamamlıyor.

-- ----------------------------------------------------------------------------
-- 1. external_ref — dış sistem referansı (Apollo.io kişi ID'si, JivoChat sohbet ID'si vb.)
-- ----------------------------------------------------------------------------

alter table public.leads add column if not exists external_ref text;
alter table public.customer_pool add column if not exists external_ref text;

create index if not exists idx_leads_external_ref on public.leads (external_ref);

-- ----------------------------------------------------------------------------
-- 2. contact_email_norm — normalize edilmiş e-posta + (region, contact_email_norm) üzerinde
--    benzersizlik. NULL e-postalar (contact_email boş bırakılmış lead'ler) Postgres'te
--    birbirinden farklı sayıldığından hiçbir zaman çakışma üretmez — bu istenen davranış,
--    sadece GERÇEK e-posta eşleşmelerinde upsert "zaten var, atla" yapsın diye.
-- ----------------------------------------------------------------------------

alter table public.leads
  add column if not exists contact_email_norm text
  generated always as (nullif(lower(trim(contact_email)), '')) stored;

do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and tablename = 'leads' and indexname = 'leads_region_contact_email_norm_key'
  ) then
    create unique index leads_region_contact_email_norm_key on public.leads (region, contact_email_norm);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- 3. auto_assign_lead — "en az iş yüküne sahip aktif sales_inhouse üyesine ata"
--    (import-actions.ts'deki Türkçe yorumdan birebir). Aday havuzu: rolü sales_inhouse,
--    aktif (is_active) ve lead ile aynı bölgede (ya da bölgesiz/global profil) olanlar.
--    "İş yükü" = o kişiye atanmış, henüz sonuçlanmamış (musteri/kaybedildi dışı) lead sayısı.
--    Eşitlik durumunda hesabı daha eski (created_at) olan tercih edilir — kabaca round-robin.
--    SECURITY DEFINER: hem founder/region_admin hem de Apollo import akışı (guard() sonrası
--    normal kullanıcı context'i) bu fonksiyonu çağırabilmeli; RLS'i bypass ederek leads.owner_id
--    günceller ve profiles'ı okur.
-- ----------------------------------------------------------------------------

create or replace function public.auto_assign_lead(p_lead_id uuid)
returns uuid
language plpgsql security definer set search_path = public
as $$
declare
  v_region public.region;
  v_chosen uuid;
begin
  select region into v_region from public.leads where id = p_lead_id;

  select p.id into v_chosen
  from public.profiles p
  where p.role = 'sales_inhouse'
    and p.is_active = true
    and (v_region is null or p.region = v_region or p.region is null)
  order by (
    select count(*) from public.leads l
    where l.owner_id = p.id and l.status not in ('musteri', 'kaybedildi')
  ) asc, p.created_at asc
  limit 1;

  if v_chosen is not null then
    update public.leads set owner_id = v_chosen where id = p_lead_id;
  end if;

  return v_chosen;
end;
$$;
