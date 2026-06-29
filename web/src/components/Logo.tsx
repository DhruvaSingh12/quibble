import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps) {
  return (
    <div className={cn("font-black tracking-[-0.03em] font-[family-name:var(--league-spartan)] text-foreground", className)}>
      quibble.
    </div>
  );
}
