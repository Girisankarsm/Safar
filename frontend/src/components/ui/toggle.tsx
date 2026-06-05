import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  description,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-4 transition hover:border-primary/20 hover:bg-slate-50/80">
      <div className="flex items-center gap-3">
        {icon && <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">{icon}</div>}
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-xs text-muted">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
          checked ? "bg-primary" : "bg-slate-300"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform",
            checked && "translate-x-5"
          )}
        />
      </button>
    </div>
  );
}
