-- Faz 1 / Adım 2 sonrası keşfedilen sorun: PostgREST (uygulamanın veritabanına
-- konuştuğu API katmanı) "anon" ve "authenticated" rolleri için public şemadaki
-- tablolarda temel GRANT izinleri yoktu (hata: "permission denied for table
-- profiles", kod 42501). Bu, satır bazlı güvenlik (RLS) politikalarından farklı
-- bir katman — RLS hangi SATIRLARIN görülebileceğini, GRANT ise tabloya
-- erişilip erişilemeyeceğini belirler. Normal bir Supabase projesinde bu
-- varsayılan olarak açık gelir; bu projede altyapı silinip yeniden
-- kurulduğu için muhtemelen atlanmış.
--
-- Bu migration'ı kaydediyoruz ki ileride proje tekrar sıfırdan kurulursa
-- (yeni bir Supabase projesi, staging ortamı vb.) bu adım unutulmasın.

grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;

alter default privileges in schema public
  grant select, insert, update, delete on tables to anon, authenticated;
alter default privileges in schema public
  grant usage, select on sequences to anon, authenticated;
