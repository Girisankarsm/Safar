import { PRESENTATION_DECK_URL } from "@/lib/config";
import { cn } from "@/lib/utils";
import { Presentation } from "lucide-react";

export function PresentationDeckTag({
  className,
  compact = false,
  iconOnly = false,
}: {
  className?: string;
  compact?: boolean;
  iconOnly?: boolean;
}) {
  if (iconOnly) {
    return (
      <a
        href={PRESENTATION_DECK_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Presentation Deck"
        title="Presentation Deck"
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#3B82F6]/30 bg-[var(--bg-elevated)] text-[#93C5FD] transition hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/15",
          className
        )}
      >
        <Presentation className="h-4 w-4" />
      </a>
    );
  }

  return (
    <a
      href={PRESENTATION_DECK_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#3B82F6]/30 bg-[#3B82F6]/10 font-semibold text-[#93C5FD] transition hover:border-[#3B82F6]/50 hover:bg-[#3B82F6]/15",
        compact ? "px-2 py-0.5 text-[10px]" : "px-3 py-1 text-[11px]",
        className
      )}
    >
      <Presentation className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      Presentation Deck
    </a>
  );
}
