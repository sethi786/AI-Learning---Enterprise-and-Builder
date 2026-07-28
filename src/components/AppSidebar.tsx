import {
  Link,
  useRouter,
  useRouterState,
  useNavigate,
  linkOptions,
  type LinkProps,
} from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  Users,
  Boxes,
  ClipboardList,
  Cloud,
  Server,
  Database,
  Bot,
  Plug,
  ShieldCheck,
  Lock,
  Scale,
  AlertTriangle,
  FolderTree,
  KeyRound,
  GitBranch,
  Cpu,
  FlaskConical,
  CheckCircle2,
  Flame,
  GraduationCap,
  FileCog,
  NotebookPen,
  Activity,
  Zap,
  History,
  LogIn,
  LogOut,
  Compass,
  BookOpen,
  Briefcase,
  FileText,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSession, signOut } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { LEVELS, prefs, usePrefs } from "@/lib/prefs";

// `link` carries typed router options so every destination is compile-checked.
// Note the lab entries: there is no `/labs/rag` route — only `labs.$labId` — so
// they must be expressed as a param, not a pre-joined string.
type Item = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  link: LinkProps;
};

const lab = (labId: string): Item["link"] =>
  linkOptions({ to: "/app/labs/$labId", params: { labId } });

const labItem = (title: string, icon: Item["icon"], labId: string): Item => ({
  title,
  icon,
  link: lab(labId),
});

const overview: Item[] = [
  { title: "Start here", icon: Compass, link: linkOptions({ to: "/app/start" }) },
  { title: "Home Dashboard", icon: LayoutDashboard, link: linkOptions({ to: "/app" }) },
  { title: "Career Path Map", icon: Map, link: linkOptions({ to: "/app/career-path" }) },
  { title: "Competency Heatmap", icon: Activity, link: linkOptions({ to: "/app/competencies" }) },
  { title: "Plain-English glossary", icon: BookOpen, link: linkOptions({ to: "/app/glossary" }) },
];

const learn: Item[] = [
  { title: "Learn by Role", icon: Users, link: linkOptions({ to: "/app/learn/role" }) },
  { title: "Learn by Platform", icon: Boxes, link: linkOptions({ to: "/app/learn/platform" }) },
  {
    title: "Learn by Scenario",
    icon: ClipboardList,
    link: linkOptions({ to: "/app/learn/scenario" }),
  },
];

const simulators: Item[] = [
  {
    title: "RAG + Ticket Agent (vertical slice)",
    icon: Zap,
    link: linkOptions({ to: "/app/scenarios/rag-ticket-agent" }),
  },
  {
    title: "SaaS AI Onboarding",
    icon: Cloud,
    link: linkOptions({ to: "/app/simulators/saas-onboarding" }),
  },
  {
    title: "In-House AI App",
    icon: Server,
    link: linkOptions({ to: "/app/simulators/in-house-app" }),
  },
  { title: "AI Lab → Prod", icon: FlaskConical, link: linkOptions({ to: "/app/simulators/env" }) },
  {
    title: "Go / No-Go",
    icon: CheckCircle2,
    link: linkOptions({ to: "/app/simulators/go-no-go" }),
  },
  { title: "Lab Engine", icon: Zap, link: linkOptions({ to: "/app/lab-engine" }) },
];

const labs: Item[] = [
  labItem("RAG Architecture", Database, "rag"),
  labItem("Agent Security", Bot, "agent"),
  labItem("Connector Security", Plug, "connector"),
  labItem("Zero Trust AI", ShieldCheck, "zero-trust"),
  labItem("Privacy / PIA", Lock, "privacy"),
  labItem("Legal / OGC", Scale, "legal"),
  labItem("QRM / Risk", AlertTriangle, "qrm"),
  labItem("Data Governance", FolderTree, "data-governance"),
  labItem("IAM / Identity", KeyRound, "iam"),
  labItem("DevSecOps / SSDLC", GitBranch, "devsecops"),
  labItem("AI Engineering", Cpu, "ai-engineering"),
];

