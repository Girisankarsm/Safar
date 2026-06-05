import { cn } from "@/lib/utils";
import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";

const styles: Record<Variant, string> = {
  primary: "bg-white !text-black hover:bg-white/90 [&_svg]:text-black",
  secondary: "bg-[#111111] text-white border border-[#222222] hover:border-[#444444]",
  ghost: "bg-transparent text-[#a1a1aa] hover:text-white hover:bg-white/5",
  danger: "bg-[#ef4444] text-white hover:bg-[#dc2626]",
  outline: "bg-transparent text-white border border-[#222222] hover:border-white/30",
};

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

export function Button({ className, variant = "primary", size = "md", ...props }: BtnProps) {
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition disabled:opacity-50",
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
  const sizes = { sm: "px-3 py-2 text-xs", md: "px-4 py-2.5 text-sm", lg: "px-6 py-3.5 text-base" };
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium transition",
        styles[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
