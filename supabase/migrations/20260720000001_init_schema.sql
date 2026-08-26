-- ============================================================================
-- Respongo CRM — Beta faz ilk migration
-- Kapsam: profiles/roller, satış (customer_pool -> leads -> customers,
-- price_lists, proposals), proje & görev (projects -> tasks -> subtasks).
-- RLS politikaları TASLAK niteliğindedir — Beta test sürecinde inceltilecek.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Ortak yardımcılar
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 1. Enum tipleri
-- ----------------------------------------------------------------------------

-- Roller (bkz. proje bağlamı — 6 rol, RLS bunlar üzerinden ayrılır)
create type public.user_role as enum (
  'founder',         -- Founder & CEO — tam yetki
  'sales_inhouse',   -- Satış Ekibi (Respongo bünyesinde, tam zamanlı)
  'partner_tr',      -- Satış Ortağı - Türkiye
  'partner_global',  -- Satış Ortağı - Global
  'freelancer',      -- Freelancer / dış kullanıcı
  'customer'         -- Müşteri (portal V1 fazında aktif olacak)
);

-- Respongo ürünleri — ürün bazlı renk kodlama ile birebir eşleşir
create type public.product_key as enum (
  'golms', 'golxp', 'gocatalog', 'gofactory', 'gotools'
);

-- Müşteri adayı pipeline durumu (prototipteki st-yeni/st-gorusme/st-teklif/st-musteri)
create type public.lead_status as enum (
  'yeni', 'gorusme', 'teklif', 'musteri', 'kaybedildi'
);

create type public.proposal_status as enum (
  'draft', 'sent', 'accepted', 'rejected', 'expired'
);

create type public.project_status as enum (
  'active', 'on_hold', 'completed', 'cancelled'
);

create type public.task_status as enum (
  'todo', 'in_progress', 'done'
);

-- ----------------------------------------------------------------------------
-- 2. profiles — auth.users'ı 1:1 genişletir
-- ----------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  role public.user_role, -- NULL = henüz rol atanmadı -> RLS varsayılan olarak erişimi reddeder
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Yeni auth.users kaydı oluşunca otomatik profil satırı aç
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- RLS içinde profiles'a tekrar tekrar sorgu atmadan rolü okumak için
-- (security definer ile RLS'i bypass eder, sonsuz döngüyü engeller)
create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_founder()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select role from public.profiles where id = auth.uid()) = 'founder', false);
$$;

-- ----------------------------------------------------------------------------
-- 3. price_lists / price_list_items — fiyat listesi yönetimi
-- ----------------------------------------------------------------------------

create table public.price_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  product public.product_key not null,
  currency text not null default 'USD',
  is_active boolean not null default true,
  valid_from date,
  valid_until date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.price_lists
  for each row execute function public.set_updated_at();

