import React, { memo, useCallback, useState, useRef, useEffect, useMemo } from "react";
import { PS_SECTIONS, PS_RENDERERS, type PlaybookSection } from "./ProductSensePlaybook.js";

/* ── Section data ────────────────────────────────────────────────── */

type PlaybookId = "agentic" | "product-sense";

const PLAYBOOK_META: Record<PlaybookId, { title: string; subtitle: string }> = {
  "product-sense": {
    title: "Product Sense Interview Playbook",
    subtitle: "A step-by-step execution scheme for senior product managers.",
  },
  agentic: {
    title: "Port / Agentic PM Interview Playbook",
    subtitle: "A cheat sheet to keep you focused, structured, and senior during the interview.",
  },
};

const AGENTIC_SECTIONS: PlaybookSection[] = [
  { id: "meta", number: "0", title: "The Meta-Point" },
  { id: "spine", number: "1", title: "Product-Sense Spine" },
  { id: "hacts", number: "2", title: "HACTS Framework" },
  { id: "generic", number: "3", title: "Don't Be Generic" },
  { id: "questions", number: "4", title: "Common Questions" },
  { id: "patterns", number: "5", title: "Solution Patterns" },
  { id: "metrics", number: "6", title: "Metrics Bank" },
  { id: "trust", number: "7", title: "Trust & Safety" },
  { id: "stuck", number: "8", title: "When You're Stuck" },
  { id: "positioning", number: "9", title: "Personal Positioning" },
  { id: "closing", number: "10", title: "Closing Template" },
  { id: "emergency", number: "11", title: "Emergency Version" },
  { id: "principle", number: "12", title: "One-Line Principle" },
];

/* ── Helpers ──────────────────────────────────────────────────────── */

function Say({ children }: { children: string }) {
  return <blockquote className="pb-say">{children}</blockquote>;
}

