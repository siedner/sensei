// ── Primitive types ──────────────────────────────────────────────────────────

export type PsPromptType =
  | "design_new"
  | "improve"
  | "engagement"
  | "marketplace"
  | "b2b";

export type PsSeniorityLevel = "apm" | "pm" | "senior";

export type PsSessionMode = "drill" | "mock" | "socratic";
export type PsMockTimingMode = "compressed" | "realistic";

export type PsSessionStatus = "started" | "answered" | "evaluated" | "abandoned";

export type PsDrillType =
  | "segment_selection"
  | "pain_point_id"
  | "prioritization"
  | "metrics_only"
  | "tradeoff_defense"
  | "answer_critique"
  | "rationale"
  | "opening_waypointing"
  | "ecosystem_mapping"
  | "journey_mapping"
  | "solution_divergence";

export type PsAnswerSpineStep =
  | "goal_context"
  | "user_segment"
  | "pain_point"
  | "problem_prioritization"
  | "solution"
  | "tradeoffs"
  | "metrics"
  | "summary";

// ── Rubric ──────────────────────────────────────────────────────────────────

export interface PsRubricScores {
  structure: number;
  communication_clarity: number;
  business_rationale: number;
  ecosystem_thinking: number;
  segment_quality: number;
  pain_point_specificity: number;
  prioritization_quality: number;
  creative_breadth: number;
  solution_coherence: number;
  tradeoff_reasoning: number;
  metrics_quality: number;
  summary_quality: number;
}

export const RUBRIC_DIMENSION_LABELS: Record<keyof PsRubricScores, string> = {
  structure: "Structure",
  communication_clarity: "Communication Clarity",
  business_rationale: "Business Rationale",
  ecosystem_thinking: "Ecosystem Thinking",
  segment_quality: "Segment Quality",
  pain_point_specificity: "Pain-Point Specificity",
  prioritization_quality: "Prioritization",
  creative_breadth: "Creative Breadth",
  solution_coherence: "Solution Coherence",
  tradeoff_reasoning: "Tradeoff Reasoning",
  metrics_quality: "Metrics Quality",
  summary_quality: "Summary Quality",
};

export const RUBRIC_DIMENSIONS = Object.keys(RUBRIC_DIMENSION_LABELS) as (keyof PsRubricScores)[];

// ── Answer spine ─────────────────────────────────────────────────────────────

export const ANSWER_SPINE_STEPS: { key: PsAnswerSpineStep; label: string; hint: string }[] = [
  { key: "goal_context", label: "Goal / Context", hint: "State assumptions, game plan, mission, and success lens" },
  { key: "user_segment", label: "User Segment", hint: "Map stakeholders, then pick a distinct target and persona" },
  { key: "pain_point", label: "Pain Point", hint: "Map the journey and diagnose a root problem" },
  { key: "problem_prioritization", label: "Prioritize Problem", hint: "Choose ONE problem to solve first" },
  { key: "solution", label: "Solution", hint: "Generate 3 distinct directions, select one, and define v1" },
  { key: "tradeoffs", label: "Tradeoffs", hint: "What are you optimizing for? What are the risks?" },
  { key: "metrics", label: "Metrics & Guardrails", hint: "Primary metric, supporting metrics, guardrails" },
  { key: "summary", label: "Summary", hint: "Restate segment, problem, solution, success criteria" },
];

// ── Drill type metadata ───────────────────────────────────────────────────────

export interface PsDrillTypeMeta {
  label: string;
  description: string;
  timeEstimate: string;
}

export const DRILL_TYPE_META: Record<PsDrillType, PsDrillTypeMeta> = {
  segment_selection: {
    label: "Segment Selection",
    description: "Given a product context, choose the best target user segment and explain your reasoning.",
    timeEstimate: "2–3 min",
  },
  pain_point_id: {
    label: "Pain-Point ID",
    description: "Given a user segment and product, identify the most important pain point and why it matters.",
    timeEstimate: "2–3 min",
  },
  prioritization: {
    label: "Prioritization",
    description: "Given three problem areas, choose one to solve first and defend your reasoning.",
    timeEstimate: "3–4 min",
  },
  metrics_only: {
    label: "Metrics Only",
    description: "Given a proposed solution, define a primary metric, two supporting metrics, and two guardrails.",
    timeEstimate: "2–3 min",
  },
  tradeoff_defense: {
    label: "Tradeoff Defense",
    description: "You proposed a v1 scope. Defend it against an objection from a skeptical interviewer.",
    timeEstimate: "3–4 min",
  },
  answer_critique: {
    label: "Answer Critique",
    description: "Read a weak candidate answer and diagnose the specific flaws using the canonical framework.",
    timeEstimate: "3–5 min",
  },
  rationale: {
    label: "Why Now / Market",
    description: "Given a product prompt, make the strategic case: why this matters now, the market opportunity, and how it fits the company's goals.",
    timeEstimate: "2–3 min",
  },
  opening_waypointing: {
    label: "Opening & Waypointing",
    description: "Set useful assumptions, announce a game plan, and practice concise transitions and check-ins.",
    timeEstimate: "2–3 min",
  },
  ecosystem_mapping: {
    label: "Ecosystem Mapping",
    description: "Map key stakeholders, choose one player, and create distinct motivation-based segments.",
    timeEstimate: "3–4 min",
  },
  journey_mapping: {
    label: "Journey Mapping",
    description: "Trace a day-in-the-life journey, identify the root problem, and separate needs from solutions.",
    timeEstimate: "3–4 min",
  },
  solution_divergence: {
    label: "Solution Divergence",
    description: "Generate three different solution mechanisms, compare impact and effort, then select a focused v1.",
    timeEstimate: "4–5 min",
  },
};

