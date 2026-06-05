import { cn } from "@/lib/utils";
import Link from "next/link";
import { ButtonHTMLAttributes, forwardRef } from "react";

export const buttonVariants = {
  primary: "gradient-primary text-white shadow-md hover:brightness-110 hover:shadow-lg active:scale-[0.98]",
  accent: "gradient-accent text-white shadow-md hover:brightness-110 active:scale-[0.98]",
  secondary: "bg-white text-slate-800 border-2 border-slate-200 shadow-sm hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]",
  danger: "bg-danger text-white shadow-md hover:brightness-110 active:scale-[0.98]",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  outline: "bg-transparent text-primary border-2 border-primary/30 hover:bg-primary-light/50",
};

const sizes = {
  sm: "min-h-9 px-3.5 py-2 text-xs rounded-lg",
  md: "min-h-11 px-5 py-2.5 text-sm rounded-xl",
  lg: "min-h-12 px-6 py-3.5 text-base rounded-xl",
};

const base =
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof sizes;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(base, buttonVariants[variant], sizes[size], className)}
      {...props}
    />
  )
);
Button.displayName = "Button";

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: keyof typeof buttonVariants;
  size?: keyof typeof sizes;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className={cn(base, buttonVariants[variant], sizes[size], className)}>
      {children}
    </Link>
  );
}
