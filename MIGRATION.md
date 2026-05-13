# Migration Guide — Moving to IntersectMBO

This guide covers moving both the data repo (`Thomas-nada/cap`) and the portal repo (`Thomas-nada/cap-tool`) to the `intersectmbo` GitHub organisation, and getting the tool fully operational under the new ownership.

Throughout this guide, replace:
- `<data-repo>` with the final name chosen for the proposals/data repository
- `<portal-repo>` with the final name chosen for the portal code repository
- `<portal-url>` with the live URL of the new frontend deployment
- `<gatekeeper-url>` with the live URL of the new gatekeeper deployment

---

## Overview of What Changes

| What | Current value | Needs to become |
|------|--------------|-----------------|
| Data repo | `Thomas-nada/cap` | `intersectmbo/<data-repo>` |
| Portal repo | `Thomas-nada/cap-tool` | `intersectmbo/<portal-repo>` |
| GitHub OAuth App | Registered under Thomas-nada | Registered under intersectmbo |
| `js/config.js` — `REPO_OWNER` | `"Thomas-nada"` | `"intersectmbo"` |
| `js/config.js` — `REPO_NAME` | `"cap"` | `"<data-repo>"` |
| `js/config.js` — `EDITORS_FALLBACK` | `['Thomas-nada']` | Updated editors list |
| `js/app.js` — `BUG_REPORT_REPO` | `'Thomas-nada/cap-tool'` | `'intersectmbo/<portal-repo>'` |
| `js/app.js` — `GITHUB_CLIENT_ID` | Current client ID | New OAuth App client ID |
| `js/app.js` — `GATEKEEPER_URL` | `https://cap-portal-auth.onrender.com` | `<gatekeeper-url>` |
| `js/components/learn.js` — data repo link | `https://github.com/Thomas-nada/cap` | `https://github.com/intersectmbo/<data-repo>` |
| `gatekeeper/app.py` — CORS origins | `https://cap-portal.onrender.com` | `<portal-url>` |
| Gatekeeper env vars | Current OAuth credentials | New OAuth App credentials |

---

## Step 1 — Transfer the Data Repo

The data repo holds all proposals (as GitHub Issues), labels, and the constitution files. **Transfer, don't recreate** — transferring preserves all issues, comments, labels, and history.

1. Go to `https://github.com/Thomas-nada/cap` → **Settings** → **Danger Zone** → **Transfer ownership**
2. Enter `intersectmbo` as the destination organisation and confirm
3. The repo will be available at `https://github.com/intersectmbo/<data-repo>` immediately

After transfer, verify in the new repo:
- All issues (proposals) are present
- All labels are intact
- The `constitution/` folder is present
- `editors.json` exists in the root — update it now to reflect the new editors list:

```json
["editor-username-1", "editor-username-2"]
```

---

## Step 2 — Transfer the Portal Repo

1. Go to `https://github.com/Thomas-nada/cap-tool` → **Settings** → **Danger Zone** → **Transfer ownership**
2. Enter `intersectmbo` as the destination and confirm

The portal repo will be available at `https://github.com/intersectmbo/<portal-repo>`.

---

## Step 3 — Create a New GitHub OAuth App

The existing OAuth App is registered under `Thomas-nada` and its client secret cannot be transferred. A new one must be created under the intersectmbo organisation.

1. Go to **https://github.com/organizations/intersectmbo/settings/applications** → **New OAuth App**
2. Fill in:

| Field | Value |
|-------|-------|
| Application name | e.g. `IntersectMBO CAP Portal` |
| Homepage URL | `<portal-url>` |
| Authorization callback URL | `<portal-url>` |

3. Note the **Client ID** — you will put this in `js/app.js`
4. Click **Generate a new client secret** — store it securely, you will set it as an environment variable on the gatekeeper

---

## Step 4 — Update the Portal Code

All changes are in the transferred portal repo at `intersectmbo/<portal-repo>`. Make these edits directly on GitHub or clone and push.

**`js/config.js`**

```js
export const GITHUB_CONFIG = {
    REPO_OWNER: "intersectmbo",
    REPO_NAME:  "<data-repo>",
    API_BASE:   "https://api.github.com"
};

export const EDITORS_FALLBACK = ['editor-username-1'];
```

**`js/app.js`** — two constants near line 1667:

```js
const BUG_REPORT_REPO = 'intersectmbo/<portal-repo>';   // line ~102
const GITHUB_CLIENT_ID = '<new-oauth-app-client-id>';    // line ~1667
const GATEKEEPER_URL   = '<gatekeeper-url>';             // line ~1668
```

**`js/components/learn.js`** — update the data repo link (search for `Thomas-nada/cap`):

```js
href="https://github.com/intersectmbo/<data-repo>"
```

**`gatekeeper/app.py`** — update the CORS allowed origins:

```python
CORS(app, origins=[
    '<portal-url>',
    'http://localhost:8765',
])
```

---

## Step 5 — Deploy the Gatekeeper

Deploy `gatekeeper/app.py` as a web service under the intersectmbo deployment account. Set these environment variables:

```
GITHUB_CLIENT_ID=<new-oauth-app-client-id>
GITHUB_CLIENT_SECRET=<new-oauth-app-client-secret>
```

Once deployed, note the service URL — this is your `<gatekeeper-url>`. Confirm Step 4 has this URL set in `js/app.js`.

Verify the gatekeeper is running:
```
GET <gatekeeper-url>/health  →  {"status": "ok"}
```

---

## Step 6 — Deploy the Frontend

Deploy the portal repo root as a static site. No build step required.

Once the static site is live, confirm its URL matches what you set in:
- The GitHub OAuth App's **Authorization callback URL** (Step 3)
- `GATEKEEPER_URL` in `js/app.js` — this is the *gatekeeper* URL, but confirm the *frontend* URL matches the OAuth callback
- `CORS(app, origins=[...])` in `gatekeeper/app.py`

If any of these URLs don't match exactly, OAuth login will fail.

---

## Step 7 — Smoke Test

1. Open `<portal-url>` — proposals from the data repo should load without logging in
2. Click login — you should be redirected to GitHub for OAuth
3. After authorising, you should land back on the portal as a logged-in user
4. If your username is in `editors.json`, editor controls should be visible on proposal detail pages
5. Create a test proposal and confirm it appears as an Issue in `intersectmbo/<data-repo>`

---

## What Does NOT Change

- All proposals and their history — carried over by the repo transfer
- All labels — carried over by the repo transfer
- The constitution files — carried over by the repo transfer
- The `docs/guides/` content — lives in the portal repo, transferred with it
- Local development workflow — `python dev-server.py` still works unchanged

---

## Rollback

If anything goes wrong during the cutover, the original repos remain accessible at `Thomas-nada/cap` and `Thomas-nada/cap-tool` until GitHub's redirect expires (GitHub redirects old URLs for a period after transfer). The old Render deployments will still function as long as the old OAuth App credentials are intact.
