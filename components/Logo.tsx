import Image from "next/image";
import { cn } from "@/lib/cn";

interface LogoProps {
  className?: string;
  priority?: boolean;
}

/**
 * Klarsa brand logo — renders the official asset (public/brand/klarsa-logo.png).
 * The logo is a self-contained square lockup, so it works on light and dark
 * surfaces. Size it via `className` (height utilities), e.g. `h-8 sm:h-10`.
 */
export function Logo({ className, priority = false }: LogoProps) {
  return (
    <Image
      src="/brand/klarsa-logo-web.png"
      alt="Klarsa"
      width={320}
      height={320}
      priority={priority}
      sizes="40px"
      className={cn("h-9 w-auto rounded-md", className)}
    />
  );
}