function Avoid({ items }: { items: string[] }) {
  return (
    <div className="pb-avoid">
      <span className="pb-badge pb-badge--avoid">Avoid</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Replace({ items }: { items: string[] }) {
  return (
    <div className="pb-replace">
      <span className="pb-badge pb-badge--replace">Replace with</span>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function Ladder({ steps }: { steps: string[] }) {
  return (
    <ol className="pb-ladder">
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </ol>
  );
}

function Checklist({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (index: number) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  return (
    <ul className="pb-checklist">
      {items.map((item, i) => (
        <li key={i}>
          <label>
            <input
              type="checkbox"
              checked={checked.has(i)}
              onChange={() => toggle(i)}
            />
            <span>{item}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function KillerLine({ children }: { children: string }) {
  return <p className="pb-killer">{children}</p>;
}

function SubStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-substep">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

function QuestionBlock({
  title,
  children,
  oneLiner,
}: {
  title: string;
  children: React.ReactNode;
  oneLiner: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-question-block">
      <button
        className="pb-question-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pb-question-arrow" aria-hidden="true">{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && (
        <div className="pb-question-body">
          {children}
          <KillerLine>{oneLiner}</KillerLine>
        </div>
      )}
    </div>
  );
}

function PatternBlock({
  title,
  useWhen,
  flow,
  metric,
}: {
  title: string;
  useWhen: string;
  flow: string[];
  metric: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="pb-pattern-block">
      <button
        className="pb-question-toggle"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span className="pb-question-arrow" aria-hidden="true">{open ? "▾" : "▸"}</span>
        {title}
      </button>
      {open && (
        <div className="pb-question-body">
          <p className="pb-use-when"><strong>Use when:</strong> {useWhen}</p>
          <p className="pb-flow-label"><strong>Flow:</strong></p>
          <ol className="pb-flow">
            {flow.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="pb-metric-label"><strong>Metric:</strong> {metric}</p>
        </div>
      )}
    </div>
  );
}

/* ── Section contents ─────────────────────────────────────────── */

function SectionMeta() {
  return (
    <>
      <p>Do <strong>not</strong> try to sound like you know every Port feature.</p>
      <p>Your position should be:</p>
      <Say>I may not know the full product internals, so I'll reason from the user, the workflow, and the platform primitives: context, tools, governance, and measurable outcomes.</Say>
      <p>The goal is to sound like a PM who can handle:</p>
      <ul className="pb-list">
        <li>Developer tools</li>
        <li>Platform products</li>
        <li>AI agents</li>
        <li>Enterprise governance</li>
        <li>Technical workflows</li>
        <li>Metrics and tradeoffs</li>
      </ul>
    </>
  );
}

function SectionSpine() {
  return (
    <>
      <p className="pb-spine-label">Use this for <strong>any</strong> question.</p>
      <div className="pb-spine-flow">
        {["Context", "Segment", "Pain", "Problem", "Solution", "Tradeoffs", "Metrics", "Summary"].map((s, i, a) => (
          <span key={s} className="pb-spine-step">
            {s}{i < a.length - 1 && <span className="pb-spine-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>

      <SubStep title="Context">
        <p>Ask:</p>
        <ul className="pb-list">
          <li>What is the goal?</li>
          <li>Are we optimizing for adoption, productivity, reliability, governance, revenue, or retention?</li>
          <li>Is this a new-build, growth, engagement, or operational-efficiency prompt?</li>
        </ul>
        <Say>I'll first clarify the objective. I'm assuming the goal is [X]. I'll optimize for that unless you want me to focus somewhere else.</Say>
      </SubStep>

      <SubStep title="Segment">
        <p>Do not solve for everyone. Pick a clear segment:</p>
        <ul className="pb-list">
          <li>Developers / service owners</li>
          <li>Platform engineers</li>
          <li>Engineering managers</li>
          <li>Security / governance teams</li>
          <li>AI agents as operational actors</li>
          <li>Admins configuring agent workflows</li>
        </ul>
        <Say>I'll choose [segment] because they experience this pain frequently and have a clear measurable outcome.</Say>
      </SubStep>

      <SubStep title="Pain">
        <p>Find the real struggle. Good pain structures:</p>
        <ul className="pb-list">
          <li>"They know what's wrong, but not what to do next."</li>
          <li>"They need to take action, but context is fragmented."</li>
          <li>"They rely on platform teams for repetitive work."</li>
          <li>"They don't trust automation enough to let it act."</li>
          <li>"Agents have tools, but not enough governed context."</li>
        </ul>
        <Say>For [segment], the main challenge is [specific pain], which matters because [impact].</Say>
      </SubStep>

      <SubStep title="Problem">
        <p>Pick one problem. Do not solve everything. Prioritize by:</p>
        <ul className="pb-list">
          <li><strong>Breadth:</strong> how many users/workflows are affected?</li>
          <li><strong>Depth:</strong> how painful/risky/frequent is it?</li>
          <li><strong>Strategic value:</strong> does it align with agentic platform direction?</li>
        </ul>
        <Say>I'll focus first on [problem] because it is broad, painful, and gives us a measurable path to improvement.</Say>
      </SubStep>

      <SubStep title="Solution">
        <p>Show 2–3 directions, then choose one. Examples:</p>
        <ul className="pb-list">
          <li>Guided remediation agent</li>
          <li>Agent control center</li>
          <li>Agent-ready onboarding wizard</li>
          <li>Approved action marketplace</li>
          <li>Trust/evidence layer</li>
          <li>Workflow automation assistant</li>
          <li>Engineering manager insight agent</li>
        </ul>
        <Say>I considered [A], [B], and [C]. I'd choose [B] for v1 because it has the best impact-to-effort ratio and is narrow enough to test.</Say>
      </SubStep>

      <SubStep title="Tradeoffs">
        <p>Consciously state what is optimized for and what is given up/risked:</p>
        <ul className="pb-list">
          <li>Optimize for speed, safety, or accuracy in v1.</li>
          <li>Name the explicit risk of delegation: trust, cost, latency, or dependency.</li>
          <li>Specify what you are deliberately NOT doing in v1.</li>
        </ul>
        <Say>For v1, we are optimizing for developer control and safety over full automation. We deliberately require manual approval for all execution steps, accepting the trade-off of higher friction to gain initial trust.</Say>
      </SubStep>

      <SubStep title="Metrics">
        <p><strong>Primary metric examples:</strong></p>
        <ul className="pb-list">
          <li>Time to remediation</li>
          <li>Workflow completion rate</li>
          <li>% of tasks completed without escalation</li>
          <li>Reduction in platform tickets</li>
          <li>Production-readiness pass rate</li>
          <li>Time to first successful workflow</li>
          <li>Successful agent task completion rate</li>
        </ul>
        <p><strong>Supporting metric examples:</strong></p>
        <ul className="pb-list">
          <li>Recommendation acceptance rate</li>
          <li>Self-service action completion rate</li>
          <li>% of tasks with enough context</li>
          <li>Repeat usage</li>
          <li>Setup completion</li>
          <li>Approval rate</li>
        </ul>
        <p><strong>Guardrail examples:</strong></p>
        <ul className="pb-list">
          <li>Incorrect recommendation rate</li>
          <li>Rollback/revert rate</li>
          <li>Unauthorized action attempts</li>
          <li>Failed workflow execution</li>
          <li>Support tickets</li>
          <li>Cost/latency</li>
          <li>Human override rate</li>
          <li>Trust/satisfaction score</li>
        </ul>
        <Say>I'd measure success by the workflow outcome, not AI engagement.</Say>
      </SubStep>

      <SubStep title="Summary">
        <p>Close cleanly.</p>
        <Say>In summary, I'm solving [problem] for [segment] with [solution], and success means improving [primary metric] while guarding against [risk].</Say>
      </SubStep>
    </>
  );
}

function SectionHACTS() {
  return (
    <>
      <p>Use this whenever the question involves <strong>AI agents</strong>.</p>
      <div className="pb-spine-flow">
        {["Human", "Agent", "Context", "Tools", "Safety", "Success"].map((s, i, a) => (
          <span key={s} className="pb-spine-step">
            {s}{i < a.length - 1 && <span className="pb-spine-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>

      <SubStep title="H — Human">
        <p>Ask:</p>
        <ul className="pb-list">
          <li>Who owns the outcome?</li>
          <li>Who needs trust, control, and visibility?</li>
        </ul>
        <p>Possible humans: Developer, Platform engineer, Engineering manager, Security/admin, SRE/DevOps</p>
        <Say>I'd separate the human stakeholder from the agent. The human still owns the outcome, so they need trust, control, and visibility.</Say>
      </SubStep>

      <SubStep title="A — Agent">
        <p>Ask:</p>
        <ul className="pb-list">
          <li>What job is the agent hired to do?</li>
          <li>Is it diagnosing, recommending, preparing, executing, or verifying?</li>
        </ul>
        <Say>I would not start with a generic AI assistant. I'd start with one narrow, repeated workflow where the agent can reliably help.</Say>
      </SubStep>

      <SubStep title="C — Context">
        <p>Ask:</p>
        <ul className="pb-list">
          <li>What does the agent need to know?</li>
          <li>Is the context fresh, structured, permission-aware, and complete?</li>
        </ul>
        <p>Typical engineering context: Services, Owners, Repos, Deployments, Incidents, Alerts, Docs, Tickets, Dependencies, Scorecards, Previous actions, Permissions</p>
        <Say>The agent is only as useful as the context layer. Before designing the UI, I'd define what entities exist, how they relate, how fresh they are, and whether the agent can trust them.</Say>
      </SubStep>

      <SubStep title="T — Tools">
        <p>Ask: What can the agent do? Through which approved workflows?</p>
        <p>Use the tool ladder:</p>
        <Ladder steps={["Read", "Recommend", "Prepare", "Execute", "Verify"]} />
        <Say>I'd allow broad read and recommend capabilities, but keep execution narrow, approved, reversible, and logged.</Say>
      </SubStep>

      <SubStep title="S — Safety">
        <p>Ask: What can go wrong? What needs approval? What must never be automated in v1?</p>
        <p>Safety controls: Permissions, Approval, Audit logs, Rollback, Evidence, Human override, Policy boundaries</p>
        <Say>The trust model is part of the product. Every recommendation should show evidence, source data, expected impact, and required approval.</Say>
      </SubStep>

      <SubStep title="S — Success">
        <p>Ask: What real workflow gets better?</p>
        <Say>The metric is not chats per user. The metric is whether the workflow is completed faster, safer, and with less human escalation.</Say>
      </SubStep>
    </>
  );
}

function SectionGeneric() {
  return (
    <>
      <Avoid
        items={[
          '"Let\'s add a chatbot."',
          '"The AI will automate everything."',
          '"Users will engage more."',
          '"We\'ll measure DAU."',
          '"The agent will know what to do."',
          '"We\'ll use AI to improve productivity."',
        ]}
      />
      <Replace
        items={[
          '"The agent needs structured context."',
          '"Execution should be permission-aware."',
          '"Start with read/recommend/prepare before autonomous execution."',
          '"Measure workflow outcomes."',
          '"Use approval and audit for trust."',
          '"Narrow v1 to one repeated painful workflow."',
        ]}
      />
    </>
  );
}

function SectionQuestions() {
  return (
    <>
      <QuestionBlock
        title="Design an AI agent that helps developers resolve production-readiness issues"
        oneLiner="I'm solving the gap between 'we know this service is not production-ready' and 'the owner knows exactly what safe action to take next.'"
      >
        <ul className="pb-list">
          <li><strong>Human:</strong> service owner</li>
          <li><strong>Agent job:</strong> diagnose failed checks and guide remediation</li>
          <li><strong>Context:</strong> service metadata, owner, repo, alerts, incidents, docs, dependencies</li>
          <li><strong>Tools:</strong> explain failure, suggest fix, create ticket/PR, run approved workflow, verify</li>
          <li><strong>Safety:</strong> approvals, audit, permissions, rollback</li>
          <li><strong>Success:</strong> time from failed check to remediation</li>
        </ul>
      </QuestionBlock>

      <QuestionBlock
        title="Design a product for AI agents as the primary user"
        oneLiner="An agent does not need delight. It needs high-quality context, clear goals, safe tools, permission boundaries, and feedback loops."
      >
        <ul className="pb-list">
          <li>Do not anthropomorphize the agent.</li>
          <li>Define functional needs: Goal, Context, Tools, Permissions, Constraints, Feedback, Memory/audit</li>
        </ul>
      </QuestionBlock>

      <QuestionBlock
        title="Design an agent control center for platform teams"
        oneLiner="If microservices needed a catalog, agents will need one too."
      >
        <ul className="pb-list">
          <li><strong>Human:</strong> platform admin</li>
          <li><strong>Pain:</strong> many agents, unclear ownership/actions/permissions</li>
          <li><strong>Product:</strong> catalog for agents</li>
          <li><strong>Features:</strong> Agent owner, Purpose, Connected tools, Permissions, Recent actions, Success/failure rate, Risk level, Cost, Audit trail</li>
          <li><strong>Metric:</strong> % of agents with owner and policy; investigation time; unsafe action attempts</li>
        </ul>
      </QuestionBlock>

      <QuestionBlock
        title="Design onboarding for a company that wants to become agent-ready"
        oneLiner="The problem is not installing an agent. The problem is preparing the organization's context, workflows, and permissions so the agent can act safely."
      >
        <ul className="pb-list">
          <li><strong>Human:</strong> platform team/admin</li>
          <li><strong>Pain:</strong> data and workflows are not ready for agents</li>
          <li><strong>Product:</strong> Agent Readiness Setup Wizard</li>
        </ul>
        <p>Steps:</p>
        <ol className="pb-list">
          <li>Connect systems</li>
          <li>Validate catalog coverage</li>
          <li>Define core entities</li>
          <li>Configure allowed actions</li>
          <li>Set approvals</li>
          <li>Test sample workflows</li>
          <li>Publish to developers</li>
        </ol>
        <p><strong>Metric:</strong> time to first successful governed agent workflow</p>
      </QuestionBlock>

      <QuestionBlock
        title="Design governance for AI agents in engineering workflows"
        oneLiner="Autonomy should be earned gradually. I'd start with read, recommend, and prepare before giving the agent broad execution rights."
      >
        <p>Use capability levels:</p>
        <Ladder steps={["Read", "Recommend", "Prepare", "Execute", "Verify"]} />
        <p>For v1: Read/recommend broadly. Prepare with clear evidence. Execute only approved, reversible workflows. Block high-risk actions.</p>
      </QuestionBlock>

      <QuestionBlock
        title="Design a marketplace of approved agent actions / MCP tools"
        oneLiner="The marketplace is not just discovery. It is governance for what agents are allowed to do."
      >
        <ul className="pb-list">
          <li><strong>Human:</strong> platform team + developers</li>
          <li><strong>Agent:</strong> needs discoverable, safe tools</li>
          <li><strong>Pain:</strong> too many tools, unclear risk, duplicated workflows</li>
          <li><strong>Product:</strong> Tool catalog — Owner, Risk level, Inputs/outputs, Required permissions, Approval mode, Usage logs, Success rate</li>
          <li><strong>Metric:</strong> approved tool adoption, successful executions, blocked unsafe attempts</li>
        </ul>
      </QuestionBlock>
    </>
  );
}

function SectionPatterns() {
  return (
    <>
      <PatternBlock
        title="Guided Remediation"
        useWhen="Something is failing and the user needs the next action"
        flow={["Detect issue", "Explain why it matters", "Recommend fix", "Prepare change", "Ask approval", "Execute", "Verify"]}
        metric="Time to remediation"
      />
      <PatternBlock
        title="Agent Control Center"
        useWhen="Many agents exist and admins need governance"
        flow={["List agents", "Show owner/purpose", "Show tools/permissions", "Show actions/logs", "Show risk", "Let admin pause/restrict/approve"]}
        metric="% of agents governed by policy"
      />
      <PatternBlock
        title="Agent-Ready Setup Wizard"
        useWhen="Company wants to adopt agents but data/workflows are messy"
        flow={["Connect systems", "Map entities", "Validate data quality", "Define allowed tools", "Configure approvals", "Run test task", "Launch"]}
        metric="Time to first successful governed workflow"
      />
      <PatternBlock
        title="Evidence Layer"
        useWhen="Trust is the main barrier"
        flow={["Show recommendation", "Show source data", "Show confidence/reasoning summary", "Show expected impact", "Show action preview", "Ask approval"]}
        metric="Recommendation acceptance rate / Incorrect recommendation rate"
      />
      <PatternBlock
        title="Workflow Orchestration Agent"
        useWhen="Human has to coordinate many tools"
        flow={["Understand goal", "Gather context", "Create plan", "Execute approved steps", "Report outcome", "Log audit trail"]}
        metric="Workflow completion without escalation"
      />
    </>
  );
}

function SectionMetrics() {
  return (
    <>
      <div className="pb-metrics-group">
        <h4>Primary Metrics <small>— use one</small></h4>
        <ul className="pb-list">
          <li>Median time to remediation</li>
          <li>Workflow completion rate</li>
          <li>% of failed checks resolved within X days</li>
          <li>Reduction in platform-team tickets</li>
          <li>Time to first successful workflow</li>
          <li>Successful agent task completion rate</li>
          <li>Production-readiness pass rate</li>
          <li>Incident investigation time</li>
          <li>Developer self-service completion rate</li>
        </ul>
      </div>
      <div className="pb-metrics-group">
        <h4>Supporting Metrics <small>— use two</small></h4>
        <ul className="pb-list">
          <li>Agent recommendation acceptance rate</li>
          <li>Self-service action execution rate</li>
          <li>% of recommendations with sufficient context</li>
          <li>% of services with required metadata</li>
          <li>Setup completion rate</li>
          <li>Approval rate</li>
          <li>Repeat usage by target segment</li>
          <li>Number of workflows configured</li>
          <li>PR/ticket creation from agent suggestions</li>
          <li>Verification success rate</li>
        </ul>
      </div>
      <div className="pb-metrics-group">
        <h4>Guardrails <small>— use two</small></h4>
        <ul className="pb-list">
          <li>Incorrect recommendation rate</li>
          <li>Rollback/revert rate</li>
          <li>Unauthorized action attempts</li>
          <li>Failed workflow execution</li>
          <li>Permission mismatch</li>
          <li>Support ticket increase</li>
          <li>Human override rate</li>
          <li>Admin disable/pause rate</li>
          <li>Cost per successful task</li>
          <li>Latency</li>
          <li>User trust score</li>
          <li>Audit log gaps</li>
        </ul>
      </div>
    </>
  );
}

function SectionTrust() {
  return (
    <>
      <p>Before giving the agent autonomy, ask:</p>
      <Checklist
        items={[
          "Can it only see what the user can see?",
          "Can it only run actions the user can run?",
          "Does it require approval for risky actions?",
          "Is every action logged?",
          "Can a human inspect why it acted?",
          "Can a human override or stop it?",
          "Is there rollback?",
          "Are high-risk actions blocked in v1?",
          "Is the source data visible?",
          "Is the expected impact previewed before execution?",
        ]}
      />
      <Say>I'd treat trust, permissions, and auditability as core product requirements, not implementation details.</Say>
    </>
  );
}

function SectionStuck() {
  return (
    <>
      <SubStep title="If you don't know the product deeply">
        <Say>I don't want to assume too much about the exact product internals, so I'll reason from the workflow: who owns the outcome, what context exists, what actions are safe, and how success is measured.</Say>
      </SubStep>
      <SubStep title="If the prompt is too broad">
        <Say>I'll narrow this to one high-frequency workflow first, because broad agentic products can become vague quickly.</Say>
      </SubStep>
      <SubStep title="If you start over-explaining AI">
        <Say>Let me bring this back to the user workflow and the measurable outcome.</Say>
      </SubStep>
      <SubStep title='If you are tempted to say "engagement"'>
        <Say>For this kind of product, I'd avoid making engagement the primary metric. I'd measure whether the workflow outcome improved.</Say>
      </SubStep>
      <SubStep title="If they ask about autonomy">
        <Say>I'd stage autonomy. Read and recommend first, prepare next, execute only when the action is approved, reversible, and audited.</Say>
      </SubStep>
      <SubStep title='If they ask "why now?"'>
        <Say>Agents are becoming capable of taking action across tools, but that creates a need for structured context, governance, permissions, and observability.</Say>
      </SubStep>
    </>
  );
}

function SectionPositioning() {
  return (
    <>
      <p>Use your background.</p>
      <Say>My background is useful here because I've worked on technical product surfaces and GenAI capabilities, but I also build products myself. So I tend to think about AI not as a magic layer, but as a workflow layer: what context does it need, what tools can it safely use, and how do we know it worked?</Say>
      <div className="pb-two-col">
        <div>
          <h4>Mention</h4>
          <ul className="pb-list">
            <li>GenAI product experience</li>
            <li>Technical PM background</li>
            <li>Builder mindset</li>
            <li>Data/workflow thinking</li>
            <li>UX instincts</li>
            <li>Enterprise/platform awareness</li>
          </ul>
        </div>
        <div>
          <h4>Avoid</h4>
          <ul className="pb-list">
            <li>Over-indexing on "I know Port"</li>
            <li>Pretending to know internals</li>
            <li>Too much implementation detail</li>
            <li>Generic AI hype</li>
          </ul>
        </div>
      </div>
    </>
  );
}

function SectionClosing() {
  return (
    <>
      <p>Use this at the end of <strong>any</strong> answer:</p>
      <Say>In summary, I'm solving [problem] for [human stakeholder], while treating the agent as an operational actor that needs [context], [tools], and [safety boundaries]. For v1, I'd focus on [narrow workflow], because it is painful, frequent, and measurable. The solution is [product concept], and success means improving [primary metric], while guarding against [risk 1] and [risk 2].</Say>
    </>
  );
}

function SectionEmergency() {
  return (
    <>
      <p>If you freeze, say this:</p>
      <Say>I'd frame this as a human-plus-agent workflow. First I'd identify the human who owns the outcome, then the narrow job the agent should perform. I'd map the context the agent needs, define which tools it can use, and separate read, recommend, prepare, execute, and verify. I'd keep execution permission-aware, approved, reversible, and audited. Success should be measured by the workflow outcome, not by AI engagement.</Say>
    </>
  );
}

function SectionPrinciple() {
  return (
    <>
      <p>Memorize this:</p>
      <Say>Agentic product management is not about adding chat; it is about giving agents the right context, tools, permissions, and feedback loops so humans can get better outcomes safely.</Say>
    </>
  );
}

const AGENTIC_RENDERERS: Record<string, () => React.JSX.Element> = {
  meta: SectionMeta,
  spine: SectionSpine,
  hacts: SectionHACTS,
  generic: SectionGeneric,
  questions: SectionQuestions,
  patterns: SectionPatterns,
  metrics: SectionMetrics,
  trust: SectionTrust,
  stuck: SectionStuck,
  positioning: SectionPositioning,
  closing: SectionClosing,
  emergency: SectionEmergency,
  principle: SectionPrinciple,
};

const ALL_RENDERERS: Record<string, () => React.JSX.Element> = {
  ...AGENTIC_RENDERERS,
  ...PS_RENDERERS,
};

/* ── Accordion section ────────────────────────────────────────── */

function AccordionSection({
  section,
  open,
  onToggle,
}: {
  section: PlaybookSection;
  open: boolean;
  onToggle: () => void;
}) {
  const Renderer = ALL_RENDERERS[section.id]!;
  return (
    <section className="pb-section" id={`pb-${section.id}`}>
      <button
        className={`pb-section-toggle ${open ? "pb-section-toggle--open" : ""}`}
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={`pb-content-${section.id}`}
      >
        <span className="pb-section-num">{section.number}</span>
        <span className="pb-section-title">{section.title}</span>
        <span className="pb-section-chevron" aria-hidden="true">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="pb-section-body" id={`pb-content-${section.id}`}>
          <Renderer />
        </div>
      )}
    </section>
  );
}

/* ── Main panel ───────────────────────────────────────────────── */

export const PlaybookPanel = memo(function PlaybookPanel() {
  const [activePlaybook, setActivePlaybook] = useState<PlaybookId>("product-sense");
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["ps-spine"]));
  const [activeNav, setActiveNav] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const sections = useMemo(
    () => (activePlaybook === "agentic" ? AGENTIC_SECTIONS : PS_SECTIONS),
    [activePlaybook]
  );
  const meta = PLAYBOOK_META[activePlaybook];

  const switchPlaybook = useCallback((id: PlaybookId) => {
    setActivePlaybook(id);
    const defaultOpen = id === "agentic" ? "meta" : "ps-spine";
    setOpenSections(new Set([defaultOpen]));
    setActiveNav(defaultOpen);
    setIsMobileMenuOpen(false);
    // Scroll content to top
    contentRef.current?.scrollTo({ top: 0 });
  }, []);

  const toggle = useCallback((id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setOpenSections(new Set(sections.map((s) => s.id)));
  }, [sections]);

  const collapseAll = useCallback(() => {
    setOpenSections(new Set());
  }, []);

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(`pb-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setOpenSections((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      setIsMobileMenuOpen(false);
    }
  }, []);

  const toggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen((prev) => !prev);
  }, []);

  // Track which section is in view for the nav highlight
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace("pb-", "");
            setActiveNav(id);
            break;
          }
        }
      },
      { rootMargin: "-60px 0px -70% 0px", threshold: 0 }
    );
    for (const section of sections) {
      const el = document.getElementById(`pb-${section.id}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <div className={`playbook ${isMobileMenuOpen ? "pb-nav-open" : ""}`}>
      <nav className="pb-nav" aria-label="Playbook sections">
        <div className="pb-switcher" role="radiogroup" aria-label="Playbook">
          <button
            role="radio"
            aria-checked={activePlaybook === "product-sense"}
            className={activePlaybook === "product-sense" ? "active" : ""}
            onClick={() => switchPlaybook("product-sense")}
          >
            Product Sense
          </button>
          <button
            role="radio"
            aria-checked={activePlaybook === "agentic"}
            className={activePlaybook === "agentic" ? "active" : ""}
            onClick={() => switchPlaybook("agentic")}
          >
            Agentic PM
          </button>
        </div>
        <div className="pb-nav-header">
          <span>Sections</span>
          <div>
            <button onClick={expandAll} title="Expand all sections">All ↓</button>
            <button onClick={collapseAll} title="Collapse all sections">All ↑</button>
          </div>
        </div>
        <ol className="pb-nav-list">
          {sections.map((section) => (
            <li key={section.id}>
              <button
                className={activeNav === section.id ? "pb-nav-active" : ""}
                onClick={() => scrollTo(section.id)}
              >
                <span className="pb-nav-num">{section.number}</span>
                {section.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <div className="pb-content" ref={contentRef}>
        <header className="pb-header">
          <h2>{meta.title}</h2>
          <p>{meta.subtitle}</p>
        </header>
        {sections.map((section) => (
          <AccordionSection
            key={section.id}
            section={section}
            open={openSections.has(section.id)}
            onToggle={() => toggle(section.id)}
          />
        ))}
      </div>

      {/* Floating mobile navigation toggle button */}
      <button
        className="pb-mobile-nav-toggle"
        onClick={toggleMobileMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMobileMenuOpen}
      >
        {isMobileMenuOpen ? "✕" : "☰"}
      </button>
    </div>
  );
});
