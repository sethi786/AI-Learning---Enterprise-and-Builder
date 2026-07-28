import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { BookOpen, Search } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { glossary, type GlossaryTerm } from "@/content/glossary";

export const Route = createFileRoute("/app/glossary")({
  head: () => ({
    meta: [
      { title: "Plain-English glossary" },
      {
        name: "description",
        content:
          "Every acronym and term of art used on this platform, defined in words that assume nothing, with why each one matters.",
      },
    ],
  }),
  component: GlossaryPage,
});

const CATEGORY_LABEL: Record<GlossaryTerm["category"], string> = {
  "ai-basics": "How AI systems work",
  identity: "Identity and access",
  security: "Security",
  data: "Data, privacy and law",
  governance: "Governance and approval",
  engineering: "Engineering",
  operations: "Running it",
};

const ORDER: GlossaryTerm["category"][] = [
  "ai-basics",
  "identity",
  "security",
  "data",
  "governance",
  "engineering",
  "operations",
];

function GlossaryPage() {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return glossary;
    return glossary.filter((t) =>
      [t.term, ...(t.aliases ?? []), t.plain, t.matters, t.precise ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }, [q]);

  const grouped = useMemo(
    () =>
      ORDER.map((c) => ({
        category: c,
        terms: filtered
          .filter((t) => t.category === c)
          .sort((a, b) => a.term.localeCompare(b.term)),
      })).filter((g) => g.terms.length > 0),
    [filtered],
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="Plain-English glossary"
        subtitle="Every term this platform uses, defined without using another term you would also have to look up. Each one also says why it matters, because a definition without a stake is trivia."
        right={
          <Badge variant="outline" className="gap-1">
            <BookOpen className="h-3.5 w-3.5" /> {glossary.length} terms
          </Badge>
        }
      />

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a word you hit somewhere else — try SCIM, groundedness, blast radius"
          className="pl-9"
        />
      </div>

      {grouped.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Nothing matches “{q}”. If you met that word somewhere on this platform and it is not
            here, that is a gap in the glossary rather than in you.
          </CardContent>
        </Card>
      ) : null}

      {grouped.map((g) => (
        <section key={g.category}>
          <h2 className="text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            {CATEGORY_LABEL[g.category]}
          </h2>
          <div className="mt-3 space-y-3">
            {g.terms.map((t) => (
              <Card key={t.id} id={t.id} className="scroll-mt-20">
                <CardHeader>
                  <div className="flex flex-wrap items-baseline gap-2">
                    <CardTitle className="text-base">{t.term}</CardTitle>
                    {t.aliases?.length ? (
                      <span className="text-xs text-muted-foreground">
                        also written {t.aliases.slice(0, 3).join(", ")}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <p className="leading-relaxed">{t.plain}</p>
                  <div className="rounded-md bg-muted/50 p-3">
                    <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                      Why it matters
                    </div>
                    <p className="mt-1 leading-relaxed text-muted-foreground">{t.matters}</p>
                  </div>
                  {t.precise ? (
                    <details>
                      <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                        The precise definition
                      </summary>
                      <p className="mt-1.5 leading-relaxed text-muted-foreground">{t.precise}</p>
                    </details>
                  ) : null}
                  {t.seeAlso?.length ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {t.seeAlso.map((s) =>
                        s.labId ? (
                          <Button key={s.label} asChild size="sm" variant="outline">
                            <Link to="/app/labs/$labId" params={{ labId: s.labId }}>
                              {s.label}
                            </Link>
                          </Button>
                        ) : null,
                      )}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
