-- ============================================================================
-- Respongo CRM — Faz 3 / Adım 2: Pazarlama Modülü (Kampanyalar)
--
-- Kapsam:
--  1. campaign_channel / campaign_status enum'ları
--  2. marketing_campaigns tablosu (kampanya kayıtları — bütçe, kanal, ürün,
--     bölge, hedef lead sayısı)
--  3. leads / customer_pool tablolarına campaign_id (attribution) kolonu
--  4. RLS: founder tam erişim, marketing + region_admin sadece kendi
--     bölgelerindeki kampanyaları yönetir (görünürlük region=null için de
--     açık — founder'ın oluşturduğu "global" kampanyalar herkese görünür)
--  5. leads tablosuna eksik olan "marketing" rolü RLS politikaları eklendi
--     (role_permissions'ta marketing'in leads'e can_view=true'su vardı ama
--     karşılığında hiçbir RLS select politikası yoktu — bu modülün "kampanyaya
--     lead bağla" özelliği için gerekli, aynı zamanda önceden var olan bir
--     boşluğu kapatıyor)
-- ============================================================================

create type public.campaign_channel as enum (
  'google_ads',
  'linkedin_ads',
  'instagram_ads',
  'youtube_ads',
  'email',
  'content',
  'webinar',
  'event',
  'referral_program',
  'partnership',
  'other'
);

create type public.campaign_status as enum ('planned', 'active', 'paused', 'completed', 'cancelled');

create table public.marketing_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel public.campaign_channel not null default 'other',
  status public.campaign_status not null default 'planned',
  product public.product_key,
  region public.region,
  budget numeric(12, 2) not null default 0,
  currency text not null default 'USD',
  start_date date,
  end_date date,
  goal_leads int,
  description text,
  owner_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.marketing_campaigns.region is
  'NULL = tüm bölgelerde görünen "global" kampanya — sadece founder oluşturabilir. marketing/region_admin rolleri kampanyayı kendi bölgesiyle sınırlı oluşturur.';

create trigger set_updated_at before update on public.marketing_campaigns
  for each row execute function public.set_updated_at();

create index idx_marketing_campaigns_region on public.marketing_campaigns (region);
create index idx_marketing_campaigns_status on public.marketing_campaigns (status);

-- ----------------------------------------------------------------------------
-- Attribution: bir lead/havuz kaydı hangi kampanyadan geldi?
-- ----------------------------------------------------------------------------

alter table public.leads
  add column campaign_id uuid references public.marketing_campaigns (id) on delete set null;
alter table public.customer_pool
  add column campaign_id uuid references public.marketing_campaigns (id) on delete set null;

create index idx_leads_campaign_id on public.leads (campaign_id);
create index idx_customer_pool_campaign_id on public.customer_pool (campaign_id);

-- ----------------------------------------------------------------------------
-- RLS — marketing_campaigns
-- ----------------------------------------------------------------------------

alter table public.marketing_campaigns enable row level security;

create policy "marketing_campaigns_founder_all" on public.marketing_campaigns
  for all using (public.is_founder()) with check (public.is_founder());

create policy "marketing_campaigns_select" on public.marketing_campaigns
  for select using (
    public.has_module_access('marketing') and (region = public.current_region() or region is null)
  );

create policy "marketing_campaigns_insert" on public.marketing_campaigns
  for insert with check (
    public.has_module_access('marketing', true) and region = public.current_region()
  );

create policy "marketing_campaigns_update" on public.marketing_campaigns
  for update using (
    public.has_module_access('marketing', true) and region = public.current_region()
  )
  with check (
    public.has_module_access('marketing', true) and region = public.current_region()
  );

create policy "marketing_campaigns_delete" on public.marketing_campaigns
  for delete using (
    public.has_module_access('marketing', true) and region = public.current_region()
  );

grant select, insert, update, delete on public.marketing_campaigns to anon, authenticated;

-- ----------------------------------------------------------------------------
-- RLS — leads: eksik "marketing" rolü politikaları
-- (role_permissions'ta zaten can_view=true tanımlıydı, karşılığı yoktu)
-- ----------------------------------------------------------------------------

create policy "leads_marketing_select" on public.leads
  for select using (
    public.current_role() = 'marketing' and region = public.current_region()
  );

-- Sadece kampanya bağlama/kaldırma amaçlı — uygulama katmanında bu rol için
-- yalnızca campaign_id alanı güncelleniyor (bkz. app/(dashboard)/marketing/actions.ts).
create policy "leads_marketing_update_campaign" on public.leads
  for update using (
    public.current_role() = 'marketing' and region = public.current_region()
  )
  with check (
    public.current_role() = 'marketing' and region = public.current_region()
  );
