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
- 🔐 **Universal OAuth 2.0 Support (Any Provider):** Works seamlessly with **all providers following the OAuth 2.0 standard** (Google, GitHub, GitLab, Discord, Auth0, Okta, Supabase, Apple, Microsoft/Azure AD, Slack, Keycloak, etc.). An auxiliary listener on port 3000 catches incoming callbacks and immediately redirects with HTTP 302/307 to your `.test` domain, delivering PKCE, CSRF tokens, and session cookies with **zero application code changes**.
- ⚡ **Built-in Port 80 Reverse Proxy:** Transparently routes incoming HTTP traffic and WebSockets (for HMR with Vite, Next.js, and Astro) from port 80 to your services' internal ephemeral ports.
- 🛡️ **Non-Destructive & Namespaced `hosts` Management:** Safely inserts and updates system `hosts` entries inside isolated `# BEGIN hostmagic:<project>` blocks without corrupting existing entries.
- 🍎 **Full macOS Support:** Native `/etc/hosts` synchronization with standard `sudo`, immediate mDNS / Bonjour cache clearing via `dscacheutil -flushcache` and `killall -HUP mDNSResponder`, process detection with `lsof`, and default TextEdit / GUI opener support.
- 🐧 **First-Class Linux Support:** Complete compatibility across Ubuntu, Debian, Fedora, Arch, and more. Safely updates `/etc/hosts` using standard `sudo`, flushes `systemd-resolved` / `resolvectl` caches, detects listeners with `lsof`/`fuser`/`ss`, and supports non-root port 80 binding via `setcap`.
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
6. [🔐 Universal OAuth 2.0 Support (Any Provider)](#-universal-oauth-20-support-any-provider)
7. [🧩 Injected Environment Variables](#-injected-environment-variables)
8. [❓ Troubleshooting & FAQs](#-troubleshooting--faqs)
9. [🏗️ Architecture & Development](#️-architecture--development)
10. [📄 License](#-license)

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
2. **Scans & classifies services:** Detects `frontend/`, `backend/`, `apps/web/`, `apps/api/`, etc., and reads `package.json` to identify Next.js, Vite, Astro, NestJS, Express, etc.
3. **Assigns clean domains:** Configures `http://my-app.test` and `http://backend.my-app.test`.
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
   │  🚀 Hostmagic is running clean domains for [my-app]            │
   ├────────────────────────────────────────────────────────────────┤
   │  • [FRONTEND] frontend: http://my-app.test                     │
   │  • [BACKEND]  backend:  http://backend.my-app.test             │
   ├────────────────────────────────────────────────────────────────┤
   │  ⚡ Port 80 Reverse Proxy active (no port numbers needed in browser) │
   │  Press Ctrl+C at any time to gracefully stop all services.     │
   └────────────────────────────────────────────────────────────────┘
   ```
6. **Streams Prefixed Logs:** Displays concurrent output with `[FRONT]` (Cyan) and `[BACK]` (Magenta) tags.

---

### Step 4: Browser Access & Hot Reloading

Open your browser and navigate directly to:
- **Frontend Application:** `http://my-app.test`
- **Backend API:** `http://backend.my-app.test`

**No port numbers required!** Full WebSocket proxying is enabled, meaning Hot Module Replacement (HMR) in Vite, Next.js, and Astro works seamlessly out of the box across Chrome, Safari, Firefox, Edge, Arc, and Brave on macOS, Linux, and Windows.

---

### Step 5: Stopping Services (`ESC` or `Ctrl+C`)

To stop all running services cleanly:
- Press **`ESC`** or **`Ctrl + C`** in your terminal.
- Hostmagic captures the signal/keypress and executes a cross-platform process tree kill (`tree-kill` issuing `SIGINT`/`SIGTERM`/`SIGKILL` on Unix and `taskkill /F /T` on Windows), terminating all sub-processes (Bun, Node, Vite) and freeing sockets immediately without leaving zombie background tasks.

---

### Step 6: Cleaning Up Hosts Entries (`hm clean`)

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

### Step 7: Opening System Hosts File (`hm --hostfile`)

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

## ❓ Troubleshooting & FAQs

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
