/**
 * Project Configuration
 * Reads credentials from env.local.js (local development).
 */

import { ENV } from '../env.local.js';

// GitHub Repository Configuration (uses env.local.js overrides when present)
export const GITHUB_CONFIG = {
    REPO_OWNER: ENV.REPO_OWNER || "Thomas-nada",
    REPO_NAME: ENV.REPO_NAME || "cap",
    API_BASE: "https://api.github.com"
};

// Set to a local server URL (e.g. "http://localhost:8766") to load
// constitution files from a local copy of the repo instead of GitHub.
// Set to null to use GitHub (production default).
export const LOCAL_CONSTITUTION_BASE = null;

// Local auth from env.local.js (replaces Firebase)
export const LOCAL_AUTH = {
    GITHUB_TOKEN: ENV.GITHUB_TOKEN || "",
    GITHUB_USERNAME: ENV.GITHUB_USERNAME || ""
};

// Application Constants
export const APP_ID = 'cap-portal-v1';