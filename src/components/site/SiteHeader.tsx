import { Link, linkOptions } from "@tanstack/react-router";
import { Menu } from "lucide-react";

import { Wordmark } from "./Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

// `/for/$audience` is a single dynamic route, so audience links carry a param
// rather than a pre-joined path.
const nav = [
  { label: "Career paths", link: linkOptions({ to: "/paths" }) },
  {
    label: "For students",
    link: linkOptions({ to: "/for/$audience", params: { audience: "students" } }),
  },
  {
    label: "For professionals",
    link: linkOptions({ to: "/for/$audience", params: { audience: "professionals" } }),
  },
  { label: "About", link: linkOptions({ to: "/about" }) },
] as const;

export function SiteHeader() {
  return (
    // Matches the portal header treatment so the two shells feel continuous.
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center">
          <Wordmark />
        </Link>

        <nav className="hidden flex-1 items-center gap-1 md:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              {...item.link}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              activeProps={{ className: "text-foreground font-medium" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/app">Start learning</Link>
          </Button>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <nav className="mt-8 flex flex-col gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.label}
                    {...item.link}
                    className="rounded-md px-3 py-2 text-sm hover:bg-accent"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link to="/auth" className="rounded-md px-3 py-2 text-sm hover:bg-accent">
                  Sign in
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
