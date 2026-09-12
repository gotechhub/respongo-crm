-- ============================================================================
-- Kalici duzeltme: service_role icin eksik GRANT izinleri.
--
-- 20260826000003_faz1_grants_fix.sql migration'i, altyapi silinip yeniden
-- kuruldugunda Supabase'in normalde otomatik actigi temel GRANT izinlerinin
-- bu projede atlandigini kesfedip SADECE "anon" ve "authenticated" rolleri
-- icin duzeltmisti (o an gorulen hata da bu ikisi icindi). Ancak ayni kok
-- neden -- tablolar yeniden olusturulurken standart Supabase bootstrap
-- GRANT'lerinin uygulanmamis olmasi -- "service_role" icin de gecerliymis.
-- Bu, Sistem Ayarlari > Test Hesaplari Olustur/Guncelle gibi service-role
-- (admin) istemcisi kullanan sunucu eylemlerinde su hatayla ortaya cikti:
-- "permission denied for table profiles" (SQLSTATE 42501). Bu, bir RLS
-- politika ihlali DEGIL -- RLS zaten service_role icin bypass ediliyor --
-- saf bir GRANT (tabloya erisim izni) eksikligi.
--
-- Bunu ileride yeni eklenecek her tabloda tek tek tekrarlamamak icin hem
-- MEVCUT tum tablolara/sequence'lere/fonksiyonlara hem de "alter default
-- privileges" ile BUNDAN SONRA olusturulacak tum yeni nesnelere service_role
-- icin tam yetki taniniyor -- tipki Supabase'in normal, sifirdan kurulan
-- her projede otomatik yaptigi gibi.
-- ============================================================================

grant usage on schema public to service_role;
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;

alter default privileges in schema public
  grant all on tables to service_role;
alter default privileges in schema public
  grant all on sequences to service_role;
alter default privileges in schema public
  grant all on routines to service_role;
