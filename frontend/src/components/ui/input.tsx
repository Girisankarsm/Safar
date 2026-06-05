import { cn } from "@/lib/utils";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-xl border border-[#222222] bg-black px-4 py-3.5 text-white placeholder:text-[#a1a1aa] outline-none transition focus:border-white/30",
        className
      )}
      {...props}
    />
  );
}
