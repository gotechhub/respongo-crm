"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ApolloClient } from "@/lib/apollo/client";
import { ApolloError, authorizeApollo, parseSearch, type ApolloSearchResult } from "@/lib/apollo/domain";
import { importApolloPerson, type ApolloImportResult } from "@/lib/apollo/import";

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function guard(region: unknown) {
  const supabase = createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new ApolloError("Oturum bulunamadı.");
  const { data: profile, error } = await supabase.from("profiles").select("id, role, region, is_active").eq("id", user.id).single();
  if (error) throw new ApolloError("Kullanıcı yetkileri okunamadı.");
  const context = authorizeApollo(profile, region);
  return { supabase, context, client: new ApolloClient(process.env.APOLLO_API_KEY ?? "") };
}

function failure(error: unknown): { ok: false; error: string } {
  return { ok: false, error: error instanceof ApolloError ? error.message : "İşlem tamamlanamadı. Lütfen tekrar denemeden önce kayıtları kontrol et." };
}

export async function searchApollo(input: unknown, region: unknown): Promise<Result<ApolloSearchResult>> {
  try {
    const { client } = await guard(region);
    return { ok: true, data: await client.search(parseSearch(input)) };
  } catch (error) { return failure(error); }
}

export async function importApollo(personId: string, region: unknown, autoAssign: boolean, creditConsent: boolean): Promise<Result<ApolloImportResult>> {
  try {
    const { supabase, context, client } = await guard(region);
    if (creditConsent !== true) throw new ApolloError("Zenginleştirme işleminin Apollo kredisi kullanabileceğini onayla.");
    if (typeof autoAssign !== "boolean") throw new ApolloError("Geçersiz atama tercihi.");
    const data = await importApolloPerson(personId, context, autoAssign, {
      async findExisting(id, scope) {
        const { data: existing, error } = await supabase.from("leads").select("id").eq("region", scope.region).eq("source_type", "apollo").eq("external_ref", id).limit(1);
        if (error) throw new ApolloError("Mevcut Apollo kayıtları kontrol edilemedi; kredi kullanan işlem başlatılmadı.");
        return Boolean(existing?.length);
      },
      enrich: (id) => client.enrich(id),
      async insert(row) {
        // Reuse the existing region/email unique constraint; never update an existing lead.
        const { data: inserted, error } = await supabase.from("leads")
          .upsert(row, { onConflict: "region,contact_email_norm", ignoreDuplicates: true }).select("id");
        if (error) throw new ApolloError("Lead kaydedilemedi. Veritabanı izinlerini ve mevcut içe aktarma şemasını kontrol et. Apollo sorgusu kredi kullanmış olabilir.");
        return inserted?.[0]?.id as string | undefined ?? null;
      },
      async assign(id) {
        const { data: owner, error } = await supabase.rpc("auto_assign_lead", { p_lead_id: id });
        if (error) throw new ApolloError("Otomatik atama yapılamadı.");
        return Boolean(owner);
      },
    });
    if (data.status === "inserted") revalidatePath("/sales/leads");
    return { ok: true, data };
  } catch (error) { return failure(error); }
}
