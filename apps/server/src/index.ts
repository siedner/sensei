import {
  copilotInputSchema,
  SkillRegistry,
  type AgentAdapter,
  type CopilotOutput
} from "@sensei/core";
import cors from "cors";
import express from "express";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ZodError } from "zod";
import { MockAdapter } from "./adapters/MockAdapter.js";
import { PiAdapter } from "./adapters/PiAdapter.js";
import { AgentRunError } from "./AgentRunError.js";
import { getRuntimeOptions, loadProviderEnvironment } from "./runtimeOptions.js";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(currentDir, "../../..");
loadProviderEnvironment(rootDir);
const port = Number(process.env.SENSEI_PORT ?? 3131);
const app = express();
const registry = loadSkillRegistry();
const sessionSkills = new Map<string, string>();

const allowedOrigin = (origin?: string): boolean => {
  if (!origin) return true;
  try {
    const url = new URL(origin);
    return (
      (["localhost", "127.0.0.1"].includes(url.hostname) && ["http:", "https:"].includes(url.protocol)) ||
      url.protocol === "chrome-extension:"
    );
  } catch {
    return false;
  }
};

app.disable("x-powered-by");
app.use(cors({
  origin(origin, callback) {
    callback(null, allowedOrigin(origin));
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json({ limit: "128kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, adapter: process.env.SENSEI_AGENT_ADAPTER ?? "mock" });
});

app.get("/api/skills", (_request, response) => {
  response.json({ skills: registry.list() });
});

app.get("/api/runtime", (_request, response) => {
  response.json(getRuntimeOptions());
});

app.post("/api/run", async (request, response) => {
  try {
    const input = copilotInputSchema.parse(request.body);
    const parsedCommand = registry.parseCommand(input.command);
    if (parsedCommand?.kind === "list") {
      const markdown = registry.list()
        .map((skill) => `- **${skill.name}** (${skill.invocation.join(", ")}): ${skill.description}`)
        .join("\n");
      return response.json(systemOutput(markdown, "skills"));
    }
    if (parsedCommand?.kind === "help") {
      return response.json(systemOutput(
        "## Commands\n\n- `/skills` — list installed skills\n- `/product-sense` — select Product Sense\n- `/product-sense metrics` — run a specific action\n- Choose **Auto** to return routing to inference.",
        "help"
      ));
    }
    if (parsedCommand?.kind === "unknown") {
      return response.status(400).json({
        error: {
          code: "UNKNOWN_COMMAND",
          message: "Unknown command.",
          suggestions: parsedCommand.suggestions ?? []
        }
      });
    }

    const currentSessionSkill = input.sessionId ? sessionSkills.get(input.sessionId) : undefined;
    const context = registry.resolve(input, currentSessionSkill);
    if (input.sessionId) sessionSkills.set(input.sessionId, context.manifest.id);

    const adapter = createAdapter(input.runtime?.adapter ?? process.env.SENSEI_AGENT_ADAPTER ?? "mock");
    const output = await adapter.run(input, context);
    response.json(output);
  } catch (error) {
    if (error instanceof ZodError) {
      return response.status(400).json({
        error: { code: "INVALID_REQUEST", message: "Request validation failed.", details: error.flatten() }
      });
    }
    const message = error instanceof Error ? error.message : "Unknown server error";
    response.status(/unknown|does not support/i.test(message) ? 400 : 503).json({
      error: {
        code: "AGENT_UNAVAILABLE",
        message,
        ...(error instanceof AgentRunError ? { trace: error.trace } : {})
      }
    });
  }
});

function createAdapter(name: string): AgentAdapter {
  if (name === "mock") return new MockAdapter();
  if (name === "pi") return new PiAdapter(rootDir);
  throw new Error(`Unknown adapter "${name}". Use mock or pi.`);
}

function loadSkillRegistry(): SkillRegistry {
  const registry = new SkillRegistry([]);
  const skillsDir = path.join(rootDir, ".pi", "skills");
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(skillsDir, entry.name, "manifest.json");
    if (!fs.existsSync(manifestPath)) continue;
    registry.register(JSON.parse(fs.readFileSync(manifestPath, "utf8")));
  }
  if (registry.list().length === 0) throw new Error("No valid Sensei skills were discovered.");
  return registry;
}

function systemOutput(markdown: string, action: string): CopilotOutput {
  const now = new Date();
  return {
    markdown,
    redFlags: [],
    suggestedNextStep: null,
    routing: { primarySkill: "system", overlays: [], reason: "command" },
    debug: { adapter: "mock", action },
    trace: {
      runId: crypto.randomUUID(),
      startedAt: now.toISOString(),
      status: "success",
      adapter: "mock",
      skill: "system",
      action,
      mode: "live",
      toolsEnabled: false,
      events: [{
        id: "command",
        label: "Local command handled",
        detail: "No model request was needed",
        elapsedMs: 0,
        status: "success"
      }],
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadTokens: 0,
        cacheWriteTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
        durationMs: 0,
        turns: 0,
        retries: 0
      }
    }
  };
}

async function start(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    const { createServer } = await import("vite");
    const vite = await createServer({
      root: path.join(rootDir, "apps", "web"),
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const webDist = path.join(rootDir, "apps", "web", "dist");
    app.use(express.static(webDist));
    app.get("*", (_request, response) => response.sendFile(path.join(webDist, "index.html")));
  }

  app.listen(port, "127.0.0.1", () => {
    console.log(`Sensei is running at http://localhost:${port}`);
  });
}

void start();
