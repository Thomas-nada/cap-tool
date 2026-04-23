import { GITHUB_CONFIG } from './config.js';

/**
 * Generic fetch wrapper for GitHub API.
 * Token is optional — public repo read calls work without auth (60 req/hr limit).
 * Write operations (POST/PUT/PATCH/DELETE) still require a token.
 */
export async function ghFetch(endpoint, token, options = {}) {
    const activeToken = token || localStorage.getItem('gh_token');
    const isWriteOp = options.method && ['POST','PUT','PATCH','DELETE'].includes(options.method.toUpperCase());
    if (isWriteOp && !activeToken) throw new Error("AUTH_REQUIRED");

    const headers = {
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
    };
    if (activeToken) headers['Authorization'] = `token ${activeToken}`;

    const res = await fetch(`${GITHUB_CONFIG.API_BASE}${endpoint}`, {
        ...options,
        headers
    });

    if (res.status === 401) throw new Error(activeToken ? "AUTH_EXPIRED" : "AUTH_REQUIRED");
    if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `GitHub Error: ${res.status}`);
    }
    return res.status === 204 ? true : res.json();
}

/**
 * Commits a file to the repository as an Institutional Exhibit.
 */
export async function uploadFileToRepo(path, base64Content, message, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/contents/${path}`, token, {
        method: 'PUT',
        body: JSON.stringify({
            message: message,
            content: base64Content
        })
    });
}

/**
 * Fetches a file from the local server root.
 */
export async function fetchLocalFile(path) {
    const res = await fetch(`./${path}`);
    if (!res.ok) throw new Error(`Local file not found: "${path}"`);
    return await res.text();
}

/**
 * Fetches all constitution versions from the repository.
 * Tries multiple possible paths and supports both main versions and CAP previews.
 */
export async function fetchConstitutionVersions(token) {
    // Only try the correct path
    const possiblePaths = [
        'constitution'
    ];
    
    let allVersions = [];
    
    for (const path of possiblePaths) {
        try {
            const contents = await ghFetch(
                `/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/contents/${path}`, 
                token
            );
            
            
            // Filter for markdown AND text files, sort by date (newest first)
            const versions = contents
                .filter(file => file.name.endsWith('.md') || file.name.endsWith('.txt'))
                .map(file => {
                    // Extract date from filename
                    const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})/);
                    const date = dateMatch ? dateMatch[1] : '1900-01-01';
                    
                    // Create a clean display name
                    let displayName = file.name.replace(/\.(md|txt)$/, '');
                    displayName = displayName.replace(/^cardano-constitution-/, '');
                    displayName = displayName.replace(/^constitution-/, '');
                    
                    return {
                        name: displayName || file.name.replace(/\.(md|txt)$/, ''),
                        filename: file.name,
                        path: file.path,
                        downloadUrl: file.download_url,
                        date: date,
                        sha: file.sha,
                        isOfficial: true // Main constitution versions
                    };
                })
                .sort((a, b) => new Date(b.date) - new Date(a.date));

            
            if (versions.length > 0) {
                allVersions = [...allVersions, ...versions];
            }
            
        } catch (error) {
            console.warn(`Could not fetch from ${path}:`, error.message);
        }
    }
    
    // Now try to fetch CAP Constitution previews from subfolder
    try {
        const capPath = 'constitution/CAP%20Constitutions';
        const capContents = await ghFetch(
            `/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/contents/${capPath}`,
            token
        );

        const capVersions = capContents
            .filter(file => file.name.endsWith('.md') || file.name.endsWith('.txt'))
            .map(file => {
                // Extract CAP number and date (format: CAP-123-2025-01-29.txt)
                const capMatch = file.name.match(/CAP-(\d+)-(\d{4}-\d{2}-\d{2})/);
                const capNumber = capMatch ? capMatch[1] : 'Unknown';
                const date = capMatch ? capMatch[2] : '1900-01-01';
                
                return {
                    name: `CAP-${capNumber} Preview (${date})`,
                    filename: file.name,
                    path: file.path,
                    downloadUrl: file.download_url,
                    date: date,
                    sha: file.sha,
                    isOfficial: false, // CAP preview versions
                    capNumber: capNumber
                };
            })
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        allVersions = [...allVersions, ...capVersions];

    } catch (error) {
        // No CAP Constitutions folder yet — this is normal
    }
    
    if (allVersions.length === 0) {
        // Fall back to local file
        console.warn('No versions found in GitHub, falling back to local file');
        try {
            const content = await fetchLocalFile('cardano-constitution.md');
            const today = new Date().toISOString().split('T')[0];
            return [{
                name: today,
                filename: 'cardano-constitution.md',
                path: 'cardano-constitution.md',
                downloadUrl: null,
                date: today,
                isCurrent: true,
                isOfficial: true,
                content: content
            }];
        } catch (localError) {
            throw new Error('Could not load constitution from GitHub or local files');
        }
    }
    
    // Mark the most recent official version as current
    const officialVersions = allVersions.filter(v => v.isOfficial);
    if (officialVersions.length > 0) {
        officialVersions[0].isCurrent = true;
    }
    
    // Fetch content for all versions
    const versionsWithContent = await Promise.all(
        allVersions.map(async (version) => {
            try {
                const response = await fetch(version.downloadUrl);
                const content = await response.text();
                return { ...version, content };
            } catch (error) {
                console.error(`Failed to fetch content for ${version.filename}:`, error);
                return { ...version, content: '# Error loading content' };
            }
        })
    );

    return versionsWithContent;
}

/**
 * Formats text to comply with CIP-120:
 * - Lines max 80 characters (except headers with long parameter names)
 * - Preserves paragraph breaks, list indentation, headers
 */
function formatCIP120(text) {
    const lines = text.split('\n');
    const out = [];

    for (const line of lines) {
        // Don't wrap: blank lines, headers, list-start lines ≤80
        if (line.trim() === '' || /^#{1,6}\s/.test(line)) {
            out.push(line);
            continue;
        }

        if (line.length <= 80) {
            out.push(line);
            continue;
        }

        // Detect leading whitespace (for list continuation)
        const indent = line.match(/^(\s*)/)[1];
        const content = line.slice(indent.length);
        const words = content.split(' ');
        let current = indent;

        for (const w of words) {
            const test = current + (current.trim() ? ' ' : '') + w;
            if (test.length <= 80) {
                current = current.trim() ? test : current + w;
            } else {
                if (current.trim()) out.push(current);
                current = indent + w;
            }
        }
        if (current.trim()) out.push(current);
    }

    return out.join('\n');
}

/**
 * Generates a new constitution version based on CAP changes
 * @param {string} currentConstitutionContent - The current constitution text
 * @param {Array} revisions - Array of revision objects with {section, originalText, proposedText}
 * @param {number} capNumber - The CAP issue number
 * @param {string} date - Date string in YYYY-MM-DD format
 * @returns {string} The new constitution text with changes applied
 */
export function generateCapConstitution(currentConstitutionContent, revisions, capNumber, date) {
    let newConstitution = currentConstitutionContent;
    
    
    // Add header indicating this is a CAP preview
    const header = `<!-- 
    CAP-${capNumber} PREVIEW CONSTITUTION
    Generated: ${date}
    This is a preview of what the constitution would look like if CAP-${capNumber} is approved.
    This is NOT an official constitution version.
    
    CHANGES APPLIED:
${revisions.map((r, i) => `    ${i + 1}. ${r.section || 'General'}: ${r.originalText ? r.originalText.substring(0, 50) + '...' : 'N/A'}`).join('\n')}
-->

`;
    
    // Apply each revision
    let appliedCount = 0;
    let failedRevisions = [];
    
    revisions.forEach((revision, index) => {
        if (revision.originalText && revision.proposedText) {
            // Normalize whitespace: trim and replace multiple spaces/newlines with single space
            const normalizeWhitespace = (text) => {
                return text.trim().replace(/\s+/g, ' ');
            };
            
            const originalTextTrimmed = revision.originalText.trim();
            const originalTextNormalized = normalizeWhitespace(revision.originalText);
            const proposedTextTrimmed = revision.proposedText.trim();
            const constitutionNormalized = normalizeWhitespace(newConstitution);
            
            // Try exact match first
            if (newConstitution.includes(originalTextTrimmed)) {
                // Replace the text
                const beforeLength = newConstitution.length;
                newConstitution = newConstitution.replace(
                    originalTextTrimmed, 
                    proposedTextTrimmed
                );
                const afterLength = newConstitution.length;
                
                appliedCount++;
            } else if (originalTextNormalized && constitutionNormalized.includes(originalTextNormalized)) {
                // Build a whitespace-flexible regex and apply it to the ORIGINAL unflattened text.
                // This preserves all paragraph breaks / document structure.
                try {
                    const flexRegex = new RegExp(
                        originalTextNormalized
                            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // escape regex chars
                            .replace(/\s+/g, '\\s+'),                // allow any whitespace
                        'i'
                    );
                    if (flexRegex.test(newConstitution)) {
                        newConstitution = newConstitution.replace(flexRegex, proposedTextTrimmed);
                        appliedCount++;
                    } else {
                        failedRevisions.push({
                            index: index + 1,
                            section: revision.section,
                            originalText: originalTextTrimmed.substring(0, 100) + '...',
                            proposedText: proposedTextTrimmed.substring(0, 100) + '...'
                        });
                    }
                } catch (regexErr) {
                    // Regex too complex — fall through to failed
                    failedRevisions.push({
                        index: index + 1,
                        section: revision.section,
                        originalText: originalTextTrimmed.substring(0, 100) + '...',
                        proposedText: proposedTextTrimmed.substring(0, 100) + '...'
                    });
                }
            } else {
                // Try fuzzy matching - find text that contains most of the key words
                // Exact match failed — attempt fuzzy match using key words
                const originalWords = originalTextTrimmed.split(/\s+/).filter(w => w.length > 3);
                const keyWords = originalWords.slice(0, Math.max(5, Math.floor(originalWords.length / 2)));
                
                // Try to find a section containing these keywords
                let fuzzyMatch = null;
                let bestMatchScore = 0;
                
                // Create a regex pattern that requires the key phrases to appear in order
                const searchPattern = keyWords.join('.*?');
                const regex = new RegExp(searchPattern, 'i');
                
                const match = constitutionNormalized.match(
                    new RegExp(`.{0,100}${searchPattern}.{0,300}`, 'i')
                );
                
                if (match) {
                    // Try to replace using regex with flexible spacing
                    const fuzzyRegex = new RegExp(
                        originalTextNormalized
                            .split(/\s+/)
                            .slice(0, 10)
                            .join('.*?'),
                        'i'
                    );
                    
                    if (fuzzyRegex.test(newConstitution)) {
                        const beforeLength = newConstitution.length;
                        newConstitution = newConstitution.replace(fuzzyRegex, proposedTextTrimmed);
                        const afterLength = newConstitution.length;
                        
                        appliedCount++;
                    } else {
                        failedRevisions.push({
                            index: index + 1,
                            section: revision.section,
                            originalText: originalTextTrimmed.substring(0, 100) + '...',
                            proposedText: proposedTextTrimmed.substring(0, 100) + '...'
                        });
                    }
                } else {
                    failedRevisions.push({
                        index: index + 1,
                        section: revision.section,
                        originalText: originalTextTrimmed.substring(0, 100) + '...',
                        proposedText: proposedTextTrimmed.substring(0, 100) + '...'
                    });
                }
            }
        } else {
            failedRevisions.push({
                index: index + 1,
                section: revision.section,
                originalText: revision.originalText || 'MISSING',
                proposedText: revision.proposedText || 'MISSING'
            });
        }
    });
    
    // Format to CIP-120 (80-char line wrapping) before adding header
    newConstitution = formatCIP120(newConstitution);

    // Add header at the beginning
    newConstitution = header + newConstitution;
    
    // Add summary at the end
    const summary = `

---

## CAP-${capNumber} Changes Summary

**Applied:** ${appliedCount} of ${revisions.length} revision(s)
**Date:** ${date}

${failedRevisions.length > 0 ? `
### ⚠️ Revisions That Could Not Be Applied

The following revisions could not be automatically applied and require manual review:

${failedRevisions.map(f => `
#### Revision #${f.index}: ${f.section}
**Original text not found:**
\`\`\`
${f.originalText}
\`\`\`

**Proposed text:**
\`\`\`
${f.proposedText}
\`\`\`
`).join('\n')}

