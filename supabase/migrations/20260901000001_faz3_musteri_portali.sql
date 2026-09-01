-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 5: Müşteri Portalı (Onay/Revizyon)
--
-- "customer" rolü ve customer_users köprü tablosu 20260720000001'de zaten
-- taslak olarak vardı (V1 hazırlığı) — bu migration onu gerçekten aktif hale
-- getirir: müşterinin kendi hesabıyla giriş yapıp "sent" durumundaki
-- tekliflerini görüp Kabul Et / Reddet / Revizyon İste kararını KENDİSİNİN
-- vermesini sağlar (önceden bu karar satışçı/kurucu tarafından elle
-- işaretleniyordu — updateProposalStatus fonksiyonu hâlâ bir yedek/manuel
-- yol olarak duruyor, portal birincil yol olur).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Yeni kolon: customer_note — müşterinin revizyon isterken yazdığı not.
--    approval_note kolonundan AYRI tutuluyor çünkü o kurucunun satışçıya
--    yazdığı iç notu taşıyor — ikisini karıştırmak kafa karıştırır.
-- ----------------------------------------------------------------------------

alter table public.proposals add column if not exists customer_note text;

comment on column public.proposals.customer_note is 'Musterinin portal uzerinden revizyon isterken yazdigi not (approval_note kurucunun ic notudur, ayridir).';

-- ----------------------------------------------------------------------------
-- 2. Eksik index — customer_users.customer_id üzerinden yapılan RLS
--    sorgularının (aşağıda) performanslı çalışması için.
-- ----------------------------------------------------------------------------

create index if not exists idx_customer_users_customer_id on public.customer_users (customer_id);

-- ----------------------------------------------------------------------------
-- 3. customer_users yönetim politikası — sadece kurucu VEYA o müşterinin
--    sahibi olan satışçı, müşteriye portal erişimi (login) verebilir/kaldırabilir.
--    Mevcut "customer_users_self" (sadece kendi satırını görme) politikası
--    AYNEN kalıyor — bu yeni politika ekstra, çakışmıyor (Postgres RLS
--    politikaları OR ile birleşir).
-- ----------------------------------------------------------------------------

create policy "customer_users_manage" on public.customer_users
  for all using (
    public.is_founder()
    or exists (
      select 1 from public.customers c
      where c.id = customer_users.customer_id and c.owner_id = auth.uid()
    )
  )
  with check (
    public.is_founder()
    or exists (
      select 1 from public.customers c
      where c.id = customer_users.customer_id and c.owner_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. proposals — müşterinin kendi teklifini görmesi + karar vermesi.
--    SADECE "sent" durumundaki teklife karar verebilir (using), sonucu
--    "accepted"/"rejected"/"revision_requested" olabilir (with check) —
--    bu bir durum-geçiş politikası olduğu için using/with-check bilinçli
--    olarak asimetrik (DERS 17'deki "aynı olmalı" kuralı sahiplik
--    kontrollerinde geçerli, durum makinelerinde değil).
-- ----------------------------------------------------------------------------

create policy "proposals_customer_select" on public.proposals
  for select using (
    public.current_role() = 'customer'
    and status not in ('draft', 'pending_approval')
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  );

create policy "proposals_customer_respond" on public.proposals
  for update using (
    public.current_role() = 'customer'
    and status = 'sent'
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  )
  with check (
    public.current_role() = 'customer'
    and status in ('accepted', 'rejected', 'revision_requested')
    and customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
  );

-- ----------------------------------------------------------------------------
-- 5. proposal_items — müşterinin görebildiği tekliflerin kalemlerini görmesi
--    (SADECE select — proposal_items_via_proposal "for all" politikasına hiç
--    dokunmuyoruz, DERS 17: hassas tablolarda ayrı politika, mevcut olanı
--    bozma riski alma).
-- ----------------------------------------------------------------------------

create policy "proposal_items_customer_select" on public.proposal_items
  for select using (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_items.proposal_id
        and p.status not in ('draft', 'pending_approval')
        and p.customer_id in (select customer_id from public.customer_users where profile_id = auth.uid())
    )
  );
