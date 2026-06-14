import { describe, expect, it } from "vitest";
import { runMockAction } from "./mockActions.js";
import { productSenseManifest } from "./productSense.js";
import { SkillRegistry } from "./registry.js";
import type { CopilotInput } from "./types.js";

const registry = new SkillRegistry([productSenseManifest]);

function input(action: string): CopilotInput {
  return {
    action,
    prompt: "Port wants platform teams to govern AI agents across engineering workflows.",
    notes: "Platform engineer approves production actions. Need audit and rollback. Primary metric is workflow completion rate.",
    currentStep: action === "metrics" ? "metrics" : "solution",
    company: "port",
    mode: "live"
  };
}

describe("product-sense mock actions", () => {
  for (const action of productSenseManifest.actions) {
    it(`returns a useful ${action.id} response`, () => {
      const current = input(action.id);
      const output = runMockAction(current, registry.resolve(current));
      expect(output.markdown.length).toBeGreaterThan(100);
      expect(output.routing.primarySkill).toBe("product-sense");
      expect(output.routing.overlays).toContain("port");
      expect(output.debug.action).toBe(action.id);
      expect(output.redFlags.length).toBeLessThanOrEqual(3);
      expect(output.trace.adapter).toBe("mock");
      expect(output.trace.toolsEnabled).toBe(false);
      expect(output.trace.usage.totalTokens).toBe(0);
      expect(output.trace.events.some((event) => event.id === "skill")).toBe(true);
    });
  }

  it("adapts recommendation text to a named persona", () => {
    const current = {
      ...input("recommend"),
      notes: "Security governance owner needs to approve agent actions."
    };
    const output = runMockAction(current, registry.resolve(current));
    expect(output.markdown).toContain("security or governance owner");
  });
});
