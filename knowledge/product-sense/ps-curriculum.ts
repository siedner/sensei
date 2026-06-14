import type { PsDrillType } from "./product-sense-types";

export interface PsLesson {
  slug: string;
  title: string;
  eyebrow: string;
  concept: string;
  conceptDetail: string[];       // supporting paragraphs
  strongExample: PsExample;
  weakExample: PsExample;
  commonMistake: string;
  mistakeDetail: string;
  takeaway: string;
  relatedDrill: PsDrillType;
}

export interface PsExample {
  label: "Strong" | "Weak";
  prompt: string;
  response: string;
  annotation: string;            // why it's strong/weak
}

// eyebrow ("Lesson N of M") is derived from array position below, so inserting
// or reordering lessons never desyncs the numbering.
const PS_CURRICULUM_RAW: Omit<PsLesson, "eyebrow">[] = [
  {
    slug: "lead-the-interview",
    title: "Lead the Interview Clearly",
    concept: "Make every evaluation signal easy for the interviewer to recognize.",
    conceptDetail: [
      "Start with 2–4 assumptions that narrow the exercise without choosing the answer in advance. State your role, relevant market or platform boundary, and any constraint that materially shapes the exercise.",
      "Announce a short game plan before solving: motivation, audience, problems, solutions, and v1. Before each section, take a brief thinking pause, then waypoint with language such as 'Now that we have the target user, I'll map their journey and prioritize one problem.'",
      "Lead with ownership while remaining adaptable. Use concise check-ins at major decision points, but do not repeatedly ask the interviewer what to do next.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "Design a gardening product for Meta.",
      response:
        "I'll assume I'm building a zero-to-one product inside Meta's existing family of apps, initially for U.S. home gardening rather than commercial agriculture. I'll first establish why this matters and a guiding mission, then map the ecosystem, choose a user segment, identify and prioritize problems, explore three solution directions, and define a v1. Does that plan work before I begin with the product motivation?",
      annotation:
        "The assumptions focus the exercise without selecting a feature. The candidate owns a complete plan and gives the interviewer one useful opportunity to redirect.",
    },
    weakExample: {
      label: "Weak",
      prompt: "Design a gardening product for Meta.",
      response:
        "Should I make an app? Which users should I focus on? Do you want me to talk about problems or features first? I think an AI plant scanner could be useful.",
      annotation:
        "The candidate asks the interviewer to lead, prematurely selects a feature, and provides no visible structure.",
    },
    commonMistake: "Thinking out loud without separating process from conclusions.",
    mistakeDetail:
      "Unstructured narration forces the interviewer to reconstruct your reasoning. Pause silently, organize the next section, then present it with a clear transition and conclusion.",
    takeaway:
      "Set useful assumptions, announce the route, waypoint at transitions, and check in only when redirection would save meaningful time.",
    relatedDrill: "opening_waypointing",
  },
  {
    slug: "what-is-product-sense",
    title: "What Product Sense Actually Is",
    concept: "Product sense is structured user-centered judgment under ambiguity.",
    conceptDetail: [
      "In PM interviews, product sense is the ability to take an ambiguous prompt, understand the user and the problem, make principled choices, and propose a product direction that is useful, coherent, and measurable.",
      "It is NOT the same as feature brainstorming, analytics fluency, execution planning, or vague 'vision' talk. What distinguishes product sense is the combination of structure, user empathy, tradeoff reasoning, and measurable thinking — all under time pressure and ambiguity.",
      "The canonical framework structures this into 8 steps: Goal/Context → User Segment → Pain Point → Problem Prioritization → Solution → Tradeoffs → Metrics & Guardrails → Summary. Every strong answer touches all 8. Every weak answer skips at least one.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "How would you improve Spotify?",
      response:
        "Before diving in: I'll focus on improving Spotify for podcast listeners specifically, since that's where Spotify has invested heavily but engagement lags music. Within that group, I'll target casual listeners — people who start 2–3 podcasts a month but rarely finish them. Their key pain point is that they can't judge upfront whether an episode is worth 40 minutes of their time. I'll prioritize that over discoverability because the drop-off data would show abandonment mid-episode, not at the browse stage. My solution: a 90-second 'episode preview' — a curated highlight reel generated from the best moments, surfaced before the user commits. I'm deliberately excluding full transcripts and chapter markers in v1 to reduce complexity. The downside is that generating quality highlights requires LLM inference at scale — not cheap. I'd measure success by episode start-to-completion rate for the target segment, with listen-through rate and skip rate as supporting metrics, and I'd watch for any drop in total listening hours as a guardrail.",
      annotation:
        "Picks a specific segment and justifies it. Names a behavioral pain point with a root cause. Prioritizes one problem with a reason. Proposes a focused solution and explicitly names what's excluded in v1. Calls out the cost tradeoff. Ends with a primary metric + supporting metrics + a guardrail.",
    },
    weakExample: {
      label: "Weak",
      prompt: "How would you improve Spotify?",
      response:
        "Spotify has a huge user base and could improve in many ways. I'd add better social features so friends can share playlists, improve the recommendation algorithm, add a better podcast interface, and make the UI cleaner. For metrics I'd look at engagement and DAU.",
      annotation:
        "No segment chosen — 'huge user base' is not a target. No pain point articulated. Four unrelated feature ideas with no prioritization. 'Engagement and DAU' are vanity metrics with no connection to any of the proposed features. No tradeoffs. No summary.",
    },
    commonMistake: "Treating product sense as a brainstorming exercise.",
    mistakeDetail:
      "Most candidates treat the prompt as an invitation to list ideas. Product sense is not ideation — it's judgment. The interviewer is not evaluating whether you thought of a clever feature. They are evaluating whether you can make a principled choice for the right user, explain why, and define success. A short, focused, well-reasoned answer almost always beats a long list.",
    takeaway:
      "Product sense is structured judgment, not brainstorming. One user, one problem, one focused solution, with tradeoffs and metrics.",
    relatedDrill: "answer_critique",
  },

  {
    slug: "clarify-the-prompt",
    title: "How to Clarify a Prompt",
    concept: "Ask only clarifying questions that materially change your answer.",
    conceptDetail: [
      "The first thing most candidates do wrong is dive straight into features without orienting. The second thing they do wrong is ask too many questions — wasting time and signaling indecision.",
      "Good clarification aligns on one thing: the objective, the product context, the user population, the success lens, or an explicit constraint. You rarely need more than one question, two at most. The rule is: would a different answer to this question meaningfully change my approach? If not, don't ask it.",
      "Common prompt types and what they imply: 'Design a new product' → bias toward segment and MVP scope. 'Improve an existing product' → bias toward friction and existing habits. 'Increase engagement' → bias toward frequency drivers and retention. 'Reduce churn' → bias toward why users are leaving. Knowing the type shapes your answer before you even clarify.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "Design a product to help people manage their health.",
      response:
        "Before I start — 'manage their health' is pretty broad. Should I focus on a chronic condition context, preventive health, or mental health? That would change my segment and the entire product direction. [Interviewer: focus on preventive health for working adults.] Great. Then I'll frame this around helping busy professionals build sustainable health habits, which is a very different problem than managing an existing diagnosis.",
      annotation:
        "One focused question. The candidate explains WHY the answer matters (it changes segment and direction). Accepts the answer immediately and anchors the rest of the response on it.",
    },
    weakExample: {
      label: "Weak",
      prompt: "Design a product to help people manage their health.",
      response:
        "Before I begin, can you tell me: are we focused on physical or mental health? What's the target age group? Are we thinking B2C or B2B? Is this a mobile app or a web product? What's the budget?",
      annotation:
        "Five questions, none of which the interviewer can answer (budget), and most of which don't materially change the core approach. This signals indecision, not rigor. The candidate has spent their clarification time gathering noise.",
    },
    commonMistake: "Asking clarifying questions as a stall tactic.",
    mistakeDetail:
      "Some candidates ask multiple questions to buy thinking time. Interviewers notice. It signals that you don't have a framework and are hoping the interviewer will give you a direction. Better approach: state your assumption aloud and proceed. 'I'll assume we're optimizing for new user activation — let me know if you'd prefer a different lens.'",
    takeaway:
      "One purposeful question, or state your assumption and move. Never ask questions whose answers don't change your direction.",
    relatedDrill: "segment_selection",
  },

  {
    slug: "why-now-market-logic",
    title: "Why Now — Market & Business Logic",
    concept: "Before designing, establish why this problem is worth solving now and how it serves the business.",
    conceptDetail: [
      "Interviewers — especially for PM and senior roles — are testing strategic awareness, not just user empathy. A great solution to a problem nobody should be investing in still fails the interview. Ground your answer in why this matters now and why this company should care.",
      "Cover three things briefly: market — how big or strategically important is this space; why now — what changed (behavior, technology, regulation, competition) that makes this the moment; and company fit — if a company is named, how this supports its mission, business objectives (revenue, retention, growth), and where competitors fall short.",
      "This is a framing move, not a monologue. One or two sharp sentences at the top of your answer is enough — 'This matters now because X, and it's a fit for [company] because Y.' At senior level, interviewers expect genuine competitive and second-order reasoning here; at APM level, a light touch is fine.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "How would you improve YouTube?",
      response:
        "Before I pick a direction, the strategic frame: online video is YouTube's core attention market, and the real battleground now is no longer watch-time but whether viewers feel their time was well spent — short-form competitors have raised the bar on intentional satisfaction, and AI now makes per-video understanding cheap enough to act on. YouTube's unique advantage is the breadth of its creator supply, especially for learning content. So I'll focus where that advantage is underexploited: helping goal-directed learners get value, which supports retention and defends against TikTok-style substitution.",
      annotation:
        "Names the market and the competitive shift ('why now'). Ties the bet to a real business goal (retention, defense vs. competitors). Uses the company's actual structural advantage. All in a few sentences before narrowing to a segment.",
    },
    weakExample: {
      label: "Weak",
      prompt: "How would you improve YouTube?",
      response:
        "YouTube is a huge platform with billions of users, so there's a big opportunity to improve it. Video is really popular and keeps growing, so any improvement would be valuable.",
      annotation:
        "Generic market hand-waving. 'Huge platform', 'video is popular' applies to any answer and signals nothing. No 'why now', no competitive context, no connection to a specific business objective. This is filler, not strategic awareness.",
    },
    commonMistake: "Skipping straight to users and features without a business case.",
    mistakeDetail:
      "Many candidates treat product sense as purely a user-empathy exercise and never explain why the business should invest here now. That reads as junior. The opposite failure is generic market filler ('it's a big market'). Strategic awareness means a specific, falsifiable reason this matters now and to this company — not a platitude.",
    takeaway:
      "Open with one or two sentences on market, why-now, and company fit. Make it specific enough that it couldn't be pasted into a different prompt.",
    relatedDrill: "rationale",
  },

  {
    slug: "user-segmentation",
    title: "Segmentation — Picking the Right User",
    concept: "Designing for 'everyone' means designing for no one.",
    conceptDetail: [
      "The single highest-signal move in product sense is to choose a specific user segment and justify it. Interviewers have heard 'all users' hundreds of times. It signals shallow thinking because different users have different needs, pain points, and behaviors.",
      "Strong segmentation dimensions: behavior/frequency of use, job to be done, sophistication level, life stage or context, role in a multi-sided product, geography or access constraints. A strong segment is relevant to the prompt, distinct in needs, plausible as a starting point, and not chosen arbitrarily.",
      "For marketplaces and multi-sided products, first map the ecosystem and choose which player to serve. Then create about three motivation-based, mutually exclusive segments: if the same person naturally fits several at once, the segmentation will not guide different product choices.",
      "Prioritize using reach versus underserved need, then make the target concrete with a lightweight persona describing motivation, context, behavior, and constraints. The justification matters as much as the choice.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "How would you improve LinkedIn?",
      response:
        "LinkedIn serves many user types — recruiters, job seekers, professionals building thought leadership, students. I'll focus on mid-career professionals who are passively open to opportunities but not actively searching. They're underserved: LinkedIn's experience is built around active job seekers and recruiters, but this passive segment is huge and valuable. Their needs are different — they don't want to signal they're looking, they want to grow their network strategically without noise. That framing changes everything about what I'd build.",
      annotation:
        "Names a specific segment. Explains why they're underserved compared to who the product is built for. Shows that the segment choice has downstream consequences for the solution — it's not arbitrary.",
    },
    weakExample: {
      label: "Weak",
      prompt: "How would you improve LinkedIn?",
      response:
        "LinkedIn has many types of users: job seekers, recruiters, companies, students, and professionals. I'll think about improvements for all of them.",
      annotation:
        "Lists segments but picks none. 'All of them' is not a choice — it's a refusal to make one. The solution will inevitably be a generic list of features that doesn't deeply serve anyone.",
    },
    commonMistake: "Listing segments instead of choosing one.",
    mistakeDetail:
      "Many candidates demonstrate awareness of segmentation by listing 3–4 user types, then proceed to either pick all of them or never commit to one. Listing is not choosing. The interviewer wants to see you make a decision and own it. You can acknowledge you're deprioritizing other segments, but commit to one.",
    takeaway:
      "Name your segment, justify it in one sentence, and move on. If you can't justify it, you chose the wrong one.",
    relatedDrill: "ecosystem_mapping",
  },

  {
    slug: "pain-points",
    title: "Pain Points — Specific, Behavioral, Consequential",
    concept: "A pain point is only valid if it's specific enough to rule out features that don't solve it.",
    conceptDetail: [
      "Most candidates articulate pain points as vague frustrations: 'users find the experience confusing' or 'users want it to be easier.' These are not pain points — they are descriptions of dissatisfaction without enough specificity to guide a solution.",
      "A strong pain point is behavioral (it manifests in what users do or fail to do), specific (it applies to the chosen segment in a describable situation), and consequential (there is a meaningful cost to not solving it — wasted time, a failed goal, lost trust, missed connection).",
      "Before naming the pain, walk through the user's relevant journey: trigger, steps, friction moment, current workaround, and outcome. Diagnose the root cause and emotional consequence rather than jumping from a broad need directly to a feature.",
      "Keep three concepts separate: a need is the desired outcome, a problem is what blocks it, and a solution is an intervention. 'Users need an AI assistant' is solution-shaped, not a diagnosed problem.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "You've chosen to focus on new freelancers on an online marketplace. What's their biggest pain point?",
      response:
        "New freelancers can't assess the quality of a job posting before spending 45–90 minutes on a proposal. They have no signal on whether the client is responsive, serious, or realistic about budget. The cost of this is high: they win few jobs early on, get demoralized, and churn. The platform loses supply at the exact moment when it's hardest to replace.",
      annotation:
        "Specific behavior (45–90 min on a proposal). Specific missing signal (client responsiveness, seriousness, budget). Specific consequence (demoralization, churn, platform supply loss). You can immediately think of solutions that address this — and rule out solutions that don't.",
    },
    weakExample: {
      label: "Weak",
      prompt: "You've chosen to focus on new freelancers on an online marketplace. What's their biggest pain point?",
      response:
        "New freelancers struggle to find good jobs and clients. The experience could be more user-friendly and help them get started faster.",
      annotation:
        "Not specific. 'Struggle to find good jobs' could mean anything. 'More user-friendly' is not a pain point at all. There's no behavioral observation, no consequence, and no way to determine which of a dozen possible features would address this.",
    },
    commonMistake: "Describing dissatisfaction instead of diagnosing a problem.",
    mistakeDetail:
      "'Users are frustrated with the search experience' describes how users feel. It doesn't explain what they're trying to do, where they fail, or what the cost of that failure is. Dissatisfaction is a symptom. A pain point is a diagnosis. The test: can you draw the user's failed journey? If yes, you have a pain point. If you can only say 'users don't like it', you don't.",
    takeaway:
      "State what the user is trying to do, where they fail, and what it costs them. If you can't answer all three, keep digging.",
    relatedDrill: "journey_mapping",
  },

  {
    slug: "prioritization",
    title: "Prioritization — Choosing One Problem",
    concept: "Prioritization is the act of saying 'not now' to everything except one thing.",
    conceptDetail: [
      "Candidates fail at prioritization in two ways: they never make a choice (listing problems without ranking them), or they make a choice without giving criteria (just asserting something is 'most important').",
      "Strong prioritization uses explicit criteria. Common ones: severity of pain (how bad is it when it happens?), frequency (how often does this segment encounter it?), addressability (can we actually build something that fixes this?), leverage (does solving this unblock other value?), strategic fit (does this align with the product's goals?).",
      "You don't need all five criteria. Pick the one or two that apply most to the prompt and use them to justify the choice. The goal is to show that your pick is reasoned, not arbitrary.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "For a recipe app targeting home cooks, you've identified three problems: (1) finding recipes for ingredients they already have, (2) keeping track of which recipes they've tried and liked, (3) scaling recipes for different serving sizes. Which do you prioritize?",
      response:
        "I'd prioritize finding recipes for ingredients they already have. Here's my reasoning: it's high frequency — most home cooks decide what to cook based on what's in the fridge, not the other way around. It's also the highest severity problem: the current experience fails at the exact moment of decision, which leads to ordering takeout instead of cooking. Problems 2 and 3 are real, but they occur later in the flow and affect fewer sessions. Solving problem 1 also has a halo effect: if users cook more frequently, problems 2 and 3 become more relevant — so it creates the conditions for addressing them later.",
      annotation:
        "Chooses one. States two criteria explicitly (frequency, severity). Explains why the others are deprioritized. Notes a leverage effect (solving 1 makes 2 and 3 more valuable later).",
    },
    weakExample: {
      label: "Weak",
      prompt: "For a recipe app targeting home cooks, you've identified three problems: (1) finding recipes for ingredients they already have, (2) keeping track of which recipes they've tried and liked, (3) scaling recipes for different serving sizes. Which do you prioritize?",
      response:
        "All three are important. I think we should work on all of them, but if I had to pick one, maybe the first one? It seems like users would find it useful.",
      annotation:
        "Hedges with 'all three are important'. The pick ('maybe the first one') is tentative and has no reasoning behind it. 'Users would find it useful' applies to all three — it's not a differentiating criterion.",
    },
    commonMistake: "Saying everything is important.",
    mistakeDetail:
      "Prioritization only means something if it implies saying no. If you say 'all of these matter', you haven't prioritized — you've described a backlog. The interviewer knows all three things matter. The question is which one you'd bet the next sprint on, and why. Make the call and own it.",
    takeaway:
      "Pick one. State the criterion that made it win. Acknowledge what you're not doing yet — and why that's okay.",
    relatedDrill: "prioritization",
  },

  {
    slug: "solution-design",
    title: "Solution Design — Focused, Not a Feature Dump",
    concept: "A strong v1 is defined as much by what it excludes as by what it includes.",
    conceptDetail: [
      "After choosing a user, pain point, and prioritized problem, candidates often sprint to a feature list. This is the feature dump failure mode: five or six loosely related ideas that don't form a coherent product experience.",
      "A strong solution describes a coherent user flow, not a list. It names the main surface (where the user encounters the solution), the core interaction (what they do), and the mechanism (how the product creates value). It also explicitly names what is NOT in v1 — this signals scope control and production-readiness thinking.",
      "Generating multiple directions first (2–3 options) before picking one signals breadth. But then commit. The final solution should feel like a single coherent product decision, not a compromise between options.",
      "The options must use meaningfully different mechanisms, not cosmetic variations of one feature. Compare them using impact and effort, company advantage, discoverability or distribution, and fit with the existing product ecosystem.",
      "Connect the chosen direction back to the guiding mission established at the start. This creates one narrative thread from why the product matters to what gets built.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "You've chosen to address the problem of new freelancers being unable to assess client quality before writing proposals. What's your solution?",
      response:
        "I'd build a client trust signal surfaced on every job listing — before the freelancer clicks in. It would show: average response time to proposals, the percentage of posted jobs that actually led to a hire, and whether the client has verified payment. These three signals are already in our data — we just don't show them. The experience is: freelancer browses listings, sees a small trust strip under each one, and self-selects into only the listings worth their time. V1 deliberately excludes: client reviews (too complex to seed), AI-generated client summaries (requires LLM spend we're not ready to justify), and anything the client can game. I'd measure success by time-to-first-proposal-accepted for new freelancers, not by proposal volume — because we want quality engagement, not more noise.",
      annotation:
        "One coherent experience (trust strip on listing). Names the core interaction and where it lives. Uses existing data — no new data collection required. Explicitly excludes three things from v1 with reasons. The metric is tied directly to the chosen pain point.",
    },
    weakExample: {
      label: "Weak",
      prompt: "You've chosen to address the problem of new freelancers being unable to assess client quality before writing proposals. What's your solution?",
      response:
        "I'd add a client rating system, a messaging feature so freelancers can ask questions before applying, an AI assistant that helps write proposals, a 'recommended for you' job feed, and a dashboard showing the freelancer's application success rate.",
      annotation:
        "Five features with no connection to each other. None of them is developed beyond a label. The AI assistant and recommended feed address entirely different problems. There's no description of a user flow, no scope rationale, and no metric.",
    },
    commonMistake: "Listing features instead of designing an experience.",
    mistakeDetail:
      "Features are not a solution — they're a shopping list. A solution is a coherent answer to the user's problem in a specific context. Ask yourself: what does the user see, what do they do, and what happens? If you can't walk through those three things, you don't have a solution yet.",
    takeaway:
      "Describe the user flow, not the feature list. Name what you're deliberately leaving out of v1.",
    relatedDrill: "solution_divergence",
  },

  {
    slug: "tradeoffs",
    title: "Tradeoffs — What You're Optimizing and Why",
    concept: "Every product decision optimizes for something and accepts a cost. Name both.",
    conceptDetail: [
      "Tradeoff reasoning is one of the clearest signals of PM maturity. Junior candidates propose solutions. Senior candidates propose solutions and explain what they're giving up.",
      "Strong tradeoff reasoning has three parts: what you're optimizing for, what you're not optimizing for (yet), and what the downside risk is — and why that risk is acceptable at this stage. This is not the same as listing pros and cons. It's explaining the strategic bet.",
      "Common tradeoff dimensions in PM interviews: breadth vs depth, speed vs quality, personalization vs privacy, power vs simplicity, engagement vs annoyance, short-term lift vs long-term trust, one segment's benefit vs another segment's experience.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "You've proposed a client trust signal for freelancers. What tradeoffs are you making?",
      response:
        "I'm optimizing for proposal quality over proposal volume — I'm explicitly trying to reduce the number of proposals on low-quality listings, which means some metrics will look worse short-term (total proposals, listing engagement). I'm accepting that tradeoff because our core problem is freelancer churn, not low proposal count. The downside risk is that clients with legitimate jobs but low initial trust scores get fewer proposals unfairly — especially new clients with no history. I'd mitigate that with a 'new client' badge so freelancers can calibrate, but I wouldn't exclude new clients from the platform.",
      annotation:
        "Names what's being optimized (proposal quality). Names what's being sacrificed (volume metrics). Identifies the real risk (false negatives on legitimate clients). Proposes a mitigation without over-engineering the v1.",
    },
    weakExample: {
      label: "Weak",
      prompt: "You've proposed a client trust signal for freelancers. What tradeoffs are you making?",
      response:
        "The main tradeoff is that it takes engineering time to build. There's also a risk that some clients won't like it.",
      annotation:
        "Engineering time is not a product tradeoff — it's a cost. 'Some clients won't like it' is too vague to be actionable. There's no naming of what's being optimized, no quantification of the risk, and no reasoning about why the tradeoff is acceptable.",
    },
    commonMistake: "Confusing tradeoffs with implementation risks.",
    mistakeDetail:
      "'It takes time to build' and 'it might not work' are not product tradeoffs. A product tradeoff is when optimizing for one thing explicitly comes at the cost of another. If you're optimizing for engagement, you're probably accepting some annoyance. If you're optimizing for simplicity, you're accepting less power. Name the thing you're giving up on purpose — not the things that might go wrong.",
    takeaway:
      "Complete this sentence: 'I'm optimizing for X, not for Y yet, and the risk is Z — which is acceptable because...'",
    relatedDrill: "tradeoff_defense",
  },

  {
    slug: "metrics-and-guardrails",
    title: "Metrics & Guardrails — Tied to User Value",
    concept: "A metric is only good if you can trace it back to a user getting value.",
    conceptDetail: [
      "Most candidates memorize metric names (DAU, retention, NPS, conversion rate) and apply them generically. This is weak. A strong metric is chosen because it's the most sensitive, proximal measure of whether the specific user you're targeting is getting the specific value your solution creates.",
      "The five-question chain: (1) What user value is supposed to improve? (2) What user behavior would signal that? (3) What metric best captures that behavior? (4) What supporting metrics explain the driver tree? (5) What guardrails catch negative side effects? Work through these in order — don't jump to metric names.",
      "Guardrails are non-negotiable. Every solution creates side effects. A guardrail metric monitors a dimension you're NOT optimizing for but must not damage. No guardrails = no awareness of downside risk. For a feature that increases engagement, guardrails should watch for spam, low-quality content, or annoyance.",
    ],
    strongExample: {
      label: "Strong",
      prompt: "What metrics would you use to evaluate the client trust signal you proposed for freelancers?",
      response:
        "My primary metric is time-to-first-proposal-accepted for new freelancers — that's the specific outcome I'm trying to improve. If the trust signal is working, new freelancers should be routing to higher-quality listings and converting faster. Supporting metrics: proposal-to-hire rate by listing trust tier (to verify that high-trust listings actually convert better), and 30-day retention of new freelancers (the lagging indicator of the churn problem I set out to solve). Guardrails: job fill rate on new client listings (I don't want legitimate new clients to get zero proposals) and total proposal volume (I should not be killing marketplace liquidity to solve one segment's problem).",
      annotation:
        "Primary metric tied directly to the pain point. Two supporting metrics in the driver tree. Two guardrails covering the risks named in the tradeoff step. All metrics are connected to the chosen user and problem — none are generic.",
    },
    weakExample: {
      label: "Weak",
      prompt: "What metrics would you use to evaluate the client trust signal you proposed for freelancers?",
      response:
        "I'd measure engagement — how many freelancers are using the trust signal feature — and DAU. I'd also look at user satisfaction through NPS surveys.",
      annotation:
        "Feature engagement is a vanity metric — it tells you the feature is used, not that it's working. DAU has no connection to the specific problem. NPS is a lagging, noisy indicator with no causal tie to this feature. No guardrails.",
    },
    commonMistake: "Naming metrics that measure the feature, not the user outcome.",
    mistakeDetail:
      "'Feature adoption rate' and 'clicks on the new button' measure whether users noticed the feature. They don't measure whether users got value from it. The question is: did the freelancer spend less time on bad proposals and get hired faster? That's the outcome. Start from the outcome and work backwards to the metric, not the other way around.",
    takeaway:
      "Start from the user value you promised, trace it to a behavior, then pick the metric. Add guardrails for the one thing you're NOT optimizing for.",
    relatedDrill: "metrics_only",
  },
];

export const PS_CURRICULUM: PsLesson[] = PS_CURRICULUM_RAW.map((lesson, i) => ({
  ...lesson,
  eyebrow: `Lesson ${i + 1} of ${PS_CURRICULUM_RAW.length}`,
}));

export const PS_LESSON_SLUGS = PS_CURRICULUM.map((l) => l.slug);

export function getPsLesson(slug: string): PsLesson | null {
  return PS_CURRICULUM.find((l) => l.slug === slug) ?? null;
}
