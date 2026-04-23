# CAP Portal — Cardano Constitutional Amendment Portal

A governance platform for managing Constitutional Amendment Proposals (CAPs) and Constitutional Information Submissions (CIS). Built with vanilla JavaScript, Tailwind CSS, and GitHub as the backend.

**Live:** https://cap-portal.onrender.com

---

## Features

- **Public read-only access** — anyone can browse proposals, view the constitution, and read guides without logging in
- **GitHub OAuth login** — log in with your GitHub account to submit proposals and add comments
- **Editor controls** — editors can manage lifecycle stages, signal labels, special handling flags, and suggest revisions directly on proposals (access managed via `editors.json`)
- **Editor revision suggestions** — editors can suggest edits to a proposal using the actual proposal form; authors receive a notification card and can apply or dismiss the suggestion
- **Audit trail** — every stage move, edit, signal change, and suggestion is recorded chronologically on the proposal; shows 5 most recent events with a "Show all" toggle
- **Proposal Registry** — list and Kanban views with full-text search and filtering
- **Constitution Viewer** — browse versions and compare diffs; select text to anchor CAP proposals
- **Amendment Wizard** — step-by-step guided form for creating CAPs and CIS submissions
- **Learning Hub** — guides and documentation for governance participants
- **Dark mode** — full light/dark theme support

---

## Authentication

The portal uses **GitHub OAuth** — no Personal Access Tokens required.

- Public visitors can browse everything without logging in
- Clicking "New CAP" or "Post Comment" prompts login
- Login redirects through GitHub OAuth and back to the portal automatically

The OAuth token exchange is handled by a small Flask gatekeeper service deployed at `https://cap-portal-auth.onrender.com`. This keeps the GitHub Client Secret server-side.

---

## Editors

Editors have additional controls on proposal detail pages (lifecycle stage management, signal labels, special handling flags).

The list of editors is maintained in **`editors.json`** in the root of the `Thomas-nada/cap` GitHub repo:

```json
["Thomas-nada", "another-editor"]
```

To add or remove editors, edit this file directly on GitHub. Changes take effect on the next login.

---

## Project Structure

```
cap-portal/
├── index.html                  # Single-page app entry point
├── styles.css                  # Global styles
├── CAP.png                     # Logo
├── dev-server.py               # Local development server (port 8765)
├── gatekeeper/
│   ├── app.py                  # Flask OAuth gatekeeper (deployed to Render)
│   └── requirements.txt
├── js/
│   ├── app.js                  # App state, routing, all action handlers
│   ├── api.js                  # GitHub API wrapper functions
│   ├── config.js               # Repo owner/name, API base URL
│   ├── env.js                  # GITHUB_TOKEN = null (OAuth used in production)
│   └── components/
│       ├── nav.js              # Navigation bar
│       ├── landing.js          # Login page (shown before OAuth completes)
│       ├── dashboard.js        # Home view with stats and activity
│       ├── registry.js         # Proposal list/kanban registry
│       ├── kanban.js           # Kanban board view
│       ├── detail.js           # Proposal detail, comments, editor controls
│       ├── wizard.js           # Step-by-step proposal creation wizard
│       ├── create.js           # Direct form-based proposal creation
│       ├── edit.js             # Edit existing proposals
│       ├── constitution.js     # Constitution viewer with diff and text selection
│       └── learn.js            # Guides and learning hub
├── docs/guides/                # Markdown guide files for the Learn hub
└── CAPs/                       # CAP document files (CAP-0001/, etc.)
```

---

## Local Development

```bash
python dev-server.py
# Open: http://localhost:8765
```

The dev server serves the portal and handles ES6 module loading. OAuth login works on localhost because the GitHub OAuth app's callback URLs include `http://localhost:8765`.

> **Note:** The Render free tier gatekeeper sleeps after inactivity. On first login after a period of inactivity, the auth exchange may take 20–30 seconds. The portal shows a "Warming up auth server…" message during this time.

---

## Deployment

The portal is deployed as two Render services:

| Service | Type | URL |
|---------|------|-----|
| `cap-portal` | Static site | https://cap-portal.onrender.com |
| `cap-portal-auth` | Flask web service | https://cap-portal-auth.onrender.com |

The gatekeeper requires two environment variables set in Render:
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`

These come from the GitHub OAuth App registered at https://github.com/settings/developers.

---

## GitHub Repository Setup

The portal reads from and writes to `Thomas-nada/cap` on GitHub.

Required repo structure:
- Issues enabled (proposals are stored as GitHub Issues)
- Labels matching the lifecycle stages: `consultation`, `ready`, `done`, `withdrawn`
- Labels for status tags: `review`, `revision`, `finalizing`, `onchain`
- Labels for editor signals: `editor-ok`, `editor-concern`, `editor-suggested`
- Labels for author signal: `author-ready`
- Labels for special handling: `major`, `minor`, `bundle`, `fast-track`, `pause`
- Type labels: `CAP`, `CIS`
- `constitution/` folder with at least one `.md` constitution file
- `editors.json` in the root listing GitHub usernames who have editor access

> **Note:** `draft`, `submitted`, and `Deliberation-Period` are legacy labels from earlier versions. New submissions enter at the `consultation` stage. Existing proposals with these legacy labels can be advanced to `consultation` using the editor lifecycle controls.

---

## Technologies

- **Frontend:** Vanilla JavaScript (ES6 modules), Tailwind CSS, Marked.js, Lucide Icons
- **Backend:** GitHub REST API + GraphQL, Flask gatekeeper for OAuth
- **Auth:** GitHub OAuth 2.0 (web flow)
- **Hosting:** Render (static site + web service)

---

## Troubleshooting

**Blank page / module errors:**
- Must be served over HTTP (not `file://` protocol) — use `python dev-server.py`
- Clear browser cache and hard-reload (Ctrl+Shift+R)

**Login doesn't work:**
- The gatekeeper may be cold-starting — wait 30 seconds and try again
- Check browser console for CORS errors; verify `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` are set in Render

**Not showing as editor:**
- Confirm your GitHub username is listed in `editors.json` in the `Thomas-nada/cap` repo
- Log out and back in — editor status is resolved at login time
