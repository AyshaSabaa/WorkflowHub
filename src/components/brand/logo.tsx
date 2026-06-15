import Image from "next/image";
import { cn } from "@/lib/utils";

const LOGO_SRC = "/assets/avishkar-ai-logo.png";

type LogoVariant = "sidebar" | "login" | "header" | "icon";

const variantStyles: Record<LogoVariant, { height: string; showText: boolean }> = {
  sidebar: { height: "h-10 md:h-12", showText: false },
  login: { height: "h-10 sm:h-12", showText: false },
  header: { height: "h-8 md:h-10", showText: false },
  icon: { height: "h-8 w-8", showText: false },
};

export function Logo({
  variant = "sidebar",
  className,
  priority = false,
}: {
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const { height } = variantStyles[variant];

  return (
    <div className={cn("flex items-center shrink-0", className)}>
      <Image
        src={LOGO_SRC}
        alt="Avishkar AI"
        width={240}
        height={80}
        priority={priority}
        className={cn("w-auto object-contain", height)}
      />
    </div>
  );
}

export const APP_NAME = "Avishkar AI";
export const APP_TITLE = "Avishkar AI CRM";
