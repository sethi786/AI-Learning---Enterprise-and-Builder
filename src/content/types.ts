export type MasteryDomain =
  | "platform"
  | "security"
  | "privacy_legal_risk"
  | "architecture"
  | "agent_rag_connector"
  | "governance_grc"
  | "ops";

export type RoleId =
  | "platform-admin"
  | "governance-operator"
  | "solution-architect"
  | "security-architect"
  | "grc-lead";

export type Stage = "beginner" | "intermediate" | "advanced" | "expert";

export interface RoleDef {
  id: RoleId;
  order: number;
  name: string;
  short: string;
  mission: string;
  owns: string[];
  daily: string[];
  meetings: string[];
  documents: string[];
  questions: string[];
  risks: string[];
  tools: string[];
  technicalSkills: string[];
  governanceSkills: string[];
  securitySkills: string[];
  artifacts: string[];
  coach: string[];
  masteryDomains: MasteryDomain[];
  labIds: string[];
  scenarioIds: string[];
  platformIds: string[];
  stages: Record<Stage, string[]>;
  depth: "deep" | "scaffold";
}

export interface PlatformDef {
  id: string;
  name: string;
  category:
    "saas-productivity" | "saas-chat" | "coding-assistant" | "cloud-ai" | "internal" | "pattern";
  what: string;
  useCases: string[];
  adminResponsibilities: string[];
  architecture: string;
  securityModel: string[];
  iamModel: string[];
  dataModel: string[];
  privacy: string[];
  legal: string[];
  dataGovernance: string[];
  agentConnectorRisks: string[];
  environments: string[];
  commonRisks: string[];
  fixes: string[];
  evidence: string[];
  scenarioId?: string;
  quiz: QuizQuestion[];
  depth: "deep" | "scaffold";
}

export type QuizType = "mc" | "find-risk" | "choose-control" | "owner" | "gate";

export interface QuizQuestion {
  id: string;
  type: QuizType;
  prompt: string;
  options: { id: string; label: string; correct?: boolean; why?: string }[];
  explanation: string;
  moduleRef?: string;
  domain?: MasteryDomain;
  competencyIds?: string[];
  misconceptionByOption?: Record<string, string>;
}

export interface LessonSection {
  simple: string;
  enterprise: string;
  deepDive: string;
  diagram?: string;
  mistakes: string[];
  risks: string[];
  fixes: string[];
  evidence: string[];
  // v2 optional fields (backward compatible)
  objective?: string;
  prerequisites?: string[];
  dataFlow?: string;
  identityFlow?: string;
  trustBoundaries?: string[];
  configExample?: string;
  failureModes?: string[];
  attackExample?: string;
  troubleshooting?: string[];
  securePattern?: string;
  insecurePattern?: string;
  controls?: string[];
  guidedExercise?: string;
  independentChallenge?: string;
  reflection?: string;
  furtherPractice?: string[];
  competencyIds?: string[];
  source?: LessonSource;
}

export interface LessonSource {
  type:
    | "stable-concept"
    | "product-specific"
    | "version-sensitive"
    | "framework"
    | "instructor"
    | "simulation";
  title: string;
  url?: string;
  retrievedDate?: string;
  version?: string;
  confidence: "high" | "medium" | "low";
  owner?: string;
}

export type CompetencyId = string;

export type CompetencyCategory =
  "platform" | "governance" | "architecture" | "security" | "privacy_legal_risk" | "engineering";

export type CompetencyStatus =
  | "not_introduced"
  | "introduced"
  | "practiced"
  | "demonstrated"
  | "mastered"
  | "needs_reinforcement";

export interface Competency {
  id: CompetencyId;
  category: CompetencyCategory;
  name: string;
  description: string;
  prerequisites?: CompetencyId[];
}

export interface LabModule {
  id: string;
  title: string;
  lesson: LessonSection;
  quiz: QuizQuestion[];
  scenarioId?: string;
}

export interface LabDef {
  id: string;
  name: string;
  tagline: string;
  mission: string;
  domain: MasteryDomain;
  modules: LabModule[];
  depth: "deep" | "scaffold";
}

export type EnvDecision = "ai-lab" | "dev" | "uat" | "pilot" | "production" | "blocked";

export interface ScenarioStep {
  id: string;
  title: string;
  question: string;
  options: { id: string; label: string; ideal?: boolean }[];
  ideal: string;
  explain: string;
  competencyIds?: string[];
}

export interface ScenarioDef {
  id: string;
  title: string;
  summary: string;
  context: string;
  roleIds: RoleId[];
  domain: MasteryDomain;
  difficulty: Stage;
  steps: ScenarioStep[];
  finalDecision: {
    prompt: string;
    options: { id: EnvDecision; label: string; ideal?: boolean; why: string }[];
  };
  idealAnswer: string;
}

export interface ExamQuestion extends QuizQuestion {
  weight?: number;
}

export interface ExamDef {
  id: string;
  name: string;
  roleId: RoleId;
  description: string;
  questions: ExamQuestion[];
  depth: "deep" | "scaffold";
}

export interface ArtifactField {
  id: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect";
  options?: string[];
  placeholder?: string;
  help?: string;
}

export interface ArtifactTemplate {
  id: string;
  name: string;
  category: string;
  description: string;
  fields: ArtifactField[];
  markdown: (v: Record<string, string | string[]>) => string;
}
