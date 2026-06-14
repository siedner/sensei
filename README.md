# Sensei

Sensei is a local-first live Product Manager (PM) interview sidecar and playbook reference. It sits alongside Notion to keep candidates structured during live PM interviews, catch critical watch-outs/red flags, and provide interactive, mobile-responsive playbooks for on-the-go study.

---

## 🌟 Key Features

### 1. Live Workspace (Copilot Mode)
* **Structured Spine Navigation**: Walk through the canonical 8-step Product Sense spine (*Goal/Context → User Segment → Pain Point → Prioritize Problem → Solution → Tradeoffs → Metrics & Guardrails → Summary*).
* **Live AI Guidance**: Connects to the local server to evaluate your current answer and generate Notion-ready markdown bullet points.
* **Watch-outs / Red Flag Detector**: Flags common interview traps (e.g., approval fatigue, vanity metrics, generic solutions) in real-time.
* **Notion Integration**: Capture text from Notion via the optional Chrome extension to quickly update prompts.

### 2. Interactive Playbooks (Desktop & Mobile)
Sensei includes two comprehensive, collapsible playbooks:
* **Product Sense Playbook**: Canonical PM framework aligned with the workspace's 8-step spine, including segment chip grids, breadth/depth matrices, input/output/guardrail metrics, and copy-ready phrases.
* **Agentic PM Playbook**: Dedicated cheat sheet for Port-specific developer tools, platform products, AI agents, enterprise governance, and trust & safety workflows.

### 3. Standalone Mobile-First Web App (`@sensei/playbook`)
* **Responsive sliding navigation drawer** for comfortable vertical reading on phones.
* **Floating index button (FAB)** to easily jump between chapters.
* **Checkbox checklists** for real-time tracking of frameworks (e.g., Trust & Safety).
* **Static page bundle** ready to deploy directly to **GitHub Pages** or **Vercel**.

---

## 🛠 Tech Stack

* **Frontend**: React 19, TypeScript, Vite 6, Vanilla CSS (curated, modern, high-contrast aesthetics).
* **Backend**: Node.js, Express.
* **Chrome Extension**: Manifest V3 Sidepanel Extension.
* **Monorepo Manager**: `pnpm` Workspaces.
* **AI Integration**: Headless agent runtime via Pi.dev or local Mock Adapter.

---

## 📁 Repository Structure

```text
├── apps/
│   ├── web/               # The main desktop/workbench React app
│   ├── playbook/          # Standalone mobile-friendly static playbook app
│   ├── extension/         # Manifest V3 Chrome Extension side panel
│   └── server/            # Local Express server (registry, adapters)
├── packages/
│   ├── core/              # Shared models, registries, contracts, and test fixtures
│   └── ui/                # Shared React components & global stylesheet
├── knowledge/
│   ├── product-sense/     # Source playbook materials & curriculum
│   └── sensei/            # Curated runtime knowledge configurations
└── .pi/
    └── skills/            # Discoverable copilot skill manifests (e.g., Product Sense)
```

---

## 🚀 Running Locally

### Requirements
* Node.js 22 or newer
* pnpm 10 or newer

### Setup
Install workspace-wide dependencies:
```bash
pnpm install
```

### Development
Start the local server and desktop workbench:
```bash
pnpm dev
```
* **API Server**: Runs on `http://localhost:3131`
* **Desktop App**: Opens at `http://localhost:3131` (proxying to the server)

Start the standalone static Playbook app (with mobile design support):
```bash
pnpm playbook:dev
```
* **Mobile-friendly Playbooks**: Runs on `http://localhost:5173`

---

## 📦 Build & Deploy

### Common Scripts
```bash
pnpm build           # Build all web apps, packages, server, and extensions
pnpm typecheck       # Run TypeScript verification across all workspace projects
pnpm test            # Run unit tests via Vitest
```

### Chrome Side Panel Extension
1. Build the unpacked extension:
   ```bash
   pnpm extension:build
   ```
2. Open `chrome://extensions` in Google Chrome.
3. Turn on **Developer mode** (top-right toggle).
4. Click **Load unpacked** and select the built folder: `apps/extension/dist`.
5. Pin Sensei and click its toolbar action to open the side panel.

### Deploying Playbooks to GitHub Pages
This repository contains a pre-configured GitHub Actions workflow (`.github/workflows/deploy.yml`) to automatically compile and deploy the playbook app to GitHub Pages.

To activate it:
1. Go to your repository on GitHub.
2. Navigate to **Settings** > **Pages**.
3. Under **Build and deployment** > **Source**, change the dropdown to **GitHub Actions**.
4. The workflow will build `apps/playbook/dist` and deploy it. All compiled asset links are relative (`base: "./"`), allowing hosting under user/repo subfolders.

### Deploying Playbooks to Vercel
Because Sensei is a monorepo, configure the project in Vercel as follows:
* **Root Directory**: Keep as the repository root (`/` or `.`). Do *not* target `apps/playbook` directly.
* **Build Command**: `pnpm --filter @sensei/playbook build`
* **Output Directory**: `apps/playbook/dist`
* **Install Command**: `pnpm install`

---

## 🔒 Security & Privacy

* **Local-First**: No external cloud databases, analytics, remote requests logging, or tracking.
* **Isolated API Keys**: API credentials (`OPENAI_API_KEY`, etc.) reside safely in `.env.local` at the root, parsed server-side, and are **never** leaked to the browser.
* **No Notion Intrusion**: The Chrome Extension relies strictly on manual selection capture. It does *not* read block histories, write back, or use DOM automation.
