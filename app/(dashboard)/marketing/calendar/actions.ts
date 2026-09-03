"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Region } from "@/lib/roles";
import type { ProductKey } from "../../sales/proposals/actions";

type ActionResult = { ok: true } | { ok: false; error: string };

export type SocialPlatform = "linkedin" | "instagram" | "facebook" | "tiktok" | "youtube" | "x" | "blog" | "other";

export type SocialPostStatus = "draft" | "scheduled" | "published" | "cancelled";

export type SocialPostInput = {
  title: string;
  contentText: string;
  platform: SocialPlatform;
  product: ProductKey | "";
  region: Region | ""; // "" => global
  scheduledAt: string; // "" | "YYYY-MM-DDTHH:mm"
  linkUrl: string;
  notes: string;
  ownerId: string | null;
};

function toRow(input: SocialPostInput) {
  return {
    title: input.title.trim(),
    content_text: input.contentText.trim() || null,
    platform: input.platform,
    product: input.product || null,
    region: input.region || null,
    scheduled_at: input.scheduledAt ? new Date(input.scheduledAt).toISOString() : null,
    link_url: input.linkUrl.trim() || null,
    notes: input.notes.trim() || null,
    owner_id: input.ownerId,
  };
}

export async function createSocialPost(input: SocialPostInput): Promise<ActionResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: "Oturum bulunamadı." };
  }
  if (!input.title.trim()) {
    return { ok: false, error: "Başlık zorunlu." };
  }

  const { error } = await supabase.from("social_posts").insert({
    ...toRow(input),
    created_by: user.id,
    owner_id: input.ownerId ?? user.id,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/marketing/calendar");
  return { ok: true };
}

export async function updateSocialPost(id: string, input: SocialPostInput): Promise<ActionResult> {
  const supabase = createClient();
  if (!input.title.trim()) {
    return { ok: false, error: "Başlık zorunlu." };
  }

  const { error, count } = await supabase
    .from("social_posts")
    .update(toRow(input), { count: "exact" })
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu gönderiyi güncelleme yetkin yok." };
  }

  revalidatePath("/marketing/calendar");
  return { ok: true };
}

const STATUS_TRANSITIONS: Record<SocialPostStatus, SocialPostStatus[]> = {
  draft: ["scheduled", "cancelled"],
  scheduled: ["published", "draft", "cancelled"],
  published: [],
  cancelled: ["draft"],
};

export async function updateSocialPostStatus(id: string, next: SocialPostStatus): Promise<ActionResult> {
  const supabase = createClient();
  const { data: post } = await supabase.from("social_posts").select("status").eq("id", id).single();
  if (!post) {
    return { ok: false, error: "Gönderi bulunamadı." };
  }
  const current = post.status as SocialPostStatus;
  if (!STATUS_TRANSITIONS[current].includes(next)) {
    return { ok: false, error: "Bu durum geçişi yapılamaz." };
  }

  const { error, count } = await supabase
    .from("social_posts")
    .update(
      { status: next, published_at: next === "published" ? new Date().toISOString() : null },
      { count: "exact" }
    )
    .eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu gönderiyi güncelleme yetkin yok." };
  }

  revalidatePath("/marketing/calendar");
  return { ok: true };
}

export async function deleteSocialPost(id: string): Promise<ActionResult> {
  const supabase = createClient();
  const { error, count } = await supabase.from("social_posts").delete({ count: "exact" }).eq("id", id);

  if (error) {
    return { ok: false, error: error.message };
  }
  if (!count) {
    return { ok: false, error: "Bu gönderiyi silme yetkin yok." };
  }

  revalidatePath("/marketing/calendar");
  return { ok: true };
}
