import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#262626] bg-[#111111] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#71717A] focus:border-[#3B82F6]/50",
        className
      )}
      {...props}
    />
  );
}