**Possible reasons:**
- The original text may have been modified in a previous change
- There might be slight differences in spacing or punctuation
- The text might span across multiple sections

**Action required:** Manual review and application of these changes.
` : ''}

---

<!-- 
    GENERATION SUMMARY:
    Total revisions: ${revisions.length}
    Successfully applied: ${appliedCount}
    Failed to apply: ${failedRevisions.length}
-->
`;
    
    newConstitution += summary;
    
    if (failedRevisions.length > 0) {
        console.warn(`CAP-${capNumber}: ${failedRevisions.length} of ${revisions.length} revision(s) could not be applied`);
    }
    
    return newConstitution;
}

/**
 * Uploads a CAP preview constitution to the repository
 */
export async function uploadCapConstitution(capNumber, date, content, token) {
    const filename = `CAP-${capNumber}-${date}.txt`;
    const path = `constitution/CAP%20Constitutions/${filename}`;
    
    // Convert content to base64
    const base64Content = btoa(unescape(encodeURIComponent(content)));
    
    const message = `Add CAP-${capNumber} preview constitution (${date})`;
    
    return await uploadFileToRepo(path, base64Content, message, token);
}

/**
 * Fetches all issues (proposals) from the repository.
 */
export async function fetchAllProposals(token) {
    const issues = await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues?state=all&per_page=100`, token);
    return issues.filter(i => !i.pull_request).map(i => {
        let type = 'Issue';
        if (i.labels.some(l => l.name.toUpperCase() === 'CIS')) type = 'CIS';
        else if (i.labels.some(l => l.name.toUpperCase() === 'CAP')) type = 'CAP';
        return { ...i, type };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export async function fetchProposalDetail(number, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}`, token);
}

