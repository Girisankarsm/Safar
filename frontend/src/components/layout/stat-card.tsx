import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  variant = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "accent";
}) {
  const variants = {
    default: "bg-white",
    primary: "bg-primary-light/40 border-primary/20",
    accent: "bg-accent-light/50 border-accent/20",
  };
  const iconVariants = {
    default: "bg-slate-100 text-slate-600",
    primary: "bg-primary/10 text-primary",
    accent: "bg-accent/10 text-accent",
  };

  return (
    <div className={cn("surface flex items-start gap-4 p-5", variants[variant])}>
      <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl", iconVariants[variant])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-label">{label}</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
          {value}
          {unit && <span className="ml-1 text-sm font-medium text-muted">{unit}</span>}
        </p>
        {trend && <p className="mt-1 text-xs text-muted">{trend}</p>}
      </div>
    </div>
  );
}
