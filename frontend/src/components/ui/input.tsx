import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-foreground shadow-sm outline-none transition placeholder:font-normal placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-[var(--ring)]",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
