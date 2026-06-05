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
    default: "bg-slate-100 text-slate-700",
    safe: "bg-green-100 text-green-700",
    moderate: "bg-amber-100 text-amber-700",
    risky: "bg-red-100 text-red-700",
    accent: "bg-green-50 text-accent border border-green-200",
  };
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}
