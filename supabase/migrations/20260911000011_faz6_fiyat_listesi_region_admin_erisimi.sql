-- ============================================================================
-- Faz 6 — Fiyat Listeleri: region_admin yönetim yetkisi (RLS'i role_permissions
-- ile hizala)
-- ----------------------------------------------------------------------------
-- KÖK NEDEN: role_permissions tablosu (20260826000002) founder + region_admin
-- rollerine price_lists modülü için can_edit=true veriyor (satır 96-100'deki
-- "founder + region_admin: tüm modüllere tam erişim" toplu INSERT'ü). Ama
-- price_lists/price_list_items üzerindeki GERÇEK RLS policy'si (init_schema)
-- sadece "price_lists_founder_all" — yani is_founder() şart koşuyor,
-- region_admin'i KAPSAMIYOR. Bu, uygulamanın kendi beyan ettiği yetki
-- modeliyle veritabanı zorlamasının UYUŞMADIĞI bir durum: role_permissions
-- "region_admin düzenleyebilir" diyor ama hiçbir RLS policy'si buna izin
-- vermiyordu (fiyat listesi CRUD'u bu tura kadar hiç yazılmamıştı, bu yüzden
-- fark hiç ortaya çıkmamıştı). Şimdi gerçek CRUD eklendiğine göre, bu turda
-- kapatılması gereken tam olarak böyle bir "eksik".
--
-- Diğer satış tablolarındaki (leads, customers, customer_pool, proposals,
-- projects — hepsi aynı migration'da) YERLEŞİK desenle birebir aynı yaklaşım:
-- region_admin SADECE KENDİ BÖLGESİNDEKİ (current_region()) kayıtları
-- yönetebilir. Bölgeden bağımsız/"ortak" (region IS NULL) listeler bilinçli
-- olarak KAPSAM DIŞI bırakıldı — bir bölge yöneticisinin her iki bölgeyi de
-- etkileyen ortak bir listeyi değiştirebilmesi istenmeyen bir yetki genişlemesi
-- olurdu; ortak listeler founder'a özel kalıyor.
-- ============================================================================

drop policy if exists "price_lists_region_admin_manage" on public.price_lists;
create policy "price_lists_region_admin_manage" on public.price_lists
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  ) with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

drop policy if exists "price_list_items_region_admin_manage" on public.price_list_items;
create policy "price_list_items_region_admin_manage" on public.price_list_items
  for all using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and public.current_role() = 'region_admin'
        and pl.region = public.current_region()
    )
  ) with check (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and public.current_role() = 'region_admin'
        and pl.region = public.current_region()
    )
  );

-- region_admin ayrıca "ortak" (region IS NULL) listeleri GÖREBİLMELİ —
-- kendi bölgesindeki satışı yönetirken tüm ürün fiyatlarının tam resmini
-- görmesi gerekiyor — ama DÜZENLEYEMEZ (yukarıdaki manage policy'si sadece
-- kendi bölgesini kapsıyor, ortak listeler founder'a özel kalıyor). Bu
-- yüzden ayrı, salt-okunur bir SELECT policy'si.
drop policy if exists "price_lists_region_admin_view_shared" on public.price_lists;
create policy "price_lists_region_admin_view_shared" on public.price_lists
  for select using (
    public.current_role() = 'region_admin' and region is null
  );

drop policy if exists "price_list_items_region_admin_view_shared" on public.price_list_items;
create policy "price_list_items_region_admin_view_shared" on public.price_list_items
  for select using (
    exists (
      select 1 from public.price_lists pl
      where pl.id = price_list_items.price_list_id
        and public.current_role() = 'region_admin'
        and pl.region is null
    )
  );
