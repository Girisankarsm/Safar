import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

export function InsightBanner({
  message,
  variant = "accent",
  className,
}: {
  message: string;
  variant?: "accent" | "primary" | "warning";
  className?: string;
}) {
  const styles = {
    accent: "border-accent/20 bg-accent-light/60 text-green-800",
    primary: "border-primary/20 bg-primary-light/60 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div className={cn("flex items-start gap-3 rounded-xl border px-4 py-3", styles[variant], className)}>
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 opacity-70" />
      <p className="text-sm font-medium leading-relaxed">{message}</p>
    </div>
  );
}
