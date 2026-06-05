import { cn } from "@/lib/utils";

export function Card({
  className,
  children,
  hover,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  hover?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
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
