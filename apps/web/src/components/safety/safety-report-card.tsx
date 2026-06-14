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
  isOwner,
  onVote,
  onVerify,
  onDelete,
  deleting,
}: {
  report: SafetyReport;
  cityName: string;
  isOwner?: boolean;
  onVote: () => void;
  onVerify: () => void;
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

  return (
    <article className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-2xl border border-[#262626] bg-[#111111] transition hover:border-[#3B82F6]/30">
      <div className="relative h-36 overflow-hidden">
        <img src={img} alt="" className="h-full w-full object-cover opacity-90" />
        <span className="absolute left-3 top-3 rounded-md bg-[#EF4444]/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          {report.report_type.replace(/_/g, " ")}
        </span>
        {isOwner && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="absolute right-3 top-3 rounded-lg bg-black/50 p-1.5 text-white hover:bg-[#EF4444]/80 disabled:opacity-50"
            aria-label="Delete report"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-1 text-sm font-bold text-white">{title}</h3>
        <p className="mt-1 text-xs text-[#71717A]">
          {cityName} · {timeAgo(report.created_at)}
        </p>
        <div className="mt-auto flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={onVote}
            className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white"
          >
            <ThumbsUp className="h-3.5 w-3.5" /> {report.upvotes}
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="flex items-center gap-1 text-xs text-[#A1A1AA] hover:text-white"
          >
            <MessageCircle className="h-3.5 w-3.5" /> {report.verifications}
          </button>
          {report.is_verified && (
            <span className="ml-auto flex items-center gap-1 rounded-full bg-[#22C55E]/15 px-2 py-0.5 text-[10px] font-bold text-[#22C55E]">
              <CheckCircle2 className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
