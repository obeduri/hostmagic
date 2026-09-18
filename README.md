# 🧙‍♂️ Hostmagic

> Automate local fullstack development with clean `.local` domains, zero-conflict ephemeral ports, and concurrent service execution.

[![npm version](https://img.shields.io/npm/v/hostmagic.svg)](https://www.npmjs.com/package/hostmagic)
[![License: MIT](https://img.shields.io/badge/License-MIT-magenta.svg)](https://opensource.org/licenses/MIT)

**Hostmagic** is a developer CLI tool built with Node.js and TypeScript that eliminates the everyday friction of local fullstack development. It automatically detects your frontend and backend services, configures system `.local` domain names (with seamless Windows UAC elevation and Unix `sudo`), assigns dynamic random ports at runtime, and launches your services concurrently with clear, prefixed logs.

---

## ⚡ Key Features

- 🌐 **Clean `.local` Domains (No Ports!):** Say goodbye to confusing `localhost:3000` and ports at the end of URLs. Your apps run directly on intuitive addresses like `http://my-app.local` and `http://backend.my-app.local`.
- ⚡ **Built-in Port 80 Reverse Proxy:** Transparently routes incoming HTTP traffic and WebSockets (for HMR with Vite, Next.js, and Astro) from port 80 to your services' internal ephemeral ports.
- 🛡️ **Non-Destructive & Namespaced `hosts` Management:** Safely inserts and updates system `hosts` entries inside isolated `# BEGIN hostmagic:<project>` blocks without corrupting existing entries.
- 🪟 **Automatic Windows UAC Elevation:** Running without administrative rights in Windows? Hostmagic triggers a native PowerShell UAC elevation prompt automatically without forcing you to restart your terminal as Administrator.
- 🔍 **Heuristic Service Detection:** Scans subdirectories (`frontend/`, `backend/`, `client/`, `server/`, `apps/web/`, `apps/api/`) and inspects `package.json` to detect Next.js, Vite, Astro, NestJS, Express, etc.
- 🎲 **Zero-Conflict Ephemeral Ports:** Allocates available random system ports internally via `get-port` so you can run multiple copies or projects simultaneously without port collision errors (`EADDRINUSE`).
- 💉 **In-Memory Environment Injection:** Injects clean cross-service URLs (`NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `PORT`) directly into process memory without modifying your physical `.env` files.
- 🌲 **Cascading Process Tree Termination:** Pressing `Ctrl+C` cleans up all child processes (Bun, Vite, Node) using `tree-kill`, leaving no zombie processes holding onto system ports.

---

## 🚀 Quick Start

You can run Hostmagic instantly with `npx` or install it globally:

```bash
# Run directly with npx
npx hostmagic init

# Or install globally
npm install -g hostmagic
```

### 1. Initialize Your Project (`hostmagic init`)

In your project root (which contains frontend and backend subfolders):

```bash
hostmagic init
```

The interactive wizard will:
1. Confirm the project name.
2. Scan and identify frontend and backend folders, frameworks, and start commands.
3. Save configuration to `.hostmagic.json`.
4. Register the `.local` domains in your system's `hosts` file (triggering UAC in Windows if needed).

Options:
- `-y, --yes`: Skip prompts and accept all detected defaults.
- `-n, --name <name>`: Specify custom project name for domain resolution.

### 2. Run Services Concurrently (`hostmagic run`)

```bash
hostmagic run
```

Hostmagic will:
1. Allocate unique available ports.
2. Print an interactive banner with clickable URLs.
3. Infiltrate environment variables into memory:
   - **Frontend:** `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `VITE_API_URL`
   - **Backend:** `PORT`, `APP_URL`, `FRONTEND_URL`, `CORS_ORIGIN`
4. Stream interleaved logs with `[FRONT]` and `[BACK]` prefixes.

### 3. Clean System Hosts (`hostmagic clean`)

When you want to remove domain entries from your operating system's `hosts` file:

```bash
# Clean current project entries
hostmagic clean

# Clean all Hostmagic entries across all projects (prompts for confirmation)
hostmagic clean --all

# Clean all entries without interactive confirmation prompt
hostmagic clean --all --yes
```

---

## ⚙️ Configuration Schema (`.hostmagic.json`)

```json
{
  "$schema": "https://raw.githubusercontent.com/hostmagic/cli/main/schema.json",
  "name": "my-app",
  "tld": "local",
  "services": [
    {
      "name": "frontend",
      "path": "frontend",
      "type": "frontend",
      "domain": "my-app.local",
      "command": "npm run dev"
    },
    {
      "name": "backend",
      "path": "backend",
      "type": "backend",
      "domain": "backend.my-app.local",
      "command": "npm run dev"
    }
  ]
}
```

---

## 🧩 Injected Environment Variables

Hostmagic injects these environment variables in-memory for each service at runtime:

| Target Service | Variable Name | Example Value | Description |
| :--- | :--- | :--- | :--- |
| **Frontend** | `PORT` | `54321` | Internal ephemeral port (handled by Reverse Proxy) |
| **Frontend** | `NEXT_PUBLIC_APP_URL` | `http://my-app.local` | Clean frontend base URL (no port) |
| **Frontend** | `NEXT_PUBLIC_API_URL` | `http://backend.my-app.local` | Clean backend API URL for Next.js (no port) |
| **Frontend** | `VITE_API_URL` | `http://backend.my-app.local` | Clean backend API URL for Vite (no port) |
| **Backend** | `PORT` | `54322` | Internal ephemeral port (handled by Reverse Proxy) |
| **Backend** | `APP_URL` | `http://backend.my-app.local` | Clean backend base URL (no port) |
| **Backend** | `FRONTEND_URL` | `http://my-app.local` | Clean frontend URL for CORS / redirects (no port) |
| **Backend** | `CORS_ORIGIN` | `http://my-app.local` | CORS allowed origin header (no port) |

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
