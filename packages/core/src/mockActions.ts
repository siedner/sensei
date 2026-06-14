import { detectRedFlags } from "./redFlags.js";
import type { AgentRunTrace, CopilotInput, CopilotOutput, ResolvedSkillContext } from "./types.js";

const hasPort = (input: CopilotInput, context: ResolvedSkillContext) =>
  context.overlays.includes("port") || input.company?.toLowerCase() === "port";

function inferPersona(text: string): string {
  const normalized = text.toLowerCase();
  const candidates = [
    ["platform engineer", ["platform engineer", "platform team"]],
    ["security or governance owner", ["security", "governance", "compliance"]],
    ["SRE or incident owner", ["sre", "incident owner"]],
    ["developer", ["developer"]],
    ["engineering manager", ["engineering manager", "eng manager"]]
  ] as const;
  const ranked = candidates
    .map(([persona, terms]) => ({
      persona,
      index: Math.max(...terms.map((term) => normalized.lastIndexOf(term)))
    }))
    .sort((a, b) => b.index - a.index);
  return ranked[0]?.index !== -1 ? ranked[0]!.persona : "platform engineer";
}

function inferWorkflow(text: string): string {
  if (/agent/i.test(text)) return "reviewing and approving an AI agent action before it changes a production workflow";
  if (/incident/i.test(text)) return "coordinating incident response with trusted service context";
  if (/onboard|setup/i.test(text)) return "onboarding a team into the platform and completing its first self-service workflow";
  return "completing a high-value engineering workflow without platform-team manual intervention";
}

function nextStep(action: string): string | null {
  const map: Record<string, string | null> = {
    clarify: "State your assumptions and frame the objective.",
    frame: "Choose one persona and map their workflow.",
    personas: "Walk through the chosen persona's journey and isolate one pain.",
    options: "Select one mechanism and define the smallest credible v1.",
    recommend: "Name the key tradeoff, primary metric, and guardrails.",
    metrics: "Pressure-test whether the metrics prove workflow value.",
    risks: "Return to the v1 and make the mitigation explicit.",
    skeptic: "Fix the largest gap, then continue from the current answer step.",
    summary: null
  };
  return map[action] ?? null;
}

function clarify(input: CopilotInput): string {
  const target = hasPort(input, { overlays: ["port"] } as ResolvedSkillContext) ? "platform team, developers, or governance owners" : "the highest-value user groups";
  return `## Clarifying questions

- Which persona should we optimize for first: ${target}? **Why it matters:** this changes the workflow and success metric.
- Are we solving visibility only, or enabling a concrete action? **Why it matters:** this separates a dashboard from a workflow product.
- Is the primary objective trust and safety, operational efficiency, or adoption? **Why it matters:** this determines the first product bet.
- What boundary should remain human-approved? **Why it matters:** this defines the automation-versus-control tradeoff.`;
}

function frame(input: CopilotInput): string {
  const port = hasPort(input, { overlays: ["port"] } as ResolvedSkillContext);
  return `## Working frame

- **Prompt type:** B2B / workflow
- **Assumptions:** Start with one engineering persona, one repeated workflow, and a local v1 rather than organization-wide transformation.
- **Why now:** AI-driven engineering work increases leverage, but fragmented context and unclear control boundaries reduce trust.
- **Likely surface:** ${port ? "A workflow and governance layer connected to the software catalog" : "A workflow surface integrated into the user's existing work"}
- **Starting lens:** Persona → workflow → context → action → guardrail → interface → metric

**Problem frame:** Help a specific engineering owner complete a high-value workflow faster without losing control, auditability, or trust.`;
}

function personas(input: CopilotInput): string {
  const text = `${input.prompt} ${input.notes}`;
  const recommended = inferPersona(text);
  return `## Persona map

| Persona | JTBD | Pain | Current workaround | Priority |
|---|---|---|---|---|
| Platform engineer | Enable safe, repeatable engineering workflows | Context and controls are fragmented | Tickets, scripts, manual approvals | **Start here** |
| Developer | Complete work without waiting on a platform team | Self-service paths are unclear or untrusted | Slack and ticket escalation | Important beneficiary |
| Security / governance owner | Enforce policy with evidence | Agent and workflow actions lack consistent audit trails | Reviews and periodic audits | Critical partner, not first operator |
| Engineering manager | Improve delivery reliability | Cannot see where workflows stall | Dashboards and status meetings | Later decision-maker view |

**Recommendation:** I’d start with **${recommended}** because they own the control point between developer autonomy and organizational guardrails.`;
}

function options(): string {
  return `## Solution directions

| Option | Mechanism | User value | Business value | Complexity / risk |
|---|---|---|---|---|
| Governed action inbox | Route high-risk actions through contextual approval | Fast, confident decisions | Adoption with controlled risk | Low-complexity v1; approval fatigue |
| Policy-aware workflow engine | Execute low-risk steps and escalate exceptions | Less manual platform work | Scalable self-service | Integration and policy complexity |
| Agent trust scorecard | Evaluate context, permissions, and action history | Clear risk signal | Standardizes governance | Can become passive dashboarding |

**Best v1 candidate:** The governed action inbox. It creates immediate workflow value while preserving human control.`;
}

