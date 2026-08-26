-- ============================================================================
-- Respongo CRM — Faz 1 / Adım 1b: Bölge ayrımı, rol/izin yönetimi,
-- lead kaynağı, teklif şablonları
--
-- Kapsam:
--  1. profiles + satış tablolarına region (tr/global) kolonu
--  2. current_region() ve has_module_access() yardımcı fonksiyonları
--  3. modules + role_permissions — Süper Admin'in kod değişmeden rol bazlı
--     ekran erişimini yönetebildiği tablo (madde 14)
--  4. customer_pool / leads içine source_type (lead kaynağı) kolonu
--  5. proposal_templates / proposal_template_items (madde 13)
--  6. Bölgeye göre RLS güncellemeleri (mevcut "inhouse" politikalarına bölge
--     filtresi eklenir, region_admin için yeni politikalar eklenir)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. region kolonları
-- ----------------------------------------------------------------------------

alter table public.profiles add column region public.region;
alter table public.customer_pool add column region public.region;
alter table public.leads add column region public.region;
alter table public.customers add column region public.region;
alter table public.proposals add column region public.region;
alter table public.projects add column region public.region;

comment on column public.profiles.region is
  'founder için NULL kalır (tüm bölgeleri görür). Diğer roller için zorunlu — Süper Admin ekranından atanır.';

-- ----------------------------------------------------------------------------
-- 2. yardımcı fonksiyonlar
-- ----------------------------------------------------------------------------

create or replace function public.current_region()
returns public.region
language sql stable security definer set search_path = public
as $$
  select region from public.profiles where id = auth.uid();
$$;

-- ----------------------------------------------------------------------------
-- 3. modules + role_permissions — rol bazlı ekran/erişim yönetimi
-- ----------------------------------------------------------------------------

create table public.modules (
  key text primary key,
  group_key text not null,
  label_tr text not null,
  label_en text not null,
  sort_order int not null default 0
);

create table public.role_permissions (
  role public.user_role not null,
  module_key text not null references public.modules (key) on delete cascade,
  can_view boolean not null default false,
  can_edit boolean not null default false,
  primary key (role, module_key)
);

create or replace function public.has_module_access(p_module text, p_need_edit boolean default false)
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.is_founder() or coalesce(
    (
      select case when p_need_edit then rp.can_edit else rp.can_view end
      from public.role_permissions rp
      where rp.role = public.current_role() and rp.module_key = p_module
    ),
    false
  );
$$;

insert into public.modules (key, group_key, label_tr, label_en, sort_order) values
  ('dashboard', 'genel', 'Panel', 'Dashboard', 0),
  ('products', 'satis', 'Ürünler', 'Products', 10),
  ('price_lists', 'satis', 'Fiyat Listeleri', 'Price Lists', 11),
  ('proposals', 'satis', 'Teklifler', 'Proposals', 12),
  ('proposal_templates', 'satis', 'Teklif Şablonları', 'Proposal Templates', 13),
  ('customer_pool', 'satis', 'Satış Havuzu', 'Customer Pool', 14),
  ('leads', 'satis', 'Lead''ler', 'Leads', 15),
  ('customers', 'musteri', 'Müşteriler', 'Customers', 20),
  ('licenses', 'musteri', 'Lisanslar', 'Licenses', 21),
  ('reminders', 'musteri', 'Hatırlatıcılar', 'Reminders', 22),
  ('support', 'musteri', 'Destek Merkezi', 'Support Center', 23),
  ('projects', 'proje', 'Projeler', 'Projects', 30),
  ('tasks', 'proje', 'Görevler', 'Tasks', 31),
  ('marketing', 'pazarlama', 'Pazarlama', 'Marketing', 40),
  ('email', 'pazarlama', 'Mail Yönetimi', 'Email Management', 41),
  ('finance', 'finans', 'Finans', 'Finance', 50),
  ('users', 'yonetim', 'Kullanıcılar & Yetkiler', 'Users & Permissions', 60),
  ('settings', 'yonetim', 'Ayarlar', 'Settings', 61)
on conflict (key) do nothing;

-- founder + region_admin: tüm modüllere tam erişim
insert into public.role_permissions (role, module_key, can_view, can_edit)
select roles.r, m.key, true, true
from public.modules m, (values ('founder'::public.user_role), ('region_admin'::public.user_role)) as roles(r)
on conflict (role, module_key) do nothing;

-- sales_inhouse / partner_tr / partner_global: satış + müşteri (görüntüleme dahil sınırlı)
insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('sales_inhouse', 'dashboard', true, false),
  ('sales_inhouse', 'products', true, false),
  ('sales_inhouse', 'price_lists', true, false),
  ('sales_inhouse', 'proposals', true, true),
  ('sales_inhouse', 'proposal_templates', true, false),
  ('sales_inhouse', 'customer_pool', true, true),
  ('sales_inhouse', 'leads', true, true),
  ('sales_inhouse', 'customers', true, true),
  ('sales_inhouse', 'licenses', true, false),
  ('sales_inhouse', 'reminders', true, true),
  ('partner_tr', 'dashboard', true, false),
  ('partner_tr', 'products', true, false),
  ('partner_tr', 'proposals', true, true),
  ('partner_tr', 'proposal_templates', true, false),
  ('partner_tr', 'customer_pool', true, false),
  ('partner_tr', 'leads', true, true),
  ('partner_tr', 'customers', true, false),
  ('partner_global', 'dashboard', true, false),
  ('partner_global', 'products', true, false),
  ('partner_global', 'proposals', true, true),
  ('partner_global', 'proposal_templates', true, false),
  ('partner_global', 'customer_pool', true, false),
  ('partner_global', 'leads', true, true),
  ('partner_global', 'customers', true, false)
