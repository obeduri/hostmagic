<p align="center">
  <img src="https://raw.githubusercontent.com/obeduri/hostmagic/master/hostmagic-logo.png" alt="Hostmagic - Developer CLI for seamless local fullstack development" width="720" style="max-width: 100%; border-radius: 14px;">
</p>

# 🧙‍♂️ Hostmagic

> Automate local fullstack development with clean `.test` domains, zero-conflict ephemeral ports, universal OAuth 2.0 support, and concurrent service execution across Windows, macOS, and Linux.

[![npm version](https://img.shields.io/npm/v/hostmagic.svg)](https://www.npmjs.com/package/hostmagic)
[![License: MIT](https://img.shields.io/badge/License-MIT-magenta.svg)](https://opensource.org/licenses/MIT)
[![Platform](https://img.shields.io/badge/platform-windows%20%7C%20macos%20%7C%20linux-blue.svg)](https://github.com/obeduri/hostmagic)

**Hostmagic** is a developer CLI tool built with Node.js and TypeScript that eliminates the everyday friction of local fullstack development. It automatically detects your frontend and backend services, configures system `.test` domain names (with seamless Windows UAC elevation and Unix `sudo`), assigns dynamic random ports at runtime, and launches your services concurrently with clear, prefixed logs.

> 💡 **Tip:** You can use either `hostmagic` or the shorthand **`hm`** alias for all commands (e.g. `hm init`, `hm dev`, `hm clean`, `hm --hostfile`).

---

## ⚡ Key Features

- 🌐 **Clean `.test` Domains (No Ports!):** Say goodbye to confusing `localhost:3000` and ports at the end of URLs. Your apps run directly on intuitive addresses like `http://my-app.test` and `http://backend.my-app.test`.
- 🎛️ **IBM Carbon Design System Dashboard (`http://hostmagic.settings`):** Built-in administrative control center crafted with the enterprise IBM Carbon Design System. Features flat dark mode (**Carbon Gray 100** `#161616`) by default, persistent Light/Dark theme switching, `IBM Plex` typography, and strict 0px border-radius engineering.
- 📂 **Collapsible Project Accordions:** Every project is rendered as an interactive accordion with smooth chevrons and service counters. Accordions default to **collapsed** for a clean multi-project view, and include a global **Expand All / Collapse All** toggle.
- 🎨 **Project Appearance Customizer:** Personalize each project card with a dedicated **React-Icon** (choose from 24 developer icons like `FiBox`, `FiGlobe`, `FiServer`, `FiDatabase`, `FiTerminal`, `FiCpu`, `FiCode`, `FiZap`) and custom **left-border accent color** (12 IBM Carbon swatches or custom hex picker). Settings sync instantly to `localStorage` and `~/.hostmagic/projects.json`.
- ⚛️ **Zero-Emoji React-Icons SVG Engine:** Crisp, pixel-perfect vector SVGs (based on Feather / Carbon Icons) replacing all emojis across the entire interface.
- 🚀 **Standalone Gateway (`hm start`):** Launch a lightweight, persistent Hostmagic Gateway server in the background to serve `hostmagic.settings` and dynamically route between projects as they are launched.
- 🔄 **Hot-Refresh Settings & DNS (`hm --rs`):** Instantly flush DNS cache, synchronize system hosts, and push updated dashboard templates into the running gateway in memory—without stopping or restarting your background dev servers.
- 📁 **Native OS Folder Linking:** Link unlinked project folders on disk directly from the web dashboard using native OS dialogs (Windows PowerShell WinForms, macOS AppleScript, and Linux Zenity).
- 🔐 **Universal OAuth 2.0 Support (Any Provider):** Works seamlessly with **all providers following the OAuth 2.0 standard** (Google, GitHub, GitLab, Discord, Auth0, Okta, Supabase, Apple, Microsoft/Azure AD, Slack, Keycloak, etc.). An auxiliary listener on port 3000 catches incoming callbacks and immediately redirects with HTTP 302/307 to your `.test` domain, delivering PKCE, CSRF tokens, and session cookies with **zero application code changes**.
- ⚡ **Built-in Port 80 Reverse Proxy:** Transparently routes incoming HTTP traffic and WebSockets (for HMR with Vite, Next.js, and Astro) from port 80 to your services' internal ephemeral ports.
- 🛡️ **Non-Destructive & Namespaced `hosts` Management:** Safely inserts and updates system `hosts` entries inside isolated `# BEGIN hostmagic:<project>` blocks without corrupting existing entries.
- 🍎 **Full macOS Support:** Native `/etc/hosts` synchronization with standard `sudo`, immediate mDNS / Bonjour cache clearing via `dscacheutil -flushcache` and `killall -HUP mDNSResponder`, process detection with `lsof`, and default TextEdit / GUI opener support.
- 🐧 **First-Class Linux Support:** Complete compatibility across Ubuntu, Debian, Fedora, Arch, and more. Safely updates `/etc/hosts` using standard `sudo`, flushes `systemd-resolved` / `resolvectl` caches, detects listeners with `lsof`/`fuser`/`ss`, and supports non-root port 80 binding via `setcap`.
- 🪟 **Automatic Windows UAC Elevation:** Running without administrative rights in Windows? Hostmagic triggers a native PowerShell UAC elevation prompt automatically without forcing you to restart your terminal as Administrator.
- 🔍 **Heuristic Multi & Single-Folder Detection:** Works seamlessly with multi-service monorepos (`frontend/` & `backend/`, `apps/`, `packages/`) **as well as standalone single-folder projects** (Next.js, Astro, Vite, Remix, Nuxt, SvelteKit, Express, Fastify, NestJS, etc. directly in the root folder).
- 🎲 **Zero-Conflict Ephemeral Ports:** Allocates available random system ports internally via `get-port` so you can run multiple copies or projects simultaneously without port collision errors (`EADDRINUSE`).
- 💉 **In-Memory Environment Injection:** Injects clean cross-service URLs (`NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `PORT`) directly into process memory without modifying your physical `.env` files.
- 🌲 **Cascading Process Tree Termination:** Pressing `ESC` or `Ctrl+C` cleans up all child processes (Bun, Vite, Node) using `tree-kill`, leaving no zombie processes holding onto system ports.
- 📝 **Cross-Platform Hosts File Opener:** Open the operating system's `hosts` file across Windows, macOS, and Linux in your default editor with `hm --hostfile`.

---

## 📑 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Step-by-Step Usage Guide](#-step-by-step-usage-guide)
   - [Step 1: Installation & Setup](#step-1-installation--setup)
   - [Step 2: Initialize Your Project (`hm init`)](#step-2-initialize-your-project-hm-init)
   - [Step 3: Run Services Concurrently (`hm dev`)](#step-3-run-services-concurrently-hm-dev)
   - [Step 4: Browser Access & Hot Reloading](#step-4-browser-access--hot-reloading)
   - [Step 5: Administrative Dashboard & Live Logs (`http://hostmagic.settings`)](#step-5-administrative-dashboard--live-logs-httphostmagicsettings)
   - [Step 6: Hot-Refresh Settings & Routes (`hm --rs`)](#step-6-hot-refresh-settings--routes-hm---rs)
   - [Step 7: Stopping Services (`ESC` or `Ctrl+C`)](#step-7-stopping-services-esc-or-ctrlc)
   - [Step 8: Cleaning Up Hosts Entries (`hm clean`)](#step-8-cleaning-up-hosts-entries-hm-clean)
   - [Step 9: Opening System Hosts File (`hm --hostfile`)](#step-9-opening-system-hosts-file-hm---hostfile)
3. [🎯 Supported Frameworks & Project Architectures](#-supported-frameworks--project-architectures)
4. [⚡ Quick 2-Minute Demo Setup (Try Without Existing Project)](#-quick-2-minute-demo-setup)
5. [⚙️ Configuration Schema (`.hostmagic.json`)](#️-configuration-schema-hostmagicjson)
6. [🔐 Universal OAuth 2.0 Support (Any Provider)](#-universal-oauth-20-support-any-provider)
7. [🧩 Injected Environment Variables](#-injected-environment-variables)
8. [📋 Full CLI Command Reference](#-full-cli-command-reference)
9. [❓ Troubleshooting & FAQs](#-troubleshooting--faqs)
10. [🏗️ Architecture & Development](#️-architecture--development)
11. [📄 License](#-license)

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or later (or **Bun** v1.0+).
- **Supported Operating Systems:**
  - 🪟 **Windows:** Windows 10 or 11 (PowerShell UAC automatically handles elevation prompts).
  - 🍎 **macOS:** macOS Monterey (12), Ventura (13), Sonoma (14), Sequoia (15), Apple Silicon (M1/M2/M3/M4) & Intel.
  - 🐧 **Linux:** Ubuntu, Debian, Fedora, Arch, CentOS, Alpine, etc.
- **Elevation & Port 80 Permissions:**
  - **Windows:** UAC is requested automatically in non-elevated terminals when writing to `hosts`.
  - **macOS & Linux:** Running the gateway on port 80 requires privileged access. Simply run `sudo hm dev`, or on Linux grant Node permission to bind privileged ports without root:
    ```bash
    sudo setcap 'cap_net_bind_service=+ep' $(which node)
    ```

---

## 🚀 Step-by-Step Usage Guide

### Step 1: Installation & Setup

Run Hostmagic instantly with `npx`, install it globally, or link it locally from source across any operating system:

```bash
# Option A: Run directly with npx (Windows, macOS, Linux)
npx hostmagic init

# Option B: Install globally via npm (provides both `hostmagic` and `hm`)
npm install -g hostmagic
# Note for macOS/Linux users installing into global system paths:
# sudo npm install -g hostmagic

# Option C: Link locally from source
git clone https://github.com/hostmagic/hostmagic.git
cd hostmagic
npm install && npm run build && npm link
```

---

### Step 2: Initialize Your Project (`hm init`)

Navigate to your fullstack project root (which contains your frontend and backend subfolders) and initialize:

```bash
cd path/to/your/project
hm init
# or: hostmagic init
```

#### What the interactive wizard does:
1. **Confirms project name:** Defaults to your folder name (e.g. `my-app`).
2. **Scans & classifies services:** Supports both **multi-service repos** (`frontend/`, `backend/`, `apps/web/`, `apps/api/`) and **standalone single-folder apps** (Next.js, Astro, Vite, Remix, Nuxt, SvelteKit, Express, Fastify, NestJS, etc. directly in root).
3. **Assigns clean domains:** Configures `http://<project>.test` (and `http://backend.<project>.test` for multi-service repos).
4. **Saves configuration:** Writes `.hostmagic.json` in your project root.
5. **Updates system `hosts` across platforms:**
   - 🪟 **Windows:** Triggers a native PowerShell UAC elevation prompt automatically (click **Yes**).
   - 🍎 **macOS:** Prompts for `sudo` to securely update `/etc/hosts` and flushes mDNS resolver cache (`dscacheutil` & `mDNSResponder`).
   - 🐧 **Linux:** Prompts for `sudo` to update `/etc/hosts` and flushes `systemd-resolved` / `resolvectl` caches.
   - Writes entries inside isolated `# BEGIN hostmagic:<project>` blocks without touching existing entries.

**CLI Options:**
- `-y, --yes`: Accept all detected defaults without interactive prompts.
- `-n, --name <name>`: Provide a custom project name for domain resolution.
- `-t, --tld <tld>`: Custom top-level domain suffix (default: `"test"`, e.g. `"localtest.me"`).

---

### Step 3: Run Services Concurrently (`hm dev`)

Start all services and the local reverse proxy with a single command:

```bash
# Windows
hm dev

# macOS (binding port 80 requires privileged access)
sudo hm dev

# Linux (run with sudo or with setcap capability)
sudo hm dev
# Or if setcap was configured: hm dev
```

*(Aliases: `hostmagic dev`, `hostmagic run`, `hm start`)*

#### What happens at startup:
1. **Starts Port 80 Reverse Proxy:** Intercepts traffic on port 80 and maps requests to internal service ports based on the `Host` HTTP header.
2. **Starts Port 3000 OAuth Bridge:** Intercepts any OAuth 2.0 callbacks on `localhost:3000` and bounces them directly to your `.test` domain.
3. **Allocates Ephemeral Ports:** Assigns random available ports internally to each child process without conflicts.
4. **Injects In-Memory Variables:** Injects clean URLs without modifying your physical `.env` files:
   - **Frontend:** `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `VITE_API_URL`
   - **Backend:** `PORT`, `APP_URL`, `FRONTEND_URL`, `CORS_ORIGIN`
5. **Displays Interactive Banner:**
   ```text
   ┌────────────────────────────────────────────────────────────────┐
   │  🚀 Hostmagic running [my-app]                                 │
   ├────────────────────────────────────────────────────────────────┤
   │  • [FRONTEND] frontend: http://my-app.test                     │
   │  • [BACKEND]  backend:  http://backend.my-app.test             │
   │  • [SETTINGS] hostmagic.settings: http://hostmagic.settings    │
   │  • [OAUTH]    localhost:3000: http://localhost:3000 (OAuth)    │
   ├────────────────────────────────────────────────────────────────┤
   │  ⚡ Port 80 Gateway active (multi-project concurrent reverse proxy) │
   │  Press ESC or Ctrl+C at any time to gracefully stop all services.│
   └────────────────────────────────────────────────────────────────┘
   ```
6. **Streams Prefixed Logs:** Displays concurrent output with `[FRONT]` (Cyan) and `[BACK]` (Magenta) tags.

---

### Step 4: Browser Access & Hot Reloading

Open your browser and navigate directly to:
- **Frontend Application:** `http://my-app.test`
- **Backend API:** `http://backend.my-app.test`
- **Settings Dashboard:** `http://hostmagic.settings`

**No port numbers required!** Full WebSocket proxying is enabled, meaning Hot Module Replacement (HMR) in Vite, Next.js, and Astro works seamlessly out of the box across Chrome, Safari, Firefox, Edge, Arc, and Brave on macOS, Linux, and Windows.

---

### Step 5: Administrative Dashboard & Live Logs (`http://hostmagic.settings`)

Hostmagic provides a dedicated local control plane running directly on port 80, crafted following the enterprise **IBM Carbon Design System**:

👉 **Open in browser:** [http://hostmagic.settings](http://hostmagic.settings) *(or `http://localhost/__hostmagic`)*

#### Core Dashboard Capabilities:
- 🖤 **IBM Carbon Dark Theme by Default:** Designed for developer ergonomics using Carbon Gray 100 (`#161616`) by default, with an instant Light / Dark mode toggle in the masthead header.
- 📂 **Collapsible Project Accordions:** Clean, space-efficient overview. Project cards default to **collapsed**, displaying the project name, custom icon, status badge, service count, and action controls. Clicking anywhere on the project header smoothly expands or collapses the services table.
- ↕️ **Global Expand / Collapse All:** Instantly expand or collapse all project accordions at once using the toolbar toggle.
- 🎨 **Appearance Customizer (React-Icons & Border Colors):**
  - Click **Style** (or click the project name/icon) on any project card to open the *Customize Project Appearance* modal.
  - **24 React-Icons:** Select from curated developer vector icons (`FiBox`, `FiGlobe`, `FiServer`, `FiDatabase`, `FiCpu`, `FiTerminal`, `FiCode`, `FiZap`, `FiCloud`, `FiShield`, `FiSmartphone`, `FiLayers`, etc.) via a `<select>` dropdown or visual grid.
  - **Left-Border Color Accent:** Choose from 12 IBM Carbon color swatches (`Blue 60`, `Cyan 50`, `Teal 40`, `Green 50`, `Magenta 50`, `Purple 60`, `Yellow 30`, `Orange 40`, etc.), native color picker, or arbitrary hex string.
  - **Persistence:** Saved immediately in `localStorage` and automatically synchronized to the backend via `POST /__hostmagic/api/projects/customize` (`~/.hostmagic/projects.json`).
- 📁 **Native OS Folder Linking:** If a project in your registry does not have a linked local path, click **Link Folder** to launch your operating system's native folder browser dialog (PowerShell WinForms on Windows, AppleScript on macOS, Zenity on Linux) and bind the path directly.
- ▶️ **One-Click Project Runner:** Click **Start** to spawn background development servers for that project; click **Stop** to terminate its process tree safely.
- 📜 **Live Service Logs:** Click **Logs** on any running service to open the real-time terminal modal with ANSI color parsing and auto-scrolling.
- 📋 **One-Click Copy Logs:** Click **Copy Logs** to copy clean, ANSI-stripped log history directly to your clipboard.
- 🔍 **Search & Filter:** Instantly filter projects, services, ports, and domains in real time.
- ➕ **Dynamic Route Management:** Register standalone custom domains and target ports without modifying configuration files.
- 🚀 **OS Start on Boot Toggle:** Easily toggle whether Hostmagic Gateway launches automatically in the background on Operating System boot (Windows Registry/VBScript silent launcher, macOS LaunchAgents, Linux systemd/desktop autostart).
- 💻 **One-Click Open in IDE & Terminal:** Launch any project in your favorite editor or terminal directly from the inactive route gateway page and the Settings Hub. Supports Antigravity, Claude Code, Codex, VS Code, Cursor, Windsurf, Zed, Sublime Text, Notepad++, Visual Studio, WebStorm, DataGrip, PyCharm, IntelliJ IDEA, Android Studio, PhpStorm, GoLand, CLion, Rider, RubyMine, Fleet, Void, Positron, Trae, Neovim, Helix, Emacs, Eclipse, Xcode, Terminal, and File Explorer with smart PATH and application binary discovery.
- 🔌 **REST API Endpoints:**
  - `GET /__hostmagic/api/projects` — Returns all known registered projects, services, and live statuses.
  - `POST /__hostmagic/api/projects/start` — Starts a project by name or directory path: `{"name": "my-app"}`.
  - `POST /__hostmagic/api/projects/stop` — Stops a running project process tree: `{"name": "my-app"}`.
  - `POST /__hostmagic/api/projects/add` — Registers a project folder path: `{"path": "C:\\path\\to\\project"}`.
  - `POST /__hostmagic/api/projects/customize` — Updates project icon and left-border color: `{"name": "my-app", "icon": "globe", "color": "#0f62fe"}`.
  - `POST /__hostmagic/api/projects/browse` — Triggers native OS folder dialog to link a project path: `{"name": "my-app"}`.
  - `DELETE /__hostmagic/api/projects` — Unregisters a project from the global dashboard: `{"name": "my-app"}`.
  - `GET /__hostmagic/api/autostart` — Checks if Hostmagic is configured to start on OS boot.
  - `POST /__hostmagic/api/autostart` — Enables or disables automatic OS startup: `{"enabled": true}`.
  - `GET /__hostmagic/api/logs?target=<domain>` — Retrieves buffered log history.
  - `GET /__hostmagic/api/ides` — Returns the catalog of supported IDEs and terminal applications.
  - `POST /__hostmagic/api/projects/open-ide` — Launches a project folder in the selected IDE or terminal: `{"name": "my-app", "ide": "vscode"}`.
  - `POST /__hostmagic/api/refresh-settings` — Hot-pushes updated dashboard templates into memory.

---

### Step 6: Hot-Refresh Settings & Routes (`hm --rs`)

When you modify `.hostmagic.json`, add new domains, or wish to update the settings dashboard without interrupting your running development servers:

```bash
# Hot-refresh settings, templates, and routes on the active gateway
hm --rs
# or: hm --refresh-settings, hm rs, hm refresh-settings
```

#### What `hm --rs` does:
1. **Flushes DNS Cache:** Runs `ipconfig /flushdns` (Windows), `dscacheutil` (macOS), or `resolvectl` (Linux) to guarantee instant hostname resolution.
2. **Synchronizes System Hosts:** Ensures `# BEGIN hostmagic:system` and `127.0.0.1 hostmagic.settings` are intact in your operating system's `hosts` file.
3. **Synchronizes Project Routes:** Reads your project's `.hostmagic.json` and updates the active gateway's route table.
4. **Hot-Reloads Dashboard Template:** Injects the latest dashboard HTML template into the running gateway process in memory via HTTP (`POST /__hostmagic/api/refresh-settings`).
5. **Zero Downtime:** Your running processes (Next.js dev servers, Vite watchers, backend API instances) keep running completely uninterrupted!

---

### Step 7: Stopping Services (`ESC` or `Ctrl+C`)

To stop all running services cleanly:
- Press **`ESC`** or **`Ctrl + C`** in your terminal.
- Hostmagic captures the signal/keypress and executes a cross-platform process tree kill (`tree-kill` issuing `SIGINT`/`SIGTERM`/`SIGKILL` on Unix and `taskkill /F /T` on Windows), terminating all sub-processes (Bun, Node, Vite) and freeing sockets immediately without leaving zombie background tasks.

---

### Step 8: Cleaning Up Hosts Entries (`hm clean`)

To remove domain entries from your operating system's `hosts` file:

```bash
# Windows
hm clean

# macOS & Linux (prompts for sudo if not already elevated)
sudo hm clean

# Clean all Hostmagic entries across all projects
hm clean --all

# Clean all entries without interactive confirmation prompt
hm clean --all --yes
```

---

### Step 9: Opening System Hosts File (`hm --hostfile`)

Instantly open your operating system's `hosts` file across **Windows**, **macOS**, and **Linux** in your default or preferred editor:

```bash
# Open using default system editor:
# • Windows -> Notepad
# • macOS   -> Default Text Editor (TextEdit via `open -t`)
# • Linux   -> GUI Default (via `xdg-open`) or terminal editor (nano, vim)
hm --hostfile
# or: hostmagic --hostfile, hm -H, hm hostfile, hm hosts

# Open with a specific custom editor across any OS (e.g. VS Code, Cursor, nano)
hm hostfile --editor code
hm --hostfile -e cursor
hm --hostfile -e nano
```

---

## 🎯 Supported Frameworks & Project Architectures

Hostmagic works natively with **any web or API framework** across the JavaScript, TypeScript, Node.js, and Bun ecosystems, whether structured as a single standalone application or a multi-service monorepo.

### 🎨 Frontend & Fullstack Frameworks

| Framework | Target Modes | Detection & Command | Clean Domain |
| :--- | :--- | :--- | :--- |
| ⚛️ **Next.js** | App Router & Pages Router | Detected via `next` dependency; runs `next dev` | `http://<app>.test` |
| ⚡ **Vite** | React, Vue, Svelte, Solid, Preact, Vanilla | Detected via `vite` dependency; runs `vite` | `http://<app>.test` |
| 🚀 **Astro** | SSR & Static site generation | Detected via `astro` dependency; runs `astro dev` | `http://<app>.test` |
| 💿 **Remix** | Fullstack web applications | Detected via `@remix-run/*`; runs `remix dev` | `http://<app>.test` |
| 💚 **Nuxt.js** | Nuxt 3 & Nuxt 2 | Detected via `nuxt`; runs `nuxi dev` | `http://<app>.test` |
| 🧡 **SvelteKit** | Svelte fullstack apps | Detected via `@sveltejs/kit` or `svelte`; runs `vite dev` | `http://<app>.test` |
| 🔷 **Angular** | Angular CLI / SSR | Detected via `@angular/core`; runs `ng serve` | `http://<app>.test` |
| 🟦 **SolidJS** | Solid & SolidStart | Detected via `solid-js`; runs `vinxi dev` or `vite` | `http://<app>.test` |
| ⚡ **Qwik** | Qwik & Qwik City | Detected via `@builder.io/qwik`; runs `vite` | `http://<app>.test` |
| 🧭 **TanStack** | TanStack Start & Router | Detected via `@tanstack/start` or `@tanstack/react-router` | `http://<app>.test` |
| 📜 **Gatsby** | Static & Hydrated web apps | Detected via `gatsby`; runs `gatsby develop` | `http://<app>.test` |

---

### 🛠️ Backend, APIs & Microservices

| Framework | Target Modes | Detection & Command | Clean Domain |
| :--- | :--- | :--- | :--- |
| 🚂 **Express.js** | REST APIs & Microservices | Detected via `express`; runs `dev` script or `node server.js` | `http://<app>.test` *(or `backend.<app>.test`)* |
| ⚡ **Fastify** | High-performance JSON APIs | Detected via `fastify`; runs `fastify start` or dev script | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🦁 **NestJS** | Enterprise TypeScript backend | Detected via `@nestjs/core`; runs `nest start --watch` | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🔥 **Hono** | Lightweight Edge / Node / Bun API | Detected via `hono`; runs `bun run dev` or `tsx` | `http://<app>.test` *(or `backend.<app>.test`)* |
| ☕ **Koa** | Middleware-based web service | Detected via `koa`; runs dev script or entry file | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🥑 **AdonisJS** | Fullstack Node.js framework | Detected via `@adonisjs/core`; runs `node ace serve --watch` | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🧩 **Hapi** | Configuration-centric API | Detected via `@hapi/hapi` or `hapi` | `http://<app>.test` *(or `backend.<app>.test`)* |
| 📦 **Polka** | Minimalist micro-framework | Detected via `polka`; runs dev script or entry file | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🚀 **Strapi** | Headless CMS | Detected via `@strapi/strapi`; runs `strapi develop` | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🦚 **FeathersJS** | Real-time & REST API | Detected via `@feathersjs/feathers` | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🗄️ **ORM / DB APIs** | Prisma, Drizzle, TypeORM | Auto-detected and classified as backend service | `http://<app>.test` *(or `backend.<app>.test`)* |
| 🟢 **Vanilla Node / Bun** | HTTP servers with `server.js` or `index.ts` | Auto-detects entry point file even without a `"dev"` script | `http://<app>.test` |

---

### 📂 Supported Repository Layouts

Hostmagic automatically detects and adapts to your repository structure:

#### 1. Standalone Single-Folder App (Root `package.json`)
You have a single project folder (e.g. Next.js, Astro, Vite, or Express) where `package.json` is in the root directory:
```text
my-portfolio/
├── package.json   (dependencies: { "astro": "^4.0.0" })
├── astro.config.mjs
└── src/
```
- **Action:** Run `hm init` inside `my-portfolio/`.
- **Result:** Automatically configures `http://my-portfolio.test` pointing to your app with zero port numbers in the URL!

#### 2. Traditional Multi-Service Monorepo (`frontend/` + `backend/`)
You have distinct subfolders for frontend and backend:
```text
fullstack-shop/
├── frontend/      (package.json -> Next.js)
└── backend/       (package.json -> Express or NestJS)
```
- **Action:** Run `hm init` in `fullstack-shop/`.
- **Result:** Automatically configures:
  - Frontend: `http://fullstack-shop.test`
  - Backend API: `http://backend.fullstack-shop.test`
  - Injects `NEXT_PUBLIC_API_URL=http://backend.fullstack-shop.test` and `FRONTEND_URL=http://fullstack-shop.test` in-memory.

#### 3. Monorepos & Workspaces (`apps/*`, `packages/*`)
Turborepo, pnpm workspaces, npm/yarn workspaces, Lerna, and Nx:
```text
enterprise-mono/
├── package.json   (workspaces: ["apps/*"])
├── turbo.json
└── apps/
    ├── web/       (Next.js or Vite)
    └── api/       (Fastify or NestJS)
```
- **Action:** Run `hm init` in `enterprise-mono/`.
- **Result:** Detects individual workspace applications and assigns clean subdomains without creating redundant root services.

---

## ⚡ Quick 2-Minute Demo Setup

Want to see Hostmagic in action right now with a disposable test project? Run this script in PowerShell or Bash:

```bash
# 1. Create a demo directory
mkdir hostmagic-demo
cd hostmagic-demo

# 2. Create mock frontend
mkdir frontend
cat << 'EOF' > frontend/package.json
{
  "name": "frontend",
  "scripts": { "dev": "node server.js" },
  "dependencies": { "vite": "^5.0.0" }
}
EOF

cat << 'EOF' > frontend/server.js
import http from 'http';
const port = process.env.PORT || 3000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(`
    <body style="font-family: sans-serif; background: #0f172a; color: white; padding: 40px; text-align: center;">
      <h1>✨ Frontend Running on ${process.env.NEXT_PUBLIC_APP_URL}</h1>
      <p>Connected to API: <code>${process.env.NEXT_PUBLIC_API_URL}</code></p>
    </body>
  `);
}).listen(port, () => console.log(`Frontend listening on internal port ${port}`));
EOF

# 3. Create mock backend
mkdir backend
cat << 'EOF' > backend/package.json
{
  "name": "backend",
  "scripts": { "dev": "node server.js" },
  "dependencies": { "express": "^4.18.0" }
}
EOF

cat << 'EOF' > backend/server.js
import http from 'http';
const port = process.env.PORT || 4000;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    status: 'online',
    message: 'Hello from Hostmagic Backend API!',
    frontendUrl: process.env.FRONTEND_URL
  }, null, 2));
}).listen(port, () => console.log(`Backend listening on internal port ${port}`));
EOF
```

### Test it:
```bash
hm init
hm dev
```
Open `http://hostmagic-demo.test` and `http://backend.hostmagic-demo.test` in your browser!

---

## ⚙️ Configuration Schema (`.hostmagic.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/hostmagic/cli/main/schema.json",
  "name": "my-app",
  "tld": "test",
  "services": [
    {
      "name": "frontend",
      "path": "frontend",
      "type": "frontend",
      "domain": "my-app.test",
      "command": "npm run dev"
    },
    {
      "name": "backend",
      "path": "backend",
      "type": "backend",
      "domain": "backend.my-app.test",
      "command": "npm run dev"
    }
  ]
}
```

### Fixed Ports Support (Optional):
If you prefer fixed internal ports instead of random ephemeral ones, declare `"port"` in `.hostmagic.json`:
```json
{
  "name": "my-app",
  "services": [
    { "name": "frontend", "port": 3000 },
    { "name": "backend", "port": 4000 }
  ]
}
```
Hostmagic will honor these fixed ports if available.

---

## 🔐 Universal OAuth 2.0 Support (Any Provider)

OAuth 2.0 in local development with custom domains has historically been painful:
- Major providers (e.g. Google Cloud Console) strictly reject `.test` or custom TLDs over plain HTTP (*"Invalid redirect URI: must use localhost"*).
- Developer credentials and documentation default to `http://localhost:3000/api/auth/callback/<provider>`.
- Redirecting back to `localhost` causes the browser to lose `.test` origin cookies (such as PKCE `code_verifier`, `state`, and CSRF tokens), breaking authentication libraries like NextAuth, Auth.js, Lucia, Supabase Auth, or Passport.

Hostmagic solves this with an RFC 6749 compliant **Universal OAuth 2.0 Redirect Bridge**:

### 🎯 Compatible Providers
Hostmagic works natively with **any provider conforming to the OAuth 2.0 authorization framework**:

| Provider | Supported | Typical Callback Path |
| :--- | :---: | :--- |
| 🌐 **Google Identity** | ✅ Full | `/api/auth/callback/google` |
| 🐙 **GitHub OAuth** | ✅ Full | `/api/auth/callback/github` |
| 🦊 **GitLab** | ✅ Full | `/api/auth/callback/gitlab` |
| 💬 **Discord** | ✅ Full | `/api/auth/callback/discord` |
| 🛡️ **Auth0 / Okta** | ✅ Full | `/api/auth/callback/auth0` |
| ⚡ **Supabase Auth** | ✅ Full | `/auth/v1/callback` |
| 🍎 **Apple Sign-In** | ✅ Full (307 POST & GET) | `/api/auth/callback/apple` |
| 🪟 **Microsoft / Azure AD** | ✅ Full | `/api/auth/callback/azure-ad` |
| 💼 **Slack** | ✅ Full | `/api/auth/callback/slack` |
| 🔒 **Keycloak / Custom OIDC** | ✅ Full | `/api/auth/callback/keycloak` |

### 🔄 How the Universal OAuth 2.0 Flow Works:

```text
 1. User clicks "Sign In" on http://my-app.test
        │
        ▼
 2. App initiates OAuth request -> External Provider (Google, GitHub, Auth0, etc.)
        │ (Hostmagic ensures redirect_uri=http://localhost:3000 for strict providers)
        ▼
 3. Provider authorizes user and redirects browser to:
    http://localhost:3000/api/auth/callback/<provider>?code=...&state=...
        │
        ▼
 4. Hostmagic auxiliary port 3000 listener catches the callback!
        │ (Correlates state & issues HTTP 302 Found)
        ▼
 5. Browser redirects to: http://my-app.test/api/auth/callback/<provider>?code=...&state=...
        │ (Browser natively sends all my-app.test cookies: PKCE verifier, state, session)
        ▼
 6. Your application completes the token exchange natively under my-app.test!
```

### 🚀 Zero Application Code Changes
- **Leave your `.env` intact:** If your application or provider dashboard is configured with `http://localhost:3000`, Hostmagic catches it and redirects seamlessly to your `.test` domain.
- **No changes in provider developer consoles:** Keep your registered callback as `http://localhost:3000/api/auth/callback/<provider>` without worrying about provider restrictions on custom TLDs.
- **Works with any auth library:** NextAuth.js / Auth.js, Passport.js, Supabase Auth, Lucia, Firebase Auth, Remix Auth, or custom OAuth 2.0 implementations.

---

## 🧩 Injected Environment Variables

Hostmagic injects these environment variables in-memory for each service at runtime:

| Target Service | Variable Name | Example Value | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `PORT` | `54321` | Internal ephemeral port (handled by Reverse Proxy) |
| **Frontend** | `NEXT_PUBLIC_APP_URL` | `http://my-app.test` | Clean frontend base URL (no port) |
| **Frontend** | `NEXT_PUBLIC_API_URL` | `http://backend.my-app.test` | Clean backend API URL for Next.js (no port) |
| **Frontend** | `VITE_API_URL` | `http://backend.my-app.test` | Clean backend API URL for Vite (no port) |
| **Backend** | `PORT` | `54322` | Internal ephemeral port (handled by Reverse Proxy) |
| **Backend** | `APP_URL` | `http://backend.my-app.test` | Clean backend base URL (no port) |
| **Backend** | `FRONTEND_URL` | `http://my-app.test` | Clean frontend URL for CORS / redirects (no port) |
| **Backend** | `CORS_ORIGIN` | `http://my-app.test` | CORS allowed origin header (no port) |

---

## 📋 Full CLI Command Reference

You can use either `hostmagic` or the shorthand **`hm`** alias interchangeably:

| Command | Aliases & Options | Description |
| :--- | :--- | :--- |
| `hm init` | `hostmagic init` | Interactive project setup wizard: detects services, assigns `.test` domains, and updates system `hosts`. |
| | `-y, --yes` | Accept all detected defaults without interactive prompts. |
| | `-n, --name <name>` | Specify a custom project name for domain resolution. |
| | `-t, --tld <tld>` | Specify a custom top-level domain / suffix (default: `"test"`). |
| `hm start` | `hm server`, `hm gateway` | Start the standalone Hostmagic Gateway & Settings server for `hostmagic.settings`. |
| | `-p, --port <port>` | Gateway listening port (default: `80`). |
| | `--oauth-port <port>` | OAuth bridge listening port (default: `3000`). |
| | `-o, --open` | Open `http://hostmagic.settings` in your default browser. |
| `hm dev` | `hm run` | Allocate dynamic ephemeral ports, start port 80 gateway, OAuth bridge, and stream prefixed logs. |
| `hm --rs` | `hm --refresh-settings`, `hm rs` | **Hot-refresh:** Flushes DNS cache, re-syncs system `hosts`, updates project routes, and pushes latest dashboard template into gateway memory without restarting dev processes. |
| `hm --hostfile` | `hm -H`, `hm hostfile`, `hm hosts` | Open operating system's `hosts` file across Windows, macOS, and Linux in your default editor. |
| | `-e, --editor <editor>` | Open `hosts` with a custom editor (e.g. `code`, `cursor`, `nano`, `notepad`). |
| `hm clean` | `hostmagic clean` | Remove Hostmagic domain entries from system `hosts` for current project. |
| | `-a, --all` | Remove Hostmagic entries across **all** projects. |
| | `-y, --yes` | Skip interactive confirmation warning prompt. |
| `hm --version` | `hm -V` | Display currently installed version of Hostmagic (e.g. `1.1.6`). |
| `hm --help` | `hm -h` | Display CLI help menu and list of available options. |

---

## ❓ Troubleshooting & FAQs

### Q: How do I access the administrative dashboard and service logs?
Simply start your project with `hm dev` and open [http://hostmagic.settings](http://hostmagic.settings) in any web browser. You'll see all running projects, their clean domains, target ephemeral ports, and live status. Clicking **View Logs** on any service opens a real-time console with a **`📋 Copy Logs`** button to copy clean output directly to your clipboard.

### Q: Can I refresh the dashboard or update routes without restarting my servers?
**Yes!** Run `hm --rs` or `hm --refresh-settings` in any terminal. It hot-pushes the updated dashboard template and route tables directly to the active Port 80 Gateway in memory and flushes your operating system's DNS cache, leaving your Next.js dev servers or backend APIs running without interruption.

### Q: How do I run Hostmagic on macOS and Linux?
On Unix-based operating systems (macOS and Linux), binding to privileged port 80 requires elevated privileges. Simply run:
```bash
sudo hm dev
# or: sudo hostmagic dev
```
On **Linux**, if you prefer running without `sudo` each time, you can grant Node permission to bind privileged ports:
```bash
sudo setcap 'cap_net_bind_service=+ep' $(which node)
hm dev
```

### Q: How does Hostmagic flush the DNS cache on macOS and Linux?
Hostmagic automatically flushes your operating system's DNS cache whenever `hosts` entries change:
- **macOS:** Executes `dscacheutil -flushcache` and signals `killall -HUP mDNSResponder`.
- **Linux:** Automatically uses `resolvectl flush-caches` or `systemd-resolve --flush-caches`.
- **Windows:** Executes `ipconfig /flushdns`.

### Q: Windows UAC prompt appeared. Is this normal?
**Yes.** Windows restricts modification of `C:\Windows\System32\drivers\etc\hosts` to Administrators. Hostmagic invokes PowerShell's `Start-Process -Verb RunAs` so you don't need to manually run an Administrator terminal.

### Q: What if port 80 is already in use?
If another server occupies port 80, Hostmagic notifies you with a clear error message:
- 🍎 **macOS:** Check what is listening on port 80 with `sudo lsof -i :80`. If macOS's built-in Apache service is running, stop it with `sudo apachectl stop`.
- 🐧 **Linux:** Check active listeners with `sudo lsof -i :80` or `sudo fuser 80/tcp`. If Nginx or Apache is active, stop them with `sudo systemctl stop nginx` or `sudo systemctl stop apache2`.
- 🪟 **Windows:** If IIS or Skype occupies port 80, stop the conflicting service or disable the IIS World Wide Web Publishing Service in Windows Services (`services.msc`).

### Q: Can I use Hostmagic inside WSL2 (Windows Subsystem for Linux)?
**Yes!** Inside WSL2, Hostmagic runs under the Linux subsystem, updating `/etc/hosts` and binding port 80 within WSL. Because modern WSL2 shares localhost networking with Windows, you can access your clean `.test` domains directly from your Windows web browser.

### Q: Do I need to edit my `.env` files?
**No.** Hostmagic injects `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, and other variables directly into the running process's memory. Your physical `.env` files remain untouched.

### Q: What happens if a port or dev server is already running?
If a port (or a Next.js development server from a previous crash/session) is already active, Hostmagic detects it automatically:
- Shows the PID and executable name (e.g. `node.exe (PID 45748)` on Windows, `node (PID 45748)` on macOS/Linux).
- Interactively asks if you want to terminate it:
  `Do you want to terminate node (PID 45748) to free port 58993? (Y/n)`
- Terminates the process tree across **Windows** (`taskkill /F /T`), **macOS**, and **Linux** (`kill -9`), cleans `.next/dev/lock`, and starts your server cleanly.

---

## 🏗️ Architecture & Development

```bash
# Install dependencies
bun install   # or npm install

# Run typecheck
npm run typecheck

# Run unit & integration tests
npm test

# Build production bundle
npm run build
```

---

## 📄 License

MIT © Hostmagic Contributors
