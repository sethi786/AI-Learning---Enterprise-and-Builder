import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const EventKind = z.enum([
  "stage_enter","config_change","architecture_change","command","injection_fired",
  "diagnosis","containment","remediation","evaluation","artifact","sar_answer","decision","note",
]);

export const startScenarioRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      scenarioId: z.string(),
      scenarioVersion: z.string().default("v1"),
      state: z.record(z.string(), z.any()).default({}),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("scenario_runs")
      .insert({
        user_id: userId,
        scenario_id: data.scenarioId,
        scenario_version: data.scenarioVersion,
        state: data.state,
      })
      .select("id, started_at")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const appendScenarioEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      runId: z.string().uuid(),
      kind: EventKind,
      stage: z.string().optional(),
      severity: z.enum(["info", "warn", "error", "critical"]).default("info"),
      payload: z.record(z.string(), z.any()).default({}),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase.from("scenario_events").insert({
      run_id: data.runId,
      user_id: userId,
      kind: data.kind,
      stage: data.stage ?? null,
      severity: data.severity,
      payload: data.payload,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const updateScenarioRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      runId: z.string().uuid(),
      currentStage: z.string().optional(),
      state: z.record(z.string(), z.any()).optional(),
      competencies: z.record(z.string(), z.any()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const patch: {
      current_stage?: string;
      state?: Json;
      competencies?: Json;
    } = {};
    if (data.currentStage !== undefined) patch.current_stage = data.currentStage;
    if (data.state !== undefined) patch.state = data.state as Json;
    if (data.competencies !== undefined) patch.competencies = data.competencies as Json;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await supabase
      .from("scenario_runs")
      .update(patch)
      .eq("id", data.runId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const finishScenarioRun = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({
      runId: z.string().uuid(),
      status: z.enum(["passed", "failed", "abandoned"]),
      score: z.number().nullable().optional(),
      maxScore: z.number().nullable().optional(),
      competencies: z.record(z.string(), z.any()).optional(),
    }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("scenario_runs")
      .update({
        status: data.status,
        score: data.score ?? null,
        max_score: data.maxScore ?? null,
        finished_at: new Date().toISOString(),
        ...(data.competencies ? { competencies: data.competencies } : {}),
      })
      .eq("id", data.runId)
      .eq("user_id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listMyScenarioRuns = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("scenario_runs")
      .select("id, scenario_id, scenario_version, status, current_stage, score, max_score, started_at, finished_at")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getScenarioRunWithEvents = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ runId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [run, events] = await Promise.all([
      supabase.from("scenario_runs").select("*").eq("id", data.runId).maybeSingle(),
      supabase
        .from("scenario_events")
        .select("id, kind, stage, severity, payload, created_at")
        .eq("run_id", data.runId)
        .order("id", { ascending: true }),
    ]);
    if (run.error) throw new Error(run.error.message);
    if (events.error) throw new Error(events.error.message);
    return { run: run.data, events: events.data ?? [] };
  });