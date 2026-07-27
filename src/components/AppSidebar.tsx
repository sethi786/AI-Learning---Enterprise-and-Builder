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

// `link` carries typed router options so every destination is compile-checked.
// Note the lab entries: there is no `/labs/rag` route — only `labs.$labId` — so
// they must be expressed as a param, not a pre-joined string.
type Item = {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  link: LinkProps;
};

const lab = (labId: string) => linkOptions({ to: "/labs/$labId", params: { labId } });

const overview: Item[] = [
  { title: "Home Dashboard", icon: LayoutDashboard, link: linkOptions({ to: "/" }) },
  { title: "Career Path Map", icon: Map, link: linkOptions({ to: "/career-path" }) },
  { title: "Competency Heatmap", icon: Activity, link: linkOptions({ to: "/competencies" }) },
];

const learn: Item[] = [
  { title: "Learn by Role", icon: Users, link: linkOptions({ to: "/learn/role" }) },
  { title: "Learn by Platform", icon: Boxes, link: linkOptions({ to: "/learn/platform" }) },
  { title: "Learn by Scenario", icon: ClipboardList, link: linkOptions({ to: "/learn/scenario" }) },
];

const simulators: Item[] = [
  {
    title: "RAG + Ticket Agent (vertical slice)",
    icon: Zap,
    link: linkOptions({ to: "/scenarios/rag-ticket-agent" }),
  },
  {
    title: "SaaS AI Onboarding",
    icon: Cloud,
    link: linkOptions({ to: "/simulators/saas-onboarding" }),
  },
  { title: "In-House AI App", icon: Server, link: linkOptions({ to: "/simulators/in-house-app" }) },
  { title: "AI Lab → Prod", icon: FlaskConical, link: linkOptions({ to: "/simulators/env" }) },
  { title: "Go / No-Go", icon: CheckCircle2, link: linkOptions({ to: "/simulators/go-no-go" }) },
  { title: "Lab Engine", icon: Zap, link: linkOptions({ to: "/lab-engine" }) },
];

const labs: Item[] = [
  { title: "RAG Architecture", icon: Database, link: lab("rag") },
  { title: "Agent Security", icon: Bot, link: lab("agent") },
  { title: "Connector Security", icon: Plug, link: lab("connector") },
  { title: "Zero Trust AI", icon: ShieldCheck, link: lab("zero-trust") },
  { title: "Privacy / PIA", icon: Lock, link: lab("privacy") },
  { title: "Legal / OGC", icon: Scale, link: lab("legal") },
  { title: "QRM / Risk", icon: AlertTriangle, link: lab("qrm") },
  { title: "Data Governance", icon: FolderTree, link: lab("data-governance") },
  { title: "IAM / Identity", icon: KeyRound, link: lab("iam") },
  { title: "DevSecOps / SSDLC", icon: GitBranch, link: lab("devsecops") },
  { title: "AI Engineering", icon: Cpu, link: lab("ai-engineering") },
];

const practice: Item[] = [
  { title: "Flashcards", icon: Flame, link: linkOptions({ to: "/flashcards" }) },
  { title: "Practice Exams", icon: GraduationCap, link: linkOptions({ to: "/exams" }) },
  { title: "Artifact Builder", icon: FileCog, link: linkOptions({ to: "/artifacts" }) },
  { title: "My Learning Notes", icon: NotebookPen, link: linkOptions({ to: "/notes" }) },
  { title: "My Runs (cloud)", icon: History, link: linkOptions({ to: "/my-runs" }) },
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
            const active =
              href === "/"
                ? currentPath === "/"
                : currentPath === href || currentPath.startsWith(href + "/");
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link {...item.link} className="flex items-center gap-2">
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
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
        <Link to="/" className="flex items-center gap-2 px-2 py-3">
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
      </SidebarContent>
      <SidebarFooter>
        <AccountBlock />
      </SidebarFooter>
    </Sidebar>
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
