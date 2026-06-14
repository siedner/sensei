# Sensei Project Instructions

Sensei is a local PM interview sidecar for the user, a senior IC PM. Notion remains the interview canvas. Sensei supports judgment; it does not answer autonomously or write into Notion.

## Commands

- `pnpm dev`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`
- `pnpm extension:build`

## Product Rules

- Live output must be concise, practical, senior-PM quality, and Notion-ready.
- Prioritize one user, one problem, one first bet, explicit tradeoffs, metrics, guardrails, and a clean close.
- Do not invent company facts or interviewer expectations.
- Do not add auth, databases, analytics, remote logging, cloud sync, autonomous browser control, or Notion writeback.

## Architecture

The UI calls the local server. The server discovers `.pi/skills/*/manifest.json`, resolves one primary skill plus contextual overlays, then calls an `AgentAdapter`.

Routing precedence: slash command → explicit `skillIds` → inference → session skill → `product-sense`.

Keep adapters skill-agnostic. New skills must not require branching in the registry or Pi adapter. Product-specific doctrine belongs in skill and knowledge files, not the core server prompt.

## Live Safety

- Pi sessions are in-memory and have no tools.
- Browser selection capture occurs only after a user click and confirmation.
- Never log prompts or notes.
- Keep extension permissions restricted.

## Adding Actions

Add the action to the owning skill manifest, implement its skill instructions and MockAdapter handler, expose it through skill metadata, and add action-shape tests. Do not add product-sense action constants to unrelated skills.
