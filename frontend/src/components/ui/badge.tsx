import { cn } from "@/lib/utils";

export function Badge({
  children,
  className,
  variant = "default",
}: {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "safe" | "moderate" | "risky" | "accent";
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700 border border-slate-200/80",
    safe: "bg-green-100 text-green-800 border border-green-200/80",
    moderate: "bg-amber-100 text-amber-800 border border-amber-200/80",
    risky: "bg-red-100 text-red-800 border border-red-200/80",
    accent: "bg-green-50 text-accent border border-green-200",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
