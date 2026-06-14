import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CommunityComment, SafetyReport } from "@/types/database";
import { MessageCircle, Send, X } from "lucide-react";
import { useEffect, useState } from "react";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function SafetyReportComments({
  report,
  open,
  onClose,
  loadComments,
  onAddComment,
}: {
  report: SafetyReport | null;
  open: boolean;
  onClose: () => void;
  loadComments: (reportId: string) => Promise<CommunityComment[]>;
  onAddComment: (reportId: string, body: string) => Promise<void>;
}) {
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !report) return;
    setLoading(true);
    setError("");
    loadComments(report.id)
      .then(setComments)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load comments"))
      .finally(() => setLoading(false));
  }, [open, report, loadComments]);

  if (!open || !report) return null;

  const title =
    report.description?.split(".")[0] ??
    report.report_type.replace(/_/g, " ");

  async function submit() {
    const body = text.trim();
    if (!body) return;
    setSubmitting(true);
    setError("");
    try {
      await onAddComment(report!.id, body);
      setText("");
      const next = await loadComments(report!.id);
      setComments(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[3000] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center">
      <div className="flex max-h-[85vh] w-full max-w-md flex-col rounded-2xl border border-[#262626] bg-[#111111] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-[#262626] p-4">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-bold text-white">
              <MessageCircle className="h-4 w-4 text-[#3B82F6]" />
              Comments
            </p>
            <p className="mt-1 line-clamp-2 text-xs text-[#A1A1AA]">{title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-lg p-2 text-[#71717A] hover:bg-[#262626] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <p className="text-center text-sm text-[#71717A]">Loading comments…</p>
          ) : comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-[#262626] px-4 py-8 text-center text-sm text-[#71717A]">
              No comments yet. Be the first to share what you know about this spot.
            </p>
          ) : (
            <ul className="space-y-3">
              {comments.map((c) => (
                <li key={c.id} className="rounded-xl border border-[#262626] bg-[#0a0a0c] p-3">
                  <p className="text-sm text-[#E4E4E7]">{c.body}</p>
                  <p className="mt-2 text-[10px] text-[#71717A]">
                    {c.author_name ?? "Community member"} · {timeAgo(c.created_at)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-[#262626] p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Add a comment…"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !submitting && submit()}
            />
            <Button onClick={submit} disabled={submitting || !text.trim()} className="shrink-0 px-3">
              <Send className="h-4 w-4" />
            </Button>
          </div>
          {error && <p className="mt-2 text-xs text-[#EF4444]">{error}</p>}
        </div>
      </div>
    </div>
  );
}
