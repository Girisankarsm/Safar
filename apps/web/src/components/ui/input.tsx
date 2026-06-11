import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#2a2a32] bg-[#121216] px-4 py-3 text-sm text-white outline-none transition placeholder:text-[#71717A] focus:border-[#3B82F6]/50 focus:ring-2 focus:ring-[#3B82F6]/15",
        className
      )}
      {...props}
    />
  );
}
