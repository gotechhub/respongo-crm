import { cn } from "@/lib/utils";

export function InitialsAvatar({
  name,
  size = "md",
  className,
}: {
  name: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-golms-tint font-display font-bold text-golms",
        size === "sm" ? "h-[22px] w-[22px] text-[9px]" : "h-7 w-7 text-[11px]",
        className
      )}
    >
      {initials}
    </div>
  );
}
