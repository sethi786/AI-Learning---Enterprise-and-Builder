import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Copy, Download, FileText, Info } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useProgress } from "@/lib/progress";
import { buildPortfolio, portfolioMarkdown } from "@/lib/portfolio";

export const Route = createFileRoute("/app/portfolio")({
  head: () => ({
    meta: [
      { title: "My practice record" },
      {
        name: "description",
        content:
          "An honest, exportable record of the simulator work you have completed — what you ran, how you scored, and which competencies you demonstrated more than once.",
      },
    ],
  }),
  component: PortfolioPage,
});

const KIND_LABEL: Record<string, string> = {
  simulator: "Simulator",
  board: "Board case",
  scenario: "Scenario",
  exam: "Exam",
  lab: "Lab",
};

function PortfolioPage() {
  const p = useProgress();
  const [name, setName] = useState("");
  const [copied, setCopied] = useState(false);

  const data = useMemo(() => buildPortfolio(p), [p]);
  const md = useMemo(() => portfolioMarkdown(data, name.trim() || undefined), [data, name]);

  const empty = data.evidence.length === 0;

  const download = () => {
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ai-practice-record.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="My practice record"
        subtitle="Everything you have worked through, in a form you can paste into an application, a CV or a message to a hiring manager."
        right={
          <Badge variant="outline" className="gap-1">
            <FileText className="h-3.5 w-3.5" /> {data.evidence.length} entries
          </Badge>
        }
      />

      {/* The honesty framing is the first thing on the page on purpose. A record
          that overclaims collapses in the first interview and leaves the learner
          worse off than having nothing. */}
      <Card className="border-amber-500/40 bg-amber-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="h-4 w-4" /> What this is, and what it is not
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            This is a record of <strong className="text-foreground">practice</strong>, like a flight
            simulator logbook. It shows what you worked through and how you scored under a rubric.
            It is not job experience and it does not claim to be.
          </p>
          <p>
            Used honestly it is genuinely useful: it says these scenarios are familiar, the
            trade-offs have been reasoned about, and you can discuss the decisions rather than
            recite them. Presented as real work it will not survive the first interview — so the
            exported wording says plainly that it is simulation.
          </p>
        </CardContent>
      </Card>

      {empty ? (
        <Card>
          <CardContent className="space-y-4 p-6 text-sm">
            <p className="leading-relaxed text-muted-foreground">
              Nothing recorded yet. Run one lab simulator or one board case and it will appear here
              with its score and the artifact it produced.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link to="/app/start">Get a plan</Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to="/app/lab-engine">Browse the simulators</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <Stat n={data.counts.simulators} label="Simulators" />
            <Stat n={data.counts.boards} label="Board cases" />
            <Stat n={data.counts.scenarios} label="Scenarios" />
            <Stat n={data.counts.exams} label="Exams" />
            <Stat n={data.counts.demonstrated} label="Demonstrated" />
            <Stat n={data.counts.practised} label="Practised" />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">What you worked through</CardTitle>
              <CardDescription>Most recent first.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.evidence.map((e, i) => (
                <div key={`${e.kind}-${i}`} className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {KIND_LABEL[e.kind]}
                    </Badge>
                    <span className="font-medium">{e.title}</span>
                    {e.score !== undefined ? (
                      <Badge
                        variant={e.score >= 0.7 ? "default" : "outline"}
                        className="text-[10px]"
                      >
                        {Math.round(e.score * 100)}%
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-1.5 leading-relaxed text-muted-foreground">{e.detail}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          {data.competencies.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Competencies</CardTitle>
                <CardDescription>
                  Demonstrated means shown in more than one distinct exercise, not read about once.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {data.competencies.map((c) => (
                  <Badge
                    key={c.id}
                    variant={
                      c.status === "demonstrated" || c.status === "mastered" ? "default" : "outline"
                    }
                    className="text-[11px] font-normal"
                    title={`${c.status.replace(/_/g, " ")} · ${c.demonstrations} demonstrations`}
                  >
                    {c.name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Export</CardTitle>
              <CardDescription>
                Markdown, so it pastes into an email, a CV, a LinkedIn summary or a GitHub profile
                without needing this site to be reachable.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional — appears in the heading)"
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(md).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                  className="gap-1"
                >
                  <Copy className="h-4 w-4" /> {copied ? "Copied" : "Copy as Markdown"}
                </Button>
                <Button size="sm" variant="outline" onClick={download} className="gap-1">
                  <Download className="h-4 w-4" /> Download
                </Button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-md border bg-muted/40 p-3 text-[11px] leading-relaxed whitespace-pre-wrap">
                {md}
              </pre>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="rounded-md border p-3">
      <div className="text-2xl font-semibold tabular-nums">{n}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
