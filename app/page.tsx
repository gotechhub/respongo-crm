import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-rg-bg">
      <h1 className="font-display text-2xl font-bold text-rg-ink">
        Respongo CRM
      </h1>
      <p className="text-sm text-rg-ink-soft">
        Kurulum tamamlandı — modüller kuruluyor.
      </p>
      <Link href="/dashboard">
        <Button>Dashboard&apos;a Git</Button>
      </Link>
    </main>
  );
}