on conflict (role, module_key) do nothing;

-- freelancer / project_member: proje & görev
insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('freelancer', 'dashboard', true, false),
  ('freelancer', 'projects', true, false),
  ('freelancer', 'tasks', true, true),
  ('project_member', 'dashboard', true, false),
  ('project_member', 'projects', true, false),
  ('project_member', 'tasks', true, true)
on conflict (role, module_key) do nothing;

-- support_agent: müşteri görünümü + destek merkezi
insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('support_agent', 'dashboard', true, false),
  ('support_agent', 'customers', true, false),
  ('support_agent', 'support', true, true)
on conflict (role, module_key) do nothing;

-- marketing: lead kaynakları + pazarlama + mail
insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('marketing', 'dashboard', true, false),
  ('marketing', 'leads', true, false),
  ('marketing', 'marketing', true, true),
  ('marketing', 'email', true, true)
on conflict (role, module_key) do nothing;

-- finance: finans modülü + faturalama için müşteri görünümü
insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('finance', 'dashboard', true, false),
  ('finance', 'customers', true, false),
  ('finance', 'finance', true, true)
on conflict (role, module_key) do nothing;

-- ----------------------------------------------------------------------------
-- 4. lead kaynağı (source_type) kolonları
-- ----------------------------------------------------------------------------

alter table public.customer_pool
  add column source_type public.lead_source not null default 'manual';
alter table public.leads
  add column source_type public.lead_source not null default 'manual';

-- ----------------------------------------------------------------------------
-- 5. proposal_templates / proposal_template_items
-- ----------------------------------------------------------------------------

create table public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product public.product_key not null,
  description text,
  is_active boolean not null default true,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.proposal_templates
  for each row execute function public.set_updated_at();

create table public.proposal_template_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.proposal_templates (id) on delete cascade,
  price_list_item_id uuid references public.price_list_items (id),
  description text,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null default 0,
  discount_percent numeric(5, 2) not null default 0,
  created_at timestamptz not null default now()
);

create index idx_proposal_template_items_template_id
  on public.proposal_template_items (template_id);

-- ----------------------------------------------------------------------------
-- 6. RLS — yeni tablolar
-- ----------------------------------------------------------------------------

alter table public.modules enable row level security;
alter table public.role_permissions enable row level security;
alter table public.proposal_templates enable row level security;
alter table public.proposal_template_items enable row level security;

create policy "modules_authenticated_select" on public.modules
  for select using (auth.uid() is not null);

create policy "modules_founder_manage" on public.modules
  for all using (public.is_founder()) with check (public.is_founder());

create policy "role_permissions_authenticated_select" on public.role_permissions
  for select using (auth.uid() is not null);

create policy "role_permissions_founder_manage" on public.role_permissions
  for all using (public.is_founder()) with check (public.is_founder());

create policy "proposal_templates_founder_all" on public.proposal_templates
  for all using (public.is_founder()) with check (public.is_founder());

create policy "proposal_templates_internal_select" on public.proposal_templates
  for select using (
    is_active and public.has_module_access('proposal_templates')
  );

create policy "proposal_template_items_select" on public.proposal_template_items
  for select using (
    exists (
      select 1 from public.proposal_templates t
      where t.id = proposal_template_items.template_id
        and (t.is_active or public.is_founder())
    )
  );

create policy "proposal_template_items_founder_manage" on public.proposal_template_items
  for all using (public.is_founder()) with check (public.is_founder());

-- ----------------------------------------------------------------------------
-- 7. RLS — mevcut satış tablolarına bölge filtresi + region_admin erişimi
-- ----------------------------------------------------------------------------

-- ---- profiles: region_admin kendi bölgesindeki kullanıcıları görsün/yönetsin
create policy "profiles_region_admin_select" on public.profiles
  for select using (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

create policy "profiles_region_admin_update" on public.profiles
  for update using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

-- ---- customer_pool ----
drop policy if exists "customer_pool_inhouse_select" on public.customer_pool;
create policy "customer_pool_inhouse_select" on public.customer_pool
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

drop policy if exists "customer_pool_inhouse_write" on public.customer_pool;
create policy "customer_pool_inhouse_write" on public.customer_pool
  for insert with check (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "customer_pool_region_admin_manage" on public.customer_pool
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

-- ---- leads ----
drop policy if exists "leads_inhouse_select" on public.leads;
create policy "leads_inhouse_select" on public.leads
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

drop policy if exists "leads_inhouse_insert" on public.leads;
create policy "leads_inhouse_insert" on public.leads
  for insert with check (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "leads_region_admin_manage" on public.leads
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

-- ---- customers ----
drop policy if exists "customers_inhouse_select" on public.customers;
create policy "customers_inhouse_select" on public.customers
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "customers_region_admin_manage" on public.customers
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

create policy "customers_support_select" on public.customers
  for select using (public.has_module_access('customers'));

-- ---- proposals ----
drop policy if exists "proposals_inhouse_select" on public.proposals;
create policy "proposals_inhouse_select" on public.proposals
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "proposals_region_admin_manage" on public.proposals
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

-- ---- projects ----
drop policy if exists "projects_inhouse_select" on public.projects;
create policy "projects_inhouse_select" on public.projects
  for select using (
    public.current_role() = 'sales_inhouse' and region = public.current_region()
  );

create policy "projects_region_admin_manage" on public.projects
  for all using (
    public.current_role() = 'region_admin' and region = public.current_region()
  )
  with check (
    public.current_role() = 'region_admin' and region = public.current_region()
  );

-- ---- tasks/subtasks: project_member, freelancer ile aynı task_assignees
--      mekanizmasını zaten kullanıyor (20260720000001), ek politika gerekmiyor.
