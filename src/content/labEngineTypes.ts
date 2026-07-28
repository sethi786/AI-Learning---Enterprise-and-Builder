import type { MasteryDomain } from "./types";

export type CfgValue = string | number | boolean;
export type CfgMap = Record<string, CfgValue>;

export interface LabConfigField {
  id: string;
  label: string;
  help?: string;
  type: "select" | "toggle" | "number";
  options?: { value: string; label: string }[];
  default: CfgValue;
}

export interface RubricCheck {
  id: string;
  label: string;
  weight: number;
  /** Return true if the current config satisfies this rubric item. */
  check: (cfg: CfgMap) => boolean;
  remedy: string;
}

export interface LabInjection {
  id: string;
  /**
   * Which step this incident fires during, 1-based to match how the steps are
   * numbered in their titles. `atStep: 3` fires on the third step, so it must
   * not exceed `steps.length` or the incident never reaches the learner.
   */
  atStep: number;
  kind: "failure" | "attack" | "drift" | "policy";
  title: string;
  /** Log lines that stream into the console when triggered. */
  logs: string[];
  prompt: string;
  choices: {
    id: string;
    label: string;
    scoreDelta: number;
    explain: string;
    /** Extra log lines emitted after the learner picks this choice. */
    followupLogs?: string[];
    correct?: boolean;
  }[];
}

export interface LabStep {
  id: string;
  title: string;
  narrative: string;
  logs: string[];
}

export interface LabBlueprint {
  id: string;
  name: string;
  tagline: string;
  domain: MasteryDomain;
  competencyIds: string[];
  summary: string;
  config: LabConfigField[];
  steps: LabStep[];
  injections: LabInjection[];
  rubric: RubricCheck[];
  debrief: { section: string; body: string }[];
  artifact: {
    name: string;
    build: (ctx: {
      cfg: CfgMap;
      choices: Record<string, string>;
      score: number;
      max: number;
      passedRubric: string[];
      failedRubric: string[];
    }) => string;
  };
}