create table public.price_list_items (
  id uuid primary key default gen_random_uuid(),
  price_list_id uuid not null references public.price_lists (id) on delete cascade,
  name text not null,
  description text,
  unit text not null default 'adet',
  unit_price numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.price_list_items
  for each row execute function public.set_updated_at();

create index idx_price_list_items_price_list_id on public.price_list_items (price_list_id);

-- ----------------------------------------------------------------------------
-- 4. customer_pool — ham/işlenmemiş havuz
-- ----------------------------------------------------------------------------

create table public.customer_pool (
  id uuid primary key default gen_random_uuid(),
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  source text, -- örn. "fuar", "referans", "inbound form"
  country text,
  notes text,
  owner_id uuid references public.profiles (id), -- NULL = henüz atanmadı
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.customer_pool
  for each row execute function public.set_updated_at();

create index idx_customer_pool_owner_id on public.customer_pool (owner_id);

-- ----------------------------------------------------------------------------
-- 5. leads — müşteri adayı (havuzdan veya doğrudan oluşur)
-- ----------------------------------------------------------------------------

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_pool_id uuid references public.customer_pool (id) on delete set null,
  company_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  product_interest public.product_key[] not null default '{}',
  status public.lead_status not null default 'yeni',
  value_estimate numeric(12, 2),
  currency text not null default 'USD',
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  converted_customer_id uuid, -- leads.status = 'musteri' olduğunda customers.id ile doldurulur
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.leads
  for each row execute function public.set_updated_at();

create index idx_leads_owner_id on public.leads (owner_id);
create index idx_leads_customer_pool_id on public.leads (customer_pool_id);
create index idx_leads_status on public.leads (status);

-- ----------------------------------------------------------------------------
-- 6. customers — kazanılmış müşteri
-- ----------------------------------------------------------------------------

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  company_name text not null,
  primary_contact_name text,
  primary_contact_email text,
  primary_contact_phone text,
  country text,
  billing_info jsonb not null default '{}',
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.customers
  for each row execute function public.set_updated_at();

create index idx_customers_owner_id on public.customers (owner_id);
create index idx_customers_lead_id on public.customers (lead_id);

alter table public.leads
  add constraint leads_converted_customer_id_fkey
  foreign key (converted_customer_id) references public.customers (id) on delete set null;

-- Müşteri portalı (V1) profiles.id <-> customers ilişkisi için köprü tablo.
-- Beta'da boş kalabilir; V1'de müşteri kullanıcıları burada eşlenir.
create table public.customer_users (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 7. proposals / proposal_items — teklif oluşturma sihirbazı
-- ----------------------------------------------------------------------------

create table public.proposals (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads (id) on delete set null,
  customer_id uuid references public.customers (id) on delete set null,
  title text not null,
  status public.proposal_status not null default 'draft',
  total_amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  valid_until date,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint proposal_target_check check (lead_id is not null or customer_id is not null)
);

create trigger set_updated_at before update on public.proposals
  for each row execute function public.set_updated_at();

create index idx_proposals_owner_id on public.proposals (owner_id);
create index idx_proposals_lead_id on public.proposals (lead_id);
create index idx_proposals_customer_id on public.proposals (customer_id);

create table public.proposal_items (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete cascade,
  price_list_item_id uuid references public.price_list_items (id),
  product public.product_key not null,
  description text,
  quantity numeric(12, 2) not null default 1,
  unit_price numeric(12, 2) not null,
  discount_percent numeric(5, 2) not null default 0,
  line_total numeric(12, 2) generated always as
    (quantity * unit_price * (1 - discount_percent / 100.0)) stored,
  created_at timestamptz not null default now()
);

create index idx_proposal_items_proposal_id on public.proposal_items (proposal_id);

-- ----------------------------------------------------------------------------
-- 8. projects -> tasks -> subtasks — kanban
-- ----------------------------------------------------------------------------

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers (id) on delete set null,
  name text not null,
  description text,
  status public.project_status not null default 'active',
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create index idx_projects_owner_id on public.projects (owner_id);
create index idx_projects_customer_id on public.projects (customer_id);

-- Ana görev
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  due_date date,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create index idx_tasks_project_id on public.tasks (project_id);
create index idx_tasks_status on public.tasks (status);

-- Ana görev çoklu atama (many-to-many)
create table public.task_assignees (
  task_id uuid not null references public.tasks (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (task_id, profile_id)
);

create index idx_task_assignees_profile_id on public.task_assignees (profile_id);

-- Alt görev
create table public.subtasks (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  assignee_id uuid references public.profiles (id),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.subtasks
  for each row execute function public.set_updated_at();

create index idx_subtasks_task_id on public.subtasks (task_id);
create index idx_subtasks_assignee_id on public.subtasks (assignee_id);

-- ============================================================================
-- 9. RLS — TASLAK politikalar
--
-- Genel mantık:
--  - founder            -> her tabloda tam CRUD (is_founder())
--  - sales_inhouse       -> atandığı (owner_id = auth.uid()) satış kayıtlarına
--                          okuma/yazma; SELECT genelde havuz görünürlüğü için
--                          tüm satış kayıtlarına açık, INSERT/UPDATE/DELETE
--                          sadece kendi owner_id'sinde (Beta'da konservatif)
--  - partner_tr/global   -> sadece owner_id = auth.uid() olan kendi havuzu
--  - freelancer          -> sadece task_assignees üzerinden atandığı
--                          proje/görev/alt görev (satış tablolarına erişim yok)
--  - customer            -> V1 portal öncesi Beta'da sadece kendi customers
--                          satırı (customer_users eşlemesi ile) — pasif taslak
-- ============================================================================

alter table public.profiles enable row level security;
alter table public.price_lists enable row level security;
alter table public.price_list_items enable row level security;
alter table public.customer_pool enable row level security;
alter table public.leads enable row level security;
alter table public.customers enable row level security;
alter table public.customer_users enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.task_assignees enable row level security;
alter table public.subtasks enable row level security;

-- ---- profiles ----
create policy "profiles_self_select" on public.profiles
  for select using (id = auth.uid() or public.is_founder());

create policy "profiles_founder_manage" on public.profiles
  for all using (public.is_founder()) with check (public.is_founder());

create policy "profiles_self_update" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ---- price_lists / price_list_items (fiyat listesi yönetimi — Master) ----
create policy "price_lists_founder_manage" on public.price_lists
  for all using (public.is_founder()) with check (public.is_founder());

create policy "price_lists_internal_select" on public.price_lists
  for select using (
    public.current_role() in ('sales_inhouse', 'partner_tr', 'partner_global')
  );

create policy "price_list_items_founder_manage" on public.price_list_items
  for all using (public.is_founder()) with check (public.is_founder());

create policy "price_list_items_internal_select" on public.price_list_items
  for select using (
    public.current_role() in ('sales_inhouse', 'partner_tr', 'partner_global')
  );

-- ---- customer_pool ----
create policy "customer_pool_founder_all" on public.customer_pool
  for all using (public.is_founder()) with check (public.is_founder());

create policy "customer_pool_inhouse_select" on public.customer_pool
  for select using (public.current_role() = 'sales_inhouse');

create policy "customer_pool_inhouse_write" on public.customer_pool
  for insert with check (public.current_role() = 'sales_inhouse');

create policy "customer_pool_owner_update" on public.customer_pool
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "customer_pool_partner_own" on public.customer_pool
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

-- ---- leads ----
create policy "leads_founder_all" on public.leads
  for all using (public.is_founder()) with check (public.is_founder());

create policy "leads_inhouse_select" on public.leads
  for select using (public.current_role() = 'sales_inhouse');

create policy "leads_inhouse_insert" on public.leads
  for insert with check (public.current_role() = 'sales_inhouse');

create policy "leads_owner_update" on public.leads
  for update using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "leads_partner_own" on public.leads
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "leads_partner_insert" on public.leads
  for insert with check (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

-- ---- customers ----
create policy "customers_founder_all" on public.customers
  for all using (public.is_founder()) with check (public.is_founder());

create policy "customers_inhouse_select" on public.customers
  for select using (public.current_role() = 'sales_inhouse');

create policy "customers_owner_write" on public.customers
  for all using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

create policy "customers_partner_own" on public.customers
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

-- Müşteri portalı (V1 hazırlığı — Beta'da pasif, tablo boş)
create policy "customers_customer_self" on public.customers
  for select using (
    public.current_role() = 'customer'
    and id in (select customer_id from public.customer_users where profile_id = auth.uid())
  );

create policy "customer_users_self" on public.customer_users
  for select using (profile_id = auth.uid() or public.is_founder());

-- ---- proposals / proposal_items ----
create policy "proposals_founder_all" on public.proposals
  for all using (public.is_founder()) with check (public.is_founder());

create policy "proposals_inhouse_select" on public.proposals
  for select using (public.current_role() = 'sales_inhouse');

create policy "proposals_owner_write" on public.proposals
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "proposals_partner_own" on public.proposals
  for select using (
    public.current_role() in ('partner_tr', 'partner_global') and owner_id = auth.uid()
  );

create policy "proposal_items_via_proposal" on public.proposal_items
  for all using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_items.proposal_id
        and (p.owner_id = auth.uid() or public.is_founder()
             or (public.current_role() = 'sales_inhouse'))
    )
  )
  with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_items.proposal_id
        and (p.owner_id = auth.uid() or public.is_founder())
    )
  );

-- ---- projects ----
create policy "projects_founder_all" on public.projects
  for all using (public.is_founder()) with check (public.is_founder());

create policy "projects_inhouse_select" on public.projects
  for select using (public.current_role() = 'sales_inhouse');

create policy "projects_owner_write" on public.projects
  for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());

-- ---- tasks (freelancer erişimi burada başlar) ----
create policy "tasks_founder_all" on public.tasks
  for all using (public.is_founder()) with check (public.is_founder());

create policy "tasks_project_owner" on public.tasks
  for all using (
    exists (
      select 1 from public.projects pr
      where pr.id = tasks.project_id and pr.owner_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.projects pr
      where pr.id = tasks.project_id and pr.owner_id = auth.uid()
    )
  );

create policy "tasks_assignee_select" on public.tasks
  for select using (
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = tasks.id and ta.profile_id = auth.uid()
    )
  );

