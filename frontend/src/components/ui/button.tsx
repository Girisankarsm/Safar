import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "accent";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "gradient-primary text-white shadow-md hover:opacity-90 hover:shadow-lg",
      accent: "gradient-accent text-white shadow-md hover:opacity-90",
      secondary: "bg-white text-foreground border border-border shadow-sm hover:bg-slate-50 hover:border-slate-300",
      danger: "bg-danger text-white shadow-sm hover:bg-red-700",
      ghost: "bg-transparent text-muted hover:bg-slate-100 hover:text-foreground",
    };
    const sizes = {
      sm: "px-3 py-2 text-xs rounded-lg",
      md: "px-4 py-2.5 text-sm rounded-xl",
      lg: "px-6 py-3.5 text-base rounded-xl",
    };
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
