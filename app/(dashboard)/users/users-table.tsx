"use client";

import { useState, useTransition, type FormEvent } from "react";
import { Check, Loader2, UserPlus, X } from "lucide-react";
import {
  INVITABLE_ROLES,
  REGION_LABELS_TR,
  REGION_REQUIRED_ROLES,
  ROLE_LABELS_TR,
  type ProfileRow,
  type Region,
  type UserRole,
} from "@/lib/roles";
import { inviteUser, updateUserRoleRegion } from "./actions";

function RoleSelect({
  value,
  onChange,
  options,
}: {
  value: UserRole | "";
  onChange: (v: UserRole) => void;
  options: UserRole[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as UserRole)}
      className="rounded-[8px] border border-rg-line bg-white px-2.5 py-1.5 text-[12.5px] text-rg-ink outline-none focus:border-primary"
    >
      <option value="" disabled>
        Rol seç
      </option>
      {options.map((r) => (
        <option key={r} value={r}>
          {ROLE_LABELS_TR[r]}
        </option>
      ))}
    </select>
  );
}

function RegionSelect({
  value,
  onChange,
  disabled,
  lockedTo,
}: {
  value: Region | "";
  onChange: (v: Region | "") => void;
  disabled?: boolean;
  lockedTo?: Region | null;
}) {
  const options: Region[] = lockedTo ? [lockedTo] : ["tr", "global"];
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as Region | "")}
      className="rounded-[8px] border border-rg-line bg-white px-2.5 py-1.5 text-[12.5px] text-rg-ink outline-none focus:border-primary disabled:bg-rg-surface-alt disabled:text-rg-ink-faint"
    >
      <option value="">— (sadece Kurucu)</option>
      {options.map((r) => (
        <option key={r} value={r}>
          {REGION_LABELS_TR[r]}
        </option>
      ))}
    </select>
  );
}

function UserRow({
  profile,
  roleOptions,
  lockedRegion,
}: {
  profile: ProfileRow;
  roleOptions: UserRole[];
  lockedRegion: Region | null;
}) {
  const [role, setRole] = useState<UserRole>(profile.role ?? "sales_inhouse");
  const [region, setRegion] = useState<Region | "">(profile.region ?? "");
  const [isActive, setIsActive] = useState(profile.is_active);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const regionLocked = REGION_REQUIRED_ROLES.includes(role) ? lockedRegion : null;

  function handleSave() {
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await updateUserRoleRegion(
        profile.id,
        role,
        region === "" ? null : region,
        isActive
      );
      if (result.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <tr className="border-t border-rg-line">
      <td className="px-4 py-3">
        <div className="text-[12.8px] font-semibold text-rg-ink">
          {profile.full_name || "(isim girilmemiş)"}
        </div>
        <div className="text-[11.5px] text-rg-ink-faint">{profile.email}</div>
      </td>
      <td className="px-4 py-3">
        <RoleSelect value={role} onChange={setRole} options={roleOptions} />
      </td>
      <td className="px-4 py-3">
        <RegionSelect
          value={region}
          onChange={setRegion}
          disabled={!REGION_REQUIRED_ROLES.includes(role)}
          lockedTo={regionLocked}
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => setIsActive((v) => !v)}
          className={
            "rounded-full px-2.5 py-1 text-[11px] font-bold " +
            (isActive ? "bg-gofactory-tint text-gofactory" : "bg-rg-surface-alt text-rg-ink-faint")
          }
        >
          {isActive ? "Aktif" : "Pasif"}
        </button>
      </td>
      <td className="px-4 py-3 text-right">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-[8px] bg-primary px-3 py-1.5 text-[12px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : saved ? (
            <Check className="h-3.5 w-3.5" />
          ) : null}
          {saved ? "Kaydedildi" : "Kaydet"}
        </button>
        {error && <div className="mt-1 text-[11px] text-destructive">{error}</div>}
      </td>
    </tr>
  );
}

export function UsersTable({
  profiles,
  canManageAllRegions,
  callerRegion,
}: {
  profiles: ProfileRow[];
  canManageAllRegions: boolean;
  callerRegion: Region | null;
}) {
  const roleOptions = canManageAllRegions
    ? INVITABLE_ROLES
    : INVITABLE_ROLES.filter((r) => r !== "founder" && r !== "region_admin");
  const lockedRegion = canManageAllRegions ? null : callerRegion;

  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<UserRole>(
    canManageAllRegions ? "sales_inhouse" : "sales_inhouse"
  );
  const [inviteRegion, setInviteRegion] = useState<Region | "">(lockedRegion ?? "");
  const [invitePending, startInvite] = useTransition();
  const [inviteError, setInviteError] = useState("");
  const [inviteSent, setInviteSent] = useState(false);

  function handleInvite(e: FormEvent) {
    e.preventDefault();
    setInviteError("");
    startInvite(async () => {
      const result = await inviteUser(
        inviteEmail,
        inviteName,
        inviteRole,
        inviteRegion === "" ? null : inviteRegion
      );
      if (result.ok) {
        setInviteSent(true);
        setInviteEmail("");
        setInviteName("");
        setTimeout(() => {
          setShowInvite(false);
          setInviteSent(false);
        }, 1500);
      } else {
        setInviteError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08]"
        >
          {showInvite ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
          {showInvite ? "Vazgeç" : "Kullanıcı Davet Et"}
        </button>
      </div>

      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="grid grid-cols-4 items-end gap-3 rounded-2xl border border-rg-line bg-rg-surface p-5 shadow-rg"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Ad Soyad
            </label>
            <input
              required
              value={inviteName}
              onChange={(e) => setInviteName(e.target.value)}
              placeholder="Ayşe Yılmaz"
              className="rounded-[8px] border border-rg-line bg-white px-3 py-2 text-[12.8px] outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              E-posta
            </label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="ayse@respongo.com"
              className="rounded-[8px] border border-rg-line bg-white px-3 py-2 text-[12.8px] outline-none focus:border-primary"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Rol
            </label>
            <RoleSelect value={inviteRole} onChange={setInviteRole} options={roleOptions} />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-[.3px] text-rg-ink-faint">
              Bölge
            </label>
            <RegionSelect
              value={inviteRegion}
              onChange={setInviteRegion}
              disabled={!REGION_REQUIRED_ROLES.includes(inviteRole)}
              lockedTo={lockedRegion}
            />
          </div>
          <div className="col-span-4 flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={invitePending}
              className="inline-flex items-center gap-2 rounded-[10px] bg-primary px-4 py-2.5 text-[12.8px] font-semibold text-white transition-colors hover:brightness-[1.08] disabled:opacity-50"
            >
              {invitePending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {inviteSent ? "Davet gönderildi" : "Daveti Gönder"}
            </button>
            {inviteError && (
              <span className="text-[12px] text-destructive">{inviteError}</span>
            )}
          </div>
        </form>
      )}

      <div className="overflow-x-auto rounded-2xl border border-rg-line bg-rg-surface shadow-rg">
        <table className="w-full min-w-[720px] border-collapse">
          <thead>
            <tr className="bg-rg-surface-alt text-left">
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Kullanıcı
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Rol
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Bölge
              </th>
              <th className="px-4 py-2.5 text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                Durum
              </th>
              <th className="px-4 py-2.5 text-right text-[10.8px] font-bold uppercase tracking-[.4px] text-rg-ink-faint">
                &nbsp;
              </th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <UserRow
                key={p.id}
                profile={p}
                roleOptions={roleOptions}
                lockedRegion={lockedRegion}
              />
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-[12.5px] text-rg-ink-faint">
                  Henüz kullanıcı yok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