function recommend(input: CopilotInput): string {
  const text = `${input.prompt} ${input.notes}`;
  const persona = inferPersona(text);
  const workflow = inferWorkflow(text);
  return `## Focused v1

**Recommendation:** A governed action inbox for **${persona}s** ${workflow}.

**Core flow**
1. Receive an action request with service ownership, environment, policy, and change context.
2. Show the decision, risk, and required approval in one view.
3. Approve, reject, or request changes; execute through the existing workflow.
4. Record outcome, approver, and rollback evidence.

**In v1:** One workflow, contextual approval, permissions, audit log, and rollback link.

**Explicitly excluded:** Broad agent marketplace, autonomous policy generation, generalized analytics, and every engineering workflow.

**Why first:** It delivers action plus guardrail, not visibility alone, and tests whether teams will trust governed agent workflows.`;
}

function metrics(): string {
  return `## Success metrics

**Primary metric**
- Percentage of eligible workflows completed successfully through the required policy and approval path.

**Supporting metrics**
- Median time from action request to approved completion.
- Percentage of workflows completed without platform-team manual intervention.

**Guardrails**
- Rollback or manual-intervention rate after execution.
- Permission violations or unsafe actions that bypass policy.

**Vanity metric to avoid**
- Number of agents or workflows created. Inventory does not prove trusted user value.

**Logic:** User value → safe workflow completion → successful governed completion rate.`;
}

function risks(): string {
  return `## Risks and mitigations

| Risk | Why it matters | Mitigation | Guardrail |
|---|---|---|---|
| Missing or stale context | Approvers make unsafe decisions | Show provenance and freshness | Context-related failure rate |
| Incorrect permissions | Actions exceed intended authority | Least privilege and policy checks | Permission violations |
| Approval fatigue | Users bypass or abandon the workflow | Risk-tiered approvals | Approval latency and bypass rate |
| Low trust in automation | Adoption stalls | Preview, evidence, and rollback | Reversal / rollback rate |
| Integration complexity | Time to value becomes too long | Start with one workflow and system | Setup time and integration failures |`;
}

function skeptic(input: CopilotInput): string {
  const flags = detectRedFlags({ ...input, mode: "critique" }).slice(0, 3);
  return `## Tough review

**Biggest gap**
- ${flags[0] ?? "The proposal needs a sharper link between the chosen pain and the v1 mechanism."}

**Likely interviewer pushback**
- “Is this a dashboard, a workflow engine, or a governance layer? Pick the primary job.”

**Weakest dimension**
- ${flags.some((flag) => /persona|segment/i.test(flag)) ? "Segment quality" : "Pain-point specificity"}

**Fixes**
${(flags.length ? flags : ["Choose one persona and workflow."]).map((flag) => `- ${flag}`).join("\n")}`;
}

function summary(input: CopilotInput): string {
  const text = `${input.prompt} ${input.notes}`;
  const persona = inferPersona(text);
  return `## 45-second close

I’d start with **${persona}s** who need to govern high-impact engineering actions but currently lack trusted context, consistent controls, and a fast approval path. The v1 is a **governed action inbox** that combines service context, policy, approval, execution, and audit evidence for one high-value workflow. I’m optimizing for **speed with trust**, so I would keep broad automation and generalized dashboards out of v1. Success is the **percentage of eligible workflows completed successfully through the required policy path**, with rollback rate and permission violations as guardrails.`;
}

export function runMockAction(input: CopilotInput, context: ResolvedSkillContext): CopilotOutput {
  const startedAt = new Date();
  const trace = mockTrace(input, context, startedAt);
  if (context.manifest.id !== "product-sense") {
    return {
      markdown: `## ${context.manifest.name}\n\n- Registered independently\n- Routed through the shared registry\n- Action: ${context.action.label}\n- No core router or adapter changes required`,
      redFlags: [],
      suggestedNextStep: null,
      routing: { primarySkill: context.manifest.id, overlays: [], reason: context.routingReason },
      debug: { adapter: "mock", action: context.action.id },
      trace
    };
  }

  const handlers: Record<string, (input: CopilotInput) => string> = {
    clarify, frame, personas, options, recommend, metrics, risks, skeptic, summary
  };
  const handler = handlers[context.action.id];
  if (!handler) throw new Error(`Mock handler missing for action: ${context.action.id}`);
  return {
    markdown: handler(input),
    redFlags: detectRedFlags(input),
    suggestedNextStep: nextStep(context.action.id),
    routing: {
      primarySkill: context.manifest.id,
      overlays: context.overlays,
      reason: context.routingReason
    },
    debug: { adapter: "mock", action: context.action.id },
    trace
  };
}

function mockTrace(
  input: CopilotInput,
  context: ResolvedSkillContext,
  startedAt: Date
): AgentRunTrace {
  return {
    runId: crypto.randomUUID(),
    startedAt: startedAt.toISOString(),
    status: "success",
    adapter: "mock",
    skill: context.manifest.id,
    action: context.action.id,
    mode: input.mode,
    toolsEnabled: false,
    events: [
      {
        id: "routing",
        label: "Request routed",
        detail: `${context.manifest.name} selected by ${context.routingReason}`,
        elapsedMs: 0,
        status: "success"
      },
      {
        id: "skill",
        label: "Skill instructions loaded",
        detail: `${context.action.label}${context.overlays.length ? ` with ${context.overlays.join(", ")} overlay` : ""}`,
        elapsedMs: 0,
        status: "success"
      },
      {
        id: "mock",
        label: "Deterministic mock executed",
        detail: "No model request or external provider was used",
        elapsedMs: 1,
        status: "success"
      }
    ],
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
      totalTokens: 0,
      estimatedCostUsd: 0,
      durationMs: 1,
      turns: 0,
      retries: 0
    }
  };
}
