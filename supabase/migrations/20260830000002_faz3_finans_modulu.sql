-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 3: Finans Modülü (Faturalar & Ödemeler)
--
-- Kapsam:
--  1. invoice_status / payment_method enum'ları
--  2. invoices tablosu (kabul edilmiş bir tekliften veya doğrudan faturalanır),
--     otomatik fatura numarası (INV-YIL-00001) trigger ile üretilir
--  3. payments tablosu (bir faturaya birden fazla kısmi ödeme kaydedilebilir) —
--     ödeme kaydı SİLİNEBİLİR/eklenebilir ama GÜNCELLENEMEZ (muhasebe kaydı
--     mantığı: yanlış girildiyse sil, yeniden ekle)
--  4. RLS: founder tam erişim, finance + region_admin sadece kendi bölgesindeki
--     faturaları/ödemeleri yönetir
--  5. finance rolüne accepted teklifleri görme izni (faturalandırma kaynağı) —
--     role_permissions'ta yoktu, bu modül için eklendi
-- ============================================================================

create type public.invoice_status as enum ('draft', 'sent', 'paid', 'cancelled');
create type public.payment_method as enum ('bank_transfer', 'credit_card', 'cash', 'other');

create sequence public.invoice_number_seq;

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text unique,
  customer_id uuid not null references public.customers (id),
  proposal_id uuid references public.proposals (id) on delete set null,
  amount numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  status public.invoice_status not null default 'draft',
  issue_date date not null default current_date,
  due_date date,
  paid_at timestamptz,
  notes text,
  region public.region,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_invoice_number()
returns trigger
language plpgsql
as $$
begin
  if new.invoice_number is null then
    new.invoice_number := 'INV-' || extract(year from now())::int || '-' ||
      lpad(nextval('public.invoice_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger set_invoice_number before insert on public.invoices
  for each row execute function public.set_invoice_number();

create trigger set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();

create index idx_invoices_region on public.invoices (region);
create index idx_invoices_status on public.invoices (status);
create index idx_invoices_customer_id on public.invoices (customer_id);
create index idx_invoices_proposal_id on public.invoices (proposal_id);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  amount numeric(12, 2) not null,
  currency text not null,
  method public.payment_method not null default 'bank_transfer',
  paid_at date not null default current_date,
  reference_no text,
  notes text,
  recorded_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now()
);

create index idx_payments_invoice_id on public.payments (invoice_id);

-- ----------------------------------------------------------------------------
-- RLS — invoices
-- ----------------------------------------------------------------------------

alter table public.invoices enable row level security;

create policy "invoices_founder_all" on public.invoices
  for all using (public.is_founder()) with check (public.is_founder());

create policy "invoices_select" on public.invoices
  for select using (
    public.has_module_access('finance') and (region = public.current_region() or region is null)
  );

create policy "invoices_insert" on public.invoices
  for insert with check (
    public.has_module_access('finance', true) and region = public.current_region()
  );

create policy "invoices_update" on public.invoices
  for update using (
    public.has_module_access('finance', true) and region = public.current_region()
  )
  with check (
    public.has_module_access('finance', true) and region = public.current_region()
  );

create policy "invoices_delete" on public.invoices
  for delete using (
    public.has_module_access('finance', true) and region = public.current_region()
  );

grant select, insert, update, delete on public.invoices to anon, authenticated;
grant usage, select on public.invoice_number_seq to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS — payments (invoice'ın bölgesi üzerinden dolaylı kontrol)
-- ----------------------------------------------------------------------------

alter table public.payments enable row level security;

create policy "payments_founder_all" on public.payments
  for all using (public.is_founder()) with check (public.is_founder());

create policy "payments_select" on public.payments
  for select using (
    exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id
        and public.has_module_access('finance')
        and (i.region = public.current_region() or i.region is null)
    )
  );

create policy "payments_insert" on public.payments
  for insert with check (
    exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id
        and public.has_module_access('finance', true)
        and i.region = public.current_region()
    )
  );

create policy "payments_delete" on public.payments
  for delete using (
    exists (
      select 1 from public.invoices i
      where i.id = payments.invoice_id
        and public.has_module_access('finance', true)
        and i.region = public.current_region()
    )
  );

grant select, insert, delete on public.payments to anon, authenticated;

-- ----------------------------------------------------------------------------
-- finance rolüne: kabul edilmiş teklifleri görme izni (faturalandırma kaynağı)
-- ----------------------------------------------------------------------------

insert into public.role_permissions (role, module_key, can_view, can_edit) values
  ('finance', 'proposals', true, false)
on conflict (role, module_key) do nothing;

create policy "proposals_finance_select" on public.proposals
  for select using (
    public.current_role() = 'finance' and status = 'accepted' and region = public.current_region()
  );
