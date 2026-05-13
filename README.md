# CAP Portal — Operational Guide

This is a self-hostable governance portal. It uses **GitHub Issues as the data store**, a **small Flask service for OAuth**, and a **static frontend** served from anywhere. This guide covers everything needed to fork and run your own instance.

---

## Architecture

```
Browser → Static frontend (index.html + js/)
             ↓ GitHub REST API (proposals, comments, labels)
             ↓ Gatekeeper (gatekeeper/app.py) — OAuth token exchange only
```

The frontend is entirely static. The gatekeeper is a minimal Flask service whose only job is keeping your GitHub OAuth Client Secret off the client. All proposal data lives in GitHub Issues on a repo you control.

---

## What You Need

- A GitHub account
- Two GitHub repositories: one for the portal code (this repo), one for proposals (the "data repo")
- A GitHub OAuth App
- A place to host the static frontend (Render, Netlify, GitHub Pages, etc.)
- A place to run the Flask gatekeeper (Render, Railway, Fly.io, etc.)

---

## Step 1 — Create the Data Repo

Create a new GitHub repo (e.g. `your-org/proposals`). This is where proposals will be stored as Issues and the constitution will be read from.

**Required repo contents:**

`editors.json` in the root — list of GitHub usernames with editor access:
```json
["your-github-username"]
```

`constitution/` folder — at least one `.md` file containing the document the portal will display. Filename becomes the version label shown in the UI (e.g. `v1.0.md`).

**Required labels** — create these in the repo's Labels settings:

| Purpose | Labels |
|---------|--------|
| Lifecycle stages | `consultation` `ready` `done` `withdrawn` |
| Status tags | `review` `revision` `finalizing` `onchain` |
| Editor signals | `editor-ok` `editor-concern` `editor-suggested` |
| Author signal | `author-ready` |
| Special handling | `major` `minor` `bundle` `fast-track` `pause` |
| Document type | `CAP` `CIS` |

Issues must be enabled on the repo.

---

## Step 2 — Configure the Portal Code

Fork this repo, then edit two files:

**`js/config.js`** — point to your data repo:
```js
export const GITHUB_CONFIG = {
    REPO_OWNER: "your-org",
    REPO_NAME:  "proposals",
    API_BASE:   "https://api.github.com"
};

export const EDITORS_FALLBACK = ['your-github-username'];
```

**`gatekeeper/app.py`** — update the CORS origins to your own URLs:
```python
CORS(app, origins=[
    'https://your-portal.onrender.com',
    'http://localhost:8765',
])
```

---

## Step 3 — Create the GitHub OAuth App

Go to **GitHub → Settings → Developer settings → OAuth Apps → New OAuth App**.

| Field | Value |
|-------|-------|
| Application name | Your portal name |
| Homepage URL | Your frontend URL |
| Authorization callback URL | Your frontend URL (same as homepage) |

Note the **Client ID** and generate a **Client Secret** — you'll need both in the next step.

---

## Step 4 — Deploy the Gatekeeper

The gatekeeper is a Flask app in `gatekeeper/`. Deploy it as a web service anywhere that can run Python.

**Environment variables to set on the host:**

```
GITHUB_CLIENT_ID=<your OAuth app client ID>
GITHUB_CLIENT_SECRET=<your OAuth app client secret>
```

The app binds to `$PORT` automatically. The only route that matters is `GET /authenticate/<code>`.

**On Render:** create a new Web Service, point it at the `gatekeeper/` directory, set build command `pip install -r requirements.txt` and start command `gunicorn app:app`.

---

## Step 5 — Deploy the Frontend

The frontend is a static site — just `index.html`, `styles.css`, `CAP.png`, `js/`, `docs/`, and `cardano-constitution.md`. No build step.

**`js/env.js`** — leave `GITHUB_TOKEN` as `null` in production. Users authenticate via OAuth at runtime:
```js
export const GITHUB_TOKEN = null;
```

Point your static host at the repo root. On Render: create a Static Site, set the publish directory to `/` (repo root).

After deploying, go back to your GitHub OAuth App settings and confirm the **Authorization callback URL** matches your live frontend URL exactly.

---

## Local Development

```bash
python dev-server.py
# Open http://localhost:8765
```

The dev server handles ES module loading and serves the app on port 8765. OAuth login works on localhost as long as `http://localhost:8765` is listed in your OAuth App's callback URLs.

For a GitHub PAT (skip OAuth locally), edit `js/env.js`:
```js
export const GITHUB_TOKEN = 'ghp_your_token_here';
```
Do not commit this value — `env.js` is gitignored.

---

## Troubleshooting

**Blank page / module errors** — the app must be served over HTTP, not opened as a `file://` URL. Use `python dev-server.py`.

**Login fails silently** — open the browser console. A CORS error means the gatekeeper's allowed origins list doesn't include your frontend URL. A 401 from GitHub means the OAuth App credentials are wrong or the callback URL doesn't match exactly.

**Gatekeeper cold start** — on free-tier hosting the gatekeeper may sleep after inactivity. The first login after a dormant period can take 20–30 seconds. The portal displays a "Warming up…" message during this.

**Not showing as editor** — editor status is resolved at login time from `editors.json` in the data repo. Edit that file and log out and back in.
