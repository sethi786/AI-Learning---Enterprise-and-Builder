/**
 * The product mark: an "E" tile. Promoted from the inline version in
 * AppSidebar so the site, the portal, and the favicon all render the same
 * shape. Built as markup because `public/` ships no image assets.
 */
export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div
      className="grid shrink-0 place-items-center rounded-md bg-primary font-black text-primary-foreground"
      style={{ height: size, width: size, fontSize: size * 0.55 }}
      aria-hidden
    >
      E
    </div>
  );
}

export function Wordmark({ size = 32, tagline }: { size?: number; tagline?: string }) {
  return (
    <span className="flex items-center gap-2">
      <Logo size={size} />
      <span className="flex flex-col leading-tight">
        <span className="text-sm font-semibold">EAI Career Sim</span>
        {tagline ? <span className="text-[11px] text-muted-foreground">{tagline}</span> : null}
      </span>
    </span>
  );
}
