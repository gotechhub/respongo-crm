-- Faz 6 — İş ortağı tablolarına region_admin erişimi
--
-- app/(dashboard)/partner-admin/actions.ts içindeki upsertPartnerMonthlyTarget yorumu açıkça
-- "RLS (partner_monthly_targets_founder_all + ..._region_admin_manage) zaten yalnızca
-- founder/region_admin'in bunu yapmasına izin veriyor" diyor — ama 20260911000001'de sadece
-- founder_all + self_select/self_all eklendi, region_admin_manage HİÇ YOKTU. Bu, bir region_admin
-- (founder değil ama bir bölgeyi yöneten rol) iş ortağı hedefi/toplantısı/görevini
-- güncellemeye çalıştığında sessizce RLS'e takılıp "yetkin yok" hatası almasına yol açardı.
--
-- Bu tablolarda DOĞRUDAN bir region kolonu yok (bkz. 20260911000001) — bölge, iş ortağının kendi
-- profiles.region alanından gelir; bu yüzden companies/leads/customers'daki gibi basit
-- "region = current_region()" yerine profiles'a bir alt sorgu ile bakıyoruz.
do $$ begin
  if not exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'partner_profiles') then
    raise notice 'partner_profiles tablosu yok, bu migration atlanıyor (20260911000001 önce uygulanmalı).';
  end if;
end $$;

drop policy if exists "partner_profiles_region_admin_manage" on public.partner_profiles;
create policy "partner_profiles_region_admin_manage" on public.partner_profiles
  for all using (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_profiles.profile_id and p.region = public.current_region())
  )
  with check (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_profiles.profile_id and p.region = public.current_region())
  );

drop policy if exists "commission_entries_region_admin_manage" on public.commission_entries;
create policy "commission_entries_region_admin_manage" on public.commission_entries
  for all using (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = commission_entries.partner_id and p.region = public.current_region())
  )
  with check (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = commission_entries.partner_id and p.region = public.current_region())
  );

drop policy if exists "partner_meetings_region_admin_manage" on public.partner_meetings;
create policy "partner_meetings_region_admin_manage" on public.partner_meetings
  for all using (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_meetings.partner_id and p.region = public.current_region())
  )
  with check (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_meetings.partner_id and p.region = public.current_region())
  );

drop policy if exists "partner_monthly_targets_region_admin_manage" on public.partner_monthly_targets;
create policy "partner_monthly_targets_region_admin_manage" on public.partner_monthly_targets
  for all using (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_monthly_targets.partner_id and p.region = public.current_region())
  )
  with check (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_monthly_targets.partner_id and p.region = public.current_region())
  );

drop policy if exists "partner_tasks_region_admin_manage" on public.partner_tasks;
create policy "partner_tasks_region_admin_manage" on public.partner_tasks
  for all using (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_tasks.partner_id and p.region = public.current_region())
  )
  with check (
    public.current_role() = 'region_admin'
    and exists (select 1 from public.profiles p where p.id = partner_tasks.partner_id and p.region = public.current_region())
  );
