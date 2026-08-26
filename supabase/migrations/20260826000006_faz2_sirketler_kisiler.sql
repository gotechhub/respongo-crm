-- ============================================================================
-- Respongo CRM — Faz 2 / Adım 1: Şirketler (companies) + Kişiler (contacts)
--
-- Kapsam:
--  1. companies — merkezi şirket dizini (satış hunisinden bağımsız, çatı kayıt)
--  2. contacts — şirkete bağlı veya bağımsız kişi kayıtları
--  3. customer_pool / leads / customers tablolarına opsiyonel company_id
--     bağlantısı (mevcut satırlar etkilenmez — nullable, geriye dönük uyumlu)
--  4. modules + role_permissions içine 'companies' / 'contacts' eklenir
--  5. RLS — customers tablosuyla aynı "founder / region_admin / owner /
--     partner-own / has_module_access" deseni izlenir
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. companies
-- ----------------------------------------------------------------------------

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  website text,
  industry text,
  country text,
  city text,
  address text,
  tax_office text,
  tax_no text,
  employee_count text, -- örn. "1-10", "11-50", "51-200", "200+"
  notes text,
  region public.region,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.companies
  for each row execute function public.set_updated_at();

create index idx_companies_owner_id on public.companies (owner_id);
create index idx_companies_region on public.companies (region);

-- ----------------------------------------------------------------------------
-- 2. contacts
-- ----------------------------------------------------------------------------

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  first_name text not null,
  last_name text,
  title text, -- ünvan / pozisyon
  email text,
  phone text,
  mobile_phone text,
  is_primary boolean not null default false,
  notes text,
  region public.region,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.contacts
  for each row execute function public.set_updated_at();

create index idx_contacts_company_id on public.contacts (company_id);
create index idx_contacts_owner_id on public.contacts (owner_id);
create index idx_contacts_region on public.contacts (region);

-- Bir şirkette aynı anda en fazla bir "birincil kişi" olabilir.
create unique index uq_contacts_company_primary
  on public.contacts (company_id)
  where (is_primary and company_id is not null);

-- ----------------------------------------------------------------------------
-- 3. satış hunisine opsiyonel şirket bağlantısı (geriye dönük uyumlu)
-- ----------------------------------------------------------------------------

alter table public.customer_pool
  add column company_id uuid references public.companies (id) on delete set null;
alter table public.leads
  add column company_id uuid references public.companies (id) on delete set null;
alter table public.customers
  add column company_id uuid references public.companies (id) on delete set null;

create index idx_customer_pool_company_id on public.customer_pool (company_id);
create index idx_leads_company_id on public.leads (company_id);
create index idx_customers_company_id on public.customers (company_id);

-- ----------------------------------------------------------------------------
-- 4. modules + role_permissions
-- ----------------------------------------------------------------------------

insert into public.modules (key, group_key, label_tr, label_en, sort_order) values
  ('companies', 'musteri', 'Şirketler', 'Companies', 5),
  ('contacts', 'musteri', 'Kişiler', 'Contacts', 6)
on conflict (key) do nothing;

-- founder + region_admin zaten "tüm modüller" toplu insert'i ile kapsanıyor
-- (20260826000002, madde 96-100) — burada tekrar eklemeye gerek yok.

insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('sales_inhouse', 'companies', true, true),
  ('sales_inhouse', 'contacts', true, true),
  ('partner_tr', 'companies', true, true),
  ('partner_tr', 'contacts', true, true),
  ('partner_global', 'companies', true, true),
  ('partner_global', 'contacts', true, true),
  ('marketing', 'companies', true, false),
  ('marketing', 'contacts', true, false),
  ('finance', 'companies', true, false),
  ('finance', 'contacts', true, false),
  ('support_agent', 'companies', true, false),
  ('support_agent', 'contacts', true, false)
on conflict (role, module_key) do nothing;

-- ----------------------------------------------------------------------------
-- 5. RLS — companies
-- ----------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.contacts enable row level security;

create policy "companies_founder_all" on public.companies
  for all using (public.is_founder()) with check (public.is_founder());

create policy "companies_inhouse_select" on public.companies
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "companies_inhouse_insert" on public.companies
  for insert with check (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "companies_partner_select" on public.companies
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "companies_partner_insert" on public.companies
  for insert with check (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "companies_owner_write" on public.companies
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "companies_region_admin_manage" on public.companies
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

create policy "companies_module_select" on public.companies
  for select using (public.has_module_access('companies'));

-- ----------------------------------------------------------------------------
-- 6. RLS — contacts
-- ----------------------------------------------------------------------------

create policy "contacts_founder_all" on public.contacts
  for all using (public.is_founder()) with check (public.is_founder());

create policy "contacts_inhouse_select" on public.contacts
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "contacts_inhouse_insert" on public.contacts
  for insert with check (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "contacts_partner_select" on public.contacts
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "contacts_partner_insert" on public.contacts
  for insert with check (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "contacts_owner_write" on public.contacts
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "contacts_region_admin_manage" on public.contacts
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

create policy "contacts_module_select" on public.contacts
  for select using (public.has_module_access('contacts'));

-- ----------------------------------------------------------------------------
-- 7. GRANT — bkz. 20260826000003_faz1_grants_fix.sql notu; "alter default
--    privileges" yeni tabloları da kapsamalı ama garanti olsun diye açıkça
--    ekliyoruz.
-- ----------------------------------------------------------------------------

grant select, insert, update, delete on public.companies to anon, authenticated;
grant select, insert, update, delete on public.contacts to anon, authenticated;
