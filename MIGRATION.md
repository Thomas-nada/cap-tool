# Migration Guide — Production Setup on IntersectMBO

This guide covers standing up a clean production instance of the CAP Portal under the `intersectmbo` GitHub organisation. Everything is created from scratch — new repos, new OAuth app, new deployments.

Throughout this guide, replace:
- `<data-repo>` with the chosen name for the proposals repository
- `<portal-repo>` with the chosen name for the portal code repository
- `<portal-url>` with the live URL of the frontend deployment
- `<gatekeeper-url>` with the live URL of the gatekeeper deployment

---

## Step 1 — Create the Data Repo

Create a new repository at `intersectmbo/<data-repo>`. This is where proposals will live as GitHub Issues and the constitution will be read from.

**Settings to enable:**
- Issues must be on
- No default branch protection rules needed (the portal manages content via the API)

**Create `editors.json` in the root:**
```json
["editor-username-1", "editor-username-2"]
```

**Create the `constitution/` folder** with at least one `.md` file containing the constitution document. The filename becomes the version label shown in the portal (e.g. `v1.0.md`).

**Create all required labels** under Issues → Labels:

| Purpose | Labels to create |
|---------|-----------------|
| Lifecycle stages | `consultation` `ready` `done` `withdrawn` |
| Status tags | `review` `revision` `finalizing` `onchain` |
| Editor signals | `editor-ok` `editor-concern` `editor-suggested` |
| Author signal | `author-ready` |
| Special handling | `major` `minor` `bundle` `fast-track` `pause` |
| Document type | `CAP` `CIS` |

---

## Step 2 — Create the Portal Repo

Create a new repository at `intersectmbo/<portal-repo>` and push the portal code to it. This is a clean push — no history from the development repo is needed.

```bash
git clone https://github.com/Thomas-nada/cap-tool.git
cd cap-tool
git remote set-url origin https://github.com/intersectmbo/<portal-repo>.git
git push origin main
```

---

## Step 3 — Create the GitHub OAuth App

1. Go to **https://github.com/organizations/intersectmbo/settings/applications** → **New OAuth App**
2. Fill in:

| Field | Value |
|-------|-------|
| Application name | e.g. `IntersectMBO CAP Portal` |
| Homepage URL | `<portal-url>` |
| Authorization callback URL | `<portal-url>` |

3. Note the **Client ID** — goes into `js/app.js`
4. Click **Generate a new client secret** — store it securely, goes into the gatekeeper as an environment variable

---

## Step 4 — Update the Portal Code

Make the following edits in the `intersectmbo/<portal-repo>` codebase.

**`js/config.js`**

```js
export const GITHUB_CONFIG = {
    REPO_OWNER: "intersectmbo",
    REPO_NAME:  "<data-repo>",
    API_BASE:   "https://api.github.com"
};

export const EDITORS_FALLBACK = ['editor-username-1'];
```

**`js/app.js`**

```js
// ~line 102
const BUG_REPORT_REPO = 'intersectmbo/<portal-repo>';

// ~line 1667
const GITHUB_CLIENT_ID = '<new-oauth-app-client-id>';
const GATEKEEPER_URL   = '<gatekeeper-url>';
```

**`js/components/learn.js`** — search for `Thomas-nada/cap` and replace:

```html
href="https://github.com/intersectmbo/<data-repo>"
```

**`gatekeeper/app.py`** — update the CORS allowed origins:

```python
CORS(app, origins=[
    '<portal-url>',
    'http://localhost:8765',
])
```

Commit and push these changes to `intersectmbo/<portal-repo>`.

---

## Step 5 — Deploy the Gatekeeper

Deploy `gatekeeper/app.py` as a web service. Set the following environment variables on the host:

```
GITHUB_CLIENT_ID=<new-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<new-oauth-app-client-secret>
```

Once deployed, confirm `<gatekeeper-url>` is live:
```
GET <gatekeeper-url>/health  →  {"status": "ok"}
```

---

## Step 6 — Deploy the Frontend

Deploy the `intersectmbo/<portal-repo>` root as a static site. No build step. Once live, confirm:

- The site URL matches the **Authorization callback URL** set in the OAuth App (Step 3)
- The site URL matches the CORS origin in `gatekeeper/app.py` (Step 4)

All three must be identical or OAuth login will fail.

---

## Step 7 — Smoke Test

1. Open `<portal-url>` — the portal loads, no proposals yet (expected)
2. Click login — GitHub OAuth prompt appears
3. After authorising, you land back on the portal as a logged-in user
4. If your username is in `editors.json`, editor controls are visible on proposal detail pages
5. Create a test proposal via the Amendment Wizard — confirm it appears as an Issue in `intersectmbo/<data-repo>`
6. Move it through a lifecycle stage — confirm the label is applied on GitHub
7. Delete the test issue from GitHub when done
