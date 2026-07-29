import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Briefcase, Eye, EyeOff, Search } from "lucide-react";

import { PageHeader } from "@/components/learning/Primitives";
import { Explained } from "@/components/learning/Explained";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { careerProfiles, type CareerProfile, type InterviewQuestion } from "@/content/careers";
import { rolesById } from "@/content/roles";

export const Route = createFileRoute("/app/careers")({
  head: () => ({
    meta: [
      { title: "The jobs, and how to get one" },
      {
        name: "description",
        content:
          "What each of these roles actually involves, which backgrounds transfer into it, how to read the job ad, and the questions the interview will ask.",
      },
    ],
  }),
  component: CareersPage,
});

function CareersPage() {
  const [openRole, setOpenRole] = useState<string>(careerProfiles[0].roleId);
  const profile = careerProfiles.find((c) => c.roleId === openRole)!;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title="The jobs, and how to get one"
        subtitle="These are real, advertised roles. Most people who could do them do not know they exist, or assume they are unqualified. This is what each one involves, what background transfers in, and what the interview actually asks."
        right={
          <Badge variant="outline" className="gap-1">
            <Briefcase className="h-3.5 w-3.5" /> {careerProfiles.length} roles
          </Badge>
        }
      />

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm leading-relaxed text-muted-foreground">
          Two things this page deliberately leaves out. It does not quote salaries — they vary by
          country, city and sector by multiples, and a confident wrong number sends you into a
          negotiation badly informed. Search the titles below on a local job board and read five
          real adverts instead. And it does not promise outcomes: practice is not experience, and
          nothing here is a guarantee of getting hired.
        </CardContent>
      </Card>

      {/* Entry-level roles are separated and put first, because the people who
          most need this platform are the ones who assume every role on it is
          closed to them. Burying them in one flat list loses exactly those
          readers. */}
      <div className="space-y-3">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            No prior technology career needed
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {careerProfiles
              .filter((c) => c.entryLevel)
              .map((c) => (
                <Button
                  key={c.roleId}
                  size="sm"
                  variant={openRole === c.roleId ? "default" : "outline"}
                  onClick={() => setOpenRole(c.roleId)}
                >
                  {rolesById[c.roleId]?.name ?? c.title ?? c.roleId}
                </Button>
              ))}
          </div>
        </div>
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Building on an existing technology or risk career
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {careerProfiles
              .filter((c) => !c.entryLevel)
              .map((c) => (
                <Button
                  key={c.roleId}
                  size="sm"
                  variant={openRole === c.roleId ? "default" : "outline"}
                  onClick={() => setOpenRole(c.roleId)}
                >
                  {rolesById[c.roleId]?.name ?? c.title ?? c.roleId}
                </Button>
              ))}
          </div>
        </div>
      </div>

      <RoleDetail profile={profile} />
    </div>
  );
}

function RoleDetail({ profile }: { profile: CareerProfile }) {
  const role = rolesById[profile.roleId];
  return (
    <div className="space-y-5">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">What the job actually is</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Explained text={profile.whatTheJobIs} className="block leading-relaxed" />
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <Search className="h-3.5 w-3.5" /> Search these titles
            </div>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              Searching the wrong words finds nothing. This role is advertised as:{" "}
              {profile.alsoAdvertisedAs.join(" · ")}.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">A day in it</CardTitle>
            <CardDescription>More conversation than most people expect.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {profile.typicalDay.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">First ninety days</CardTitle>
            <CardDescription>What you would be judged on.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {profile.firstNinetyDays.map((d) => (
                <li key={d} className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  <span>{d}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand/40 bg-brand/5">
        <CardHeader>
          <CardTitle className="text-base">Could you already do this?</CardTitle>
          <CardDescription>
            Backgrounds that genuinely transfer, and why. Most people underestimate how much of this
            they already have.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.transfersFrom.map((t) => (
            <div key={t.from} className="rounded-md border bg-background p-3">
              <div className="font-medium">{t.from}</div>
              <Explained
                text={t.why}
                className="mt-1 block leading-relaxed text-muted-foreground"
              />
            </div>
          ))}
          <div className="rounded-md bg-background/60 p-3">
            <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Honest about the bar
            </div>
            <Explained
              text={profile.entryReality}
              className="mt-1 block leading-relaxed text-muted-foreground"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Decoding the job advert</CardTitle>
          <CardDescription>What the phrase in the listing is really asking for.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {profile.decodeTheAd.map((d) => (
            <div key={d.phrase} className="rounded-md border p-3">
              <div className="font-medium italic">“{d.phrase}”</div>
              <Explained
                text={d.means}
                className="mt-1 block leading-relaxed text-muted-foreground"
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Seniority</CardTitle>
          <CardDescription>
            What separates the bands, in behaviour rather than years.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {profile.seniority.map((s) => (
            <div
              key={s.band}
              className="flex flex-col gap-1 rounded-md border p-3 sm:flex-row sm:gap-4"
            >
              <span className="w-40 shrink-0 font-medium">{s.band}</span>
              <span className="leading-relaxed text-muted-foreground">{s.looksLike}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <section>
        <h2 className="text-lg font-bold tracking-tight">Interview practice</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Answer out loud before you reveal anything. Reading a model answer feels like learning and
          is not — the gap between knowing a point and being able to say it under pressure is the
          entire thing being tested.
        </p>
        <div className="mt-4 space-y-3">
          {profile.interview.map((q) => (
            <InterviewCard key={q.id} q={q} />
          ))}
        </div>
      </section>

      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <span className="text-sm text-muted-foreground">
            Practise the work this role does, then export it as evidence.
          </span>
          <div className="flex gap-2">
            {profile.labId ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/app/labs/$labId" params={{ labId: profile.labId }}>
                  Open the lab
                </Link>
              </Button>
            ) : null}
            {role ? (
              <Button asChild size="sm" variant="outline">
                <Link to="/app/roles/$roleId" params={{ roleId: profile.roleId }}>
                  Role detail
                </Link>
              </Button>
            ) : null}
            <Button asChild size="sm" className="gap-1">
              <Link to="/app/portfolio">
                My practice record <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InterviewCard({ q }: { q: InterviewQuestion }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base leading-snug">“{q.question}”</CardTitle>
          <Badge variant="outline" className="shrink-0 text-[10px] capitalize">
            {q.difficulty}
          </Badge>
        </div>
        <CardDescription className="pt-1">
          <span className="font-medium text-foreground">What they are really testing: </span>
          {q.testing}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          size="sm"
          variant={revealed ? "ghost" : "default"}
          onClick={() => setRevealed((v) => !v)}
          className="gap-1"
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {revealed ? "Hide" : "I have answered — show me what a strong answer covers"}
        </Button>
        {revealed ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-md border border-emerald-500/40 bg-emerald-500/5 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                A strong answer covers
              </div>
              <ul className="mt-2 space-y-1.5">
                {q.strongAnswer.map((a) => (
                  <li key={a} className="flex gap-2 leading-relaxed">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-600" />
                    <Explained text={a} />
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-3">
              <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                The answer that sounds fine and fails
              </div>
              <Explained text={q.weakAnswer} className="mt-1.5 block leading-relaxed" />
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