export async function fetchProposalComments(number, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/comments`, token);
}

export async function fetchProposalEvents(number, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/events`, token);
}

/**
 * Creates a new GitHub issue with appropriate labels.
 */
export async function createGhIssue(title, body, category, type, token) {
    let labels = type === 'CIS' ? ["CIS", "consultation"] : ["CAP", "consultation"];
    if (category) labels.push(category);

    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues`, token, {
        method: 'POST',
        body: JSON.stringify({ title, body, labels })
    });
}

/**
 * Updates an existing issue's content.
 */
export async function updateGhIssueContent(number, title, body, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ title, body })
    });
}

/**
 * Updates the state (open/closed) of an issue.
 */
export async function updateIssueState(number, state, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ state })
    });
}

/**
 * Locks the issue and archives it to preserve the record.
 */
export async function deleteIssue(number, token) {
    await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/lock`, token, {
        method: 'PUT',
        body: JSON.stringify({ lock_reason: 'resolved' })
    });
    return await updateIssueState(number, 'closed', token);
}

/**
 * Fetches the editors list from editors.json in the repo root.
 * Falls back to an empty array if the file doesn't exist or can't be read.
 */
export async function fetchEditors() {
    try {
        const url = `https://raw.githubusercontent.com/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/main/editors.json`;
        const res = await fetch(url);
        if (!res.ok) return [];
        return await res.json();
    } catch {
        return [];
    }
}

/**
 * Adds a label to an issue.
 */
export async function addLabel(number, label, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/labels`, token, {
        method: 'POST',
        body: JSON.stringify({ labels: [label] })
    });
}

/**
 * Removes a label from an issue.
 */
export async function removeLabel(number, label, token) {
    const encoded = encodeURIComponent(label);
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/labels/${encoded}`, token, {
        method: 'DELETE'
    });
}

/**
 * Posts a comment to an issue deliberation.
 */
export async function postProposalComment(number, body, token) {
    return await ghFetch(`/repos/${GITHUB_CONFIG.REPO_OWNER}/${GITHUB_CONFIG.REPO_NAME}/issues/${number}/comments`, token, {
        method: 'POST',
        body: JSON.stringify({ body })
    });
}
