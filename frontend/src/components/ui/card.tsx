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
        "rounded-2xl border border-[#222222] bg-[#111111] p-5",
        hover && "transition hover:border-[#333333] hover:bg-[#141414]",
        className
      )}
    >
      {children}
    </div>
  );
}
