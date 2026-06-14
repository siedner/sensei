import type { AnswerStep, CopilotInput } from "./types.js";

export const RED_FLAG_LABELS: Record<string, string> = {
  weak_communication: "Your answer is hard to follow. State the decision and rationale directly.",
  no_ecosystem_map: "Map the relevant actors before choosing a target.",
  overlapping_segments: "Segments overlap and will not drive different product choices.",
  no_journey_context: "Anchor the pain in a concrete workflow or journey.",
  solution_shaped_problem: "The problem is phrased as a missing solution.",
  no_solution_divergence: "Generate distinct mechanisms before choosing a v1.",
  solution_not_linked_to_mission: "Connect the bet to the product or business objective.",
  no_market_rationale: "State why this problem matters now and why this company should solve it.",
  no_segment_chosen: "Choose one primary persona; broad groups will produce a generic solution.",
  weak_segment_rationale: "Explain why this segment is the best starting point.",
  generic_pain_point: "Name the failed workflow, root cause, and consequence.",
  multiple_problems_none_prioritized: "Choose one problem to solve first.",
  solution_not_tied_to_pain_point: "Show how the proposed mechanism resolves the chosen pain.",
  too_many_features: "Scope a focused v1 and explicitly exclude secondary features.",
  no_metrics: "Define a primary metric tied to user value.",
  bad_metrics: "Replace generic engagement metrics with workflow outcomes.",
  no_guardrails: "Add safety, quality, or unintended-consequence guardrails.",
  weak_tradeoffs: "Name what you optimize for and what you intentionally give up.",
  weak_summary: "Close with user, problem, v1, tradeoff, metric, and guardrail."
};

const stepOrder: AnswerStep[] = [
  "goal_context", "user_segment", "pain_point", "problem_prioritization",
  "solution", "tradeoffs", "metrics", "summary"
];

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(text));
}

export function detectRedFlagIds(input: CopilotInput): string[] {
  const text = `${input.prompt}\n${input.notes}`.toLowerCase();
  const currentIndex = input.currentStep ? stepOrder.indexOf(input.currentStep) : 0;
  const flags: Array<{ id: string; priority: number; relevantAt: number }> = [];
  const add = (id: string, priority: number, relevantAt: number) => flags.push({ id, priority, relevantAt });

  if (!hasAny(text, [/\b(platform engineer|developer|engineering manager|sre|security|persona|segment|target user)\b/])) {
    add("no_segment_chosen", 100, 1);
  } else if (!hasAny(text, [/\bbecause\b/, /\bprioriti[sz]e\b/, /\bunderserved\b/, /\bhigh impact\b/])) {
    add("weak_segment_rationale", 73, 1);
  }
  if (!hasAny(text, [/\bworkflow\b/, /\bjourney\b/, /\bwhen\b/, /\bcurrent workaround\b/])) {
    add("no_journey_context", 76, 2);
  }
  if (hasAny(text, [/\bvisibility\b/, /\bbetter experience\b/, /\beasier\b/, /\bfrustrat/]) &&
      !hasAny(text, [/\bbecause\b/, /\bcauses?\b/, /\bresult(?:s|ing)?\b/, /\btime\b/, /\bfail/])) {
    add("generic_pain_point", 91, 2);
  }
  if (hasAny(text, [/\bneed(s)? (an?|the) (dashboard|ai|agent|app|feature)\b/])) {
    add("solution_shaped_problem", 84, 2);
  }
  if (hasAny(text, [/\b(and also|plus|as well as)\b/g]) || (text.match(/\b(add|build|create|include)\b/g)?.length ?? 0) >= 4) {
    add("too_many_features", 69, 4);
  }
  if (currentIndex >= 4 && !hasAny(text, [/\boption\b/, /\balternative\b/, /\bdirection\b/])) {
    add("no_solution_divergence", 65, 4);
  }
  if (currentIndex >= 5 && !hasAny(text, [/\btradeoff\b/, /\bversus\b/, /\bvs\.?\b/, /\bexclude\b/, /\brisk\b/])) {
    add("weak_tradeoffs", 78, 5);
  }
  if (currentIndex >= 6 || input.action === "metrics" || input.action === "summary") {
    if (!hasAny(text, [/\bmetric\b/, /\brate\b/, /\btime to\b/, /\bpercentage\b/, /\bmttr\b/, /\blatency\b/])) {
      add("no_metrics", 90, 6);
    } else if (hasAny(text, [/\b(dau|mau|engagement|nps|clicks?)\b/]) &&
               !hasAny(text, [/\bsuccess rate\b/, /\bcompletion\b/, /\btime to\b/])) {
      add("bad_metrics", 82, 6);
    }
    if (!hasAny(text, [/\bguardrail\b/, /\brollback\b/, /\bunsafe\b/, /\bpermission\b/, /\baudit\b/, /\berror rate\b/])) {
      add("no_guardrails", 87, 6);
    }
  }
  if (currentIndex >= 7 && text.length < 180) add("weak_summary", 70, 7);

  const applicable = flags
    .filter((flag) => flag.relevantAt <= currentIndex + 1 || input.action === "skeptic")
    .sort((a, b) => b.priority - a.priority)
    .map((flag) => flag.id);
  return [...new Set(applicable)].slice(0, input.mode === "live" ? 3 : 8);
}

export function detectRedFlags(input: CopilotInput): string[] {
  return detectRedFlagIds(input).map((id) => RED_FLAG_LABELS[id] ?? id);
}
