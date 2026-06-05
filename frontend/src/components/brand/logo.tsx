import { Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({
  size = "md",
  showTagline = false,
  className,
}: {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  className?: string;
}) {
  const sizes = {
    sm: { icon: "h-5 w-5", text: "text-base", sub: "text-[10px]" },
    md: { icon: "h-6 w-6", text: "text-lg", sub: "text-xs" },
    lg: { icon: "h-8 w-8", text: "text-2xl", sub: "text-sm" },
  };
  const s = sizes[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary shadow-md">
        <Shield className="h-5 w-5 text-white" />
      </div>
      <div>
        <span className={cn("block font-bold tracking-tight text-foreground", s.text)}>
          Safar<span className="text-primary">AI</span>
        </span>
        {showTagline && (
          <span className={cn("block text-muted", s.sub)}>Safe Mobility Platform</span>
        )}
      </div>
    </div>
  );
}
