import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("surface-card rounded-2xl p-5 md:p-6", className)}
      {...props}
    />
  );
}
