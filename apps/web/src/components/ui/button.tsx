import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const styles: Record<Variant, string> = {
  primary:
    "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-[#3B82F6]/35 border border-[#60A5FA]/30",
  secondary: "bg-[#18181d] text-white border border-[#2a2a32] hover:border-[#3B82F6]/55 hover:bg-[#1f1f26]",
  ghost: "bg-transparent text-[#A1A1AA] hover:text-white hover:bg-white/8",
  danger: "bg-[#EF4444] text-white hover:bg-[#dc2626] shadow-lg shadow-[#EF4444]/20",
  outline: "bg-transparent text-white border border-[#2a2a32] hover:border-[#3B82F6]/50 hover:bg-[#18181d]/80",
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "min-h-9 px-4 text-xs", md: "min-h-11 px-5 text-sm", lg: "min-h-12 px-6 text-base" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-none transition active:scale-[0.97]",
        styles[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  to,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  to: string;
  className?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const sizes = { sm: "min-h-9 px-4 text-xs", md: "min-h-11 px-5 text-sm", lg: "min-h-12 px-6 text-base" };
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold leading-none transition hover:scale-[1.01]",
        styles[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
