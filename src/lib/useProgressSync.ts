import { useEffect, useRef } from "react";

import { getMyProgress, saveMyProgress } from "./learnerProgress.functions";
import { mergeProgress } from "./progressMerge";
import { progress, useProgress, type ProgressState } from "./progress";
import { useSession } from "./session";

const PUSH_DEBOUNCE_MS = 2000;

/**
 * Mirrors local progress to Supabase for signed-in learners.
 *
 * Design constraints this respects:
 *  - Anonymous practice must keep working with no network at all, so every
 *    path here is a no-op when signed out.
 *  - Neither side is authoritative. On sign-in the two snapshots are merged
 *    (see `mergeProgress`), so practising signed-out then signing in never
 *    discards work.
 *  - Failures are non-fatal. If the table is missing or the request fails,
 *    the learner keeps their local progress and simply doesn't sync; the
 *    alternative — surfacing an error over a lab — is worse.
 */
export function useProgressSync() {
  const { user, loading } = useSession();
  const state = useProgress();
  const pulled = useRef<string | null>(null);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPushed = useRef<string>("");

  // Pull once per signed-in user, merge, then write the merged result back.
  useEffect(() => {
    if (loading || !user) return;
    if (pulled.current === user.id) return;
    pulled.current = user.id;

    let cancelled = false;
    void (async () => {
      try {
        const row = await getMyProgress();
        if (cancelled) return;
        const local = progress.snapshot();
        const remote = row?.state as ProgressState | undefined;
        const merged = remote ? mergeProgress(local, remote) : local;
        progress.replaceAll(merged);
        lastPushed.current = JSON.stringify(merged);
        await saveMyProgress({ data: { state: merged as unknown as Record<string, unknown> } });
      } catch (err) {
        // Sync is best-effort; local progress is unaffected.
        console.warn("[progress-sync] pull failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  // Push local changes, debounced so a burst of quiz answers is one request.
  useEffect(() => {
    if (loading || !user || pulled.current !== user.id) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastPushed.current) return;

    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      lastPushed.current = serialized;
      void saveMyProgress({
        data: { state: state as unknown as Record<string, unknown> },
      }).catch((err) => console.warn("[progress-sync] push failed", err));
    }, PUSH_DEBOUNCE_MS);

    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [state, user, loading]);

  // Signing out clears the guard so the next sign-in pulls again.
  useEffect(() => {
    if (!loading && !user) {
      pulled.current = null;
      lastPushed.current = "";
    }
  }, [user, loading]);
}
