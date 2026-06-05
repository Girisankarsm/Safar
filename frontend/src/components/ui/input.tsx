import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#262626] bg-[#050505] px-4 py-4 text-base text-white placeholder:text-[#A1A1AA] outline-none transition focus:border-[#3B82F6]/60 focus:ring-2 focus:ring-[#3B82F6]/20",
        className
      )}
      {...props}
    />
  );
}
