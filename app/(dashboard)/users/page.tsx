import { redirect } from "next/navigation";
import { Topbar } from "@/components/layout/topbar";
import { createClient } from "@/lib/supabase/server";
import type { ProfileRow, Region, UserRole } from "@/lib/roles";
import { UsersTable } from "./users-table";
import { RolePermissionsMatrix, type ModuleRow, type PermissionRow } from "./role-permissions-matrix";

export default async function UsersPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, region")
    .eq("id", user.id)
    .single();

  const caller = callerProfile as { role: UserRole | null; region: Region | null } | null;
  const isFounder = caller?.role === "founder";
  const isRegionAdmin = caller?.role === "region_admin";

  if (!isFounder && !isRegionAdmin) {
    return (
      <>
        <Topbar
          title="Kullanıcı & Yetki"
          subtitle="Kullanıcı ve rol yönetimi"
        />
        <div className="rounded-2xl border-[1.5px] border-dashed border-rg-line p-10 text-center text-[12.5px] text-rg-ink-faint">
          Bu sayfayı görüntüleme yetkin yok — sadece Süper Admin ve Bölge
          Yöneticileri kullanıcı yönetebilir.
        </div>
      </>
    );
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, phone, role, region, is_active, created_at")
    .order("created_at", { ascending: false });

  let modules: ModuleRow[] = [];
  let permissions: PermissionRow[] = [];
  if (isFounder) {
    const [{ data: moduleRows }, { data: permissionRows }] = await Promise.all([
      supabase.from("modules").select("key, group_key, label_tr, sort_order").order("sort_order", { ascending: true }),
      supabase.from("role_permissions").select("role, module_key, can_view, can_edit"),
    ]);
    modules = (moduleRows ?? []) as ModuleRow[];
    permissions = (permissionRows ?? []) as PermissionRow[];
  }

  return (
    <>
      <Topbar
        title="Kullanıcı & Yetki"
        subtitle={
          isFounder
            ? "Tüm bölgelerdeki kullanıcılar — rol ve bölge ataması burada yapılır."
            : "Kendi bölgendeki kullanıcılar."
        }
      />
      <UsersTable
        profiles={(profiles ?? []) as ProfileRow[]}
        canManageAllRegions={isFounder}
        callerRegion={caller?.region ?? null}
      />

      {isFounder && (
        <div className="mt-5">
          <RolePermissionsMatrix modules={modules} permissions={permissions} />
        </div>
      )}
    </>
  );
}
