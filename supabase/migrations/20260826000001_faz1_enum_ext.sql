-- ============================================================================
-- Respongo CRM — Faz 1 / Adım 1a: Enum genişletmeleri
--
-- Bu dosya SADECE yeni enum tipi/değeri ekler. Yeni eklenen user_role
-- değerleri (region_admin, project_member, support_agent, marketing, finance)
-- bir SONRAKİ migration'da (20260826000002) kullanılacak — PostgreSQL, aynı
-- transaction içinde yeni eklenen bir enum değerinin kullanılmasına izin
-- vermeyebiliyor, bu yüzden ekleme ve kullanım iki ayrı migration'a bölündü.
-- ============================================================================

alter type public.user_role add value if not exists 'region_admin';
alter type public.user_role add value if not exists 'project_member';
alter type public.user_role add value if not exists 'support_agent';
alter type public.user_role add value if not exists 'marketing';
alter type public.user_role add value if not exists 'finance';

-- Türkiye / Global operasyon ayrımı
create type public.region as enum ('tr', 'global');

-- Lead / havuz kaydının nereden geldiği (madde 20-27: reklam, google, linkedin,
-- youtube, sosyal, referans, satış ekibi, Apollo.io, web formu)
create type public.lead_source as enum (
  'manual',
  'referral',
  'sales_rep',
  'apollo',
  'website_form',
  'ad_google',
  'ad_linkedin',
  'ad_instagram',
  'ad_youtube',
  'social_other',
  'other'
);