// Maps each drill type to the single rubric dimension it exercises. Used to
// update only that dimension's rolling average on drill completion.
export const DRILL_DIMENSION_MAP: Record<PsDrillType, keyof PsRubricScores> = {
  segment_selection: "segment_quality",
  pain_point_id: "pain_point_specificity",
  prioritization: "prioritization_quality",
  metrics_only: "metrics_quality",
  tradeoff_defense: "tradeoff_reasoning",
  answer_critique: "structure",
  rationale: "business_rationale",
  opening_waypointing: "communication_clarity",
  ecosystem_mapping: "ecosystem_thinking",
  journey_mapping: "pain_point_specificity",
  solution_divergence: "creative_breadth",
};

// ── Prompt type metadata ──────────────────────────────────────────────────────

export const PROMPT_TYPE_LABELS: Record<PsPromptType, string> = {
  design_new: "Design New Product",
  improve: "Improve Existing",
  engagement: "Engagement / Retention",
  marketplace: "Marketplace",
  b2b: "B2B / Workflow",
};

export const SENIORITY_LABELS: Record<PsSeniorityLevel, string> = {
  apm: "APM",
  pm: "PM",
  senior: "Senior PM",
};

// ── Database entity types ─────────────────────────────────────────────────────

export interface PsPrompt {
  id: string;
  prompt_type: PsPromptType;
  difficulty: number;
  target_level: PsSeniorityLevel;
  prompt_text: string;
  company_context: string | null;
  tags: string[];
  is_seed: boolean;
  created_at: string;
}

export interface PsSession {
  id: string;
  mode: PsSessionMode;
  prompt_id: string | null;
  seniority_level: PsSeniorityLevel;
  user_answer: string | null;
  status: PsSessionStatus;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface PsSessionDetail extends PsSession {
  prompt: PsPrompt | null;
  evaluation: PsEvaluation | null;
}

export interface PsEvaluation {
  id: string;
  session_id: string;
  overall_score: number;
  rubric_scores: PsRubricScores;
  what_was_strong: string[];
  what_was_weak: string[];
  rewrite_suggestion: string | null;
  follow_up_question: string | null;
  next_drill_suggestion: string | null;
  error_taxonomy: string[];
  evaluated_at: string;
  created_at: string;
}

export interface PsDrillAttempt {
  id: string;
  drill_type: PsDrillType;
  prompt_snippet: string;
  user_response: string;
  evaluation_json: PsDrillEvaluation;
  score: number | null;
  completed_at: string;
  created_at: string;
}

export interface PsDrillEvaluation {
  score: number;
  what_was_strong: string[];
  what_was_weak: string[];
  correct_approach: string;
}

export interface PsProgress {
  id: string;
  total_sessions: number;
  total_drills: number;
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  level_estimate: PsSeniorityLevel;
  dimension_scores: Partial<PsRubricScores>;
  created_at: string;
  updated_at: string;
}

// ── LLM output shapes ─────────────────────────────────────────────────────────

export interface PsEvaluatorLlmOutput {
  overall_verdict: string;
  overall_score: number;
  rubric_scores: PsRubricScores;
  what_was_strong: string[];
  what_was_weak: string[];
  rewrite_suggestion: string;
  follow_up_question: string;
  difficulty_adjusted_next_drill: string;
  error_taxonomy: string[];
}

export interface PsCoachMessage {
  role: "coach" | "user";
  content: string;
  step?: PsAnswerSpineStep;
}

export interface PsCoachResponse {
  reply: string;
  next_step: PsAnswerSpineStep | null;
}

// ── API request/response shapes ───────────────────────────────────────────────

export interface CreatePsSessionInput {
  mode: PsSessionMode;
  prompt_id?: string;
  seniority_level: PsSeniorityLevel;
}

export interface SubmitPsAnswerInput {
  user_answer: string;
}

export interface CreatePsDrillAttemptInput {
  drill_type: PsDrillType;
  prompt_snippet: string;
  user_response: string;
}

export interface ListPsPromptsQuery {
  prompt_type?: PsPromptType;
  target_level?: PsSeniorityLevel;
  difficulty?: number;
  limit?: number;
}

export interface PsCoachMessageInput {
  session_id: string;
  current_step: PsAnswerSpineStep;
  message: string;
  history: PsCoachMessage[];
}

// ── Progress summary ──────────────────────────────────────────────────────────

export interface PsProgressSummary {
  progress: PsProgress;
  recentSessions: PsSessionDetail[];
  recentDrills: PsDrillAttempt[];
  weakestDimensions: Array<{ dimension: keyof PsRubricScores; avgScore: number }>;
}

// ── Error taxonomy (from bible section 12.4) ──────────────────────────────────

export const PS_ERROR_TAXONOMY_LABELS: Record<string, string> = {
  weak_communication: "Weak interview communication",
  no_ecosystem_map: "No ecosystem map",
  overlapping_segments: "Overlapping segments",
  no_journey_context: "No journey context",
  solution_shaped_problem: "Solution-shaped problem",
  no_solution_divergence: "No divergent solutions",
  solution_not_linked_to_mission: "Solution not linked to mission",
  no_market_rationale: "No market rationale",
  no_segment_chosen: "No segment chosen",
  weak_segment_rationale: "Weak segment rationale",
  generic_pain_point: "Generic pain point",
  multiple_problems_none_prioritized: "No prioritization",
  solution_not_tied_to_pain_point: "Solution mismatch",
  too_many_features: "Feature dumping",
  no_metrics: "No metrics",
  bad_metrics: "Weak metrics",
  no_guardrails: "No guardrails",
  weak_tradeoffs: "Weak tradeoffs",
  weak_summary: "Weak summary",
};
