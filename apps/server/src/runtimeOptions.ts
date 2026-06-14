import type { AgentProviderOption, AgentRuntimeOptions } from "@sensei/core";
import { ModelRegistry } from "@mariozechner/pi-coding-agent";
import fs from "node:fs";
import path from "node:path";

const openCodeGoModels = [
  { id: "qwen3.6-plus", name: "Qwen 3.6 Plus", note: "Validated default for structured agent work" },
  { id: "minimax-m3", name: "MiniMax M3", note: "Higher-throughput option" },
  { id: "qwen3.5-plus", name: "Qwen 3.5 Plus", note: "Lower-cost routine work" },
  { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash", note: "Fast reasoning" },
  { id: "kimi-k2.5", name: "Kimi K2.5", note: "Synthesis-heavy alternative" },
  { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro", note: "Higher-quality ceiling" }
];

const openCodeZenModels = [
  { id: "deepseek-v4-flash-free", name: "DeepSeek V4 Flash Free", note: "Verified fast Zen default" },
  { id: "big-pickle", name: "Big Pickle", note: "Verified general free option" },
  { id: "mimo-v2.5-free", name: "MiMo V2.5 Free", note: "Verified alternative free option" }
];

const openAiModels = [
  { id: "gpt-5.4-mini", name: "GPT-5.4 Mini", note: "Recommended fast default" },
  { id: "gpt-5.5", name: "GPT-5.5", note: "Complex professional work" },
  { id: "gpt-5.5-pro", name: "GPT-5.5 Pro", note: "Highest precision; slower" },
  { id: "gpt-5.4", name: "GPT-5.4", note: "Frontier general model" },
  { id: "gpt-5-mini", name: "GPT-5 Mini", note: "Fast and economical" },
  { id: "gpt-4.1-mini", name: "GPT-4.1 Mini", note: "Stable structured fallback" }
];

export function loadProviderEnvironment(rootDir: string): void {
  const candidates = [
    process.env.SENSEI_PROVIDER_ENV_FILE,
    path.join(rootDir, ".env.local"),
    "/Users/mac/code/Rabota/.env.local"
  ].filter((value): value is string => Boolean(value));

  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    const text = fs.readFileSync(file, "utf8");
    for (const line of text.split(/\r?\n/)) {
      const match = line.match(/^([A-Z][A-Z0-9_]*)=(.*)$/);
      if (!match || process.env[match[1]!]) continue;
      let value = match[2]!.trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[match[1]!] = value;
    }
  }
}

export function getRuntimeOptions(): AgentRuntimeOptions {
  const providers: AgentProviderOption[] = [
    {
      id: "opencodego-go",
      name: "OpenCode Go",
      description: "OpenCode Go hosted models",
      configured: Boolean(process.env.OPENCODEGO_API_KEY),
      models: openCodeGoModels
    },
    {
      id: "opencode-zen",
      name: "OpenCode Zen",
      description: "OpenCode Zen free and pay-as-you-go models",
      configured: Boolean(process.env.OPENCODEGO_API_KEY),
      models: openCodeZenModels
    },
    {
      id: "openai",
      name: "OpenAI",
      description: "OpenAI hosted frontier models",
      configured: Boolean(process.env.OPENAI_API_KEY),
      models: openAiModels
    }
  ];

  const configuredDefault = providers.find((provider) => provider.configured) ?? providers[0]!;
  return {
    defaultAdapter: (process.env.SENSEI_AGENT_ADAPTER === "pi" ? "pi" : "mock"),
    defaultProvider: configuredDefault.id,
    defaultModel: configuredDefault.models[0]?.id,
    providers
  };
}

export function registerRuntimeProviders(registry: ModelRegistry): void {
  const openCodeKey = process.env.OPENCODEGO_API_KEY;
  if (openCodeKey) {
    registry.registerProvider("opencodego-go", providerDefinition(
      "OpenCode Go",
      "https://opencode.ai/zen/go/v1",
      openCodeKey,
      openCodeGoModels
    ));
    registry.registerProvider("opencode-zen", providerDefinition(
      "OpenCode Zen",
      "https://opencode.ai/zen/v1",
      openCodeKey,
      openCodeZenModels
    ));
  }
}

export function validateRuntimeSelection(providerId?: string, modelId?: string): void {
  if (!providerId || !modelId) return;
  const provider = getRuntimeOptions().providers.find((candidate) => candidate.id === providerId);
  if (!provider?.configured) throw new Error(`Provider is not configured: ${providerId}`);
  if (!provider.models.some((model) => model.id === modelId)) {
    throw new Error(`Model is not enabled for ${provider.name}: ${modelId}`);
  }
}

function providerDefinition(
  name: string,
  baseUrl: string,
  apiKey: string,
  models: AgentProviderOption["models"]
): Parameters<ModelRegistry["registerProvider"]>[1] {
  return {
    name,
    baseUrl,
    apiKey,
    api: "openai-completions",
    models: models.map((model) => ({
      id: model.id,
      name: model.name,
      reasoning: true,
      input: ["text"],
      cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
      contextWindow: 131_072,
      maxTokens: 16_384
    }))
  };
}
