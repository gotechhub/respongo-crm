-- ============================================================================
-- Faz 6 — Fiyat listesi: TR/Global fiyat ayrımı + CRUD için bölge alanı
-- ----------------------------------------------------------------------------
-- Kullanıcı talebi: "fiyat listelerini güncelleme silme ekleme ve değiştirme
-- yapabilmeliyiz. ayrıca tr ve en fiyatları farklılık gösterebilir buna göre
-- de ayıralım."
--
-- Karar: price_lists tablosuna `region` (tr | global | null) sütunu eklendi.
-- NULL = her iki bölgeye de açık ortak liste (geriye dönük uyumluluk ve
-- "ürüne özel, bölgeden bağımsız" listeler için). Bu, uygulamadaki mevcut
-- Region tipiyle (lib/roles.ts: 'tr' | 'global') ve partner_tr/partner_global
-- rol ayrımıyla birebir örtüşüyor — proposal_template_sections.legal_region
-- ('tr' | 'us') ile aynı desenin fiyat listesi tarafındaki karşılığı.
--
-- Geriye dönük veri: mevcut listelerde region henüz seçilmediği için para
-- birimine göre makul bir varsayılan atanıyor (TRY -> tr, diğerleri ->
-- global). Bu sadece başlangıç değeri; founder dilediği zaman panelden
-- değiştirebilir (CRUD zaten founder'a tam yetki veriyor, RLS'de değişiklik
-- gerekmiyor — sadece okuma politikaları bölgeye göre inceltiliyor).
--
-- NOT (şema kayması disiplini): CRUD işlemleri artık uygulama üzerinden
-- (actions.ts) yapılacağı için bundan sonra price_lists/price_list_items
-- üzerinde yapılan HER değişiklik migration olarak da kayıt altına
-- alınmalı — aksi halde bu oturumda 4 kez karşılaşılan "prod'da var,
-- migration'da yok" kayması price list tarafında da oluşur.
-- ============================================================================

-- public.region enum kullanılıyor (text + ad-hoc check constraint DEĞİL) —
-- leads/customers/customer_pool/proposals/projects tablolarındaki region
-- kolonuyla BİREBİR AYNI tip olmalı, çünkü region_admin RLS politikaları
-- (bkz. 20260911000011) bunu public.current_region()'ın enum dönüş tipiyle
-- doğrudan karşılaştırıyor — text ile enum karşılaştırması Postgres'te tip
-- hatası verir.
alter table public.price_lists
  add column if not exists region public.region;

comment on column public.price_lists.region is
  'tr = sadece Türkiye bölgesi fiyatı, global = sadece global/EN fiyatı, NULL = her iki bölgede de geçerli ortak liste.';

update public.price_lists
set region = (case when currency = 'TRY' then 'tr' else 'global' end)::public.region
where region is null
  and id in (
    -- Sadece bu oturumdan önce var olan (create_by dolu olan demo/gerçek)
    -- kayıtları etkiler; koşul kaldırılabilir ama açıkça WHERE region is null
    -- zaten idempotent olduğundan ekstra filtreye gerek yok — sade tutuluyor.
    select id from public.price_lists where region is null
  );

create index if not exists idx_price_lists_region on public.price_lists (region);

-- ----------------------------------------------------------------------------
-- Okuma politikalarını bölgeye göre inceltme:
--   - sales_inhouse: her şeyi görür (iç satış ekibi tüm bölgelere satış yapar).
--   - partner_tr: region = 'tr' veya NULL (ortak) listeleri görür.
--   - partner_global: region = 'global' veya NULL (ortak) listeleri görür.
-- Böylece "İş Ortağım" panelindeki bir TR ortağı yanlışlıkla Global/USD
-- fiyatını, bir Global ortak da TR/TRY fiyatını görmez.
-- ----------------------------------------------------------------------------

drop policy if exists "price_lists_internal_select" on public.price_lists;
create policy "price_lists_internal_select" on public.price_lists
  for select using (
    public.current_role() = 'sales_inhouse'
    or (public.current_role() = 'partner_tr' and (region = 'tr' or region is null))
    or (public.current_role() = 'partner_global' and (region = 'global' or region is null))
  );

drop policy if exists "price_list_items_internal_select" on public.price_list_items;
create policy "price_list_items_internal_select" on public.price_list_items
  for select using (
    exists (
      select 1
      from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and (
          public.current_role() = 'sales_inhouse'
          or (public.current_role() = 'partner_tr' and (pl.region = 'tr' or pl.region is null))
          or (public.current_role() = 'partner_global' and (pl.region = 'global' or pl.region is null))
        )
    )
  );
