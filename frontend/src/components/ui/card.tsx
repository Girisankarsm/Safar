import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("surface rounded-2xl p-5 md:p-6", className)}
      {...props}
    />
  );
}
