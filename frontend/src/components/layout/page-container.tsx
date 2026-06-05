import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
}) {
  return (
    <div className={cn("app-page mx-auto w-full", narrow ? "max-w-2xl" : "max-w-4xl", className)}>
      {children}
    </div>
  );
}
