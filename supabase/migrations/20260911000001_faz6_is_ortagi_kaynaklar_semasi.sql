-- ============================================================================
-- Respongo CRM — Faz 6 / Adım 1: İş Ortağı + Kaynaklar şema tamamlama
--
-- BAĞLAM: app/(dashboard)/partner/*, app/(dashboard)/partner-admin/* ve
-- app/(dashboard)/sales/resources/* kodu önceki bir turda yazıldı ve bu
-- tabloları (partner_profiles, commission_entries, partner_meetings,
-- partner_monthly_targets, partner_tasks, resources) sorguluyor — ama HİÇBİRİ
-- için migration dosyası bulunamadı (kod tabanı taraması ile doğrulandı).
-- Bu, kullanıcının "İş ortağım panelim boş, ne işe yaradığını anlamadım" ve
-- "Kaynaklar alanı boş" şikayetlerinin kök nedeni: sayfalar var olmayan (ya da
-- versiyon kontrolüne hiç girmemiş) tablolardan veri çekmeye çalışıyor.
--
-- Bu migration TAMAMEN İDEMPOTENT yazıldı (create table/column if not exists,
-- drop+create policy/trigger) — tablolar gerçek veritabanında farklı bir
-- yoldan (elle) zaten oluşturulmuş olsa bile bu dosya güvenle uygulanabilir,
-- CI'ı ("supabase db push") kıramaz.
--
-- Kapsam:
--  1. partner_profiles — iş ortağı onboarding + firma/banka bilgisi
--  2. commission_entries — teklif kabul edildiğinde OTOMATİK oluşan komisyon
--     kaydı (trg_calculate_partner_commission trigger'ı ile)
--  3. partner_meetings, partner_monthly_targets, partner_tasks — iş ortağı
--     kendi panelinden yönettiği toplantı/hedef/görev kayıtları
--  4. resources — satış ekibi + iş ortakları için ortak kaynak kütüphanesi
--  5. support_tickets.archived_at — destek talebi arşivleme (kullanıcı isteği)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. partner_profiles
-- ----------------------------------------------------------------------------

create table if not exists public.partner_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  onboarding_step int not null default 0,
  onboarding_completed_at timestamptz,
  company_name text,
  tax_no text,
  website text,
  country text,
  address text,
  bank_name text,
  bank_account_name text,
  iban text,
  swift text,
  product_interests text[] not null default '{}',
  agreement_accepted_at timestamptz,
  commission_rate numeric(5, 2),
  status text not null default 'pending_review',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.partner_profiles add column if not exists onboarding_step int not null default 0;
alter table public.partner_profiles add column if not exists onboarding_completed_at timestamptz;
alter table public.partner_profiles add column if not exists company_name text;
alter table public.partner_profiles add column if not exists tax_no text;
alter table public.partner_profiles add column if not exists website text;
alter table public.partner_profiles add column if not exists country text;
alter table public.partner_profiles add column if not exists address text;
alter table public.partner_profiles add column if not exists bank_name text;
alter table public.partner_profiles add column if not exists bank_account_name text;
alter table public.partner_profiles add column if not exists iban text;
alter table public.partner_profiles add column if not exists swift text;
alter table public.partner_profiles add column if not exists product_interests text[] not null default '{}';
alter table public.partner_profiles add column if not exists agreement_accepted_at timestamptz;
alter table public.partner_profiles add column if not exists commission_rate numeric(5, 2);
alter table public.partner_profiles add column if not exists status text not null default 'pending_review';
alter table public.partner_profiles add column if not exists admin_note text;
alter table public.partner_profiles add column if not exists created_at timestamptz not null default now();
alter table public.partner_profiles add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'partner_profiles_status_check'
  ) then
    alter table public.partner_profiles
      add constraint partner_profiles_status_check check (status in ('pending_review', 'active', 'suspended'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'partner_profiles_profile_id_key'
  ) then
    alter table public.partner_profiles add constraint partner_profiles_profile_id_key unique (profile_id);
  end if;
end $$;

create index if not exists idx_partner_profiles_profile_id on public.partner_profiles (profile_id);
create index if not exists idx_partner_profiles_status on public.partner_profiles (status);

drop trigger if exists set_updated_at on public.partner_profiles;
create trigger set_updated_at before update on public.partner_profiles
  for each row execute function public.set_updated_at();

-- founder dışındaki hiç kimse (partnerin kendisi dahil) commission_rate,
-- status veya admin_note alanlarını değiştiremez — RLS satır bazlı çalıştığı
-- için partnerin "kendi profilini güncelleme" izni bu üç alanı da kapsardı,
-- bu trigger onları eski değerine sabitleyerek gerçek korumayı sağlıyor.
create or replace function public.trg_partner_profiles_protect()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if not public.is_founder() then
    new.commission_rate := old.commission_rate;
    new.status := old.status;
    new.admin_note := old.admin_note;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_partner_profiles_admin_fields on public.partner_profiles;
create trigger protect_partner_profiles_admin_fields before update on public.partner_profiles
  for each row execute function public.trg_partner_profiles_protect();

alter table public.partner_profiles enable row level security;

drop policy if exists "partner_profiles_founder_all" on public.partner_profiles;
create policy "partner_profiles_founder_all" on public.partner_profiles
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "partner_profiles_self_select" on public.partner_profiles;
create policy "partner_profiles_self_select" on public.partner_profiles
  for select using (profile_id = auth.uid());

drop policy if exists "partner_profiles_self_insert" on public.partner_profiles;
create policy "partner_profiles_self_insert" on public.partner_profiles
  for insert with check (
    profile_id = auth.uid() and public.current_role() in ('partner_tr', 'partner_global')
  );

drop policy if exists "partner_profiles_self_update" on public.partner_profiles;
create policy "partner_profiles_self_update" on public.partner_profiles
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 2. commission_entries — teklif kabul edilince otomatik oluşur
-- ----------------------------------------------------------------------------

create table if not exists public.commission_entries (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles (id) on delete cascade,
  proposal_id uuid references public.proposals (id) on delete set null,
  commission_rate numeric(5, 2) not null,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status text not null default 'unpaid',
  paid_at timestamptz,
  admin_note text,
  created_at timestamptz not null default now()
);

alter table public.commission_entries add column if not exists proposal_id uuid references public.proposals (id) on delete set null;
alter table public.commission_entries add column if not exists commission_rate numeric(5, 2) not null default 0;
alter table public.commission_entries add column if not exists amount numeric(12, 2) not null default 0;
alter table public.commission_entries add column if not exists currency text not null default 'USD';
alter table public.commission_entries add column if not exists status text not null default 'unpaid';
alter table public.commission_entries add column if not exists paid_at timestamptz;
alter table public.commission_entries add column if not exists admin_note text;
alter table public.commission_entries add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'commission_entries_status_check') then
    alter table public.commission_entries add constraint commission_entries_status_check check (status in ('unpaid', 'paid'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'commission_entries_proposal_id_key') then
    alter table public.commission_entries add constraint commission_entries_proposal_id_key unique (proposal_id);
  end if;
end $$;

create index if not exists idx_commission_entries_partner_id on public.commission_entries (partner_id);
create index if not exists idx_commission_entries_status on public.commission_entries (status);

-- Bir teklif 'accepted' durumuna geçtiğinde, sahibi aktif bir satış iş ortağı
-- ve komisyon oranı tanımlıysa otomatik komisyon satırı oluşturur.
create or replace function public.trg_calculate_partner_commission()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  owner_role public.user_role;
  v_commission_rate numeric(5, 2);
begin
  if new.status = 'accepted' and (old.status is distinct from 'accepted') and new.owner_id is not null then
    select role into owner_role from public.profiles where id = new.owner_id;
    if owner_role in ('partner_tr', 'partner_global') then
      select commission_rate into v_commission_rate
      from public.partner_profiles
      where profile_id = new.owner_id;

      if v_commission_rate is not null and v_commission_rate > 0 then
        insert into public.commission_entries (partner_id, proposal_id, commission_rate, amount, currency, status)
        values (
          new.owner_id,
          new.id,
          v_commission_rate,
          round(new.total_amount * v_commission_rate / 100.0, 2),
          new.currency,
          'unpaid'
        )
        on conflict (proposal_id) do nothing;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists calc_partner_commission on public.proposals;
create trigger calc_partner_commission after update on public.proposals
  for each row execute function public.trg_calculate_partner_commission();

alter table public.commission_entries enable row level security;

drop policy if exists "commission_entries_founder_all" on public.commission_entries;
create policy "commission_entries_founder_all" on public.commission_entries
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "commission_entries_self_select" on public.commission_entries;
create policy "commission_entries_self_select" on public.commission_entries
  for select using (partner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 3. partner_meetings
-- ----------------------------------------------------------------------------

create table if not exists public.partner_meetings (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  meeting_date timestamptz not null,
  notes text,
  status text not null default 'scheduled',
  created_at timestamptz not null default now()
);

alter table public.partner_meetings add column if not exists notes text;
alter table public.partner_meetings add column if not exists status text not null default 'scheduled';
alter table public.partner_meetings add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'partner_meetings_status_check') then
    alter table public.partner_meetings
      add constraint partner_meetings_status_check check (status in ('scheduled', 'completed', 'cancelled', 'no_show'));
  end if;
end $$;

create index if not exists idx_partner_meetings_partner_id on public.partner_meetings (partner_id);
create index if not exists idx_partner_meetings_meeting_date on public.partner_meetings (meeting_date);

alter table public.partner_meetings enable row level security;

drop policy if exists "partner_meetings_founder_all" on public.partner_meetings;
create policy "partner_meetings_founder_all" on public.partner_meetings
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "partner_meetings_self_all" on public.partner_meetings;
create policy "partner_meetings_self_all" on public.partner_meetings
  for all using (partner_id = auth.uid()) with check (partner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 4. partner_monthly_targets
-- ----------------------------------------------------------------------------

create table if not exists public.partner_monthly_targets (
  partner_id uuid not null references public.profiles (id) on delete cascade,
  year int not null,
  month int not null,
  target_revenue numeric(12, 2),
  target_meetings int,
  currency text not null default 'USD',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (partner_id, year, month)
);

alter table public.partner_monthly_targets add column if not exists target_revenue numeric(12, 2);
alter table public.partner_monthly_targets add column if not exists target_meetings int;
alter table public.partner_monthly_targets add column if not exists currency text not null default 'USD';
alter table public.partner_monthly_targets add column if not exists admin_note text;
alter table public.partner_monthly_targets add column if not exists created_at timestamptz not null default now();
alter table public.partner_monthly_targets add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'partner_monthly_targets_month_check') then
    alter table public.partner_monthly_targets add constraint partner_monthly_targets_month_check check (month between 1 and 12);
  end if;
end $$;

drop trigger if exists set_updated_at on public.partner_monthly_targets;
create trigger set_updated_at before update on public.partner_monthly_targets
  for each row execute function public.set_updated_at();

alter table public.partner_monthly_targets enable row level security;

drop policy if exists "partner_monthly_targets_founder_all" on public.partner_monthly_targets;
create policy "partner_monthly_targets_founder_all" on public.partner_monthly_targets
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "partner_monthly_targets_self_select" on public.partner_monthly_targets;
create policy "partner_monthly_targets_self_select" on public.partner_monthly_targets
  for select using (partner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 5. partner_tasks — iş ortağının kendi kişisel görev listesi (Görevlerim
--    modülündeki proje bazlı 'tasks' tablosundan AYRI ve BAĞIMSIZ — iş
--    ortağının kendi kişisel to-do listesi, projeye bağlı değil).
-- ----------------------------------------------------------------------------

create table if not exists public.partner_tasks (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  description text,
  due_date date,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

alter table public.partner_tasks add column if not exists description text;
alter table public.partner_tasks add column if not exists due_date date;
alter table public.partner_tasks add column if not exists status text not null default 'open';
alter table public.partner_tasks add column if not exists created_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'partner_tasks_status_check') then
    alter table public.partner_tasks add constraint partner_tasks_status_check check (status in ('open', 'done'));
  end if;
end $$;

create index if not exists idx_partner_tasks_partner_id on public.partner_tasks (partner_id);

alter table public.partner_tasks enable row level security;

drop policy if exists "partner_tasks_founder_all" on public.partner_tasks;
create policy "partner_tasks_founder_all" on public.partner_tasks
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "partner_tasks_self_all" on public.partner_tasks;
create policy "partner_tasks_self_all" on public.partner_tasks
  for all using (partner_id = auth.uid()) with check (partner_id = auth.uid());

-- ----------------------------------------------------------------------------
-- 6. resources — satış ekibi + iş ortakları ortak kaynak kütüphanesi
-- ----------------------------------------------------------------------------

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'general',
  title_tr text not null,
  title_en text not null,
  body_tr text,
  body_en text,
  url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.resources add column if not exists body_tr text;
alter table public.resources add column if not exists body_en text;
alter table public.resources add column if not exists url text;
alter table public.resources add column if not exists sort_order int not null default 0;
alter table public.resources add column if not exists created_at timestamptz not null default now();

create index if not exists idx_resources_category on public.resources (category);

alter table public.resources enable row level security;

drop policy if exists "resources_founder_all" on public.resources;
create policy "resources_founder_all" on public.resources
  for all using (public.is_founder()) with check (public.is_founder());

drop policy if exists "resources_authenticated_select" on public.resources;
create policy "resources_authenticated_select" on public.resources
  for select using (auth.uid() is not null);

-- ----------------------------------------------------------------------------
-- 7. support_tickets — arşivleme (kullanıcı isteği: "arşivle yapılabilir ve
--    arşivi de geçmişe dönük görüntüleyebilmeliyiz"). Boolean değil timestamp
--    tercih edildi — hem "arşivli mi" hem "ne zaman arşivlendi" tek kolonda.
-- ----------------------------------------------------------------------------

alter table public.support_tickets add column if not exists archived_at timestamptz;
create index if not exists idx_support_tickets_archived_at on public.support_tickets (archived_at);
