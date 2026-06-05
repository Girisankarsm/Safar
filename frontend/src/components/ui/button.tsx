import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const styles: Record<Variant, string> = {
  primary: "bg-[#3B82F6] text-white hover:bg-[#2563EB] shadow-lg shadow-[#3B82F6]/20",
  secondary: "bg-[#171717] text-white border border-[#262626] hover:border-[#3B82F6]/40 hover:bg-[#1a1a1a]",
  ghost: "bg-transparent text-[#A1A1AA] hover:text-white hover:bg-white/5",
  danger: "bg-[#EF4444] text-white hover:bg-[#dc2626] shadow-lg shadow-[#EF4444]/20",
  outline: "bg-transparent text-white border border-[#262626] hover:border-[#3B82F6]/50",
};

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: BtnProps) {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98] disabled:opacity-50",
        styles[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
}: {
  href: string;
  className?: string;
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}) {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-5 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[0.98]",
        styles[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
