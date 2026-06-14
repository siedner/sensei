import {
  ANSWER_SPINE,
  PRODUCT_SENSE_ACTIONS,
  type AnswerStep,
  type AgentRunTrace,
  type AgentRuntimeOptions,
  type AgentRuntimeSelection,
  type CopilotMode,
  type CopilotOutput,
  type SkillMetadata
} from "@sensei/core";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { PlaybookPanel } from "./PlaybookPanel.js";

type ActiveTab = "workspace" | "playbook";

const REMARK_PLUGINS = [remarkGfm];

const MarkdownOutput = memo(function MarkdownOutput({ markdown }: { markdown: string }) {
  return (
    <article className="markdown-output">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS}>{markdown}</ReactMarkdown>
    </article>
  );
});

const SAMPLE_PROMPT =
  "Port wants to help engineering organizations manage AI agents operating across the software development lifecycle. Design a product experience that gives platform teams visibility, control, and confidence over these agents.";
const SAMPLE_NOTES =
  "Need to think through personas: platform engineer, developer, eng manager, SRE, security/governance. Likely pain: agents can act but teams lack trust, context, auditability, and control. Need workflow not dashboard only.";
const STORAGE_KEY = "sensei.workspace.v1";

// Critique leads: it pressure-tests the user's own draft rather than answering for them,
// so the live exercise reads as their judgment sharpened — not outsourced.
const MODE_ORDER: CopilotMode[] = ["critique", "live", "practice"];
const MODE_HINTS: Record<CopilotMode, string> = {
  critique: "Pressure-test your own draft — gaps, tradeoffs, and what they'll push on.",
  live: "Concise next-move nudges while you work the exercise out loud.",
  practice: "Fuller scaffolding for rehearsing before the room."
};

interface PersistedState {
  prompt: string;
  notes: string;
  command: string;
  mode: CopilotMode;
  currentStep: AnswerStep;
  completedSteps: AnswerStep[];
  skillIds?: string[];
  elapsedSeconds: number;
  timerRunning: boolean;
  timerStartedAt: number | null;
  output: CopilotOutput | null;
  runtime?: AgentRuntimeSelection;
  runHistory: AgentRunTrace[];
}

export interface WorkbenchProps {
  apiBase?: string;
  surface?: "web" | "extension";
  captureSelection?: () => Promise<string>;
}

const initialState: PersistedState = {
  prompt: "",
  notes: "",
  command: "",
  mode: "critique",
  currentStep: "goal_context",
  completedSteps: [],
  elapsedSeconds: 0,
  timerRunning: false,
  timerStartedAt: null,
  output: null,
  runHistory: []
};

function readState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...initialState, ...JSON.parse(raw) } : initialState;
  } catch {
    return initialState;
  }
}

