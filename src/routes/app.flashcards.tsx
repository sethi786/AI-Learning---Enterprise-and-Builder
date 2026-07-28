import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Check, Layers, RotateCcw, Sparkles } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { deck, deckDomains } from "@/content/deck";
import { srs, summarise, type DeckCard, type Grade } from "@/lib/srs";
import type { MasteryDomain } from "@/content/types";

export const Route = createFileRoute("/app/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards" },
      {
        name: "description",
        content:
          "Spaced repetition over every authored question in the catalogue. Cards you get wrong come back; cards you know go away.",
      },
    ],
  }),
  component: FlashcardsPage,
});

const SESSION_SIZE = 20;
const DOMAIN_LABEL: Record<MasteryDomain, string> = {
  platform: "Platform",
  security: "Security",
  privacy_legal_risk: "Privacy, legal & risk",
  architecture: "Architecture",
  agent_rag_connector: "Agents, RAG & connectors",
  governance_grc: "Governance & GRC",
  ops: "Operations",
};

function FlashcardsPage() {
  const store = useSyncExternalStore(srs.subscribe, srs.getSnapshot, srs.getServerSnapshot);
  const [domain, setDomain] = useState<MasteryDomain | "all">("all");
  const [session, setSession] = useState<DeckCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [graded, setGraded] = useState<Record<string, Grade>>({});

  const pool = useMemo(
    () => (domain === "all" ? deck : deck.filter((c) => c.domain === domain)),
    [domain],
  );
  const stats = useMemo(() => summarise(pool, store), [pool, store]);

  const start = () => {
    const now = Date.now();
    // Due cards first — they are the ones at risk of being forgotten — then
    // new cards to fill the session. Sorting due-first by how overdue they are
    // means a long gap between sessions surfaces the worst-affected cards.
    const due = pool
      .filter((c) => {
        const s = store[c.id];
        return s && s.reviews > 0 && s.due <= now;
      })
      .sort((a, b) => (store[a.id]?.due ?? 0) - (store[b.id]?.due ?? 0));
    const fresh = pool.filter((c) => !store[c.id] || store[c.id].reviews === 0);
    setSession([...due, ...fresh].slice(0, SESSION_SIZE));
    setIndex(0);
    setRevealed(false);
    setGraded({});
  };

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader
          title="Flashcards"
          subtitle="Spaced repetition over every authored question in the catalogue. Cards you miss come back sooner; cards you know drift out of the way."
          right={
            <Badge variant="outline" className="gap-1">
              <Layers className="h-3.5 w-3.5" /> {deck.length} cards
            </Badge>
          }
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pick a deck</CardTitle>
            <CardDescription>
              Every card is a question someone wrote with a correct answer and a rationale — the
              same questions used in the labs, platform pages and practice exams.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={domain === "all" ? "default" : "outline"}
                onClick={() => setDomain("all")}
              >
                Everything
              </Button>
              {deckDomains.map((d) => (
                <Button
                  key={d}
                  size="sm"
                  variant={domain === d ? "default" : "outline"}
                  onClick={() => setDomain(d)}
                >
                  {DOMAIN_LABEL[d] ?? d}
                </Button>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Due now" value={stats.due} tone="due" />
              <Stat label="Not seen yet" value={stats.fresh} tone="fresh" />
              <Stat label="Scheduled ahead" value={stats.later} tone="later" />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={start} disabled={stats.due + stats.fresh === 0}>
                {stats.due > 0
                  ? `Review ${Math.min(SESSION_SIZE, stats.due + stats.fresh)} cards`
                  : `Start ${Math.min(SESSION_SIZE, stats.fresh)} new cards`}
              </Button>
              {stats.due + stats.fresh === 0 ? (
                <span className="text-sm text-muted-foreground">
                  Nothing due in this deck. Come back when the schedule brings cards round.
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>

        {stats.later + stats.due < stats.total ? null : (
          <Button variant="ghost" size="sm" onClick={() => srs.reset()} className="gap-1">
            <RotateCcw className="h-4 w-4" /> Reset all review history
          </Button>
        )}
      </div>
    );
  }

  if (index >= session.length) {
    const again = Object.values(graded).filter((g) => g === "again").length;
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="Session complete" subtitle={`${session.length} cards reviewed.`} />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4 text-brand" /> What happens next
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p className="leading-relaxed">
              {again === 0
                ? "You did not miss any. Those cards move out to longer intervals and will not reappear for a while."
                : `${again} card${again === 1 ? "" : "s"} you marked "again" will come back in about ten minutes. The rest are scheduled days out, further each time you get them right.`}
            </p>
            <div className="flex flex-wrap gap-2">
              <Button onClick={start}>Another session</Button>
              <Button variant="outline" onClick={() => setSession(null)}>
                Back to decks
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const card = session[index];
  const advance = (g: Grade) => {
    srs.grade(card.id, g);
    setGraded((prev) => ({ ...prev, [card.id]: g }));
    setIndex((i) => i + 1);
    setRevealed(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          Card {index + 1} of {session.length}
        </div>
        <Button variant="ghost" size="sm" onClick={() => setSession(null)}>
          End session
        </Button>
      </div>
      <Progress value={Math.round((index / session.length) * 100)} />

      <Card className="min-h-[260px]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{revealed ? "Answer" : "Question"}</CardTitle>
            <Badge variant="outline" className="text-[10px]">
              {card.source}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap text-base leading-relaxed">{card.front}</p>
          {revealed ? (
            <div className="space-y-3 border-t pt-4">
              <p className="flex gap-2 whitespace-pre-wrap text-base font-medium leading-relaxed">
                <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                <span>{card.back}</span>
              </p>
              {card.why ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{card.why}</p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {!revealed ? (
        <Button className="w-full" onClick={() => setRevealed(true)}>
          Show answer
        </Button>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <GradeButton label="Again" hint="10 min" onClick={() => advance("again")} tone="again" />
          <GradeButton label="Hard" hint="short" onClick={() => advance("hard")} tone="hard" />
          <GradeButton label="Good" hint="normal" onClick={() => advance("good")} tone="good" />
          <GradeButton label="Easy" hint="longer" onClick={() => advance("easy")} tone="easy" />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  const ring =
    tone === "due"
      ? "border-brand/40 bg-brand/5"
      : tone === "fresh"
        ? "border-border"
        : "border-border opacity-70";
  return (
    <div className={`rounded-md border p-3 ${ring}`}>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function GradeButton({
  label,
  hint,
  onClick,
  tone,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  tone: "again" | "hard" | "good" | "easy";
}) {
  const cls: Record<typeof tone, string> = {
    again: "border-rose-500/50 hover:bg-rose-500/10",
    hard: "border-amber-500/50 hover:bg-amber-500/10",
    good: "border-emerald-500/50 hover:bg-emerald-500/10",
    easy: "border-sky-500/50 hover:bg-sky-500/10",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-md border px-3 py-2.5 text-sm font-medium transition-colors ${cls[tone]}`}
    >
      {label}
      <span className="ml-1.5 text-xs font-normal text-muted-foreground">{hint}</span>
    </button>
  );
}
