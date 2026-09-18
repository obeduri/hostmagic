# 🧙‍♂️ Hostmagic

> Automate local fullstack development with clean `.local` domains, zero-conflict ephemeral ports, and concurrent service execution.

[![npm version](https://img.shields.io/npm/v/hostmagic.svg)](https://www.npmjs.com/package/hostmagic)
[![License: MIT](https://img.shields.io/badge/License-MIT-magenta.svg)](https://opensource.org/licenses/MIT)

**Hostmagic** is a developer CLI tool built with Node.js and TypeScript that eliminates the everyday friction of local fullstack development. It automatically detects your frontend and backend services, configures system `.local` domain names (with seamless Windows UAC elevation and Unix `sudo`), assigns dynamic random ports at runtime, and launches your services concurrently with clear, prefixed logs.

> 💡 **Tip:** You can use either `hostmagic` or the shorthand **`hm`** alias for all commands (e.g. `hm init`, `hm dev`, `hm clean`, `hm --hostfile`).

---

## ⚡ Key Features

- 🌐 **Clean `.local` Domains (No Ports!):** Say goodbye to confusing `localhost:3000` and ports at the end of URLs. Your apps run directly on intuitive addresses like `http://my-app.local` and `http://backend.my-app.local`.
- ⚡ **Built-in Port 80 Reverse Proxy:** Transparently routes incoming HTTP traffic and WebSockets (for HMR with Vite, Next.js, and Astro) from port 80 to your services' internal ephemeral ports.
- 🛡️ **Non-Destructive & Namespaced `hosts` Management:** Safely inserts and updates system `hosts` entries inside isolated `# BEGIN hostmagic:<project>` blocks without corrupting existing entries.
- 🪟 **Automatic Windows UAC Elevation:** Running without administrative rights in Windows? Hostmagic triggers a native PowerShell UAC elevation prompt automatically without forcing you to restart your terminal as Administrator.
- 🔍 **Heuristic Service Detection:** Scans subdirectories (`frontend/`, `backend/`, `client/`, `server/`, `apps/web/`, `apps/api/`) and inspects `package.json` to detect Next.js, Vite, Astro, NestJS, Express, etc.
- 🎲 **Zero-Conflict Ephemeral Ports:** Allocates available random system ports internally via `get-port` so you can run multiple copies or projects simultaneously without port collision errors (`EADDRINUSE`).
- 💉 **In-Memory Environment Injection:** Injects clean cross-service URLs (`NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, `PORT`) directly into process memory without modifying your physical `.env` files.
- 🌲 **Cascading Process Tree Termination:** Pressing `ESC` or `Ctrl+C` cleans up all child processes (Bun, Vite, Node) using `tree-kill`, leaving no zombie processes holding onto system ports.
- 📝 **Cross-Platform Hosts File Opener:** Open the operating system's `hosts` file across Windows, macOS, and Linux in your default editor with `hm --hostfile`.

---

## 📑 Table of Contents

1. [Prerequisites](#-prerequisites)
2. [Installation & Setup](#-step-1-installation--setup)
3. [Step-by-Step Usage Guide](#-step-by-step-usage-guide)
   - [Step 1: Initialize Your Project (`hm init`)](#step-1-initialize-your-project-hm-init)
   - [Step 2: Run Services Concurrently (`hm dev`)](#step-2-run-services-concurrently-hm-dev)
   - [Step 3: Browser Access & Hot Reloading](#step-3-browser-access--hot-reloading)
   - [Step 4: Stopping Services (`ESC` or `Ctrl+C`)](#step-4-stopping-services-esc-or-ctrlc)
   - [Step 5: Cleaning Up Hosts Entries (`hm clean`)](#step-5-cleaning-up-hosts-entries-hm-clean)
   - [Step 6: Opening System Hosts File (`hm --hostfile`)](#step-6-opening-system-hosts-file-hm---hostfile)
4. [⚡ Quick 2-Minute Demo Setup (Try Without Existing Project)](#-quick-2-minute-demo-setup)
5. [⚙️ Configuration Schema (`.hostmagic.json`)](#️-configuration-schema-hostmagicjson)
6. [🔐 Google OAuth & Third-Party Authentication](#-google-oauth--third-party-authentication)
7. [🧩 Injected Environment Variables](#-injected-environment-variables)
8. [❓ Troubleshooting & FAQs](#-troubleshooting--faqs)
9. [🏗️ Architecture & Development](#️-architecture--development)
10. [📄 License](#-license)

---

## 📋 Prerequisites

- **Node.js:** v18.0.0 or later (or **Bun** v1.0+).
- **Operating System:** Windows 10/11, macOS, or Linux.
- **Administrator / Sudo Privileges:** Required only once when adding or removing entries in your system's `hosts` file (handled automatically via UAC / sudo prompts).

---

## 🚀 Step-by-Step Usage Guide

### Step 1: Installation & Setup

Run Hostmagic instantly with `npx`, install it globally, or link it locally from source:

```bash
# Option A: Run directly with npx
npx hostmagic init

# Option B: Install globally via npm (provides both `hostmagic` and `hm`)
npm install -g hostmagic

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
2. **Scans & classifies services:** Detects `frontend/`, `backend/`, `apps/web/`, `apps/api/`, etc., and reads `package.json` to identify Next.js, Vite, Astro, NestJS, Express, etc.
3. **Assigns clean domains:** Configures `http://my-app.local` and `http://backend.my-app.local`.
4. **Saves configuration:** Writes `.hostmagic.json` in your project root.
5. **Updates system `hosts`:**
   - **Windows:** Triggers a native PowerShell UAC elevation prompt automatically (click **Yes**).
   - **macOS / Linux:** Prompts for `sudo` to securely update `/etc/hosts`.
   - Writes entries inside isolated `# BEGIN hostmagic:<project>` blocks.
   - Flushes system DNS cache.

**CLI Options:**
- `-y, --yes`: Accept all detected defaults without interactive prompts.
- `-n, --name <name>`: Provide a custom project name for domain resolution.
- `-t, --tld <tld>`: Custom top-level domain suffix (default: `"local"`, e.g. `"localtest.me"`).

---

### Step 3: Run Services Concurrently (`hm dev`)

Start all services and the local reverse proxy with a single command:

```bash
hm dev
# or: hostmagic dev, hostmagic run, hm start
```

#### What happens at startup:
1. **Starts Port 80 Reverse Proxy:** Intercepts traffic on port 80 and maps requests to internal service ports based on the `Host` HTTP header.
2. **Allocates Ephemeral Ports:** Assigns random available ports internally to each child process without conflicts.
3. **Injects In-Memory Variables:** Injects clean URLs without modifying your physical `.env` files:
   - **Frontend:** `PORT`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL`, `VITE_API_URL`
   - **Backend:** `PORT`, `APP_URL`, `FRONTEND_URL`, `CORS_ORIGIN`
4. **Displays Interactive Banner:**
   ```text
   ┌────────────────────────────────────────────────────────────────┐
   │  🚀 Hostmagic is running clean domains for [my-app]            │
   ├────────────────────────────────────────────────────────────────┤
   │  • [FRONTEND] frontend: http://my-app.local                    │
   │  • [BACKEND]  backend:  http://backend.my-app.local            │
   ├────────────────────────────────────────────────────────────────┤
   │  ⚡ Port 80 Reverse Proxy active (no port numbers needed in browser) │
   │  Press Ctrl+C at any time to gracefully stop all services.     │
   └────────────────────────────────────────────────────────────────┘
   ```
5. **Streams Prefixed Logs:** Displays concurrent output with `[FRONT]` (Cyan) and `[BACK]` (Magenta) tags.

---

### Step 4: Browser Access & Hot Reloading

Open your browser and navigate directly to:
- **Frontend Application:** `http://my-app.local`
- **Backend API:** `http://backend.my-app.local`

**No port numbers required!** Full WebSocket proxying is enabled, meaning Hot Module Replacement (HMR) in Vite, Next.js, and Astro works seamlessly out of the box.

---

### Step 5: Stopping Services (`ESC` or `Ctrl+C`)

To stop all running services cleanly:
- Press **`ESC`** or **`Ctrl + C`** in your terminal.
- Hostmagic captures the signal/keypress and executes a cascading process tree kill (`tree-kill`), terminating all sub-processes (Bun, Node, Vite) and freeing sockets immediately without leaving zombie background tasks.

---

### Step 6: Cleaning Up Hosts Entries (`hm clean`)

To remove domain entries from your operating system's `hosts` file:

```bash
# Clean entries for the current project
hm clean

# Clean all Hostmagic entries across all projects (prompts for confirmation)
hm clean --all

# Clean all entries without interactive confirmation prompt
hm clean --all --yes
```

---

### Step 7: Opening System Hosts File (`hm --hostfile`)

Instantly open your operating system's `hosts` file across **Windows**, **macOS**, and **Linux** in your default or preferred editor:

```bash
# Open using default system editor (Notepad on Windows, TextEdit on macOS, xdg-open/nano on Linux)
hm --hostfile
# or: hostmagic --hostfile, hm -H, hm hostfile, hm hosts

# Open with a specific custom editor (e.g. VS Code, Cursor, nano)
hm hostfile --editor code
hm --hostfile -e cursor
```

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
Open `http://hostmagic-demo.local` and `http://backend.hostmagic-demo.local` in your browser!

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

## 🔐 Google OAuth & Third-Party Authentication

Google Cloud Console strictly forbids `.local` domains and non-public TLDs (*"Invalid Origin: must end with a public top-level domain"*). The only HTTP origin exception allowed by Google OAuth is `localhost`.

Hostmagic solves this natively: the port 80 Reverse Proxy automatically intercepts requests to `http://localhost` and `http://127.0.0.1` and routes them directly to your Frontend!

### How to configure Google Cloud Console:
Set your OAuth client once and for all without worrying about changing dynamic ports:
- **Authorized JavaScript origins:**
  `http://localhost`
- **Authorized redirect URIs:**
  `http://localhost/api/auth/callback/google` (or your framework's callback route, e.g. NextAuth/Auth.js)

Your app remains accessible at `http://<name>.local` for clean local development, while OAuth callbacks route smoothly through `http://localhost`.

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

## ❓ Troubleshooting & FAQs

### Q: Windows UAC prompt appeared. Is this normal?
**Yes.** Windows restricts modification of `C:\Windows\System32\drivers\etc\hosts` to Administrators. Hostmagic invokes PowerShell's `Start-Process -Verb RunAs` so you don't need to manually run an Administrator terminal.

### Q: What if port 80 is already in use?
If another server (such as IIS, Apache, or Skype) occupies port 80, `hostmagic run` will notify you with a clear error message. You can stop the conflicting service or disable IIS World Wide Web Publishing Service in Windows Services (`services.msc`).

### Q: Do I need to edit my `.env` files?
**No.** Hostmagic injects `NEXT_PUBLIC_API_URL`, `FRONTEND_URL`, and other variables directly into the running process's memory. Your physical `.env` files remain untouched.

### Q: What happens if a port or dev server is already running?
If a port (or a Next.js development server from a previous crash/session) is already active, Hostmagic detects it automatically:
- Shows the PID and executable name (e.g. `node.exe (PID 45748)`).
- Interactively asks if you want to terminate it:
  `Do you want to terminate node.exe (PID 45748) to free port 58993? (Y/n)`
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
