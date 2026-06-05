import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  hover,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#262626] bg-[#171717] p-6 shadow-sm shadow-black/20",
        hover &&
          "transition duration-200 hover:border-[#3B82F6]/30 hover:shadow-lg hover:shadow-[#3B82F6]/10",
        className
      )}
    >
      {children}
    </div>
  );
}
