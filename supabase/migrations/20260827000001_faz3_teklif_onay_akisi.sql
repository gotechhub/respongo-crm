-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 1: Teklif Onay Akışı (eşik bazlı kurucu yönlendirmesi)
--
-- proposal_status enum'a pending_approval ve revision_requested eklenir.
-- PostgreSQL kısıtı: yeni eklenen enum değerleri AYNI transaction/script içinde
-- bir ifadede KULLANILAMAZ (bkz. 20260826000001_faz1_enum_ext.sql'deki not).
-- Bu migration SADECE ekleme yapar; yeni değerler hiçbir yerde bu script
-- içinde (RLS, check constraint, vs.) KULLANILMIYOR — kullanım tamamen
-- uygulama kodunda (actions.ts) olacak, bu yüzden ayrı bir "adım 2" migration'a
-- gerek yok.
-- ============================================================================

alter type public.proposal_status add value if not exists 'pending_approval';
alter type public.proposal_status add value if not exists 'revision_requested';

-- Onay akışı için yeni kolonlar: kurucunun revizyon notu + kim/ne zaman onayladı.
alter table public.proposals
  add column if not exists approval_note text,
  add column if not exists approved_by uuid references public.profiles (id),
  add column if not exists approved_at timestamptz;

-- NOT: proposals tablosunda zaten "proposals_founder_all" (is_founder() -> for all)
-- ve "proposals_owner_write" (owner_id = auth.uid() -> for all) politikaları var —
-- bu politikalar tablo/kolon bazlı olduğu için yeni kolonlar otomatik kapsanıyor,
-- RLS değişikliği GEREKMİYOR. Onay akışının kimin hangi durum geçişini
-- yapabileceği kısıtlaması (ör. sadece kurucu onaylayabilir/revizyon isteyebilir)
-- uygulama katmanında (server action içinde rol kontrolü + .eq("status", ...)
-- koşullu update) uygulanıyor.
