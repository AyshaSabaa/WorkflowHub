import { cn } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizes = { sm: "h-6 w-6 text-[10px]", md: "h-8 w-8 text-xs", lg: "h-10 w-10 text-sm" };
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return <img src={src} alt={name} className={cn("rounded-full object-cover", sizes[size], className)} />;
  }

  return (
    <div
      className={cn(
        "rounded-full bg-gradient-to-br from-[#ff7a59] to-[#00bda5] flex items-center justify-center font-semibold text-white",
        sizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
}
