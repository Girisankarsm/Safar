import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  badge,
  action,
  className,
}: {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between", className)}>
      <div>
        {badge && <div className="mb-2">{badge}</div>}
        <h1 className="text-display text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted md:text-base">{description}</p>
        )}
      </div>
      {action && <div className="mt-3 shrink-0 sm:mt-0">{action}</div>}
    </div>
  );
}
