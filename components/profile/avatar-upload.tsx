"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { updateAvatarUrl } from "@/lib/profile/actions";

const MAX_BYTES = 3 * 1024 * 1024; // storage bucket'ın file_size_limit'i ile aynı (bkz. migration).
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

// V2 Revizeler bölüm I: "Fotoğraf yükleme" — herkes (tüm kullanıcı tipleri) için.
// Dosya doğrudan client'tan Supabase Storage'a yükleniyor (customer-decision-panel.tsx
// ile AYNI, zaten kanıtlanmış desen), kendi klasörüne (bucket RLS: <user_id>/...)
// yazıldığından emin olunuyor, sonra public URL profiles.avatar_url'e kaydediliyor.
export function AvatarUpload({
  userId,
  avatarUrl,
  displayName,
}: {
  userId: string;
  avatarUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);

  async function handleFileSelected(file: File | undefined) {
    if (!file) return;
    setError("");

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Sadece JPEG, PNG veya WEBP formatında fotoğraf yükleyebilirsin.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("Fotoğraf en fazla 3 MB olabilir.");
      return;
    }

    setIsUploading(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: false, contentType: file.type });
      if (uploadError) throw new Error(uploadError.message);

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const result = await updateAvatarUrl(publicUrl);
      if (!result.ok) throw new Error(result.error);

      setPreviewUrl(publicUrl);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Fotoğraf yüklenemedi.");
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-golxp to-golms font-display text-lg font-bold text-white">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            initialsOf(displayName)
          )}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          title="Fotoğrafı değiştir"
          className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-rg-surface bg-primary text-white shadow-rg transition-colors hover:brightness-[1.08] disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => handleFileSelected(e.target.files?.[0])}
        />
      </div>
      <div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="text-[12.2px] font-semibold text-primary hover:underline disabled:opacity-50"
        >
          {isUploading ? "Yükleniyor…" : "Fotoğraf değiştir"}
        </button>
        <p className="mt-0.5 text-[11px] text-rg-ink-faint">JPEG/PNG/WEBP, en fazla 3 MB.</p>
        {error && <p className="mt-1 text-[11.5px] text-destructive">{error}</p>}
      </div>
    </div>
  );
}
