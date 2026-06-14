import {
  AuthStorage,
  createAgentSession,
  DefaultResourceLoader,
  getAgentDir,
  ModelRegistry,
  SessionManager,
  type CreateAgentSessionOptions
} from "@mariozechner/pi-coding-agent";
import {
  detectRedFlags,
  type AgentAdapter,
  type AgentRunTrace,
  type AgentTraceEvent,
  type CopilotInput,
  type CopilotOutput,
  type ResolvedSkillContext
} from "@sensei/core";
import path from "node:path";
import { AgentRunError } from "../AgentRunError.js";
import { registerRuntimeProviders, validateRuntimeSelection } from "../runtimeOptions.js";

export class PiAdapter implements AgentAdapter {
  constructor(private readonly rootDir: string) {}

  async run(input: CopilotInput, context: ResolvedSkillContext): Promise<CopilotOutput> {
    const started = Date.now();
    const trace: AgentRunTrace = {
      runId: crypto.randomUUID(),
      startedAt: new Date(started).toISOString(),
      status: "success",
      adapter: "pi",
      skill: context.manifest.id,
      action: context.action.id,
      mode: input.mode,
      toolsEnabled: false,
      events: [],
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: null,
        durationMs: 0,
        turns: 0,
        retries: 0
      }
    };
    const addEvent = (
      id: string,
      label: string,
      detail?: string,
      status: AgentTraceEvent["status"] = "info"
    ) => trace.events.push({ id, label, detail, elapsedMs: Date.now() - started, status });

    addEvent(
      "routing",
      "Request routed",
      `${context.manifest.name} selected by ${context.routingReason}`,
      "success"
    );
    addEvent(
      "skill",
      "Skill resources resolved",
      `${context.action.label}${context.overlays.length ? ` with ${context.overlays.join(", ")} overlay` : ""}`,
      "success"
    );

    let session: Awaited<ReturnType<typeof createAgentSession>>["session"] | undefined;
    let unsubscribe = () => {};
    try {
      const authStorage = AuthStorage.create();
      const modelRegistry = ModelRegistry.create(authStorage);
      registerRuntimeProviders(modelRegistry);
      const availableModels = await modelRegistry.getAvailable();
      if (availableModels.length === 0) {
        throw new Error("Pi has no configured model credentials. Configure Pi, or set SENSEI_AGENT_ADAPTER=mock.");
      }

      const skillPath = path.join(this.rootDir, ".pi", "skills", context.manifest.id, "SKILL.md");
      const loader = new DefaultResourceLoader({
        cwd: this.rootDir,
        agentDir: getAgentDir(),
        systemPromptOverride: () => [
          "You are Sensei, a concise live PM interview copilot.",
          "Return only useful Notion-ready Markdown. Do not expose chain of thought.",
          "Never run tools, browse, modify files, or claim unsupported company facts.",
          context.instructions
        ].join("\n\n"),
        appendSystemPromptOverride: () => [],
        skillsOverride: (current) => ({
          skills: current.skills.filter((skill) => path.resolve(skill.filePath) === path.resolve(skillPath)),
          diagnostics: current.diagnostics
        }),
        promptsOverride: () => ({ prompts: [], diagnostics: [] }),
        extensionsOverride: (current) => ({ ...current, extensions: [], errors: [] })
      });
      await loader.reload();

      const provider = input.runtime?.provider ?? process.env.SENSEI_PI_PROVIDER;
      const modelId = input.runtime?.model ?? process.env.SENSEI_PI_MODEL;
      validateRuntimeSelection(provider, modelId);
      const model = provider && modelId ? modelRegistry.find(provider, modelId) : undefined;
      if ((provider || modelId) && !model) {
        throw new Error(`Pi model override not found: ${provider ?? "?"}/${modelId ?? "?"}`);
      }

      const sessionOptions: CreateAgentSessionOptions = {
        cwd: this.rootDir,
        authStorage,
        modelRegistry,
        resourceLoader: loader,
        sessionManager: SessionManager.inMemory(),
        tools: [],
        customTools: [],
        thinkingLevel: input.mode === "live" ? "low" : "medium"
      };
      ({ session } = await createAgentSession(
        model ? { ...sessionOptions, model } : sessionOptions
      ));
      trace.provider = session.model?.provider;
      trace.model = session.model?.id;
      addEvent(
        "runtime",
        "Pi session created",
        `${trace.provider ?? "configured provider"} / ${trace.model ?? "configured model"} · tools disabled`,
        "success"
      );

      let markdown = "";
      let agentStarted = false;
      unsubscribe = session.subscribe((event) => {
        if (event.type === "agent_start" && !agentStarted) {
          agentStarted = true;
          addEvent("agent", "Model request started", "Pi began a tool-free agent turn");
        }
        if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
          markdown += event.assistantMessageEvent.delta;
        }
        if (event.type === "auto_retry_start") {
          trace.usage.retries += 1;
          addEvent(
            `retry-${event.attempt}`,
            `Provider retry ${event.attempt}/${event.maxAttempts}`,
            `${event.delayMs} ms backoff`,
            "info"
          );
        }
        if (event.type === "compaction_start") {
          addEvent("compaction", "Context compaction started", event.reason);
        }
      });

