-- ============================================================================
-- Respongo CRM — Faz 2 / Adım 2: 5 adımlı "Teklif Oluştur" sihirbazı için
-- şema genişletmesi.
--
-- proposals tablosu şu ana kadar hangi teklif şablonunun/dilinin kullanıldığını
-- saklamıyordu — sihirbazın 4. adımı (şablon + dil seçimi) bu iki kolonu
-- gerektiriyor. price_lists/price_list_items/proposal_templates zaten mevcut,
-- ek migration gerekmiyor.
-- ============================================================================

alter table public.proposals
  add column if not exists template_id uuid references public.proposal_templates (id) on delete set null;

alter table public.proposals
  add column if not exists language text not null default 'tr' check (language in ('tr', 'en'));

comment on column public.proposals.template_id is
  'Sihirbazın 4. adımında seçilen teklif şablonu — doküman metni/dili buradan gelir.';
