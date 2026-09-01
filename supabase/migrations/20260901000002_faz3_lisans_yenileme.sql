-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 6: Lisans & Yenileme Takibi
--
-- Kapsam:
--  1. license_status enum'u
--  2. licenses tablosu (bir müşterinin bir ürün için aktif lisansı — kaynak
--     tekliften veya doğrudan girilir)
--  3. license_renewals tablosu (append-only yenileme geçmişi — invoices/
--     payments'taki "ödeme değiştirilemez, silinip yeniden eklenir" mantığına
--     benzer şekilde, bir yenileme kaydı licenses.end_date/amount'u günceller
--     ve kalıcı bir iz bırakır, kendisi asla güncellenmez)
--  4. RLS: founder tam erişim, licenses modülüne can_edit=true olan roller
--     (şu an sadece founder/region_admin — role_permissions'ta sales_inhouse
--     sadece görüntüleme alıyor, bilinçli bir tasarım kararı) yönetebilir
-- ============================================================================

create type public.license_status as enum ('active', 'cancelled');

create table public.licenses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  product public.product_key not null,
  license_name text,
  seat_count int,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  start_date date not null default current_date,
  end_date date not null,
  status public.license_status not null default 'active',
  notes text,
  region public.region,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.licenses.end_date is 'Mevcut donemin bitis/yenileme tarihi - yenileme yapildikca ileri tasinir.';

create trigger set_updated_at before update on public.licenses
  for each row execute function public.set_updated_at();

create index idx_licenses_customer_id on public.licenses (customer_id);
create index idx_licenses_proposal_id on public.licenses (proposal_id);
create index idx_licenses_region on public.licenses (region);
create index idx_licenses_owner_id on public.licenses (owner_id);
create index idx_licenses_end_date on public.licenses (end_date);

create table public.license_renewals (
  id uuid primary key default gen_random_uuid(),
  license_id uuid not null references public.licenses (id) on delete cascade,
  previous_end_date date not null,
  new_end_date date not null,
  amount numeric(12, 2),
  currency text,
  notes text,
  renewed_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index idx_license_renewals_license_id on public.license_renewals (license_id);

-- ----------------------------------------------------------------------------
-- RLS — licenses
-- ----------------------------------------------------------------------------

alter table public.licenses enable row level security;

create policy "licenses_founder_all" on public.licenses
  for all using (public.is_founder()) with check (public.is_founder());

create policy "licenses_select" on public.licenses
  for select using (
    public.has_module_access('licenses') and (region = public.current_region() or region is null)
  );

create policy "licenses_insert" on public.licenses
  for insert with check (
    public.has_module_access('licenses', true) and region = public.current_region()
  );

create policy "licenses_update" on public.licenses
  for update using (
    public.has_module_access('licenses', true) and region = public.current_region()
  )
  with check (
    public.has_module_access('licenses', true) and region = public.current_region()
  );

create policy "licenses_delete" on public.licenses
  for delete using (
    public.has_module_access('licenses', true) and region = public.current_region()
  );

grant select, insert, update, delete on public.licenses to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS — license_renewals (licenses'in bolgesi uzerinden dolayli kontrol,
-- payments/invoices ile ayni pattern)
-- ----------------------------------------------------------------------------

alter table public.license_renewals enable row level security;

create policy "license_renewals_founder_all" on public.license_renewals
  for all using (public.is_founder()) with check (public.is_founder());

create policy "license_renewals_select" on public.license_renewals
  for select using (
    exists (
      select 1 from public.licenses l
      where l.id = license_renewals.license_id
        and public.has_module_access('licenses')
        and (l.region = public.current_region() or l.region is null)
    )
  );

create policy "license_renewals_insert" on public.license_renewals
  for insert with check (
    exists (
      select 1 from public.licenses l
      where l.id = license_renewals.license_id
        and public.has_module_access('licenses', true)
        and l.region = public.current_region()
    )
  );

grant select, insert on public.license_renewals to anon, authenticated;
