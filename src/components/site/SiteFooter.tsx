import { Link } from "@tanstack/react-router";

import { Logo } from "./Logo";

export function SiteFooter() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-3">
            <span className="flex items-center gap-2">
              <Logo size={28} />
              <span className="text-sm font-semibold">EAI Career Sim</span>
            </span>
            <p className="max-w-xs text-sm text-muted-foreground">
              Learn to architect, secure, and govern enterprise AI by doing the work, not watching
              it.
            </p>
          </div>

          <FooterGroup title="Learn">
            <FooterLink to="/paths">Career paths</FooterLink>
            <FooterLink to="/app/learn/role">Browse by role</FooterLink>
            <FooterLink to="/app/learn/scenario">Scenarios</FooterLink>
            <FooterLink to="/app/lab-engine">Lab engine</FooterLink>
          </FooterGroup>

          <FooterGroup title="Audiences">
            <FooterLink to="/for/students">Students</FooterLink>
            <FooterLink to="/for/career-changers">Career changers</FooterLink>
            <FooterLink to="/for/professionals">Professionals</FooterLink>
          </FooterGroup>

          <FooterGroup title="Product">
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/app">Open the portal</FooterLink>
            <FooterLink to="/auth">Sign in</FooterLink>
          </FooterGroup>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Training simulator. No real client data, no real approvals.</p>
          <p>Practice artifacts are for learning only.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="space-y-2">{children}</ul>
    </div>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <li>
      <Link
        to={to}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {children}
      </Link>
    </li>
  );
}