      await session.prompt(this.buildPrompt(input, context));
      if (!markdown.trim()) {
        markdown = this.extractLatestAssistantText(session.messages);
      }
      const agentError = session.agent.state.errorMessage;
      if (!markdown.trim() && agentError) throw new Error(`Pi provider error: ${agentError}`);
      if (!markdown.trim()) throw new Error("Pi returned an empty response.");
      trace.usage = this.summarizeUsage(session.messages, Date.now() - started, trace.usage.retries);
      addEvent(
        "response",
        "Response completed",
        `${trace.usage.outputTokens.toLocaleString()} output tokens in ${trace.usage.durationMs.toLocaleString()} ms`,
        "success"
      );
      return {
        markdown: markdown.trim(),
        redFlags: detectRedFlags(input),
        suggestedNextStep: this.nextStep(context.action.id),
        routing: {
          primarySkill: context.manifest.id,
          overlays: context.overlays,
          reason: context.routingReason
        },
        debug: {
          adapter: "pi",
          action: context.action.id,
          provider: session.model?.provider,
          model: session.model?.id
        },
        trace
      };
    } catch (error) {
      trace.status = "error";
      if (session) {
        trace.provider = session.model?.provider;
        trace.model = session.model?.id;
        trace.usage = this.summarizeUsage(session.messages, Date.now() - started, trace.usage.retries);
      } else {
        trace.usage.durationMs = Date.now() - started;
      }
      const message = error instanceof Error ? error.message : "Pi request failed.";
      addEvent("error", "Run failed", message, "error");
      throw new AgentRunError(message, trace);
    } finally {
      unsubscribe();
      session?.dispose();
    }
  }

  private summarizeUsage(
    messages: Array<{
      role: string;
      usage?: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
        totalTokens: number;
        cost?: { total?: number };
      };
    }>,
    durationMs: number,
    retries: number
  ): AgentRunTrace["usage"] {
    const assistantMessages = messages.filter((message) => message.role === "assistant" && message.usage);
    const totals = assistantMessages.reduce((usage, message) => {
      usage.inputTokens += message.usage?.input ?? 0;
      usage.outputTokens += message.usage?.output ?? 0;
      usage.cacheReadTokens += message.usage?.cacheRead ?? 0;
      usage.cacheWriteTokens += message.usage?.cacheWrite ?? 0;
      usage.totalTokens += message.usage?.totalTokens ?? 0;
      usage.cost += message.usage?.cost?.total ?? 0;
      return usage;
    }, {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      cost: 0
    });
    return {
      inputTokens: totals.inputTokens,
      outputTokens: totals.outputTokens,
      cacheReadTokens: totals.cacheReadTokens,
      cacheWriteTokens: totals.cacheWriteTokens,
      totalTokens: totals.totalTokens,
      estimatedCostUsd: totals.totalTokens > 0 && totals.cost === 0 ? null : totals.cost,
      durationMs,
      turns: assistantMessages.length,
      retries
    };
  }

  private extractLatestAssistantText(messages: Array<{
    role: string;
    content?: unknown;
    errorMessage?: string;
  }>): string {
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      const message = messages[index];
      if (message?.role !== "assistant") continue;
      const content = Array.isArray(message.content) ? message.content : [];
      const text = content
        .filter((part): part is { type: "text"; text: string } =>
          typeof part === "object" && part !== null &&
          "type" in part && part.type === "text" &&
          "text" in part && typeof part.text === "string"
        )
        .map((part) => part.text)
        .join("");
      if (text.trim()) return text.trim();
      if (message.errorMessage) throw new Error(`Pi provider error: ${message.errorMessage}`);
    }
    return "";
  }

  private buildPrompt(input: CopilotInput, context: ResolvedSkillContext): string {
    return [
      `/skill:${context.manifest.id}`,
      `Action: ${context.action.id}`,
      `Mode: ${input.mode}`,
      `Current answer step: ${input.currentStep ?? "not selected"}`,
      `Company context: ${input.company ?? "none"}`,
      `Overlays: ${context.overlays.join(", ") || "none"}`,
      "",
      "Interview prompt:",
      input.prompt || "(empty)",
      "",
      "Candidate notes:",
      input.notes || "(empty)",
      "",
      `Produce the ${context.action.outputShape} response now.`
    ].join("\n");
  }

  private nextStep(action: string): string | null {
    const next: Record<string, string | null> = {
      clarify: "Frame the objective and assumptions.",
      frame: "Choose one persona and workflow.",
      personas: "Prioritize one pain in the selected workflow.",
      options: "Select and scope a focused v1.",
      recommend: "Define tradeoffs, metrics, and guardrails.",
      metrics: "Pressure-test risks and metric gaming.",
      risks: "Integrate mitigations into the v1.",
      skeptic: "Fix the highest-impact gap.",
      summary: null
    };
    return next[action] ?? null;
  }
}
