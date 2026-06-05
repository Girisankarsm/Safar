import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const styles: Record<Variant, string> = {
  primary:
    "bg-[#3B82F6] !text-white hover:bg-[#2563EB] shadow-lg shadow-[#3B82F6]/40 border border-[#60A5FA]/30 [&_svg]:!text-white [&_span]:!text-white disabled:bg-[#1e40af] disabled:!text-white disabled:opacity-100 disabled:shadow-none",
  secondary:
    "bg-[#262626] !text-white border-2 border-[#404040] hover:border-[#3B82F6] hover:bg-[#333333] [&_svg]:!text-white",
  ghost: "bg-transparent !text-[#A1A1AA] hover:!text-white hover:bg-white/8",
  danger:
    "bg-[#EF4444] !text-white hover:bg-[#dc2626] shadow-lg shadow-[#EF4444]/30 [&_svg]:!text-white",
  outline:
    "bg-[#111111] !text-white border-2 border-[#404040] hover:border-[#3B82F6] hover:bg-[#1a1a1a] [&_svg]:!text-white",
};

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: BtnProps) {
  const sizes = {
    sm: "min-h-[36px] px-4 py-2 text-xs",
    md: "min-h-[44px] px-5 py-2.5 text-sm",
    lg: "min-h-[52px] px-6 py-3.5 text-base",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-all duration-200",
        "active:scale-[0.97] hover:scale-[1.01] disabled:scale-100",
        "disabled:opacity-80 disabled:cursor-not-allowed",
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
  const sizes = {
    sm: "min-h-[36px] px-4 py-2 text-xs",
    md: "min-h-[44px] px-5 py-2.5 text-sm",
    lg: "min-h-[52px] px-6 py-3.5 text-base",
  };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-bold tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.97]",
        styles[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
