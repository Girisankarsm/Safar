import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { motion } from "framer-motion";

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionTo,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionTo?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "surface-card flex flex-col items-center rounded-2xl px-6 py-14 text-center",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#3B82F6]/12">
        <Icon className="h-8 w-8 text-[#3B82F6]" aria-hidden />
      </div>
      <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-[#A1A1AA]">{description}</p>
      {actionLabel && actionTo && (
        <ButtonLink to={actionTo} className="mt-6">
          {actionLabel}
        </ButtonLink>
      )}
      {actionLabel && onAction && !actionTo && (
        <Button onClick={onAction} className="mt-6">
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
