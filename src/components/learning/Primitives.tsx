import { useMemo, useState } from "react";
import { CheckCircle2, XCircle, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { LessonSection, QuizQuestion, ScenarioDef, MasteryDomain } from "@/content/types";
import { progress as progressStore, useProgress } from "@/lib/progress";
import { usePrefs, openLayersFor } from "@/lib/prefs";
import { Explained } from "./Explained";

export function RiskBadge({ level }: { level: "low" | "medium" | "high" | "info" }) {
  const map = {
    low: {
      icon: ShieldCheck,
      cls: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30 dark:text-emerald-300",
      label: "Low",
    },
    medium: {
      icon: ShieldQuestion,
      cls: "bg-amber-500/15 text-amber-700 border-amber-500/30 dark:text-amber-300",
      label: "Medium",
    },
    high: {
      icon: ShieldAlert,
      cls: "bg-rose-500/15 text-rose-700 border-rose-500/30 dark:text-rose-300",
      label: "High",
    },
    info: {
      icon: ShieldCheck,
      cls: "bg-sky-500/15 text-sky-700 border-sky-500/30 dark:text-sky-300",
      label: "Info",
    },
  } as const;
  const { icon: Icon, cls, label } = map[level];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      <Icon className="h-3.5 w-3.5" /> {label}
    </span>
  );
}

export function ProgressRing({
  value,
  size = 72,
  label,
}: {
  value: number;
  size?: number;
  label?: string;
}) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (value / 100) * c;
  return (
    <div className="inline-flex flex-col items-center gap-1">
      <svg width={size} height={size} className="text-primary">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeOpacity="0.15"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="52%"
          dominantBaseline="middle"
          textAnchor="middle"
          className="fill-foreground text-sm font-semibold"
        >
          {value}%
        </text>
      </svg>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </div>
  );
}

export function MasteryBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}%</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}

export function DiagramBlock({ text }: { text: string }) {
  return (
    <pre className="rounded-md border bg-muted/40 p-3 text-xs leading-relaxed overflow-x-auto whitespace-pre">
      {text}
    </pre>
  );
}

