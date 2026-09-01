-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 7: Destek Merkezi (Support Center)
--
-- Kapsam:
--  1. ticket_status / ticket_priority enum'ları
--  2. support_tickets tablosu (bir müşterinin destek talebi — hem iç ekip
--     hem müşteri portalı tarafından açılabilir)
--  3. support_ticket_messages tablosu (ticket üzerindeki mesaj thread'i —
--     is_internal_note=true olan mesajlar MÜŞTERİYE ASLA GÖSTERİLMEZ, ayrı
--     bir RLS select politikasıyla filtrelenir)
--  4. support_touch_ticket_on_message() trigger fonksiyonu — bir mesaj
--     eklendiğinde ticket.status'u otomatik günceller (müşteri yazınca
--     in_progress'e, ekip yazınca waiting_customer'a döner; resolved/closed
--     bir ticket'a müşteri yazarsa yeniden open'a döner) — support_agent'ın
--     her mesajdan sonra elle durum güncellemesi gerekmez.
--  5. RLS: founder tam erişim, has_module_access('support') olan roller
--     (şu an sadece support_agent — role_permissions'ta zaten 20260826'da
--     kayıtlı) iç ekip erişimi, customer_users üzerinden müşteri erişimi.
--  6. Ticket'lar HİÇBİR ZAMAN silinmez (invoices/payments/license_renewals
--     ile aynı "değiştirilemez kayıt" prensibi) — delete grant'i bilinçli
--     olarak YOK, founder dahil kimse silemez.
-- ============================================================================

create type public.ticket_status as enum ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');
create type public.ticket_priority as enum ('low', 'normal', 'high', 'urgent');

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers (id) on delete cascade,
  subject text not null,
  product public.product_key,
  status public.ticket_status not null default 'open',
  priority public.ticket_priority not null default 'normal',
  assigned_to uuid references public.profiles (id),
  region public.region,
  created_by uuid references public.profiles (id) default auth.uid(),
  last_message_at timestamptz not null default now(),
  resolved_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.support_tickets.product is 'Talebin ilgili oldugu urun (opsiyonel) - genel destek talepleri icin bos birakilir.';
comment on column public.support_tickets.region is 'Musteri portalindan acilan ticketlarda musterinin kendi bolgesi kopyalanir - musteri profilinin region alani genelde NULLdur.';

create trigger set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();

create index idx_support_tickets_customer_id on public.support_tickets (customer_id);
create index idx_support_tickets_region on public.support_tickets (region);
create index idx_support_tickets_assigned_to on public.support_tickets (assigned_to);
create index idx_support_tickets_status on public.support_tickets (status);

create table public.support_ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) default auth.uid(),
  body text not null,
  is_internal_note boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.support_ticket_messages.is_internal_note is 'true ise bu mesaj SADECE ic ekibe gorunur, musteri portalina asla sizmaz (ayri RLS select politikasi).';

create index idx_support_ticket_messages_ticket_id on public.support_ticket_messages (ticket_id);
create index idx_support_ticket_messages_internal on public.support_ticket_messages (is_internal_note);

-- ----------------------------------------------------------------------------
-- Trigger: bir mesaj eklendiginde parent ticket'in status/last_message_at'ini
-- otomatik guncelle. SECURITY DEFINER cunku musteri (customer rolu) sadece
-- kendi ticket'ini "closed" yapabilir (bkz. asagidaki RLS) ama mesaj atinca
-- status'un "in_progress"e donmesi gerekir - bu trigger RLS'i bu tek amac
-- icin gecerli sekilde bypass eder.
-- ----------------------------------------------------------------------------

create or replace function public.support_touch_ticket_on_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  author_role public.user_role;
  ticket_status_now public.ticket_status;
begin
  select role into author_role from public.profiles where id = new.author_id;
  select status into ticket_status_now from public.support_tickets where id = new.ticket_id;

  if new.is_internal_note then
    update public.support_tickets set updated_at = now() where id = new.ticket_id;
    return new;
  end if;

  if author_role = 'customer' then
    update public.support_tickets
      set updated_at = now(),
          last_message_at = new.created_at,
          status = case when ticket_status_now in ('resolved', 'closed') then 'open' else 'in_progress' end
      where id = new.ticket_id;
  else
    update public.support_tickets
      set updated_at = now(),
          last_message_at = new.created_at,
          status = case when ticket_status_now in ('resolved', 'closed') then ticket_status_now else 'waiting_customer' end
      where id = new.ticket_id;
  end if;

  return new;
end;
$$;

create trigger touch_ticket_on_message after insert on public.support_ticket_messages
  for each row execute function public.support_touch_ticket_on_message();

-- ----------------------------------------------------------------------------
-- RLS — support_tickets
-- ----------------------------------------------------------------------------

alter table public.support_tickets enable row level security;

create policy "support_tickets_founder_all" on public.support_tickets
  for all using (public.is_founder()) with check (public.is_founder());

create policy "support_tickets_select" on public.support_tickets
  for select using (
    public.has_module_access('support') and (region = public.current_region() or region is null)
  );

create policy "support_tickets_insert" on public.support_tickets
  for insert with check (
    public.has_module_access('support', true) and region = public.current_region()
  );

create policy "support_tickets_update" on public.support_tickets
  for update using (
    public.has_module_access('support', true) and region = public.current_region()
  )
  with check (
    public.has_module_access('support', true) and region = public.current_region()
  );

create policy "support_tickets_customer_select" on public.support_tickets
  for select using (
    public.current_role() = 'customer'
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  );

create policy "support_tickets_customer_insert" on public.support_tickets
  for insert with check (
    public.current_role() = 'customer'
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
    and status = 'open'
  );

-- Durum-gecis politikasi (DERS 17 istisnasi): musteri sadece kendi acik
-- ticket'ini "closed" olarak isaretleyebilir (memnun kaldi / konu kapandi).
-- Diger tum alanlari (priority, assigned_to, status'un baska bir degere
-- gecisini) SADECE ic ekip degistirebilir.
create policy "support_tickets_customer_close" on public.support_tickets
  for update using (
    public.current_role() = 'customer'
    and status <> 'closed'
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  )
  with check (
    status = 'closed'
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  );

-- Kasitli olarak delete grant'i YOK — ticket'lar hicbir zaman silinmez.
grant select, insert, update on public.support_tickets to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS — support_ticket_messages
-- ----------------------------------------------------------------------------

alter table public.support_ticket_messages enable row level security;

create policy "support_ticket_messages_founder_all" on public.support_ticket_messages
  for all using (public.is_founder()) with check (public.is_founder());

create policy "support_ticket_messages_select" on public.support_ticket_messages
  for select using (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and public.has_module_access('support')
        and (t.region = public.current_region() or t.region is null)
    )
  );

create policy "support_ticket_messages_insert" on public.support_ticket_messages
  for insert with check (
    exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and public.has_module_access('support', true)
        and t.region = public.current_region()
    )
  );

-- Musteri: SADECE kendi ticket'i + SADECE is_internal_note=false mesajlari
-- gorebilir/yazabilir - ic notlar hicbir sekilde portala sizmaz.
create policy "support_ticket_messages_customer_select" on public.support_ticket_messages
  for select using (
    is_internal_note = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
    )
  );

create policy "support_ticket_messages_customer_insert" on public.support_ticket_messages
  for insert with check (
    is_internal_note = false
    and exists (
      select 1 from public.support_tickets t
      where t.id = support_ticket_messages.ticket_id
        and t.customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
    )
  );

-- Kasitli olarak update/delete grant'i YOK — mesajlar append-only.
grant select, insert on public.support_ticket_messages to anon, authenticated;
