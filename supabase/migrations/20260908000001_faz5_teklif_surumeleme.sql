-- ============================================================================
-- Respongo CRM — Faz 5 / Teklif Stüdyosu: değiştirilemez sürüm geçmişi
--
-- Bir teklif revize edilince önceki gönderilmiş sürüm asla değişmez. Her sürüm
-- seçilen şablon, belge bölümleri ve fiyat kalemlerinin JSON anlık görüntüsünü
-- taşır. Mevcut `proposals` tablosu özet/akış kaydı olmaya devam eder.
--
-- Uygulama tarafı bu migration uygulanmadan proposal_versions'a yazmamalıdır.
-- ============================================================================

create table public.proposal_versions (
  id uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references public.proposals (id) on delete restrict,
  version_number integer not null check (version_number > 0),
  template_id uuid references public.proposal_templates (id) on delete set null,
  language text not null check (language in ('tr', 'en')),
  currency text not null,
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  change_summary text,
  document_snapshot jsonb not null default '{}'::jsonb,
  items_snapshot jsonb not null default '[]'::jsonb,
  created_by uuid references public.profiles (id) default auth.uid(),
  created_at timestamptz not null default now(),
  unique (proposal_id, version_number),
  check (jsonb_typeof(document_snapshot) = 'object'),
  check (jsonb_typeof(items_snapshot) = 'array')
);

comment on table public.proposal_versions is
  'Teklifin gönderilebilir her sürümünün değiştirilemez belge ve kalem anlık görüntüsü.';
comment on column public.proposal_versions.document_snapshot is
  'Kapak, ürün içeriği, kapsam, seçili hukuk metni, ödeme ve onay bölümlerinin sürüm anlık görüntüsü.';
comment on column public.proposal_versions.items_snapshot is
  'Teklif kalemleri ve hesaplanan toplamların sürüm anlık görüntüsü.';

create index idx_proposal_versions_proposal_id on public.proposal_versions (proposal_id, version_number desc);

alter table public.proposals
  add column if not exists current_version_id uuid references public.proposal_versions (id) on delete set null;

comment on column public.proposals.current_version_id is
  'Müşteriye gösterilen en güncel teklif sürümü. Eski sürümler proposal_versions içinde korunur.';

alter table public.proposal_versions enable row level security;

-- Görünürlük ana teklifin mevcut RLS politikasını takip eder; müşteri yalnız
-- kendisine görünür teklifler üzerinden sürüm okuyabilir.
create policy "proposal_versions_via_proposal_select" on public.proposal_versions
  for select using (
    exists (select 1 from public.proposals p where p.id = proposal_versions.proposal_id)
  );

-- Sürüm yalnız teklif sahibi, founder veya kendi bölgesindeki region_admin
-- tarafından oluşturulabilir. UPDATE/DELETE politikası bilinçli olarak yoktur.
create policy "proposal_versions_author_create" on public.proposal_versions
  for insert with check (
    exists (
      select 1 from public.proposals p
      where p.id = proposal_versions.proposal_id
        and (
          p.owner_id = auth.uid()
          or public.is_founder()
          or (public.current_role() = 'region_admin' and p.region = public.current_region())
        )
    )
  );

grant select, insert on public.proposal_versions to authenticated;
