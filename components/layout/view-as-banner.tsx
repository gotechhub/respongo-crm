import { EyeOff } from "lucide-react";
import { endViewAs } from "@/lib/view-as/actions";
import { ROLE_LABELS_TR, type UserRole } from "@/lib/roles";

// Server Component — hem (dashboard) hem (portal) layout'unda kullanılır.
// View-as sırasında auth.uid() GERÇEKTEN hedef kullanıcı olduğu için isim/rol,
// layout'un zaten okuduğu taze/cache'siz profil sorgusundan geliyor — ekstra
// sorguya gerek yok. `role` null ise (customer portalı gibi role alanı ayrı
// tiplenen ekranlarda) sadece isim gösterilir.
async function handleExit() {
  "use server";
  await endViewAs();
}

export function ViewAsBanner({ name, role }: { name: string; role?: UserRole | null }) {
  return (
    <div className="sticky top-0 z-50 flex items-center justify-between gap-3 bg-amber-500 px-5 py-2.5 text-white shadow-md">
      <div className="text-[12.5px] font-semibold">
        Şu an <strong>{name}</strong>
        {role ? " (" + ROLE_LABELS_TR[role] + ")" : ""} olarak görüntülüyorsun — bu bir denetim kaydına işleniyor.
      </div>
      <form action={handleExit}>
        <button
          type="submit"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[8px] bg-white/15 px-3 py-1.5 text-[11.8px] font-bold text-white transition-colors hover:bg-white/25"
        >
          <EyeOff className="h-3.5 w-3.5" />
          Normal Hesabına Dön
        </button>
      </form>
    </div>
  );
}
