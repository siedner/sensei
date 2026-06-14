import { useState } from "react";

/* ── Helpers (same visual language as PlaybookPanel) ────────── */

function Say({ children }: { children: string }) {
  return <blockquote className="pb-say">{children}</blockquote>;
}

function SubStep({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="pb-substep">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

/* ── Section data ────────────────────────────────────────────── */

export interface PlaybookSection {
  id: string;
  number: string;
  title: string;
}

export const PS_SECTIONS: PlaybookSection[] = [
  { id: "ps-spine", number: "0", title: "Canonical Spine" },
  { id: "ps-context", number: "1", title: "Goal / Context" },
  { id: "ps-segment", number: "2", title: "User Segment" },
  { id: "ps-pain", number: "3", title: "Pain Point" },
  { id: "ps-problem", number: "4", title: "Prioritize Problem" },
  { id: "ps-solution", number: "5", title: "Solution" },
  { id: "ps-tradeoffs", number: "6", title: "Tradeoffs" },
  { id: "ps-metrics", number: "7", title: "Metrics & Guardrails" },
  { id: "ps-summary", number: "8", title: "Summary" },
  { id: "ps-memorize", number: "9", title: "One-Minute Version" },
  { id: "ps-ultra", number: "10", title: "Ultra-Short Script" },
];

/* ── Section content components ───────────────────────────── */

function SectionSpine() {
  return (
    <>
      <div className="pb-spine-flow">
        {["Context", "Segment", "Pain Point", "Problem", "Solution", "Tradeoffs", "Metrics", "Summary"].map((s, i, a) => (
          <span key={s} className="pb-spine-step">
            {s}{i < a.length - 1 && <span className="pb-spine-arrow" aria-hidden="true">→</span>}
          </span>
        ))}
      </div>
      <p>Use this as the interview flow. Every answer should move through this spine clearly and deliberately.</p>
    </>
  );
}

function SectionContext() {
  return (
    <>
      <SubStep title="Goal">
        <p>Define the exact boundaries before ideating.</p>
      </SubStep>
      <SubStep title="Tool: The Objective Check">
        <p>Ask yourself:</p>
        <Say>Is this a growth, engagement, or new-build prompt?</Say>
      </SubStep>
      <SubStep title="Action">
        <p>State the goal out loud.</p>
        <p>Ask only clarifying questions that materially change the answer, so you avoid looking indecisive.</p>
      </SubStep>
      <SubStep title="Suggested Phrasing">
        <Say>Before jumping into solutions, I'll first clarify the objective. I'm assuming the goal is to improve [growth / engagement / retention / monetization / user value]. If that's right, I'll optimize around that.</Say>
      </SubStep>
    </>
  );
}

function SectionSegment() {
  return (
    <>
      <SubStep title="Goal">
        <p>Avoid designing for "everyone".</p>
      </SubStep>
      <SubStep title="Tool: Reach / Frequency / ARPU Matrix">
        <p>Slice the user base into mutually exclusive groups:</p>
        <div className="pb-segment-grid">
          {["Families", "Solo users", "Groups", "Power users", "New users", "Casual users", "Enterprise admins", "Creators", "Buyers", "Sellers"].map((seg) => (
            <span key={seg} className="pb-segment-chip">{seg}</span>
          ))}
        </div>
      </SubStep>
      <SubStep title="Decision">
        <p>Score the segments out loud.</p>
        <p>Pick the segment with the highest <strong>Reach</strong> and <strong>Frequency</strong>.</p>
        <p>If there is a tie, use <strong>ARPU</strong> or strategic business value as the tiebreaker.</p>
      </SubStep>
      <SubStep title="Suggested Phrasing">
        <Say>I'll compare these segments by reach, frequency of the problem, and business value. I'm choosing [segment] because they experience this problem often, represent meaningful reach, and are valuable to the business.</Say>
      </SubStep>
    </>
  );
}

function SectionPain() {
  return (
    <>
      <SubStep title="Goal">
        <p>Ground the exercise in actual user struggles.</p>
      </SubStep>
      <SubStep title="Tool: Job-to-be-Done Statement">
        <p>List 3 distinct struggles for your chosen segment:</p>
        <ol className="pb-list">
          <li>Struggle around <strong>discovery</strong></li>
          <li>Struggle around <strong>decision-making</strong></li>
          <li>Struggle around <strong>completion / follow-through</strong></li>
        </ol>
      </SubStep>
      <SubStep title="Decision">
        <p>Frame the winning pain point using this structure:</p>
        <Say>For [segment], the main challenge is [specific problem], which matters because [impact].</Say>
      </SubStep>
      <SubStep title="Suggested Phrasing">
        <Say>For [segment], the main challenge is [specific problem], which matters because [impact on user behavior, satisfaction, retention, revenue, or trust].</Say>
      </SubStep>
    </>
  );
}

function SectionProblem() {
  return (
    <>
      <SubStep title="Goal">
        <p>Lock in exactly <strong>one</strong> problem to solve.</p>
      </SubStep>
      <SubStep title="Tool: Breadth vs. Depth Matrix">
        <p>Evaluate each pain point by:</p>
        <div className="pb-two-col">
          <div>
            <h4>Breadth</h4>
            <p>How many users are affected?</p>
          </div>
          <div>
            <h4>Depth</h4>
            <p>How painful or severe is the problem?</p>
          </div>
        </div>
      </SubStep>
      <SubStep title="Decision">
        <p>Choose the problem based on:</p>
        <ol className="pb-list">
          <li>Users affected</li>
          <li>Severity of pain</li>
        </ol>
      </SubStep>
      <SubStep title="Suggested Phrasing">
        <Say>I'll focus first on [problem] because it is the most frequent blocker for this segment and gives us the clearest path to improvement.</Say>
      </SubStep>
    </>
  );
}

function SectionSolution() {
  return (
    <>
      <SubStep title="Goal">
        <p>Show ideation breadth, then narrow down to a concrete MVP.</p>
      </SubStep>
      <SubStep title="Tool: Modified RICE">
        <p>Use: <strong>Reach</strong>, <strong>Impact</strong>, <strong>Effort</strong></p>
        <p>Drop <strong>Confidence</strong> for interview ideation unless specifically useful.</p>
      </SubStep>
      <SubStep title="Solution Directions">
        <p>Brainstorm 2–4 distinct directions:</p>
        <div className="pb-segment-grid">
          {["Automation", "Personalization", "Social discovery", "Workflow simplification", "Recommendation system", "Notification / reminder loop", "Marketplace / matching", "AI assistant", "Template / guided flow"].map((s) => (
            <span key={s} className="pb-segment-chip">{s}</span>
          ))}
        </div>
      </SubStep>
      <SubStep title="Decision">
        <p>Grade the solutions verbally.</p>
        <Say>Solution A has high reach, but massive effort. Solution B has lower reach, but drives a much deeper impact for our specific problem. For v1, I would choose Solution B because it is more focused and testable.</Say>
      </SubStep>
    </>
  );
}

function SectionTradeoffs() {
  return (
    <>
      <SubStep title="Goal">
        <p>Show conscious decision-making. Name what you optimize for and what you intentionally give up.</p>
      </SubStep>
      <SubStep title="Action">
        <p>Immediately after selecting a solution, state:</p>
        <ul className="pb-list">
          <li>What the chosen solution <strong>optimizes for</strong></li>
          <li>What it <strong>deliberately ignores</strong> for v1</li>
          <li>The <strong>downside risk</strong> and how you'd monitor it</li>
        </ul>
      </SubStep>
      <SubStep title="Risks">
        <p>Identify the top risks of your v1:</p>
        <ul className="pb-list">
          <li>What could go wrong technically?</li>
          <li>What user behavior could undermine the bet?</li>
          <li>What competitive or market risk exists?</li>
          <li>What does failure look like, and how would you detect it early?</li>
        </ul>
      </SubStep>
      <SubStep title="Suggested Phrasing">
        <Say>This v1 optimizes for [speed / clarity / trust / completion / retention]. It deliberately does not solve [adjacent problem] yet. The downside risk is [risk], so I would monitor that with guardrails.</Say>
      </SubStep>
    </>
  );
}

function SectionMetrics() {
  return (
    <>
      <SubStep title="Goal">
        <p>Prove how you will measure success and monitor side effects.</p>
      </SubStep>
      <SubStep title="Tool: Input / Output / Guardrail Trio">
        <p>This is more focused than HEART for interviews.</p>
      </SubStep>
      <div className="pb-metrics-group">
        <h4>Primary Output Metric <small>— use one</small></h4>
        <p>The main success metric. This proves the problem is being solved.</p>
        <ul className="pb-list">
          <li>Task completion rate</li>
          <li>Repeat usage</li>
          <li>Retention lift</li>
          <li>Successful booking rate</li>
          <li>Time saved</li>
          <li>Conversion rate</li>
          <li>Activation rate</li>
        </ul>
      </div>
      <div className="pb-metrics-group">
        <h4>Supporting Input Metrics <small>— use two</small></h4>
        <p>Behavioral signals that lead to the outcome.</p>
        <ul className="pb-list">
          <li>Feature adoption</li>
          <li>Number of completed flows</li>
          <li>Click-through rate on recommendation</li>
          <li>Summary opened and copied</li>
          <li>Reminder created</li>
          <li>Search-to-result interaction</li>
          <li>Number of saved items</li>
        </ul>
      </div>
      <div className="pb-metrics-group">
        <h4>Guardrail Metrics <small>— use two</small></h4>
        <p>Signals that the product may be causing damage.</p>
        <ul className="pb-list">
          <li>Churn</li>
          <li>Uninstalls</li>
          <li>Support tickets</li>
          <li>Opt-out rate</li>
          <li>Complaint rate</li>
          <li>Error rate</li>
          <li>Latency</li>
          <li>Refunds</li>
          <li>Downvotes</li>
          <li>Spam reports</li>
        </ul>
      </div>
      <SubStep title="Suggested Phrasing">
        <Say>My primary metric would be [output metric], because it proves the user problem is being solved. I would support it with [input metric 1] and [input metric 2]. As guardrails, I would monitor [guardrail 1] and [guardrail 2] to make sure we are not creating negative side effects.</Say>
      </SubStep>
    </>
  );
}

function SectionSummary() {
  return (
    <>
      <SubStep title="Goal">
        <p>Close the interview with conviction and structure.</p>
      </SubStep>
      <SubStep title="Action">
        <p>Do <strong>not</strong> trail off. Restate your entire logic chain in one breath.</p>
      </SubStep>
      <SubStep title="Quick Close">
        <Say>In summary, I am solving [prioritized problem] for [target segment] with [chosen solution], and success means moving [primary metric].</Say>
      </SubStep>
      <SubStep title="Full Closing Template">
        <Say>In summary, I clarified that the goal is [goal]. I prioritized [segment] because they have strong reach, frequency, and business value. Their biggest pain point is [pain point], and I chose to focus on [problem] because it has the strongest combination of breadth and depth. I would solve it with [solution], starting with a focused MVP that optimizes for [tradeoff]. Success would be measured by [primary metric], supported by [input metrics], while monitoring [guardrails].</Say>
      </SubStep>
    </>
  );
}

function SectionMemorize() {
  return (
    <ol className="pb-memorize-list">
      {[
        { step: "Context", prompt: "What is the goal?" },
        { step: "Segment", prompt: "Who matters most?" },
        { step: "Pain", prompt: "What do they struggle with?" },
        { step: "Problem", prompt: "Which pain is broad and deep?" },
        { step: "Solution", prompt: "What MVP best solves it?" },
        { step: "Tradeoffs", prompt: "What do you optimize for and give up?" },
        { step: "Metrics", prompt: "How do we prove it worked?" },
        { step: "Summary", prompt: "Restate the logic chain." },
      ].map((item) => (
        <li key={item.step}>
          <strong>{item.step}</strong>
          <span>{item.prompt}</span>
        </li>
      ))}
    </ol>
  );
}

function SectionUltraShort() {
  return (
    <Say>
      {"I'll start by clarifying the goal and constraints. Then I'll choose a target segment instead of solving for everyone. I'll map their main pain points, prioritize one based on breadth and depth, then generate a few solution directions. I'll select the MVP using reach, impact, and effort. Then I'll call out the conscious tradeoffs — what v1 optimizes for, what it excludes, and the risks. I'll define one primary success metric with supporting inputs and guardrails. I'll close by summarizing the full logic chain."}
    </Say>
  );
}

/* ── Section renderer map ─────────────────────────────────── */

export const PS_RENDERERS: Record<string, () => React.JSX.Element> = {
  "ps-spine": SectionSpine,
  "ps-context": SectionContext,
  "ps-segment": SectionSegment,
  "ps-pain": SectionPain,
  "ps-problem": SectionProblem,
  "ps-solution": SectionSolution,
  "ps-tradeoffs": SectionTradeoffs,
  "ps-metrics": SectionMetrics,
  "ps-summary": SectionSummary,
  "ps-memorize": SectionMemorize,
  "ps-ultra": SectionUltraShort,
};
