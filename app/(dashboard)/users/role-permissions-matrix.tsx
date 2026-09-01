"use client";

import { Fragment, useState, useTransition } from "react";
import { ShieldCheck } from "lucide-react";
import { ROLE_LABELS_TR, type UserRole } from "@/lib/roles";
import { updateRolePermission } from "./actions";

export type ModuleRow = { key: string; group_key: string; label_tr: string; sort_order: number };
export type PermissionRow = { role: UserRole; module_key: string; can_view: boolean; can_edit: boolean };

// Matriste gösterilen roller: founder her zaman tam erişimlidir (is_founder()
// tüm kontrolleri bypass eder) — değiştirilemez, gösterilmez. customer'ın
// erişimi ayrı bir portal mekanizmasıyla yönetilir, bu modül tabanlı matrise
// dahil değil.
const MATRIX_ROLES: UserRole[] = [
  "region_admin",
  "sales_inhouse",
  "partner_tr",
  "partner_global",
  "freelancer",
  "project_member",
  "support_agent",
  "marketing",
  "finance",
];

const GROUP_LABEL: Record<string, string> = {
  genel: "Genel",
  satis: "Satış",
  musteri: "Müşteri",
  proje: "Proje",
  pazarlama: "Pazarlama",
  finans: "Finans",
  yonetim: "Yönetim",
};

type Level = "none" | "view" | "edit";

function levelOf(canView: boolean, canEdit: boolean): Level {
  if (canEdit) return "edit";
  if (canView) return "view";
  return "none";
}

const LEVEL_CLASS: Record<Level, string> = {
  none: "text-rg-ink-faint",
  view: "text-golxp",
  edit: "text-gofactory",
};

export function RolePermissionsMatrix({ modules, permissions }: { modules: ModuleRow[]; permissions: PermissionRow[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [map, setMap] = useState<Record<string, Level>>(() => {
    const initial: Record<string, Level> = {};
    permissions.forEach((p) => {
      initial[`${p.role}:${p.module_key}`] = levelOf(p.can_view, p.can_edit);
    });
    return initial;
  });

  function handleChange(role: UserRole, moduleKey: string, level: Level) {
    const key = `${role}:${moduleKey}`;
    const prev = map[key] ?? "none";
    setMap((m) => ({ ...m, [key]: level }));
    setError("");
    startTransition(async () => {
      const canView = level !== "none";
      const canEdit = level === "edit";
      const result = await updateRolePermission(role, moduleKey, canView, canEdit);
      if (!result.ok) {
        setMap((m) => ({ ...m, [key]: prev }));
        setError(result.error);
      }
    });
  }

  const groups = Array.from(new Set(modules.map((m) => m.group_key)));

  return (
    <div className="rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
      <div className="flex items-center gap-2 border-b border-rg-line px-5 py-3.5">
        <ShieldCheck className="h-4 w-4 text-rg-ink-faint" />
        <div className="text-[13px] font-bold text-rg-ink">Rol / İzin Matrisi</div>
        <div className="ml-auto text-[11px] text-rg-ink-faint">
          Her hücreye tıkla: Yok → Görüntüle → Düzenle. Kurucu her zaman tam erişimlidir, burada gösterilmez.
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="sticky left-0 z-10 bg-rg-surface-alt px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Modül
              </th>
              {MATRIX_ROLES.map((role) => (
                <th
                  key={role}
                  className="px-2 py-2.5 text-center text-[10.2px] font-bold uppercase tracking-[.3px] text-rg-ink-faint"
                >
                  {ROLE_LABELS_TR[role]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <Fragment key={group}>
                <tr className="border-t border-rg-line bg-rg-surface-alt">
                  <td colSpan={MATRIX_ROLES.length + 1} className="px-4 py-1.5 text-[10.5px] font-bold text-rg-ink-faint">
                    {GROUP_LABEL[group] ?? group}
                  </td>
                </tr>
                {modules
                  .filter((m) => m.group_key === group)
                  .map((m) => (
                    <tr key={m.key} className="border-t border-rg-line">
                      <td className="sticky left-0 z-10 bg-rg-surface px-4 py-2 text-[12px] font-semibold text-rg-ink">
                        {m.label_tr}
                      </td>
                      {MATRIX_ROLES.map((role) => {
                        const level = map[`${role}:${m.key}`] ?? "none";
                        return (
                          <td key={role} className="px-2 py-2 text-center">
                            <select
                              value={level}
                              disabled={isPending}
                              onChange={(e) => handleChange(role, m.key, e.target.value as Level)}
                              className={`rounded-[6px] border border-rg-line bg-rg-surface px-1.5 py-1 text-[10.5px] font-semibold outline-none focus:border-primary disabled:opacity-50 ${LEVEL_CLASS[level]}`}
                            >
                              <option value="none">Yok</option>
                              <option value="view">Görüntüle</option>
                              <option value="edit">Düzenle</option>
                            </select>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      {error && (
        <div className="border-t border-rg-line px-5 py-2.5 text-[12px] text-destructive">{error}</div>
      )}
    </div>
  );
}
