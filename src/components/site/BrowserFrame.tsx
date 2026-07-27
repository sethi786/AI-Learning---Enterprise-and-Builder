/**
 * Chrome around a product screenshot. Screenshots sitting raw on a page read
 * as clip-art; a frame reads as software.
 */
export function BrowserFrame({
  src,
  alt,
  label,
  className = "",
  priority = false,
}: {
  src: string;
  alt: string;
  label?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <figure
      className={`overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 shadow-[0_24px_80px_-24px_rgb(2_6_23_/_0.65)] backdrop-blur ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-rose-400/70" />
          <span className="size-2.5 rounded-full bg-amber-400/70" />
          <span className="size-2.5 rounded-full bg-emerald-400/70" />
        </span>
        {label ? (
          <span className="ml-2 truncate font-mono text-2xs text-white/45">{label}</span>
        ) : null}
      </div>
      {/* Intrinsic size reserves layout space so a lazily-loaded shot doesn't
          collapse to a 2px sliver and shift the page when it arrives. */}
      <img
        src={src}
        alt={alt}
        width={2880}
        height={1800}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className="block aspect-[8/5] w-full object-cover object-top"
      />
    </figure>
  );
}
