import { describe, expect, it } from "vitest";
import { detectRedFlagIds, detectRedFlags } from "./redFlags.js";
import type { CopilotInput } from "./types.js";

function input(overrides: Partial<CopilotInput> = {}): CopilotInput {
  return {
    prompt: "Design something for engineering organizations.",
    notes: "Users need an AI dashboard. Add alerts and reports and chat and analytics.",
    currentStep: "goal_context",
    company: "port",
    mode: "live",
    ...overrides
  };
}

describe("red flags", () => {
  it("limits live mode to three high-impact issues", () => {
    expect(detectRedFlags(input({ currentStep: "summary", action: "skeptic" })).length).toBeLessThanOrEqual(3);
  });

  it("does not surface missing metrics during early framing", () => {
    expect(detectRedFlagIds(input({ currentStep: "goal_context" }))).not.toContain("no_metrics");
  });

  it("surfaces missing metrics and guardrails at the metrics step", () => {
    const flags = detectRedFlagIds(input({ currentStep: "metrics", action: "metrics", mode: "critique" }));
    expect(flags).toContain("no_metrics");
    expect(flags).toContain("no_guardrails");
  });

  it("identifies solution-shaped problems", () => {
    expect(detectRedFlagIds(input({ currentStep: "pain_point", mode: "critique" }))).toContain("solution_shaped_problem");
  });
});
