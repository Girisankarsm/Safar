import {
  answerQuestion,
  SUGGESTED_QUESTIONS,
  type AssistantAnswer,
  type AssistantPoint,
} from "@/lib/route-assistant";
import type { CityId, PlannedRoute } from "@/types/database";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, ChevronRight, Loader2, Send, Sparkles } from "lucide-react";
import { useRef, useState } from "react";

const SENTIMENT_STYLES: Record<
  AssistantPoint["sentiment"],
  { dot: string; text: string }
> = {
  positive: { dot: "bg-[#22C55E]", text: "text-[#86EFAC]" },
  negative: { dot: "bg-[#EF4444]", text: "text-[#FCA5A5]" },
  neutral: { dot: "bg-[#71717A]", text: "text-[var(--text-muted)]" },
};

function AnswerCard({ answer }: { answer: AssistantAnswer }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-xl border border-[#3B82F6]/25 bg-gradient-to-b from-[#3B82F6]/08 to-transparent p-4"
    >
      {/* Header */}
      <div className="mb-3 flex items-start gap-2.5">
        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/20">
          <Sparkles className="h-3 w-3 text-[#3B82F6]" />
        </div>
        <div>
          <p className="text-[13px] font-bold text-white">{answer.headline}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-[var(--text-muted)]">
            {answer.body}
          </p>
        </div>
      </div>

      {/* Points */}
      <div className="space-y-2 pl-8">
        {answer.points.map((pt, i) => {
          const style = SENTIMENT_STYLES[pt.sentiment];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -4 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex items-start gap-2"
            >
              <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${style.dot}`} />
              <span className={`text-[11px] leading-relaxed ${style.text}`}>
                {pt.icon} {pt.text}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Confidence footer */}
      {answer.confidence !== undefined && (
        <div className="mt-3 flex items-center gap-2 pl-8">
          <div className="h-1 w-20 overflow-hidden rounded-full bg-[var(--border-subtle)]">
            <div
              className="h-full rounded-full bg-[#3B82F6] transition-all"
              style={{ width: `${answer.confidence}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-[var(--text-dim)]">
            {answer.confidence}% data confidence
          </span>
        </div>
      )}
    </motion.div>
  );
}

export function RouteAssistant({
  route,
  allRoutes,
  cityId,
  departureHour,
}: {
  route: PlannedRoute;
  allRoutes: PlannedRoute[];
  cityId: CityId;
  departureHour?: number;
}) {
  const [answers, setAnswers] = useState<AssistantAnswer[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [askedIds, setAskedIds] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  function ask(questionOrIntent: string) {
    if (loading) return;
    setLoading(true);
    setInput("");

    // Simulate brief "thinking" for premium UX feel
    window.setTimeout(() => {
      const answer = answerQuestion(
        questionOrIntent,
        route,
        allRoutes,
        cityId,
        { departureHour }
      );
      setAnswers((prev) => [answer, ...prev]);
      setLoading(false);
      window.requestAnimationFrame(() => {
        feedRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      });
    }, 400);
  }

  function handleChip(q: (typeof SUGGESTED_QUESTIONS)[number]) {
    setAskedIds((prev) => new Set([...prev, q.id]));
    ask(q.intent);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = input.trim();
    if (!q) return;
    ask(q);
    inputRef.current?.blur();
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3B82F6]/20">
            <Bot className="h-3.5 w-3.5 text-[#3B82F6]" />
          </div>
          <div>
            <p className="text-[12px] font-bold text-white">Safar Route Assistant</p>
            <p className="text-[10px] text-[var(--text-dim)]">
              Answers from corridor intelligence
            </p>
          </div>
          <span className="ml-auto rounded-full bg-[#22C55E]/12 px-2 py-0.5 text-[9px] font-bold text-[#86EFAC]">
            No external AI
          </span>
        </div>
      </div>

      {/* Suggested chips */}
      <div className="shrink-0 border-b border-[var(--border-subtle)] px-3 py-2.5">
        <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-[var(--text-dim)]">
          Ask about this route
        </p>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => {
            const asked = askedIds.has(q.id);
            return (
              <button
                key={q.id}
                type="button"
                onClick={() => handleChip(q)}
                disabled={loading}
                className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  asked
                    ? "border-[#3B82F6]/30 bg-[#3B82F6]/10 text-[#93C5FD]"
                    : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[#3B82F6]/40 hover:text-white"
                }`}
              >
                {q.label}
                <ChevronRight className="h-2.5 w-2.5 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Answer feed */}
      <div ref={feedRef} className="flex-1 overflow-y-auto p-3">
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-3 flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2.5"
          >
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#3B82F6]" />
            <span className="text-[11px] text-[var(--text-muted)]">
              Analysing corridor intelligence…
            </span>
          </motion.div>
        )}

        <AnimatePresence>
          {answers.length === 0 && !loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center px-4 py-8 text-center"
            >
              <Bot className="mb-3 h-8 w-8 text-[var(--text-dim)]" />
              <p className="text-[12px] font-semibold text-white">
                Ask anything about this route
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-dim)]">
                Tap a suggested question above or type your own
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-3">
          {answers.map((ans, i) => (
            <AnswerCard key={`${ans.intent}-${i}`} answer={ans} />
          ))}
        </div>
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-[var(--border-subtle)] p-3"
      >
        <div className="flex items-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 focus-within:border-[#3B82F6]/50">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this route…"
            className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-[var(--text-dim)]"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6] text-white transition disabled:opacity-30"
          >
            <Send className="h-3 w-3" />
          </button>
        </div>
      </form>
    </div>
  );
}
