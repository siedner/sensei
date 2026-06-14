import { describe, expect, it } from "vitest";
import { productSenseManifest } from "./productSense.js";
import { SkillRegistry } from "./registry.js";
import type { CopilotInput, SkillManifest } from "./types.js";

const baseInput: CopilotInput = {
  prompt: "",
  notes: "",
  currentStep: "goal_context",
  company: null,
  mode: "live"
};

describe("SkillRegistry", () => {
  it("uses explicit slash commands before all other routing signals", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    const result = registry.resolve({
      ...baseInput,
      command: "/product-sense metrics",
      skillIds: ["missing-skill"],
      prompt: "unrelated"
    });

    expect(result.manifest.id).toBe("product-sense");
    expect(result.action.id).toBe("metrics");
    expect(result.routingReason).toBe("command");
  });

  it("uses explicit skill IDs before inference", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    const result = registry.resolve({
      ...baseInput,
      skillIds: ["product-sense"],
      prompt: "unrelated"
    });
    expect(result.routingReason).toBe("explicit");
  });

  it("infers product sense from interview context", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    const result = registry.resolve({
      ...baseInput,
      prompt: "Design a product for a PM interview and define metrics"
    });
    expect(result.manifest.id).toBe("product-sense");
    expect(result.routingReason).toBe("inferred");
  });

  it("falls back to session and then default routing", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    expect(registry.resolve(baseInput, "product-sense").routingReason).toBe("session");
    expect(registry.resolve(baseInput).routingReason).toBe("default");
  });

  it("detects Port as an overlay", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    const result = registry.resolve({
      ...baseInput,
      prompt: "Port.io needs a developer workflow"
    });
    expect(result.overlays).toEqual(["port"]);
  });

  it("rejects duplicate IDs and slash commands", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    expect(() => registry.register(productSenseManifest)).toThrow("Duplicate skill id");

    const duplicateCommand: SkillManifest = {
      ...productSenseManifest,
      id: "other-skill",
      invocation: ["/product-sense"]
    };
    expect(() => registry.register(duplicateCommand)).toThrow("Duplicate skill command");
  });

  it("returns suggestions for unknown action commands", () => {
    const registry = new SkillRegistry([productSenseManifest]);
    const result = registry.parseCommand("/product-sense unknown");
    expect(result?.kind).toBe("unknown");
    expect(result?.suggestions?.[0]).toMatch(/^\/product-sense /);
  });
});
