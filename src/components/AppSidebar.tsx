import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
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

type Item = { title: string; url: string; icon: React.ComponentType<{ className?: string }> };

const overview: Item[] = [
  { title: "Home Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Career Path Map", url: "/career-path", icon: Map },
  { title: "Competency Heatmap", url: "/competencies", icon: Activity },
];

const learn: Item[] = [
  { title: "Learn by Role", url: "/learn/role", icon: Users },
  { title: "Learn by Platform", url: "/learn/platform", icon: Boxes },
  { title: "Learn by Scenario", url: "/learn/scenario", icon: ClipboardList },
];

const simulators: Item[] = [
  { title: "RAG + Ticket Agent (vertical slice)", url: "/scenarios/rag-ticket-agent", icon: Zap },
  { title: "SaaS AI Onboarding", url: "/simulators/saas-onboarding", icon: Cloud },
  { title: "In-House AI App", url: "/simulators/in-house-app", icon: Server },
  { title: "AI Lab → Prod", url: "/simulators/env", icon: FlaskConical },
  { title: "Go / No-Go", url: "/simulators/go-no-go", icon: CheckCircle2 },
  { title: "Lab Engine", url: "/lab-engine", icon: Zap },
];

const labs: Item[] = [
  { title: "RAG Architecture", url: "/labs/rag", icon: Database },
  { title: "Agent Security", url: "/labs/agent", icon: Bot },
  { title: "Connector Security", url: "/labs/connector", icon: Plug },
  { title: "Zero Trust AI", url: "/labs/zero-trust", icon: ShieldCheck },
  { title: "Privacy / PIA", url: "/labs/privacy", icon: Lock },
  { title: "Legal / OGC", url: "/labs/legal", icon: Scale },
  { title: "QRM / Risk", url: "/labs/qrm", icon: AlertTriangle },
  { title: "Data Governance", url: "/labs/data-governance", icon: FolderTree },
  { title: "IAM / Identity", url: "/labs/iam", icon: KeyRound },
  { title: "DevSecOps / SSDLC", url: "/labs/devsecops", icon: GitBranch },
  { title: "AI Engineering", url: "/labs/ai-engineering", icon: Cpu },
];

const practice: Item[] = [
  { title: "Flashcards", url: "/flashcards", icon: Flame },
  { title: "Practice Exams", url: "/exams", icon: GraduationCap },
  { title: "Artifact Builder", url: "/artifacts", icon: FileCog },
  { title: "My Learning Notes", url: "/notes", icon: NotebookPen },
  { title: "My Runs (cloud)", url: "/my-runs", icon: History },
];

function Group({ label, items, currentPath }: { label: string; items: Item[]; currentPath: string }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active =
              item.url === "/"
                ? currentPath === "/"
                : currentPath === item.url || currentPath.startsWith(item.url + "/");
            return (
              <SidebarMenuItem key={item.url}>
                <SidebarMenuButton asChild isActive={active}>
                  <Link to={item.url} className="flex items-center gap-2">
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
  if (loading) return <div className="px-2 py-2 text-xs text-muted-foreground">…</div>;
  if (!user) {
    return (
      <div className="px-2 py-2">
        <Button size="sm" variant="outline" className="w-full" onClick={() => navigate({ to: "/auth" })}>
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