import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  ClipboardCheck,
  FlaskConical,
  GraduationCap,
  ShieldAlert,
  Workflow,
} from "lucide-react";

import { BrowserFrame } from "@/components/site/BrowserFrame";
import { PathCard } from "@/components/site/PathCard";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { livePaths, paths } from "@/content/paths";
import { labs } from "@/content/labs";
import { labBlueprints } from "@/content/labEngine";
import { goNoGoCases } from "@/content/goNoGo";
import { scenarios } from "@/content/scenarios";

export const Route = createFileRoute("/_site/")({
  head: () => ({
    meta: [
      { title: "EAI Career Sim — Learn enterprise AI by doing the work" },
      {
        name: "description",
        content:
          "Hands-on training for the roles that make enterprise AI safe: platform admin, solution architect, security architect, and AI governance. Run real incidents in a simulator, not a slide deck.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <Flagship />
      <Paths />
      <Audiences />
      <Faq />
      <FinalCta />
    </>
  );
}

function Hero() {
  // Counted from the content modules so these can't drift into fiction.
  const stats = [
    { value: labBlueprints.length + goNoGoCases.length, label: "Runnable simulators" },
    { value: scenarios.length, label: "Decision scenarios" },
    { value: labs.reduce((n, l) => n + l.modules.length, 0), label: "Lab modules" },
    { value: livePaths.length, label: "Career paths" },
  ];
  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="surface-dark-grid absolute inset-0" aria-hidden />
      <div className="brand-radial absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 pt-20 pb-16 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-2xs tracking-widest text-white/70 uppercase">
            Enterprise AI career training
          </span>
          <h1 className="mt-6 text-display-sm text-balance text-white md:text-display lg:text-display-lg">
            Learn enterprise AI by doing the work
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-pretty text-white/70">
            Most courses teach you to write prompts. This one puts you in the chair: configure the
            platform, watch a prompt injection reach a tool call, contain it, redesign the
            architecture, and defend the decision in review.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 bg-white px-8 text-base text-slate-900 hover:bg-white/90"
            >
              <Link to="/app">
                Start learning free <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="h-12 border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
            >
              <Link to="/paths">Browse career paths</Link>
            </Button>
          </div>
          <p className="mt-5 text-sm text-white/50">
            Free account, Google or email. Your work is saved so you can export it as evidence.
          </p>
        </div>

        <div className="relative mx-auto mt-14 max-w-5xl">
          <BrowserFrame
            src="/shots/simulator.png"
            alt="The RAG and ticket-agent simulator: an architecture canvas with identity, retrieval and agent nodes beside a live system-posture panel listing missing controls."
            label="eai-career-sim.app/app/scenarios/rag-ticket-agent"
            priority
          />
        </div>

        <dl className="mx-auto mt-14 grid max-w-4xl grid-cols-2 gap-px overflow-hidden rounded-xl border border-white/10 bg-white/10 sm:grid-cols-4">
          {stats.map((s) => (
            // dt IS the label rather than a hidden copy of it — the sr-only
            // version meant every figure was announced with its label twice.
            <div key={s.label} className="surface-dark flex flex-col-reverse px-4 py-6 text-center">
              <dt className="mt-1 text-xs text-white/55">{s.label}</dt>
              <dd className="text-3xl font-semibold tabular-nums text-white">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

const features = [
  {
    icon: ShieldAlert,
    title: "Run a real incident",
    body: "A poisoned document reaches your RAG index and the agent emails a salary review to all-hands. Sixteen stages: diagnose it, contain it, redesign the architecture, then answer for it at review.",
    to: "/app/scenarios/rag-ticket-agent",
    cta: "Open the simulator",
    shot: "/shots/scenario.png",
    alt: "A scenario step asking which reviewers must engage, with graded options.",
  },
  {
    icon: FlaskConical,
    title: "Configure, then get attacked",
    body: "The lab engine scores the system you actually built. Set chunking, ACLs and guardrails, start the run, and watch injected failures find every gap you left open.",
    to: "/app/lab-engine",
    cta: "Open the lab engine",
    shot: "/shots/lab-engine.png",
    alt: "The lab engine configuration panel beside a live rubric preview showing which controls pass and fail.",
  },
  {
    icon: ClipboardCheck,
    title: "Produce the paperwork",
    body: "Security assessments, privacy impact assessments, threat models, go/no-go memos — drafted from your own decisions, in the shape a real review board expects.",
    to: "/app/artifacts",
    cta: "Open the builder",
    shot: "/shots/artifacts.png",
    alt: "The artifact builder with a security assessment form and its live markdown output.",
  },
  {
    icon: Workflow,
    title: "Track what you can actually do",
    body: "Every lesson, quiz and scenario feeds a competency ladder — introduced, practised, demonstrated, mastered. Mastery decays if you stop practising, because real skill does.",
    to: "/app/competencies",
    cta: "See the heatmap",
    shot: "/shots/competencies.png",
    alt: "The competency heatmap showing progression across platform, security, architecture and governance domains.",
  },
] as const;

function HowItWorks() {
  return (
    <section className="border-b py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-12">
          {/* Asymmetric: sticky thesis on the left, evidence on the right. */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2 className="text-3xl font-semibold text-balance md:text-4xl">
                Practice the job, not the vocabulary
              </h2>
              <p className="mt-4 max-w-sm text-pretty text-foreground/70">
                Every surface is interactive and scored. Nothing here is a video, and nothing is
                graded on whether you read the page.
              </p>
              <Button asChild variant="outline" className="mt-6">
                <Link to="/app">Open the portal</Link>
              </Button>
            </div>
          </div>

          <div className="space-y-16 lg:col-span-8">
            {features.map((f) => (
              <div key={f.title}>
                <div className="flex items-start gap-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-brand/25 bg-brand/10">
                    <f.icon className="h-5 w-5 text-brand" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold">{f.title}</h3>
                    <p className="mt-2 max-w-xl leading-relaxed text-foreground/70">{f.body}</p>
                    <Link
                      to={f.to}
                      className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline"
                    >
                      {f.cta} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
                <div className="mt-6 overflow-hidden rounded-xl border bg-slate-950/5 p-2 shadow-card">
                  <img
                    src={f.shot}
                    alt={f.alt}
                    width={2880}
                    height={1800}
                    loading="lazy"
                    decoding="async"
                    className="block aspect-[8/5] w-full rounded-lg border object-cover object-top"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Flagship() {
  const points = [
    "Place identity, retrieval, agent and network components on a canvas — missing ones become architecture flags that block progress.",
    "Watch the injection land in the logs: a retrieved chunk carries an instruction, and the agent requests a tool call.",
    "Contain it, then redesign. Your fix is re-evaluated against the attack — the engine accepts two valid architectures, not one memorised answer.",
    "Defend it in a security assessment review whose questions are generated from your own configuration.",
  ];
  return (
    <section className="surface-dark relative overflow-hidden border-b py-20 md:py-28">
      <div className="surface-dark-grid absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4">
        <span className="font-mono text-2xs tracking-widest text-brand uppercase">
          The flagship simulation
        </span>
        <h2 className="mt-4 max-w-2xl text-3xl font-semibold text-balance text-white md:text-4xl">
          One hour, one incident, and a score you have to earn
        </h2>
        <ol className="mt-10 space-y-6">
          {points.map((p, i) => (
            <li key={p} className="flex gap-4">
              <span className="grid size-7 shrink-0 place-items-center rounded-full border border-white/20 font-mono text-xs text-white/70">
                {i + 1}
              </span>
              <p className="max-w-2xl leading-relaxed text-white/70">{p}</p>
            </li>
          ))}
        </ol>
        <Button asChild size="lg" className="mt-10 bg-white text-slate-900 hover:bg-white/90">
          <Link to="/app/scenarios/rag-ticket-agent">
            Run the simulation <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function Paths() {
  return (
    <section className="border-b py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold text-balance md:text-4xl">Pick a career path</h2>
            <p className="mt-4 text-pretty text-foreground/70">
              Each path is an ordered route through roles, labs and scenarios — built around what
              the job actually asks of you, not a syllabus.
            </p>
          </div>
          <Button asChild variant="outline">
            <Link to="/paths">See all paths</Link>
          </Button>
        </div>
        <div className="mt-10 grid auto-rows-fr gap-5 md:grid-cols-2 lg:grid-cols-3">
          {paths.slice(0, 6).map((p) => (
            <PathCard key={p.id} path={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

const audiences = [
  {
    audience: "students",
    icon: GraduationCap,
    title: "Students",
    body: "Graduate knowing what an enterprise actually asks of an AI hire — and with artifacts you can put in front of an interviewer.",
  },
  {
    audience: "career-changers",
    icon: ArrowRight,
    title: "Career changers",
    body: "Already technical, new to AI? Start from the role you want and work backwards to the skills that role depends on.",
  },
  {
    audience: "professionals",
    icon: ShieldAlert,
    title: "Professionals",
    body: "Architects, security and GRC leads who have just been handed AI systems they did not design, and need the depth quickly.",
  },
] as const;

function Audiences() {
  return (
    <section className="border-b bg-slate-50 py-20 md:py-24">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-3xl font-semibold text-balance md:text-4xl">
          Built for three kinds of learner
        </h2>
        <div className="mt-12 grid auto-rows-fr gap-5 md:grid-cols-3">
          {audiences.map((a) => (
            <Link
              key={a.title}
              to="/for/$audience"
              params={{ audience: a.audience }}
              className="group"
            >
              <Card className="lift h-full shadow-card group-hover:border-brand/50">
                <CardHeader>
                  <a.icon className="mb-3 h-6 w-6 text-brand" />
                  <h3 className="text-lg font-semibold">{a.title}</h3>
                  <CardDescription className="pt-1.5 leading-relaxed">{a.body}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    q: "Do I need an account?",
    a: "No. Every lesson, lab, scenario and simulator is open — there is no sign-up wall. Progress saves in your browser. Signing in only adds syncing across devices.",
  },
  {
    q: "Is this for beginners or practitioners?",
    a: "Both, though it assumes general technical literacy. Every lesson is written in three tiers — a plain explanation, the enterprise context, and a technical deep dive — so you can enter at your level and go deeper when you want to.",
  },
  {
    q: "How are the scenarios graded?",
    a: "Deterministically. The engines model real system state, so the same decisions always produce the same outcome and you can retry and see exactly what changed. The flagship grades across eight dimensions, and it re-runs the attack against your remediation — you only score on architecture if your fix actually works.",
  },
  {
    q: "Is any of this connected to real systems?",
    a: "No. Everything is simulated. No real credentials, client data or approvals are involved, and every artifact you generate is marked as practice material.",
  },
] as const;

function Faq() {
  return (
    <section className="border-b py-20 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <h2 className="text-center text-3xl font-semibold text-balance md:text-4xl">
          Questions people ask first
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {faqs.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="text-left text-base">{f.q}</AccordionTrigger>
              <AccordionContent className="max-w-[68ch] leading-relaxed text-foreground/70">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className="surface-dark relative overflow-hidden">
      <div className="brand-radial absolute inset-0" aria-hidden />
      <div className="relative mx-auto max-w-4xl px-4 py-24 text-center">
        <h2 className="text-3xl font-semibold text-balance text-white md:text-4xl">
          Start with the incident
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-pretty text-white/70">
          The RAG and ticket-agent simulation is the fastest way to find out whether this is for
          you. It takes about an hour, and it does not go easy on you.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="h-12 bg-white px-8 text-base text-slate-900 hover:bg-white/90"
          >
            <Link to="/app/scenarios/rag-ticket-agent">
              Run the simulation <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="h-12 border-white/25 bg-transparent px-8 text-base text-white hover:bg-white/10 hover:text-white"
          >
            <Link to="/app">Go to the portal</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