create policy "tasks_assignee_update" on public.tasks
  for update using (
    exists (
      select 1 from public.task_assignees ta
      where ta.task_id = tasks.id and ta.profile_id = auth.uid()
    )
  );

-- ---- task_assignees ----
create policy "task_assignees_founder_all" on public.task_assignees
  for all using (public.is_founder()) with check (public.is_founder());

create policy "task_assignees_self_select" on public.task_assignees
  for select using (profile_id = auth.uid());

create policy "task_assignees_project_owner_manage" on public.task_assignees
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects pr on pr.id = t.project_id
      where t.id = task_assignees.task_id and pr.owner_id = auth.uid()
    )
  );

-- ---- subtasks ----
create policy "subtasks_founder_all" on public.subtasks
  for all using (public.is_founder()) with check (public.is_founder());

create policy "subtasks_via_task_owner" on public.subtasks
  for all using (
    exists (
      select 1 from public.tasks t
      join public.projects pr on pr.id = t.project_id
      where t.id = subtasks.task_id and pr.owner_id = auth.uid()
    )
  );

create policy "subtasks_assignee_select" on public.subtasks
  for select using (
    assignee_id = auth.uid()
    or exists (
      select 1 from public.task_assignees ta
      where ta.task_id = subtasks.task_id and ta.profile_id = auth.uid()
    )
  );

create policy "subtasks_assignee_update" on public.subtasks
  for update using (assignee_id = auth.uid());
