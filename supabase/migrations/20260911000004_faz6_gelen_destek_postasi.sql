-- Faz 6 — destek@respongo.com / support@respongo.com gelen posta entegrasyonu
--
-- Kullanıcı isteği (birebir): "ayrıca mail ilede destek@respongo.com müşteri mail atında direk
-- buraya düşmesi lazım support@respongo.com aynı şekilde ingilizce olarak tr ve en olarak buna
-- göre dizayn et burayı en mantıklı şekilde".
--
-- Respongo zaten Brevo kullanıyor (lib/brevo/client.ts) — Brevo'nun "Inbound Parsing" webhook
-- özelliği, destek@ / support@ adreslerine gelen e-postaları gerçek zamanlı olarak bizim
-- app/api/webhooks/inbound-email endpoint'imize POST eder (bkz. o dosyadaki yorum).
--
-- ÖNEMLİ KISIT: support_tickets.customer_id NOT NULL + customers tablosuna FK'dir — yani bir
-- ticket, sistemde KAYITLI bir müşteriye bağlı olmak zorundadır. Gelen bir e-postanın göndereni
-- (destek@ / support@'a yazan kişi) sistemde kayıtlı bir müşteri olabilir (o zaman otomatik
-- eşleştirip direkt ticket açarız) ya da OLMAYABİLİR (yeni bir kişi, henüz müşteri değil, ya da
-- farklı bir e-postadan yazıyor) — bu durumda e-postayı UYDURMA bir müşteriye bağlamak yerine bu
-- tabloda "eşleşmedi" olarak bekletip destek ekibine (Destek Merkezi ekranındaki panel) doğru
-- müşteriyi seçme/oluşturma sorumluluğunu bırakıyoruz. Bu, sahte/boş müşteri kaydı üretmekten
-- çok daha güvenli ve doğru bir tasarım.
create table if not exists public.inbound_support_emails (
  id uuid primary key default gen_random_uuid(),
  to_address text not null,
  from_address text not null,
  from_name text,
  subject text,
  body_text text,
  region public.region not null default 'global',
  matched_customer_id uuid references public.customers (id) on delete set null,
  matched_ticket_id uuid references public.support_tickets (id) on delete set null,
  status text not null default 'unmatched' check (status in ('unmatched', 'converted', 'ignored')),
  raw jsonb not null default '{}',
  message_id text,
  received_at timestamptz not null default now(),
  converted_at timestamptz,
  converted_by uuid references public.profiles (id)
);

comment on table public.inbound_support_emails is 'destek@ / support@respongo.com adreslerine gelen e-postalar (Brevo Inbound Parsing webhook uzerinden) - musteriyle otomatik eslesmezse burada bekler, Destek Merkezi ekranindan elle bir musteri/talebe baglanir.';
comment on column public.inbound_support_emails.region is 'destek@ -> tr, support@ -> global; alici adresine gore otomatik belirlenir.';

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'inbound_support_emails_message_id_key') then
    alter table public.inbound_support_emails add constraint inbound_support_emails_message_id_key unique (message_id);
  end if;
end $$;

create index if not exists idx_inbound_support_emails_status on public.inbound_support_emails (status);
create index if not exists idx_inbound_support_emails_received_at on public.inbound_support_emails (received_at desc);

alter table public.inbound_support_emails enable row level security;

drop policy if exists inbound_support_emails_founder_all on public.inbound_support_emails;
create policy inbound_support_emails_founder_all on public.inbound_support_emails
  for all using (public.is_founder()) with check (public.is_founder());

-- support modülüne erişimi olan roller (support_agent, region_admin vb.) okuyup/güncelleyebilir
-- (dönüştür / yoksay) — webhook zaten service-role ile (RLS bypass) satır ekliyor, bu yüzden bu
-- politikaların INSERT'e ihtiyacı yok.
drop policy if exists inbound_support_emails_support_select on public.inbound_support_emails;
create policy inbound_support_emails_support_select on public.inbound_support_emails
  for select using (public.has_module_access('support', false));

drop policy if exists inbound_support_emails_support_update on public.inbound_support_emails;
create policy inbound_support_emails_support_update on public.inbound_support_emails
  for update using (public.has_module_access('support', true)) with check (public.has_module_access('support', true));
