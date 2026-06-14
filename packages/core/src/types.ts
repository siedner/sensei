import { z } from "zod";

export const COPILOT_MODES = ["live", "practice", "critique"] as const;
export const ANSWER_STEPS = [
  "goal_context",
  "user_segment",
  "pain_point",
  "problem_prioritization",
  "solution",
  "tradeoffs",
  "metrics",
  "summary"
] as const;
export const ROUTING_REASONS = ["command", "explicit", "inferred", "session", "default"] as const;
export const AGENT_ADAPTERS = ["mock", "pi"] as const;

export type CopilotMode = (typeof COPILOT_MODES)[number];
export type AnswerStep = (typeof ANSWER_STEPS)[number];
export type RoutingReason = (typeof ROUTING_REASONS)[number];
export type AgentAdapterId = (typeof AGENT_ADAPTERS)[number];

export type AgentTraceStatus = "info" | "success" | "error";

export interface AgentTraceEvent {
  id: string;
  label: string;
  detail?: string;
  elapsedMs: number;
  status: AgentTraceStatus;
}

export interface AgentUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  totalTokens: number;
  estimatedCostUsd: number | null;
  durationMs: number;
  turns: number;
  retries: number;
}

export interface AgentRunTrace {
  runId: string;
  startedAt: string;
  status: "success" | "error";
  adapter: AgentAdapterId;
  provider?: string;
  model?: string;
  skill: string;
  action: string;
  mode: CopilotMode;
  toolsEnabled: boolean;
  events: AgentTraceEvent[];
  usage: AgentUsage;
}

export interface AgentRuntimeSelection {
  adapter: AgentAdapterId;
  provider?: string;
  model?: string;
}

export interface AgentModelOption {
  id: string;
  name: string;
  note?: string;
}

export interface AgentProviderOption {
  id: string;
  name: string;
  description: string;
  configured: boolean;
  models: AgentModelOption[];
}

export interface AgentRuntimeOptions {
  defaultAdapter: AgentAdapterId;
  defaultProvider?: string;
  defaultModel?: string;
  providers: AgentProviderOption[];
}

export interface SkillActionDefinition {
  id: string;
  label: string;
  description: string;
  outputShape: string;
}

export interface SkillUiDefinition {
  accent?: string;
  answerSteps?: Array<{ id: AnswerStep; label: string; hint: string }>;
}

export interface SkillManifest {
  id: string;
  name: string;
  description: string;
  invocation: string[];
  version: string;
  actions: SkillActionDefinition[];
  knowledgePaths: string[];
  supportedModes: CopilotMode[];
  triggers: string[];
  ui?: SkillUiDefinition;
}

export const copilotInputSchema = z.object({
  action: z.string().min(1).optional(),
  command: z.string().max(200).optional(),
  prompt: z.string().max(30_000).default(""),
  notes: z.string().max(50_000).default(""),
  currentStep: z.enum(ANSWER_STEPS).nullable().default(null),
  company: z.string().max(100).nullable().default(null),
  mode: z.enum(COPILOT_MODES).default("live"),
  runtime: z.object({
    adapter: z.enum(AGENT_ADAPTERS),
    provider: z.string().min(1).optional(),
    model: z.string().min(1).optional()
  }).optional(),
  skillIds: z.array(z.string().min(1)).max(4).optional(),
  sessionId: z.string().max(200).optional()
});

export type CopilotInput = z.infer<typeof copilotInputSchema>;

export interface CopilotOutput {
  markdown: string;
  redFlags: string[];
  suggestedNextStep: string | null;
  routing: {
    primarySkill: string;
    overlays: string[];
    reason: RoutingReason;
  };
  debug: {
    adapter: "mock" | "pi" | "openai" | "anthropic" | "local";
    action: string;
    provider?: string;
    model?: string;
  };
  trace: AgentRunTrace;
}

export interface CommandResolution {
  kind: "run" | "list" | "help" | "unknown";
  skillId?: string;
  action?: string;
  suggestions?: string[];
}

export interface ResolvedSkillContext {
  manifest: SkillManifest;
  action: SkillActionDefinition;
  overlays: string[];
  routingReason: RoutingReason;
  command?: CommandResolution;
  instructions: string;
}

export interface AgentAdapter {
  run(input: CopilotInput, context: ResolvedSkillContext): Promise<CopilotOutput>;
}

export interface SkillMetadata {
  id: string;
  name: string;
  description: string;
  invocation: string[];
  actions: Array<Pick<SkillActionDefinition, "id" | "label" | "description">>;
}