export function LessonShell({
  id,
  title,
  section,
  domain,
  extras,
}: {
  id: string;
  title: string;
  section: LessonSection;
  domain?: MasteryDomain;
  extras?: React.ReactNode;
}) {
  const { level } = usePrefs();
  const p = useProgress();
  const done = !!p.completedLessons[id];
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{title}</CardTitle>
          <Button
            size="sm"
            variant={done ? "secondary" : "default"}
            onClick={() => progressStore.completeLesson(id, domain, section.competencyIds)}
          >
            {done ? "Completed" : "Mark complete"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        {section.objective ? (
          <div className="rounded-md border border-brand/25 bg-brand/5 p-3">
            <div className="text-xs font-medium tracking-wide text-brand uppercase">
              What you will be able to do
            </div>
            <p className="mt-1 leading-relaxed">{section.objective}</p>
          </div>
        ) : null}
        {/* Which layers start open follows the learner's chosen level. Nothing
            is hidden — every layer is still one click away — but a newcomer no
            longer opens on the technical deep dive. `key` forces the accordion
            to re-read its default when the level changes mid-page. */}
        <Accordion key={level} type="multiple" defaultValue={openLayersFor(level)}>
          <AccordionItem value="simple">
            <AccordionTrigger>In plain English</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <Explained text={section.simple} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="enterprise">
            <AccordionTrigger>What it means in an organisation</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <Explained text={section.enterprise} />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="deep">
            <AccordionTrigger>Technical deep dive</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              <Explained text={section.deepDive} />
            </AccordionContent>
          </AccordionItem>
          {section.diagram ? (
            <AccordionItem value="diagram">
              <AccordionTrigger>Diagram</AccordionTrigger>
              <AccordionContent>
                <DiagramBlock text={section.diagram} />
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {/* v2 fields. These were declared on LessonSection but never rendered,
              which made authoring any of them invisible work. */}
          {section.configExample ? (
            <AccordionItem value="config">
              <AccordionTrigger>Configuration example</AccordionTrigger>
              <AccordionContent>
                <DiagramBlock text={section.configExample} />
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {section.insecurePattern || section.securePattern ? (
            <AccordionItem value="patterns">
              <AccordionTrigger>Insecure vs secure pattern</AccordionTrigger>
              <AccordionContent className="space-y-3">
                {section.insecurePattern ? (
                  <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-rose-700 dark:text-rose-300">
                      <XCircle className="h-3.5 w-3.5" /> Insecure
                    </div>
                    <p className="leading-relaxed">{section.insecurePattern}</p>
                  </div>
                ) : null}
                {section.securePattern ? (
                  <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
                    <div className="mb-1 flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Secure
                    </div>
                    <p className="leading-relaxed">{section.securePattern}</p>
                  </div>
                ) : null}
              </AccordionContent>
            </AccordionItem>
          ) : null}
          {section.attackExample ? (
            <AccordionItem value="attack">
              <AccordionTrigger>
                How it gets attacked <RiskBadge level="high" />
              </AccordionTrigger>
              <AccordionContent className="leading-relaxed text-muted-foreground">
                {section.attackExample}
              </AccordionContent>
            </AccordionItem>
          ) : null}
          <ListItem value="failures" label="Failure modes" items={section.failureModes} />
          <ListItem value="controls" label="Controls that apply" items={section.controls} />
          <ListItem value="trust" label="Trust boundaries" items={section.trustBoundaries} />
          <ListItem
            value="troubleshooting"
            label="Troubleshooting"
            items={section.troubleshooting}
          />
          <AccordionItem value="mistakes">
            <AccordionTrigger>Common mistakes</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {section.mistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="risks">
            <AccordionTrigger>
              Risks <RiskBadge level="high" />
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {section.risks.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="fixes">
            <AccordionTrigger>
              Fixes <RiskBadge level="low" />
            </AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {section.fixes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="evidence">
            <AccordionTrigger>Evidence expected</AccordionTrigger>
            <AccordionContent>
              <ul className="list-disc pl-5 space-y-1">
                {section.evidence.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {section.guidedExercise || section.independentChallenge || section.reflection ? (
          <div className="space-y-3 rounded-md border bg-muted/30 p-4">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              Practice
            </div>
            {section.guidedExercise ? (
              <div>
                <div className="font-medium">Guided exercise</div>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {section.guidedExercise}
                </p>
              </div>
            ) : null}
            {section.independentChallenge ? (
              <div>
                <div className="font-medium">On your own</div>
                <p className="mt-1 leading-relaxed text-muted-foreground">
                  {section.independentChallenge}
                </p>
              </div>
            ) : null}
            {section.reflection ? (
              <div>
                <div className="font-medium">Think it through</div>
                <p className="mt-1 leading-relaxed text-muted-foreground">{section.reflection}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {extras}
      </CardContent>
    </Card>
  );
}

/** Renders an optional bullet list as an accordion item, or nothing at all. */
function ListItem({ value, label, items }: { value: string; label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <AccordionItem value={value}>
      <AccordionTrigger>{label}</AccordionTrigger>
      <AccordionContent>
        <ul className="list-disc space-y-1 pl-5">
          {items.map((x) => (
            <li key={x}>{x}</li>
          ))}
        </ul>
      </AccordionContent>
    </AccordionItem>
  );
}

export function Quiz({
  id,
  questions,
  domain,
}: {
  id: string;
  questions: QuizQuestion[];
  domain?: MasteryDomain;
}) {
  const p = useProgress();
  const prev = p.quizResults[id];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const correctCount = useMemo(
    () =>
      questions.reduce((n, q) => {
        const chosen = answers[q.id];
        const correct = q.options.find((o) => o.correct)?.id;
        return n + (chosen && chosen === correct ? 1 : 0);
      }, 0),
    [answers, questions],
  );

  if (!questions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz</CardTitle>
          <CardDescription>This module has no quiz.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quiz</CardTitle>
        {prev ? (
          <CardDescription>
            Previous best: {prev.correct}/{prev.total}
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {questions.map((q, i) => {
          const chosen = answers[q.id];
          const correctId = q.options.find((o) => o.correct)?.id;
          return (
            <div key={q.id} className="space-y-2 rounded-md border p-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs uppercase">
                  {q.type}
                </Badge>
                <span className="text-xs text-muted-foreground">Question {i + 1}</span>
              </div>
              <p className="font-medium text-sm">{q.prompt}</p>
              <RadioGroup
                value={chosen ?? ""}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [q.id]: v }))}
              >
                {q.options.map((o) => {
                  const isCorrect = submitted && o.id === correctId;
                  const isWrong = submitted && chosen === o.id && o.id !== correctId;
                  return (
                    <div
                      key={o.id}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        isCorrect ? "border-emerald-500/60 bg-emerald-500/5" : ""
                      } ${isWrong ? "border-rose-500/60 bg-rose-500/5" : ""}`}
                    >
                      <RadioGroupItem id={`${q.id}-${o.id}`} value={o.id} disabled={submitted} />
                      <Label htmlFor={`${q.id}-${o.id}`} className="flex-1 cursor-pointer">
                        {o.label}
                      </Label>
                      {isCorrect ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : null}
                      {isWrong ? <XCircle className="h-4 w-4 text-rose-600" /> : null}
                    </div>
                  );
                })}
              </RadioGroup>
              {submitted ? (
                <p className="text-xs text-muted-foreground pt-1">
                  <span className="font-medium">Why:</span> {q.explanation}
                </p>
              ) : null}
            </div>
          );
        })}
        <div className="flex items-center gap-3">
          {!submitted ? (
            <Button
              onClick={() => {
                setSubmitted(true);
                const compIds = Array.from(
                  new Set(questions.flatMap((q) => q.competencyIds ?? [])),
                );
                progressStore.recordQuiz(id, correctCount, questions.length, domain, compIds);
              }}
              disabled={Object.keys(answers).length !== questions.length}
            >
              Submit
            </Button>
          ) : (
            <>
              <Badge>
                Score: {correctCount}/{questions.length}
              </Badge>
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                }}
              >
                Retry
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ScenarioRunner({ scenario }: { scenario: ScenarioDef }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [decision, setDecision] = useState<string | undefined>();
  const [submitted, setSubmitted] = useState(false);

  const score = useMemo(() => {
    let s = 0;
    for (const step of scenario.steps) if (answers[step.id] === step.ideal) s += 1;
    if (decision && scenario.finalDecision.options.find((o) => o.id === decision)?.ideal) s += 2;
    return s;
  }, [answers, decision, scenario]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle>{scenario.title}</CardTitle>
              <CardDescription className="pt-1">{scenario.summary}</CardDescription>
            </div>
            <Badge variant="outline" className="capitalize">
              {scenario.difficulty}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">{scenario.context}</p>
        </CardContent>
      </Card>

      {scenario.steps.map((step, i) => {
        const chosen = answers[step.id];
        const ideal = step.ideal;
        return (
          <Card key={step.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Step {i + 1}</Badge>
                <CardTitle className="text-base">{step.title}</CardTitle>
              </div>
              <CardDescription>{step.question}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <RadioGroup
                value={chosen ?? ""}
                onValueChange={(v) => setAnswers((a) => ({ ...a, [step.id]: v }))}
              >
                {step.options.map((o) => {
                  const isIdeal = submitted && o.id === ideal;
                  const isWrong = submitted && chosen === o.id && o.id !== ideal;
                  return (
                    <div
                      key={o.id}
                      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                        isIdeal ? "border-emerald-500/60 bg-emerald-500/5" : ""
                      } ${isWrong ? "border-rose-500/60 bg-rose-500/5" : ""}`}
                    >
                      <RadioGroupItem id={`${step.id}-${o.id}`} value={o.id} disabled={submitted} />
                      <Label htmlFor={`${step.id}-${o.id}`} className="flex-1 cursor-pointer">
                        {o.label}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
              {submitted ? (
                <p className="pt-2 text-xs text-muted-foreground">
                  <span className="font-medium">Ideal:</span> {step.explain}
                </p>
              ) : null}
            </CardContent>
          </Card>
        );
      })}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Final decision</CardTitle>
          <CardDescription>{scenario.finalDecision.prompt}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <RadioGroup value={decision ?? ""} onValueChange={setDecision}>
            {scenario.finalDecision.options.map((o) => {
              const isIdeal = submitted && o.ideal;
              const isWrong = submitted && decision === o.id && !o.ideal;
              return (
                <div
                  key={o.id}
                  className={`flex flex-col gap-1 rounded-md border px-3 py-2 text-sm ${
                    isIdeal ? "border-emerald-500/60 bg-emerald-500/5" : ""
                  } ${isWrong ? "border-rose-500/60 bg-rose-500/5" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem id={`dec-${o.id}`} value={o.id} disabled={submitted} />
                    <Label htmlFor={`dec-${o.id}`} className="flex-1 cursor-pointer capitalize">
                      {o.label}
                    </Label>
                  </div>
                  {submitted ? <p className="pl-6 text-xs text-muted-foreground">{o.why}</p> : null}
                </div>
              );
            })}
          </RadioGroup>
        </CardContent>
      </Card>

      {!submitted ? (
        <Button
          disabled={Object.keys(answers).length !== scenario.steps.length || !decision}
          onClick={() => {
            setSubmitted(true);
            // Tag competencies from ideal-answered steps
            const idealComps = Array.from(
              new Set(
                scenario.steps
                  .filter((s) => answers[s.id] === s.ideal)
                  .flatMap((s) => s.competencyIds ?? []),
              ),
            );
            const allComps = Array.from(
              new Set(scenario.steps.flatMap((s) => s.competencyIds ?? [])),
            );
            const idealCount = scenario.steps.filter((s) => answers[s.id] === s.ideal).length;
            const ratio = scenario.steps.length ? idealCount / scenario.steps.length : 0;
            const outcome: "ideal" | "partial" | "failed" =
              ratio >= 0.8 ? "ideal" : ratio >= 0.5 ? "partial" : "failed";
            progressStore.saveScenario(
              scenario.id,
              answers,
              decision,
              score,
              scenario.domain,
              outcome === "failed" ? allComps : idealComps,
              outcome,
            );
          }}
        >
          Submit scenario
        </Button>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge>
                Score: {score} / {scenario.steps.length + 2}
              </Badge>
              <CardTitle className="text-base">Ideal answer</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{scenario.idealAnswer}</p>
            <div className="mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSubmitted(false);
                  setAnswers({});
                  setDecision(undefined);
                }}
              >
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CoachPanel({ tips }: { tips: string[] }) {
  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-base">Think like this role — coach</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          {tips.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function PageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {subtitle ? <p className="text-sm text-muted-foreground pt-1">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
