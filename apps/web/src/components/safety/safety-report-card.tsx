import type { SafetyReport } from "@/types/database";
import { CheckCircle2, MessageCircle, ThumbsUp, Trash2 } from "lucide-react";

const PLACEHOLDER_IMAGES: Record<string, string> = {
  poor_lighting: "https://images.unsplash.com/photo-1519501025264-65ba15a35c6b?w=400&h=240&fit=crop",
  unsafe_bus_stop: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=240&fit=crop",
  harassment: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=240&fit=crop",
  default: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=400&h=240&fit=crop",
};

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 1) return "Just now";
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SafetyReportCard({
  report,
  cityName,
  commentCount = 0,
  isOwner,
  onVote,
  onVerify,
  onComment,
  onDelete,
  deleting,
}: {
  report: SafetyReport;
  cityName: string;
  commentCount?: number;
  isOwner?: boolean;
  onVote: () => void;
  onVerify: () => void;
  onComment: () => void;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const img =
    report.image_url ??
    PLACEHOLDER_IMAGES[report.report_type] ??
    PLACEHOLDER_IMAGES.default;
  const title =
    report.description?.split(".")[0] ??
    `${report.report_type.replace(/_/g, " ")} reported`;
  const typeLabel = report.report_type.replace(/_/g, " ");

  return (
    <article className="flex w-full overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] transition hover:border-[#3B82F6]/30 lg:flex-col lg:rounded-2xl">
      {/* Mobile: compact horizontal row · Desktop sidebar: stacked card */}
      <div className="relative h-[68px] w-[68px] shrink-0 overflow-hidden sm:h-[76px] sm:w-[76px] lg:h-32 lg:w-full">
        <img src={img} alt="" className="h-full w-full object-cover opacity-90" />
        <span className="absolute left-1 top-1 max-w-[calc(100%-8px)] truncate rounded bg-[#EF4444]/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white lg:left-3 lg:top-3 lg:px-2 lg:text-[10px]">
          {typeLabel}
        </span>
        {isOwner && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="absolute right-1 top-1 rounded-md bg-black/50 p-1 text-white hover:bg-[#EF4444]/80 disabled:opacity-50 lg:right-3 lg:top-3 lg:rounded-lg lg:p-1.5"
            aria-label="Delete report"
          >
            <Trash2 className="h-3 w-3 lg:h-3.5 lg:w-3.5" />
          </button>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center p-2.5 lg:p-4">
        <h3 className="line-clamp-1 text-[12px] font-bold text-white sm:text-sm">{title}</h3>
        <p className="mt-0.5 text-[10px] text-[var(--text-dim)] sm:text-xs">
          {cityName} · {timeAgo(report.created_at)}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 lg:mt-auto lg:gap-2 lg:pt-3">
          <button
            type="button"
            onClick={onVote}
            className="flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:border-[#3B82F6]/40 hover:text-white sm:text-xs lg:rounded-lg lg:px-2.5 lg:py-1"
          >
            <ThumbsUp className="h-3 w-3" /> {report.upvotes}
          </button>
          <button
            type="button"
            onClick={onComment}
            className="flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:border-[#3B82F6]/40 hover:text-white sm:text-xs lg:rounded-lg lg:px-2.5 lg:py-1"
          >
            <MessageCircle className="h-3 w-3" /> {commentCount}
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="flex items-center gap-1 rounded-md border border-[var(--border-subtle)] px-2 py-0.5 text-[10px] text-[var(--text-muted)] hover:border-[#22C55E]/40 hover:text-white sm:text-xs lg:rounded-lg lg:px-2.5 lg:py-1"
          >
            <CheckCircle2 className="h-3 w-3" /> {report.verifications}
          </button>
          {report.is_verified && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-1.5 py-0.5 text-[9px] font-bold text-[#22C55E] lg:px-2 lg:text-[10px]">
              Verified
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
