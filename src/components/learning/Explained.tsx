import { Fragment, useMemo, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { glossaryLookup, type GlossaryTerm } from "@/content/glossary";

/**
 * Just-in-time vocabulary.
 *
 * The single largest barrier for a non-technical learner is not the concepts —
 * it is the twenty acronyms used before anyone defines one. A glossary page
 * does not fix that, because looking a word up means leaving the sentence you
 * did not understand and losing your place.
 *
 * So terms are marked in the prose itself and explained where they stand.
 *
 * Two rules keep this from becoming noise:
 *  - only the first occurrence of each term in a block is marked, so a
 *    paragraph about permissions is not a wall of dotted underlines;
 *  - matching is whole-word and case-sensitive for short acronyms, because
 *    "RAG" is a term and "ragged" is not.
 */

const SHORT_UPPER = /^[A-Z0-9/]{2,6}$/;

interface Match {
  start: number;
  end: number;
  term: GlossaryTerm;
}

function findMatches(text: string): Match[] {
  const taken: Match[] = [];
  const used = new Set<string>();

  const overlaps = (start: number, end: number) =>
    taken.some((m) => start < m.end && end > m.start);

  for (const { needle, term } of glossaryLookup) {
    if (used.has(term.id)) continue;
    // Acronyms match case-sensitively so "RAG" hits and "rag" in "ragged" does
    // not; ordinary words match case-insensitively so a sentence-initial
    // capital still resolves.
    const caseSensitive = SHORT_UPPER.test(needle);
    const flags = caseSensitive ? "g" : "gi";
    const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Leading guard rejects a hyphen so "trimmed" does not match inside
    // "permission-trimmed"; the trailing guard allows one so "tenant" still
    // matches in "tenant-isolated", which is how this prose actually reads.
    const re = new RegExp(`(^|[^\\w-])(${escaped})(?!\\w)`, flags);
    const m = re.exec(text);
    if (!m) continue;
    const start = m.index + m[1].length;
    const end = start + m[2].length;
    if (overlaps(start, end)) continue;
    taken.push({ start, end, term });
    used.add(term.id);
  }

  return taken.sort((a, b) => a.start - b.start);
}

/**
 * Wraps plain text, marking glossary terms. Takes a string rather than children
 * on purpose — walking a React tree to find text nodes would also rewrite text
 * inside code samples and diagrams, where an acronym is a literal, not a term.
 */
export function Explained({ text, className }: { text: string; className?: string }) {
  const parts = useMemo<ReactNode[]>(() => {
    const matches = findMatches(text);
    if (matches.length === 0) return [text];

    const out: ReactNode[] = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      if (m.start > cursor) out.push(text.slice(cursor, m.start));
      out.push(
        <TermPopover key={`${m.term.id}-${i}`} term={m.term} label={text.slice(m.start, m.end)} />,
      );
      cursor = m.end;
    });
    if (cursor < text.length) out.push(text.slice(cursor));
    return out;
  }, [text]);

  return (
    <span className={className}>
      {parts.map((p, i) => (
        <Fragment key={i}>{p}</Fragment>
      ))}
    </span>
  );
}

export function TermPopover({ term, label }: { term: GlossaryTerm; label: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          // Dotted underline rather than a link colour: this is an aside, and
          // colouring it like a link makes prose look like a sea of navigation.
          className="cursor-help underline decoration-brand/50 decoration-dotted decoration-1 underline-offset-4 hover:decoration-brand focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          aria-label={`What does ${label} mean?`}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 text-left" align="start">
        <div className="space-y-3">
          <div>
            <div className="text-sm font-semibold">{term.term}</div>
            <p className="mt-1 text-sm leading-relaxed">{term.plain}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-2.5">
            <div className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Why it matters
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{term.matters}</p>
          </div>
          {term.precise ? (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                The precise definition
              </summary>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{term.precise}</p>
            </details>
          ) : null}
          {term.seeAlso?.length ? (
            <div className="flex flex-wrap gap-2 border-t pt-2.5">
              {term.seeAlso.map((s) =>
                s.labId ? (
                  <Link
                    key={s.label}
                    to="/app/labs/$labId"
                    params={{ labId: s.labId }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline"
                  >
                    <BookOpen className="h-3 w-3" /> {s.label}
                  </Link>
                ) : null,
              )}
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  );
}
