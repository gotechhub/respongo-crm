-- Faz 6 — "Teklif Şablonları 2.0" şemasının EKSİK KISMI (kritik bulgu)
--
-- DOSYA ADI NOTU: bu migration aslında 2026-09-11'de (Faz 6 sırasında) yazıldı, ama BİLEREK
-- 20260908000000 olarak (yani 20260908000003_teklif_sablonlari_detayli_icerik.sql'den HEMEN ÖNCE
-- sıraya girecek şekilde) adlandırıldı — çünkü o dosya zaten proposal_template_sections tablosuna
-- UPDATE yapıyor, bu yüzden bu şema önce var olmak ZORUNDA. Tarihi "doğru" (20260911) yazıp CI'ın
-- migration sırasına güvenmek, bu dosyanın 000003'ten SONRA çalışmasına ve orada zaten patlamış
-- olacağı anlamına gelirdi. supabase db push zaten uygulanmamış migration'ları dosya adı sırasına
-- göre uygular — canlıda bu tablo muhtemelen zaten elle var olduğu için (aşağıya bakın) bu dosyanın
-- "geçmişe dönük" tarihi canlı veritabanı için risksiz: create table/column if not exists olduğundan
-- zaten var olan şeyi asla bozmaz, sadece SIFIRDAN kurulan bir ortamda (yedekten geri yükleme, yeni
-- staging) doğru sırada gerçek şemayı inşa etmeyi garantiler.
--
-- Bu oturumda proposal_templates modülünü iyileştirirken (tam ekran önizleme, daha kaliteli
-- içerik) yerel bir Postgres kopyasında TÜM migration geçmişi baştan tekrar oynatılarak
-- doğrulandı — ve şu ortaya çıktı: canlıdaki UI'ın (template-editor.tsx, v2-templates-panel.tsx,
-- app/(dashboard)/sales/proposal-templates/actions.ts) TAMAMEN bağımlı olduğu üç şema parçası
-- HİÇBİR migration dosyasında hiç oluşturulmamış:
--   1. public.proposal_template_sections tablosu (V2Section — TR+EN içeriğin AYNI satırda
--      taşındığı, bölüm bazlı düzenleme modeli; createStudioSections, updateTemplateSection,
--      createCustomTemplateSection, deleteCustomTemplateSection, cloneProposalTemplate hepsi
--      bu tabloyu kullanıyor)
--   2. public.proposal_templates.is_default_for_product (createStarterTemplateLibrary bunu
--      "ürün başına tek varsayılan şablon" garantisi için kullanıyor)
--   3. public.proposal_templates.cloned_from_id (V2Template tipi bunu taşıyor)
--
-- Bir migration (20260908000003_teklif_sablonlari_detayli_icerik.sql, bu oturumdan ÖNCE
-- yazılmış) zaten proposal_template_sections'a UPDATE yapmaya çalışıyor — yani canlı veritabanında
-- bu tablo muhtemelen ELLE (migration dışı) oluşturulmuş ve ekran bu sayede çalışıyor (kullanıcının
-- gönderdiği ekran görüntüsü zaten dolu/çalışan bir düzenleyici gösteriyordu). Ama bu, projenin
-- "customer_requests" tablosuyla daha önce yaşadığı AYNI sınıf sorun: kod + canlı veritabanı senkron
-- ama migration geçmişi eksik — yedekten geri yükleme, yeni bir ortam kurma ya da CI'ın "supabase db
-- push --include-all" ile şemayı SIFIRDAN inşa etmesi gereken herhangi bir durumda bu özelliğin
-- TAMAMEN kaybolmasına yol açar. Bu migration o boşluğu TAMAMEN İDEMPOTENT şekilde kapatıyor —
-- tablo zaten canlıda elle oluşturulmuşsa "create table if not exists" hiçbir şey yapmaz ve CI'ı
-- kırmaz; hiç yoksa (taze bir ortamda) sıfırdan doğru kurar.

alter table public.proposal_templates add column if not exists is_default_for_product boolean not null default false;
alter table public.proposal_templates add column if not exists cloned_from_id uuid references public.proposal_templates (id) on delete set null;

create index if not exists idx_proposal_templates_is_default_for_product on public.proposal_templates (is_default_for_product);

create table if not exists public.proposal_template_sections (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.proposal_templates (id) on delete cascade,
  section_type text not null,
  legal_region text check (legal_region in ('tr', 'us')),
  sort_order int not null default 0,
  title_tr text,
  title_en text,
  body_tr text,
  body_en text,
  content jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.proposal_template_sections add column if not exists legal_region text;
alter table public.proposal_template_sections add column if not exists sort_order int not null default 0;
alter table public.proposal_template_sections add column if not exists title_tr text;
alter table public.proposal_template_sections add column if not exists title_en text;
alter table public.proposal_template_sections add column if not exists body_tr text;
alter table public.proposal_template_sections add column if not exists body_en text;
alter table public.proposal_template_sections add column if not exists content jsonb not null default '{}';
alter table public.proposal_template_sections add column if not exists created_at timestamptz not null default now();
alter table public.proposal_template_sections add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'proposal_template_sections_legal_region_check') then
    alter table public.proposal_template_sections
      add constraint proposal_template_sections_legal_region_check check (legal_region in ('tr', 'us'));
  end if;
end $$;

create index if not exists idx_proposal_template_sections_template_id on public.proposal_template_sections (template_id);

drop trigger if exists set_updated_at on public.proposal_template_sections;
create trigger set_updated_at before update on public.proposal_template_sections
  for each row execute function public.set_updated_at();

alter table public.proposal_template_sections enable row level security;

-- RLS deseni proposal_template_items ile BİREBİR aynı (20260826000002) — founder her şeyi
-- yönetir, has_module_access('proposal_templates') olan roller sadece aktif şablonların
-- bölümlerini görebilir (founder inaktif şablonları da görür).
drop policy if exists "proposal_template_sections_select" on public.proposal_template_sections;
create policy "proposal_template_sections_select" on public.proposal_template_sections
  for select using (
    exists (
      select 1 from public.proposal_templates t
      where t.id = proposal_template_sections.template_id
        and (t.is_active or public.is_founder())
    )
  );

drop policy if exists "proposal_template_sections_founder_manage" on public.proposal_template_sections;
create policy "proposal_template_sections_founder_manage" on public.proposal_template_sections
  for all using (public.is_founder()) with check (public.is_founder());