const career: Item[] = [
  {
    title: "The jobs, and how to get one",
    icon: Briefcase,
    link: linkOptions({ to: "/app/careers" }),
  },
  { title: "My practice record", icon: FileText, link: linkOptions({ to: "/app/portfolio" }) },
];

const practice: Item[] = [
  { title: "Flashcards", icon: Flame, link: linkOptions({ to: "/app/flashcards" }) },
  { title: "Practice Exams", icon: GraduationCap, link: linkOptions({ to: "/app/exams" }) },
  { title: "Artifact Builder", icon: FileCog, link: linkOptions({ to: "/app/artifacts" }) },
  { title: "My Learning Notes", icon: NotebookPen, link: linkOptions({ to: "/app/notes" }) },
  { title: "My Runs (cloud)", icon: History, link: linkOptions({ to: "/app/my-runs" }) },
];

function Group({
  label,
  items,
  currentPath,
}: {
  label: string;
  items: Item[];
  currentPath: string;
}) {
  const router = useRouter();
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            // Resolve params into a real pathname; comparing against a raw `to`
            // would never match for routes carrying a `$param`.
            const href = router.buildLocation(item.link).pathname;
            // `/app` is a prefix of every other portal route, so it only counts
            // as active on an exact match.
            const active =
              href === "/app"
                ? currentPath === "/app" || currentPath === "/app/"
                : currentPath === href || currentPath.startsWith(href + "/");
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link {...item.link} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span className="flex-1 truncate">{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const currentPath = useRouterState({ select: (r) => r.location.pathname });
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link to="/app" className="flex items-center gap-2 px-2 py-3">
          <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-black">
            E
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold">EAI Career Sim</span>
            <span className="text-[11px] text-muted-foreground">Learning simulator</span>
          </div>
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <Group label="Overview" items={overview} currentPath={currentPath} />
        <Group label="Learn by" items={learn} currentPath={currentPath} />
        <Group label="Simulators" items={simulators} currentPath={currentPath} />
        <Group label="Labs" items={labs} currentPath={currentPath} />
        <Group label="Practice" items={practice} currentPath={currentPath} />
        <Group label="Getting hired" items={career} currentPath={currentPath} />
      </SidebarContent>
      <SidebarFooter>
        <LevelSwitcher />
        <AccountBlock />
      </SidebarFooter>
    </Sidebar>
  );
}

/**
 * Reading level, reachable from every page.
 *
 * Putting this only in orientation would mean a learner who picked "new" and
 * then found it patronising has to go back through a wizard to escape it. The
 * cost of switching has to be one click, or people put up with the wrong level
 * instead of changing it.
 */
function LevelSwitcher() {
  const { level } = usePrefs();
  return (
    <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
      <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        Explain things for
      </div>
      <div className="mt-1.5 flex gap-1">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            type="button"
            title={l.blurb}
            onClick={() => prefs.set({ level: l.id })}
            className={`flex-1 rounded border px-1.5 py-1 text-[10px] leading-tight transition-colors ${
              level === l.id
                ? "border-brand bg-brand/10 font-medium text-brand"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {l.id === "new" ? "Newcomer" : l.id === "working" ? "Working" : "Deep"}
          </button>
        ))}
      </div>
    </div>
  );
}

function AccountBlock() {
  const { user, loading } = useSession();
  const navigate = useNavigate();
  // Capture where the learner is so sign-in returns them here, rather than
  // dumping everyone on the home page.
  const here = useRouterState({ select: (r) => r.location.href });
  if (loading) return <div className="px-2 py-2 text-xs text-muted-foreground">…</div>;
  if (!user) {
    return (
      <div className="px-2 py-2">
        <Button
          size="sm"
          variant="outline"
          className="w-full"
          onClick={() => navigate({ to: "/auth", search: { next: here } })}
        >
          <LogIn className="mr-2 h-4 w-4" /> Sign in
        </Button>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="flex-1 truncate text-xs">
        <div className="truncate font-medium">{user.email}</div>
        <div className="text-[10px] text-muted-foreground">Signed in</div>
      </div>
      <Button size="icon" variant="ghost" onClick={() => void signOut()} title="Sign out">
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}