function formatTime(total: number): string {
  const minutes = Math.floor(total / 60).toString().padStart(2, "0");
  const seconds = Math.floor(total % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function formatDuration(milliseconds: number): string {
  return milliseconds < 1000 ? `${milliseconds} ms` : `${(milliseconds / 1000).toFixed(1)} s`;
}

function formatCost(cost: number | null): string {
  if (cost === null) return "Unavailable";
  if (cost === 0) return "$0.00";
  return cost < 0.01 ? `<$0.01` : `$${cost.toFixed(2)}`;
}

export function Workbench({
  apiBase = "",
  surface = "web",
  captureSelection
}: WorkbenchProps) {
  const [state, setState] = useState<PersistedState>(readState);
  const [skills, setSkills] = useState<SkillMetadata[]>([]);
  const [runtimeOptions, setRuntimeOptions] = useState<AgentRuntimeOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copyState, setCopyState] = useState("Copy");
  const [showCommands, setShowCommands] = useState(false);
  const [activeCommand, setActiveCommand] = useState(-1);
  const [captureDraft, setCaptureDraft] = useState("");
  const [routingDetails, setRoutingDetails] = useState(false);
  const [errorTrace, setErrorTrace] = useState<AgentRunTrace | null>(null);
  const [showRuntime, setShowRuntime] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("workspace");
  const commandRef = useRef<HTMLInputElement>(null);
  const runtimeRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLElement>(null);
  const requestController = useRef<AbortController | null>(null);
  const sessionId = useMemo(() => {
    const key = "sensei.session.id";
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    return created;
  }, []);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Persist on idle rather than on every state change. The timer ticks once a
  // second; without debouncing, the whole workspace (output markdown + up to 50
  // run traces) was re-serialized to localStorage every tick. A 1.5s debounce
  // (longer than the 1s tick) coalesces a running timer into zero writes until
  // it stops, and the visibility/unload flush guards against losing data.
  useEffect(() => {
    const persist = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateRef.current));
      } catch {
        // storage unavailable or full — drop the write rather than throw
      }
    };
    const timeout = window.setTimeout(persist, 1500);
    const flush = () => {
      window.clearTimeout(timeout);
      persist();
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("beforeunload", flush);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("beforeunload", flush);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [state]);

  useEffect(() => {
    fetch(`${apiBase}/api/skills`, { signal: AbortSignal.timeout(8000) })
      .then(async (response) => {
        if (!response.ok) throw new Error("Skill registry unavailable.");
        return response.json() as Promise<{ skills: SkillMetadata[] }>;
      })
      .then((data) => setSkills(data.skills))
      .catch(() => setSkills([]));
  }, [apiBase]);

  useEffect(() => {
    fetch(`${apiBase}/api/runtime`, { signal: AbortSignal.timeout(8000) })
      .then(async (response) => {
        if (!response.ok) throw new Error("Runtime options unavailable.");
        return response.json() as Promise<AgentRuntimeOptions>;
      })
      .then((options) => {
        setRuntimeOptions(options);
        setState((current) => current.runtime ? current : {
          ...current,
          runtime: {
            adapter: options.defaultAdapter,
            provider: options.defaultProvider,
            model: options.defaultModel
          }
        });
      })
      .catch(() => setRuntimeOptions(null));
  }, [apiBase]);

  useEffect(() => {
    if (!state.timerRunning || state.timerStartedAt === null) return;
    const tick = () => {
      const delta = Math.floor((Date.now() - state.timerStartedAt!) / 1000);
      setState((current) => ({ ...current, elapsedSeconds: delta }));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [state.timerRunning, state.timerStartedAt]);

  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        commandRef.current?.focus();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, []);

  // L1: close the runtime (engine/provider/model) popover on outside click or Escape.
  useEffect(() => {
    if (!showRuntime) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!runtimeRef.current?.contains(event.target as Node)) setShowRuntime(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setShowRuntime(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showRuntime]);

  // L2: when a run starts, bring the output panel into view so the result is
  // never stranded below the fold in the single-column side panel.
  useEffect(() => {
    if (loading) outputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [loading]);

  const set = <K extends keyof PersistedState>(key: K, value: PersistedState[K]) =>
    setState((current) => ({ ...current, [key]: value }));

  const run = useCallback(async (action?: string, explicitCommand?: string) => {
    const command = explicitCommand ?? (state.command.trim() || undefined);
    if (!state.prompt.trim() && !state.notes.trim() && !command) {
      setError("Add the interview prompt or notes before running Sensei.");
      return;
    }
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(true);
    setError("");
    setErrorTrace(null);
    try {
      const response = await fetch(`${apiBase}/api/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          command,
          prompt: state.prompt,
          notes: state.notes,
          currentStep: state.currentStep,
          company: /\bport(?:\.io)?\b/i.test(`${state.prompt} ${state.notes}`) ? "port" : null,
          mode: state.mode,
          runtime: state.runtime,
          skillIds: state.skillIds,
          sessionId
        }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(60000)])
      });
      const body = await response.json() as CopilotOutput & {
        error?: { message: string; suggestions?: string[]; trace?: AgentRunTrace };
      };
      if (!response.ok || body.error) {
        if (body.error?.trace) {
          setErrorTrace(body.error.trace);
          setState((current) => ({
            ...current,
            runHistory: [body.error!.trace!, ...current.runHistory]
              .filter((trace, index, traces) =>
                traces.findIndex((candidate) => candidate.runId === trace.runId) === index
              )
              .slice(0, 50)
          }));
        }
        const suggestions = body.error?.suggestions?.length
          ? ` Try: ${body.error.suggestions.join(", ")}`
          : "";
        throw new Error(`${body.error?.message ?? "Sensei request failed."}${suggestions}`);
      }
      setState((current) => ({
        ...current,
        output: body,
        command: "",
        runHistory: [body.trace, ...current.runHistory]
          .filter((trace, index, traces) =>
            traces.findIndex((candidate) => candidate.runId === trace.runId) === index
          )
          .slice(0, 50)
      }));
      setShowCommands(false);
    } catch (caught) {
      if (requestController.current === controller) {
        setError(caught instanceof DOMException && caught.name === "TimeoutError"
          ? "Sensei timed out waiting for the local server."
          : caught instanceof DOMException && caught.name === "AbortError"
            ? "Run cancelled."
            : caught instanceof Error ? caught.message : "Sensei is unavailable.");
      }
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  }, [apiBase, sessionId, state]);

  const commandSuggestions = useMemo(() => {
    const query = state.command.toLowerCase();
    const defaults = [
      { command: "/skills", detail: "List installed skills" },
      { command: "/help", detail: "Show command help" }
    ];
    const skillCommands = skills.flatMap((skill) => [
      ...skill.invocation.map((command) => ({ command, detail: skill.description })),
      ...skill.actions.map((action) => ({
        command: `${skill.invocation[0]} ${action.id}`,
        detail: action.description
      }))
    ]);
    return [...defaults, ...skillCommands]
      .filter((item) => !query || item.command.toLowerCase().includes(query))
      .slice(0, 8);
  }, [skills, state.command]);

  const toggleStep = (step: AnswerStep) => {
    const completed = state.completedSteps.includes(step)
      ? state.completedSteps.filter((item) => item !== step)
      : [...state.completedSteps, step];
    setState((current) => ({ ...current, completedSteps: completed, currentStep: step }));
  };

  const timerStart = () => {
    setState((current) => ({
      ...current,
      timerRunning: true,
      timerStartedAt: Date.now() - current.elapsedSeconds * 1000
    }));
  };

  const timerPause = () => setState((current) => ({
    ...current,
    timerRunning: false,
    timerStartedAt: null
  }));

  const timerReset = () => setState((current) => ({
    ...current,
    elapsedSeconds: 0,
    timerRunning: false,
    timerStartedAt: null
  }));

  const copyOutput = async () => {
    if (!state.output?.markdown) return;
    await navigator.clipboard.writeText(state.output.markdown);
    setCopyState("Copied");
    window.setTimeout(() => setCopyState("Copy"), 1200);
  };

  const requestCapture = async () => {
    if (!captureSelection) return;
    setError("");
    try {
      const selected = await captureSelection();
      if (!selected.trim()) throw new Error("No text is selected in the active page.");
      setCaptureDraft(selected.trim());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not capture the selection.");
    }
  };

  const configuredProviders = runtimeOptions?.providers.filter((provider) => provider.configured) ?? [];
  const selectedProvider = configuredProviders.find((provider) => provider.id === state.runtime?.provider)
    ?? configuredProviders[0];

  const setAdapter = (adapter: AgentRuntimeSelection["adapter"]) => {
    setState((current) => ({
      ...current,
      runtime: adapter === "mock"
        ? { adapter: "mock" }
        : {
            adapter: "pi",
            provider: current.runtime?.provider ?? selectedProvider?.id,
            model: current.runtime?.model ?? selectedProvider?.models[0]?.id
          }
    }));
  };

  const setProvider = (providerId: string) => {
    const provider = configuredProviders.find((candidate) => candidate.id === providerId);
    setState((current) => ({
      ...current,
      runtime: {
        adapter: "pi",
        provider: providerId,
        model: provider?.models[0]?.id
      }
    }));
  };

  const usageSummary = useMemo(() => state.runHistory.reduce((summary, trace) => {
    summary.runs += 1;
    summary.failures += trace.status === "error" ? 1 : 0;
    summary.tokens += trace.usage.totalTokens;
    summary.durationMs += trace.usage.durationMs;
    if (trace.usage.estimatedCostUsd !== null) {
      summary.knownCost += trace.usage.estimatedCostUsd;
      summary.hasKnownCost = true;
    }
    return summary;
  }, {
    runs: 0,
    failures: 0,
    tokens: 0,
    durationMs: 0,
    knownCost: 0,
    hasKnownCost: false
  }), [state.runHistory]);

  return (
    <main className={`sensei-app sensei-app--${surface}`}>
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">S</span>
          <div>
            <h1>Sensei</h1>
            <p>Live PM Exercise Copilot</p>
          </div>
        </div>
        <div className="tab-bar" role="tablist" aria-label="View">
          <button
            role="tab"
            className={activeTab === "workspace" ? "active" : ""}
            aria-selected={activeTab === "workspace"}
            onClick={() => setActiveTab("workspace")}
          >
            Workspace
          </button>
          <button
            role="tab"
            className={activeTab === "playbook" ? "active" : ""}
            aria-selected={activeTab === "playbook"}
            onClick={() => setActiveTab("playbook")}
          >
            Playbook
          </button>
        </div>
        <div className="topbar-controls">
          <div className="segmented" role="radiogroup" aria-label="Copilot mode">
            {MODE_ORDER.map((mode) => (
              <button
                className={state.mode === mode ? "active" : ""}
                key={mode}
                role="radio"
                aria-checked={state.mode === mode}
                title={MODE_HINTS[mode]}
                onClick={() => set("mode", mode)}
              >
                {mode[0]!.toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button
            className={`skill-chip ${state.skillIds?.length ? "explicit" : ""}`}
            onClick={() => set("skillIds", undefined)}
            title="Click to return to automatic skill routing"
          >
            {state.skillIds?.[0] ?? "Auto skill"}
          </button>
          <div className="runtime" ref={runtimeRef}>
            <button
              className="runtime-toggle"
              aria-expanded={showRuntime}
              aria-controls="sensei-runtime"
              onClick={() => setShowRuntime((value) => !value)}
              title="Engine, provider, and model"
            >
              <span className="gear" aria-hidden="true">⚙</span>
              {(state.runtime?.adapter ?? runtimeOptions?.defaultAdapter) === "pi"
                ? selectedProvider?.name ?? "Pi"
                : "Mock"}
            </button>
            {showRuntime && (
              <div className="runtime-popover" id="sensei-runtime">
                <div className="runtime-controls">
            <label>
              <span>Engine</span>
              <select
                aria-label="Agent engine"
                value={state.runtime?.adapter ?? runtimeOptions?.defaultAdapter ?? "mock"}
                onChange={(event) => setAdapter(event.target.value as AgentRuntimeSelection["adapter"])}
              >
                <option value="mock">Mock</option>
                <option value="pi">Pi</option>
              </select>
            </label>
            {(state.runtime?.adapter ?? runtimeOptions?.defaultAdapter) === "pi" && (
              <>
                <label>
                  <span>Provider</span>
                  <select
                    aria-label="Pi provider"
                    value={selectedProvider?.id ?? ""}
                    onChange={(event) => setProvider(event.target.value)}
                    disabled={!configuredProviders.length}
                  >
                    {configuredProviders.map((provider) => (
                      <option key={provider.id} value={provider.id}>{provider.name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Model</span>
                  <select
                    aria-label="Pi model"
                    value={state.runtime?.model ?? selectedProvider?.models[0]?.id ?? ""}
                    onChange={(event) => setState((current) => ({
                      ...current,
                      runtime: {
                        adapter: "pi",
                        provider: selectedProvider?.id,
                        model: event.target.value
                      }
                    }))}
                    disabled={!selectedProvider}
                  >
                    {selectedProvider?.models.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.note ? `${model.name} · ${model.note}` : model.name}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
                </div>
              </div>
            )}
          </div>
          <div className="timer">
            <strong>{formatTime(state.elapsedSeconds)}</strong>
            {state.timerRunning
              ? <button onClick={timerPause}>Pause</button>
              : <button onClick={timerStart}>Start</button>}
            <button onClick={timerReset}>Reset</button>
          </div>
        </div>
      </header>

      {activeTab === "playbook" ? (
        <PlaybookPanel />
      ) : (
      <section className="workspace">
        <aside className="spine-panel">
          <div className="section-heading">
            <span>Answer spine</span>
            <small>{state.completedSteps.length}/8</small>
          </div>
          <ol className="spine-list">
            {ANSWER_SPINE.map((step, index) => {
              const completed = state.completedSteps.includes(step.id);
              const current = state.currentStep === step.id;
              return (
                <li key={step.id} className={current ? "current" : ""}>
                  <button
                    onClick={() => toggleStep(step.id)}
                    aria-pressed={completed}
                    aria-current={current ? "step" : undefined}
                    aria-label={`Step ${index + 1}: ${step.label}${completed ? " (complete)" : ""}`}
                  >
                    <span className={`step-check ${completed ? "done" : ""}`} aria-hidden="true">
                      {completed ? "✓" : index + 1}
                    </span>
                    <span>
                      <strong>{step.label}</strong>
                      <small>{step.hint}</small>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="phase-note">
            <span>Current phase</span>
            <strong>{ANSWER_SPINE.find((step) => step.id === state.currentStep)?.label}</strong>
            <p>{ANSWER_SPINE.find((step) => step.id === state.currentStep)?.hint}</p>
          </div>
        </aside>

        <section className="input-panel">
          <p className="mode-hint">
            <strong>{state.mode[0]!.toUpperCase() + state.mode.slice(1)} mode</strong>
            {" · "}{MODE_HINTS[state.mode]}
          </p>
          <div className="command-wrap">
            <label htmlFor="sensei-command">Launch a skill</label>
            <div className="command-input">
              <span className="command-glyph" aria-hidden="true">/</span>
              <input
                id="sensei-command"
                ref={commandRef}
                value={state.command}
                role="combobox"
                aria-expanded={showCommands}
                aria-controls="sensei-command-menu"
                aria-haspopup="listbox"
                aria-autocomplete="list"
                aria-activedescendant={
                  showCommands && activeCommand >= 0 ? `sensei-command-option-${activeCommand}` : undefined
                }
                onChange={(event) => {
                  set("command", event.target.value);
                  setShowCommands(true);
                  setActiveCommand(-1);
                }}
                onFocus={() => setShowCommands(true)}
                onBlur={() => {
                  setShowCommands(false);
                  setActiveCommand(-1);
                }}
                onKeyDown={(event) => {
                  const menuOpen = showCommands && commandSuggestions.length > 0;
                  if (menuOpen && event.key === "ArrowDown") {
                    event.preventDefault();
                    setActiveCommand((index) => (index + 1) % commandSuggestions.length);
                    return;
                  }
                  if (menuOpen && event.key === "ArrowUp") {
                    event.preventDefault();
                    setActiveCommand((index) =>
                      (index <= 0 ? commandSuggestions.length : index) - 1
                    );
                    return;
                  }
                  if (event.key === "Enter") {
                    if (menuOpen && activeCommand >= 0) {
                      event.preventDefault();
                      set("command", commandSuggestions[activeCommand]!.command);
                      setShowCommands(false);
                      setActiveCommand(-1);
                      return;
                    }
                    if (state.command.trim()) void run();
                    return;
                  }
                  if (event.key === "Escape") {
                    setShowCommands(false);
                    setActiveCommand(-1);
                  }
                }}
                placeholder="Type / for commands, or pick an action below"
                autoComplete="off"
              />
              <kbd>⌘K</kbd>
            </div>
            {showCommands && (
              <div className="command-menu" id="sensei-command-menu" role="listbox">
                {commandSuggestions.length ? commandSuggestions.map((item, index) => (
                  <button
                    key={item.command}
                    id={`sensei-command-option-${index}`}
                    role="option"
                    aria-selected={index === activeCommand}
                    className={index === activeCommand ? "active" : ""}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveCommand(index)}
                    onClick={() => {
                      set("command", item.command);
                      setShowCommands(false);
                      setActiveCommand(-1);
                    }}
                  >
                    <strong>{item.command}</strong>
                    <span>{item.detail}</span>
                  </button>
                )) : <p>No matching command. Use <strong>/skills</strong> to inspect installed skills.</p>}
              </div>
            )}
          </div>

          <div className="field-heading">
            <label htmlFor="sensei-prompt">Exercise prompt</label>
            <div>
              {captureSelection && <button className="text-button" onClick={requestCapture}>Capture selection</button>}
              <button
                className="text-button"
                onClick={() => setState((current) => ({ ...current, prompt: SAMPLE_PROMPT, notes: SAMPLE_NOTES }))}
              >
                Load sample
              </button>
            </div>
          </div>
          <textarea
            id="sensei-prompt"
            className="prompt-field"
            value={state.prompt}
            onChange={(event) => set("prompt", event.target.value)}
            placeholder="Paste the product exercise prompt…"
          />

          <label htmlFor="sensei-notes">Working notes</label>
          <textarea
            id="sensei-notes"
            className="notes-field"
            value={state.notes}
            onChange={(event) => set("notes", event.target.value)}
            placeholder="Think out loud here: persona, workflow, pain, options, decisions…"
          />

          <p className="actions-label">Quick actions <span>— same as typing the command above</span></p>
          <div className="actions">
            {PRODUCT_SENSE_ACTIONS.map((action) => (
              <button
                key={action.id}
                className={state.output?.debug.action === action.id ? "active-action" : ""}
                disabled={loading}
                onClick={() => void run(action.id)}
                title={action.description}
              >
                {action.label}
              </button>
            ))}
          </div>
          <p className="privacy-note">Local workspace. Content is sent only to the configured local adapter/provider when you run an action.</p>
        </section>

        <aside className="output-panel" ref={outputRef}>
          <div className="section-heading output-heading">
            <span>Sensei output</span>
            <button disabled={!state.output?.markdown} onClick={copyOutput} aria-live="polite">{copyState}</button>
          </div>

          {error && (
            <>
              <div className="error-state" role="alert">
                <strong>Couldn’t run Sensei</strong>
                <p>{error}</p>
                <button onClick={() => void run(errorTrace?.action ?? state.output?.debug.action)}>Retry</button>
              </div>
              {errorTrace && (
                <RunInspector
                  trace={errorTrace}
                  summary={usageSummary}
                  onClear={() => setState((current) => ({ ...current, runHistory: [] }))}
                />
              )}
            </>
          )}
          {loading && (
            <div className="loading-state" role="status" aria-live="polite">
              <span aria-hidden="true" />
              <div>
                <strong>Pi is working…</strong>
                <small>Routing, loading the skill, and waiting for the provider.</small>
              </div>
              <button onClick={() => requestController.current?.abort()}>Cancel</button>
            </div>
          )}
          {!loading && !error && !state.output && (
            <div className="empty-state">
              <span className="empty-mark">S</span>
              <strong>Choose an action when you need a scaffold.</strong>
              <p>Sensei will keep the response concise and ready to paste into Notion.</p>
            </div>
          )}
          {!loading && state.output && (
            <>
              <MarkdownOutput markdown={state.output.markdown} />
              {state.output.trace && (
                <RunInspector
                  trace={state.output.trace}
                  summary={usageSummary}
                  onClear={() => setState((current) => ({ ...current, runHistory: [] }))}
                />
              )}
              {state.output.suggestedNextStep && (
                <div className="next-step">
                  <span>Suggested next step</span>
                  <p>{state.output.suggestedNextStep}</p>
                </div>
              )}
              <div className="routing">
                <button
                  onClick={() => setRoutingDetails((value) => !value)}
                  aria-expanded={routingDetails}
                  aria-controls="sensei-routing-details"
                >
                  {state.output.routing.primarySkill} · {state.output.routing.reason}
                </button>
                {routingDetails && (
                  <p id="sensei-routing-details">
                    Adapter: {state.output.debug.adapter}. Action: {state.output.debug.action}.
                    {state.output.debug.provider ? ` Provider: ${state.output.debug.provider}.` : ""}
                    {state.output.debug.model ? ` Model: ${state.output.debug.model}.` : ""}
                    {state.output.routing.overlays.length ? ` Overlays: ${state.output.routing.overlays.join(", ")}.` : ""}
                  </p>
                )}
              </div>
              <div className="red-flags">
                <div className="section-heading"><span>Watch-outs</span><small>{state.output.redFlags.length}</small></div>
                {state.output.redFlags.length
                  ? state.output.redFlags.map((flag) => <p key={flag}>{flag}</p>)
                  : <p className="all-clear">No high-impact gap detected at this phase.</p>}
              </div>
            </>
          )}
        </aside>
      </section>
      )}

      {captureDraft && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="Confirm selected text">
          <div className="capture-modal">
            <span>Captured selection</span>
            <textarea value={captureDraft} onChange={(event) => setCaptureDraft(event.target.value)} />
            <div>
              <button onClick={() => setCaptureDraft("")}>Cancel</button>
              <button onClick={() => {
                set("prompt", captureDraft);
                setCaptureDraft("");
              }}>Replace prompt</button>
              <button className="primary-action" onClick={() => {
                set("prompt", [state.prompt, captureDraft].filter(Boolean).join("\n\n"));
                setCaptureDraft("");
              }}>Append</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

interface RunInspectorProps {
  trace: AgentRunTrace;
  summary: {
    runs: number;
    failures: number;
    tokens: number;
    durationMs: number;
    knownCost: number;
    hasKnownCost: boolean;
  };
  onClear: () => void;
}

function RunInspector({ trace, summary, onClear }: RunInspectorProps) {
  const [expanded, setExpanded] = useState(true);
  const [copyLabel, setCopyLabel] = useState("Copy trace");
  const copyTrace = async () => {
    await navigator.clipboard.writeText(JSON.stringify(trace, null, 2));
    setCopyLabel("Copied");
    window.setTimeout(() => setCopyLabel("Copy trace"), 1200);
  };

  return (
    <section className={`run-inspector run-inspector--${trace.status}`}>
      <div className="run-inspector-heading">
        <button onClick={() => setExpanded((value) => !value)} aria-expanded={expanded}>
          <span className="trace-status" aria-hidden="true" />
          Run inspector
          <small>{trace.adapter === "pi" ? `${trace.provider} / ${trace.model}` : "Local mock"}</small>
        </button>
        <span>{formatDuration(trace.usage.durationMs)}</span>
      </div>
      {expanded && (
        <>
          <div className="usage-grid" aria-label="Current run usage">
            <div><span>Input</span><strong>{trace.usage.inputTokens.toLocaleString()}</strong></div>
            <div><span>Output</span><strong>{trace.usage.outputTokens.toLocaleString()}</strong></div>
            <div><span>Total tokens</span><strong>{trace.usage.totalTokens.toLocaleString()}</strong></div>
            <div><span>Est. cost</span><strong>{formatCost(trace.usage.estimatedCostUsd)}</strong></div>
            <div><span>Turns</span><strong>{trace.usage.turns}</strong></div>
            <div><span>Retries</span><strong>{trace.usage.retries}</strong></div>
          </div>
          <ol className="trace-list">
            {trace.events.map((event) => (
              <li key={`${event.id}-${event.elapsedMs}`} className={`trace-event--${event.status}`}>
                <span className="trace-node" />
                <div>
                  <strong>{event.label}</strong>
                  {event.detail && <p>{event.detail}</p>}
                </div>
                <time>+{formatDuration(event.elapsedMs)}</time>
              </li>
            ))}
          </ol>
          <div className="trace-safety">
            <span>{trace.toolsEnabled ? "Tools enabled" : "Tools disabled"}</span>
            <p>Operational trace only. Private model reasoning is not recorded or displayed.</p>
          </div>
          <div className="usage-history">
            <div>
              <span>Local usage</span>
              <strong>
                {summary.runs} runs · {summary.tokens.toLocaleString()} tokens · {formatDuration(summary.durationMs)}
                {summary.failures ? ` · ${summary.failures} failed` : ""}
                {summary.hasKnownCost ? ` · ${formatCost(summary.knownCost)}` : ""}
              </strong>
            </div>
            <div>
              <button onClick={copyTrace} aria-live="polite">{copyLabel}</button>
              <button onClick={onClear} disabled={!summary.runs}>Clear</button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
