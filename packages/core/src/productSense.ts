import type { SkillManifest } from "./types.js";

export const PRODUCT_SENSE_ACTIONS = [
  { id: "clarify", label: "Clarify", description: "Ask only questions that change the answer.", outputShape: "3-5 consequential questions" },
  { id: "frame", label: "Frame", description: "Turn the prompt into a working PM frame.", outputShape: "Prompt type, assumptions, rationale, surface, lens, frame" },
  { id: "personas", label: "Personas", description: "Map relevant users and choose one.", outputShape: "Persona comparison table and recommendation" },
  { id: "options", label: "Options", description: "Generate three divergent mechanisms.", outputShape: "Three-option comparison table" },
  { id: "recommend", label: "Recommend", description: "Choose and scope a focused v1.", outputShape: "Recommendation, flow, in/out, rationale" },
  { id: "metrics", label: "Metrics", description: "Define value metrics and guardrails.", outputShape: "Primary, supporting, guardrails, vanity metric" },
  { id: "risks", label: "Risks", description: "Identify risks, mitigations, and guardrails.", outputShape: "Risk table" },
  { id: "skeptic", label: "Skeptic", description: "Pressure-test the most damaging gaps.", outputShape: "Biggest gap, pushback, weak dimension, fixes" },
  { id: "summary", label: "Summary", description: "Create a crisp 45-second close.", outputShape: "Target, problem, v1, tradeoff, metric, guardrail" }
] as const;

export const ANSWER_SPINE = [
  { id: "goal_context", label: "Goal / Context", hint: "0-5 min · clarify, rationale, game plan" },
  { id: "user_segment", label: "User Segment", hint: "5-12 min · map stakeholders, choose one" },
  { id: "pain_point", label: "Pain Point", hint: "12-20 min · journey, root cause, consequence" },
  { id: "problem_prioritization", label: "Prioritize Problem", hint: "Choose one problem and defend it" },
  { id: "solution", label: "Solution", hint: "20-30 min · diverge, choose, scope v1" },
  { id: "tradeoffs", label: "Tradeoffs", hint: "30-38 min · risks and conscious choices" },
  { id: "metrics", label: "Metrics & Guardrails", hint: "Value, behavior, metric, safety" },
  { id: "summary", label: "Summary", hint: "38-45 min · close and handle pushback" }
] as const;

export const productSenseManifest: SkillManifest = {
  id: "product-sense",
  name: "Product Sense",
  description: "Structure, critique, and sharpen live PM product exercises using focused user-centered judgment.",
  invocation: ["/product-sense", "/ps"],
  version: "1.0.0",
  actions: [...PRODUCT_SENSE_ACTIONS],
  knowledgePaths: [
    "knowledge/sensei/product-sense-doctrine.md",
    "knowledge/sensei/port-context.md",
    "knowledge/sensei/live-interview-playbook.md",
    "knowledge/sensei/metrics-and-guardrails.md",
    "knowledge/sensei/evaluator-rubric.md",
    "knowledge/sensei/error-taxonomy.md",
    "knowledge/sensei/action-prompts.md"
  ],
  supportedModes: ["live", "practice", "critique"],
  triggers: [
    "product exercise", "product sense", "design a product", "improve", "persona",
    "user segment", "pain point", "metrics", "guardrail", "pm interview", "port"
  ],
  ui: { accent: "#0f766e", answerSteps: [...ANSWER_SPINE] }
};

export const exampleSkillManifest: SkillManifest = {
  id: "example-skill",
  name: "Example Skill",
  description: "A non-production fixture proving that new skills register without core or adapter changes.",
  invocation: ["/example-skill"],
  version: "0.1.0",
  actions: [{ id: "outline", label: "Outline", description: "Return a small demonstration outline.", outputShape: "Three bullets" }],
  knowledgePaths: [],
  supportedModes: ["practice"],
  triggers: ["example skill fixture"]
};
