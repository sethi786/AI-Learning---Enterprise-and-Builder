import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/learning/Primitives";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMemo, useState } from "react";
import { labs } from "@/content/labs";
import { platforms } from "@/content/platforms";

type Card = { q: string; a: string };

function build(): Card[] {
  const cards: Card[] = [];
  for (const l of labs)
    for (const m of l.modules) cards.push({ q: `${l.name} — ${m.title}`, a: m.lesson.enterprise });
  for (const p of platforms)
    if (p.commonRisks[0] && p.fixes[0])
      cards.push({ q: `${p.name}: top risk?`, a: `Risk: ${p.commonRisks[0]}\nFix: ${p.fixes[0]}` });
  return cards;
}

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards" },
      { name: "description", content: "Rapid recall across platforms and labs." },
    ],
  }),
  component: FlashcardsPage,
});

function FlashcardsPage() {
  const cards = useMemo(build, []);
  const [i, setI] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[i];
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Flashcards" subtitle={`${i + 1} / ${cards.length}`} />
      <Card className="min-h-[240px] cursor-pointer" onClick={() => setFlipped((v) => !v)}>
        <CardHeader>
          <CardTitle className="text-base">{flipped ? "Answer" : "Question"}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="whitespace-pre-wrap text-sm leading-relaxed">{flipped ? card.a : card.q}</p>
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2">
        <Button
          variant="outline"
          onClick={() => {
            setI((p) => (p - 1 + cards.length) % cards.length);
            setFlipped(false);
          }}
        >
          Prev
        </Button>
        <Button onClick={() => setFlipped((v) => !v)}>
          {flipped ? "Show question" : "Show answer"}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setI((p) => (p + 1) % cards.length);
            setFlipped(false);
          }}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
