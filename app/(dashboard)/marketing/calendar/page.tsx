import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { Region, UserRole } from "@/lib/roles";
import { CalendarBoard, type SocialPostRow } from "./calendar-board";
import { PostCreateForm } from "./post-form";
import { SOCIAL_STATUS_LABEL } from "./labels";
import type { SocialPostStatus } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const STATUS_ORDER: SocialPostStatus[] = ["scheduled", "draft", "published", "cancelled"];

export default async function ContentCalendarPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase.from("profiles").select("role, region").eq("id", user.id).single();
  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";

  const statusFilter = typeof searchParams.status === "string" ? (searchParams.status as SocialPostStatus) : "";

  let query = supabase
    .from("social_posts")
    .select(
      "id, title, content_text, platform, product, region, status, scheduled_at, published_at, link_url, notes, owner_id"
    )
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }

  const { data: posts } = await query;
  const rows = (posts ?? []) as SocialPostRow[];

  const ownerNames: Record<string, string> = {};
  const ownerIds = Array.from(new Set(rows.map((r) => r.owner_id).filter(Boolean))) as string[];
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name, email").in("id", ownerIds);
    (owners ?? []).forEach((o) => {
      ownerNames[o.id] = (o.full_name as string | null) || (o.email as string);
    });
  }

  return (
    <>
      <div className="mb-3">
        <Link
          href="/marketing"
          className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-rg-ink-soft hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Pazarlamaya dön
        </Link>
      </div>
      <Topbar
        title="Sosyal Medya İçerik Takvimi"
        subtitle="LinkedIn, Instagram, TikTok ve diğer kanallar için planlanan/yayınlanan gönderiler."
      />

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Link
          href="/marketing/calendar"
          className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
            !statusFilter ? "bg-primary text-white" : "border border-rg-line text-rg-ink-soft hover:border-primary hover:text-primary"
          }`}
        >
          Tümü
        </Link>
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/marketing/calendar?status=${s}`}
            className={`rounded-full px-3 py-1.5 text-[11.5px] font-semibold ${
              statusFilter === s ? "bg-primary text-white" : "border border-rg-line text-rg-ink-soft hover:border-primary hover:text-primary"
            }`}
          >
            {SOCIAL_STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <PostCreateForm defaultRegion={isFounder ? null : caller?.region ?? null} />

      <div className="mt-4">
        <CalendarBoard rows={rows} ownerNames={ownerNames} regionLocked={isFounder ? null : caller?.region ?? null} />
      </div>
    </>
  );
}
