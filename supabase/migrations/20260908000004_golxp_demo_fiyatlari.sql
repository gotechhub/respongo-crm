-- GOLXP kaynak PDF'de fiyatı olmadığından bu liste yalnızca test/demo teklifleri içindir.
do $$
declare v_list uuid;
begin
  insert into public.price_lists (name, product, currency, is_active, valid_from, valid_until)
  values ('GOLXP — Demo Fiyat Listesi', 'golxp', 'USD', true, date '2026-01-01', date '2026-12-31') returning id into v_list;
  insert into public.price_list_items (price_list_id, name, description, unit, unit_price) values
    (v_list, '100 kullanıcı · demo', 'Demo / iç planlama; nihai satış fiyatı değildir', 'yıl', 4500),
    (v_list, '500 kullanıcı · demo', 'Demo / iç planlama; nihai satış fiyatı değildir', 'yıl', 9000),
    (v_list, '1.000 kullanıcı · demo', 'Demo / iç planlama; nihai satış fiyatı değildir', 'yıl', 14500),
    (v_list, 'Yetkinlik mimarisi başlangıç paketi · demo', 'Demo / iç planlama', 'proje', 4500),
    (v_list, 'Neura AI etkinleştirme · demo', 'Demo / iç planlama', 'proje', 2500);
end $$;
