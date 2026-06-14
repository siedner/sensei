import { z } from "zod";
import { productSenseManifest } from "./productSense.js";
import type {
  CommandResolution,
  CopilotInput,
  ResolvedSkillContext,
  SkillManifest,
  SkillMetadata
} from "./types.js";

const actionSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  label: z.string().min(1),
  description: z.string().min(1),
  outputShape: z.string().min(1)
});

const manifestSchema = z.object({
  id: z.string().regex(/^[a-z][a-z0-9-]*$/),
  name: z.string().min(1),
  description: z.string().min(1),
  invocation: z.array(z.string().regex(/^\/[a-z][a-z0-9-]*$/)).min(1),
  version: z.string().min(1),
  actions: z.array(actionSchema).min(1),
  knowledgePaths: z.array(z.string()),
  supportedModes: z.array(z.enum(["live", "practice", "critique"])).min(1),
  triggers: z.array(z.string()),
  ui: z.any().optional()
});

export class SkillRegistry {
  private readonly manifests = new Map<string, SkillManifest>();
  private readonly commands = new Map<string, string>();

  constructor(manifests: SkillManifest[] = [productSenseManifest]) {
    for (const manifest of manifests) this.register(manifest);
  }

  register(rawManifest: SkillManifest): void {
    const manifest = manifestSchema.parse(rawManifest) as SkillManifest;
    if (this.manifests.has(manifest.id)) throw new Error(`Duplicate skill id: ${manifest.id}`);
    for (const command of manifest.invocation) {
      if (this.commands.has(command)) throw new Error(`Duplicate skill command: ${command}`);
    }
    this.manifests.set(manifest.id, manifest);
    for (const command of manifest.invocation) this.commands.set(command, manifest.id);
  }

  get(id: string): SkillManifest | undefined {
    return this.manifests.get(id);
  }

  list(): SkillMetadata[] {
    return [...this.manifests.values()].map((manifest) => ({
      id: manifest.id,
      name: manifest.name,
      description: manifest.description,
      invocation: manifest.invocation,
      actions: manifest.actions.map(({ id, label, description }) => ({ id, label, description }))
    }));
  }

  parseCommand(command?: string): CommandResolution | undefined {
    const value = command?.trim();
    if (!value) return undefined;
    if (value === "/skills") return { kind: "list" };
    if (value === "/help") return { kind: "help" };

    const [name, action] = value.split(/\s+/, 2);
    const skillId = name ? this.commands.get(name) : undefined;
    if (!skillId) {
      const suggestions = [...this.commands.keys()].filter((candidate) =>
        name ? candidate.includes(name.replace("/", "")) : false
      );
      return { kind: "unknown", suggestions: suggestions.slice(0, 4) };
    }
    const manifest = this.manifests.get(skillId)!;
    if (action && !manifest.actions.some((candidate) => candidate.id === action)) {
      return {
        kind: "unknown",
        suggestions: manifest.actions.map((candidate) => `${name} ${candidate.id}`).slice(0, 5)
      };
    }
    return { kind: "run", skillId, action };
  }

  resolve(input: CopilotInput, currentSessionSkill?: string): ResolvedSkillContext {
    const command = this.parseCommand(input.command);
    let skillId: string;
    let reason: ResolvedSkillContext["routingReason"];

    if (command?.kind === "run" && command.skillId) {
      skillId = command.skillId;
      reason = "command";
    } else if (input.skillIds?.length) {
      skillId = input.skillIds[0]!;
      reason = "explicit";
    } else {
      const haystack = `${input.prompt} ${input.notes}`.toLowerCase();
      const inferred = [...this.manifests.values()]
        .filter((manifest) => manifest.id !== "example-skill")
        .map((manifest) => ({
          id: manifest.id,
          score: manifest.triggers.reduce((score, trigger) => score + (haystack.includes(trigger) ? 1 : 0), 0)
        }))
        .sort((a, b) => b.score - a.score)[0];
      if (inferred && inferred.score > 0) {
        skillId = inferred.id;
        reason = "inferred";
      } else if (currentSessionSkill && this.manifests.has(currentSessionSkill)) {
        skillId = currentSessionSkill;
        reason = "session";
      } else {
        skillId = "product-sense";
        reason = "default";
      }
    }

    const manifest = this.manifests.get(skillId);
    if (!manifest) throw new Error(`Unknown skill: ${skillId}`);
    if (!manifest.supportedModes.includes(input.mode)) {
      throw new Error(`${manifest.name} does not support ${input.mode} mode`);
    }

    const actionId = command?.kind === "run" && command.action
      ? command.action
      : input.action ?? manifest.actions[0]!.id;
    const action = manifest.actions.find((candidate) => candidate.id === actionId);
    if (!action) throw new Error(`Unknown action "${actionId}" for ${manifest.name}`);

    const overlays = input.company?.toLowerCase() === "port" || /\bport(?:\.io)?\b/i.test(`${input.prompt} ${input.notes}`)
      ? ["port"]
      : [];

    return {
      manifest,
      action,
      overlays,
      routingReason: reason,
      command,
      instructions: [
        manifest.description,
        `Action: ${action.id}. Output shape: ${action.outputShape}.`,
        input.mode === "live" ? "Be concise. Surface only the next useful move. Do not provide hidden reasoning." : "",
        overlays.includes("port") ? "Apply the Port lens: persona, workflow, context, action, guardrail, interface, metric." : ""
      ].filter(Boolean).join("\n")
    };
  }
}
