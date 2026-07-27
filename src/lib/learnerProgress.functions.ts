import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Json } from "@/integrations/supabase/types";

/**
 * Cross-device mirror of the local progress store.
 *
 * The browser stays authoritative — these only read and write the whole blob
 * for a signed-in learner. Anonymous practice never touches the network.
 */

/**
 * `src/integrations/supabase/types.ts` is generated from the live database and
 * marked do-not-edit, so it won't know about `learner_progress` until the
 * migration in supabase/migrations has been applied and types regenerated.
 * This narrow escape hatch keeps the rest of the file fully typed.
 */
type UntypedTable = {
  from: (table: string) => {
    select: (cols: string) => {
      eq: (
        col: string,
        val: string,
      ) => { maybeSingle: () => Promise<{ data: unknown; error: { message: string } | null }> };
    };
    upsert: (
      row: Record<string, unknown>,
      opts: { onConflict: string },
    ) => Promise<{ error: { message: string } | null }>;
  };
};

export const getMyProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await (supabase as unknown as UntypedTable)
      .from("learner_progress")
      .select("state, updated_at")
      .eq("user_id", userId)
      .maybeSingle();
    // A missing row is the normal first-run case, not a failure.
    if (error) throw new Error(error.message);
    return (data ?? null) as { state: Json; updated_at: string } | null;
  });

export const saveMyProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ state: z.record(z.string(), z.any()) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await (supabase as unknown as UntypedTable)
      .from("learner_progress")
      .upsert(
        { user_id: userId, state: data.state as Json, updated_at: new Date().toISOString() },
        { onConflict: "user_id" },
      );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
