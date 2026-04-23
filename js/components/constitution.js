/**
 * Constitution Component with Version Diff Viewer
 * Enables users to compare different versions of the constitution
 * and select text from the current version to add to proposals.
 * 
 * IMPROVEMENTS:
 * - Sticky action panel that stays visible during text selection
 * - Inline toast notifications instead of popup alerts
 */

export function renderConstitution(state) {
    if (state.loading.constitution) {
        return `
            <div class="flex items-center justify-center py-40">
                <div class="flex flex-col items-center gap-6">
                    <div class="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs text-center">Loading Constitution Versions...</p>
                </div>
            </div>`;
    }

    if (!state.constitutionVersions || state.constitutionVersions.length === 0) {
        return `
            <div class="max-w-7xl mx-auto pb-20 fade-in text-center">
                <div class="bg-white dark:bg-slate-900 p-20 rounded-[4rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <i data-lucide="alert-circle" class="w-16 h-16 text-slate-400 mx-auto mb-6"></i>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mb-4">No Constitution Versions Available</p>
                    <p class="text-slate-500 text-sm">Unable to load constitution versions. Please try refreshing the page.</p>
                    <button onclick="window.reloadConstitution()"
                        class="mt-6 px-6 py-3 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all">
                        Retry
                    </button>
                </div>
            </div>`;
    }

    // Determine if we're in diff mode
    const isDiffMode = state.constitutionCompareVersion !== null;
    const currentVersion = state.constitutionVersions.find(v => v.name === state.constitutionCurrentVersion);
    const compareVersion = isDiffMode ? state.constitutionVersions.find(v => v.name === state.constitutionCompareVersion) : null;

    // Check if wizard is in progress (kept for backward compatibility)
    const wizardInProgress = localStorage.getItem('wizard_in_progress');

    // --- Text Selection System ---
    // Flow: highlight → popup appears → click + CAP or + CIS → coloured pill
    // appears at top of the constitution. X on a pill removes it.
    if (!window.selectionHandlerInitialized) {
        window.selectionHandlerInitialized = true;

        // Committed pills — array of { id, text, sectionId, type }
        window.stagedSelections = window.stagedSelections || [];

        const PILL_COLORS = {
            CAP: { bg: '#2563eb', hover: '#1d4ed8' },
            CIS: { bg: '#7c3aed', hover: '#6d28d9' }
        };

        // Re-render the pill bar above the constitution article
        function renderSelectionBar() {
            const col = document.getElementById('constitution-col');
            if (!col) return;
            let bar = document.getElementById('selection-bar');
            if (!window.stagedSelections.length) {
                if (bar) bar.remove();
                return;
            }
            if (!bar) {
                bar = document.createElement('div');
                bar.id = 'selection-bar';
                col.insertBefore(bar, col.firstChild);
            }
            bar.style.cssText = 'margin-bottom:16px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;';
            bar.innerHTML = window.stagedSelections.map(s => {
                const bg = PILL_COLORS[s.type]?.bg || '#2563eb';
                const preview = s.text.length > 55 ? s.text.slice(0, 52).trimEnd() + '…' : s.text;
                return `<span style="display:inline-flex;align-items:center;gap:8px;background:${bg};border-radius:999px;padding:6px 14px;max-width:100%;">
                    <span style="color:#fff;font-size:10px;font-weight:900;letter-spacing:.08em;text-transform:uppercase;flex-shrink:0;opacity:.75">${s.type}</span>
                    <span style="color:#fff;font-size:11px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:300px" title="${s.text.replace(/"/g,'&quot;')}">${preview}</span>
                    <button onclick="window.removeSelection('${s.id}')" style="background:rgba(255,255,255,0.2);border:none;color:#fff;cursor:pointer;font-size:11px;font-weight:900;padding:1px 5px;line-height:1;border-radius:999px;flex-shrink:0" title="Remove">✕</button>
                </span>`;
            }).join('');
        }

        // Show the floating popup above the highlighted text
        function showSelectionPopup(rect) {
            let popup = document.getElementById('selection-popup');
            if (!popup) {
                popup = document.createElement('div');
                popup.id = 'selection-popup';
                popup.style.cssText = 'position:fixed;z-index:9999;display:flex;align-items:center;gap:6px;background:#1e293b;border-radius:14px;padding:6px 10px;box-shadow:0 8px 32px rgba(0,0,0,0.35);pointer-events:auto;';
                document.body.appendChild(popup);
            }
            const isLoggedIn = !!window.state?.ghToken;
            popup.innerHTML = isLoggedIn
                ? `<button onclick="window.commitSelection('CAP')" style="background:#2563eb;color:#fff;border:none;border-radius:10px;padding:5px 13px;font-size:11px;font-weight:800;cursor:pointer;letter-spacing:.05em;white-space:nowrap">+ CAP</button>
                   <button onclick="window.commitSelection('CIS')" style="background:#7c3aed;color:#fff;border:none;border-radius:10px;padding:5px 13px;font-size:11px;font-weight:800;cursor:pointer;letter-spacing:.05em;white-space:nowrap">+ CIS</button>`
                : `<span style="color:#94a3b8;font-size:11px;font-weight:700;padding:0 4px">Login to flag text</span>`;
            popup.style.top = '-9999px';
            popup.style.left = '-9999px';
            popup.style.display = 'flex';
            requestAnimationFrame(() => {
                const h = popup.offsetHeight;
                const popupW = popup.offsetWidth;
                const top = rect.top + window.scrollY - h - 10;
                const left = Math.max(8, Math.min(rect.left + rect.width / 2 - popupW / 2, window.innerWidth - popupW - 8));
                popup.style.top = `${top}px`;
                popup.style.left = `${left}px`;
            });
        }

        function hidePopup() {
            const popup = document.getElementById('selection-popup');
            if (popup) popup.style.display = 'none';
        }

        // Called when user clicks + CAP or + CIS in the popup
        window.commitSelection = (type) => {
            if (!window.currentSelection?.text) return;
            const { text, sectionId } = window.currentSelection;
            // Avoid exact-text duplicates of same type
            if (!window.stagedSelections.some(s => s.text === text && s.type === type)) {
                window.stagedSelections.push({ id: `sel-${Date.now()}`, text, sectionId, type });
            }
            // Pass to existing proposal machinery
            if (type === 'CAP') window.addTextToCAP?.();
            else window.addTextToCIS?.();
            // Clear the live selection & popup
            window.currentSelection = null;
            window.getSelection()?.removeAllRanges();
            hidePopup();
            renderSelectionBar();
            const summaryEl = document.getElementById('constitution-selection-summary');
            if (summaryEl) summaryEl.textContent = 'Highlight text in the constitution to select it';
        };

        // Remove a single pill by id
        window.removeSelection = (id) => {
            window.stagedSelections = window.stagedSelections.filter(s => s.id !== id);
            renderSelectionBar();
        };

        // Clear everything — pills, live selection, popup
        window.clearConstitutionSelection = () => {
            window.currentSelection = null;
            window.stagedSelections = [];
            window.getSelection()?.removeAllRanges();
            hidePopup();
            renderSelectionBar();
            const summaryEl = document.getElementById('constitution-selection-summary');
            if (summaryEl) summaryEl.textContent = 'Highlight text in the constitution to select it';
        };

        document.addEventListener('mouseup', (e) => {
            // If the click landed inside the popup, let the button's click handler run uninterrupted
            if (document.getElementById('selection-popup')?.contains(e.target)) return;
            try {
                const selection = window.getSelection();
                const text = selection.toString().trim();
                const isDiffModeActive = window.state?.constitutionCompareVersion !== null;

                if (text.length > 3 && !isDiffModeActive) {
                    // Only react to selections inside the constitution article
                    let node = selection.anchorNode;
                    let inside = false;
                    while (node && node !== document.body) {
                        const el = node.nodeType === 1 ? node : node.parentElement;
                        if (!el) break;
                        if (el.id === 'constitution-content') { inside = true; break; }
                        node = el.parentElement;
                    }
                    if (!inside) return;

                    // Determine section context
                    node = selection.anchorNode;
                    let contextId = 'General';
                    while (node && node !== document.body) {
                        const target = node.nodeType === 1 ? node : node.parentElement;
                        if (target?.id) { contextId = target.id; break; }
                        let sib = target?.previousElementSibling;
                        while (sib) { if (sib.id) { contextId = sib.id; break; } sib = sib.previousElementSibling; }
                        if (contextId !== 'General') break;
                        node = target?.parentElement;
                    }
                    const sectionId = contextId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

                    // Store as pending selection (no pill yet — pill appears on button click)
                    window.currentSelection = { text, sectionId };

                    const summaryEl = document.getElementById('constitution-selection-summary');
                    if (summaryEl) summaryEl.textContent = `${text.length} chars selected`;

                    showSelectionPopup(selection.getRangeAt(0).getBoundingClientRect());
                } else {
                    hidePopup();
                }
            } catch (e) {
                console.warn('Selection handler error:', e);
            }
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') window.clearConstitutionSelection?.();
        });
    }

    const sections = [
        { id: 'preamble', label: 'Preamble' },
        { id: 'article-i-cardano-blockchain-tenets-and-guardrails', label: 'Art I: Tenets' },
        { id: 'article-ii-the-cardano-blockchain-community', label: 'Art II: Community' },
        { id: 'article-iii-participatory-and-decentralized-governance', label: 'Art III: Governance' },
        { id: 'article-iv-the-cardano-blockchain-ecosystem-budget', label: 'Art IV: Budget' },
        { id: 'article-v-delegated-representatives', label: 'Art V: DReps' },
        { id: 'article-vi-stake-pool-operators', label: 'Art VI: SPOs' },
        { id: 'article-vii-constitutional-committee', label: 'Art VII: Committee' },
        { id: 'article-viii-amendment-process', label: 'Art VIII: Amendment' },
        { id: 'appendix-i-cardano-blockchain-guardrails', label: 'App I: Guardrails' },
        { id: 'appendix-ii-supporting-guidance', label: 'App II: Guidance' }
    ];

    return `
        <div class="max-w-7xl mx-auto pb-20 fade-in text-left relative">
            
            <!-- Header -->
            <header class="mb-12">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <i data-lucide="book-open" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h1 class="text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                            Constitution
                        </h1>
                        <p class="text-slate-500 text-xl font-medium mt-2">Foundational governance document</p>
                    </div>
                </div>

                ${!isDiffMode ? `
                <div class="mt-6 flex items-start gap-3 px-5 py-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/40 rounded-2xl">
                    <i data-lucide="mouse-pointer-2" class="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"></i>
                    <p class="text-sm text-blue-700 dark:text-blue-300 font-medium leading-relaxed">
                        <span class="font-black">Proposing a change?</span>
                        Highlight any section of the text below. A small menu will appear — click <span class="font-black">+ CAP</span> to flag it as a Constitutional Amendment Proposal, or <span class="font-black">+ CIS</span> to flag it as a Constitutional Issue Statement. Your selections will appear as coloured pills above the document.
                    </p>
                </div>
                ` : ''}
            </header>

            <!-- Main Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Sidebar -->
                <aside class="lg:col-span-1 space-y-6 sticky top-8 h-fit">
                    ${!isDiffMode && wizardInProgress ? `
                    <!-- Return to Wizard — only shown when a wizard session is active -->
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <button onclick="window.returnToWizard()"
                            class="w-full px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">
                            <i data-lucide="arrow-left" class="w-4 h-4 inline-block mr-2"></i>Return to Wizard
                        </button>
                    </div>
                    ` : ''}

                    <!-- Version Selector -->
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Version</h3>
                        <select onchange="window.switchConstitutionVersion(this.value)" 
                            class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all">
                            ${state.constitutionVersions.map(v => `
                                <option value="${v.name}" ${v.name === state.constitutionCurrentVersion ? 'selected' : ''}>
                                    ${v.name} ${v.isCurrent ? '(Current)' : ''} ${v.isOfficial ? '' : '(CAP Preview)'}
                                </option>
                            `).join('')}
                        </select>
                    </div>

                    <!-- Download Button -->
                    <button onclick="window.downloadConstitution()"
                        class="w-full px-4 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                        <i data-lucide="download" class="w-4 h-4"></i>
                        Download (.txt)
                    </button>

                    <!-- Diff Mode Toggle -->
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Compare Mode</h3>
                        ${!isDiffMode ? `
                            <button onclick="window.enableDiffMode()" 
                                class="w-full px-4 py-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                <i data-lucide="git-compare" class="w-4 h-4"></i>
                                Enable Diff View
                            </button>
                        ` : `
                            <select onchange="window.setCompareVersion(this.value)" 
                                class="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all mb-3">
                                ${state.constitutionVersions.filter(v => v.name !== state.constitutionCurrentVersion).map(v => `
                                    <option value="${v.name}" ${v.name === state.constitutionCompareVersion ? 'selected' : ''}>
                                        ${v.name}
                                    </option>
                                `).join('')}
                            </select>
                            <button onclick="window.disableDiffMode()" 
                                class="w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                                <i data-lucide="x" class="w-4 h-4"></i>
                                Exit Diff Mode
                            </button>
                        `}
                    </div>

                    <!-- Quick Navigation -->
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Jump To</h3>
                        <div class="space-y-1 max-h-96 overflow-y-auto no-scrollbar">
                            ${sections.map(s => `
                                <a href="#${s.id}" 
                                    class="block px-3 py-2 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                    ${s.label}
                                </a>
                            `).join('')}
                        </div>
                    </div>


                    ${isDiffMode ? `
                    <!-- Diff Legend -->
                    <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                        <h3 class="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Legend</h3>
                        <div class="space-y-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-red-400 rounded"></div>
                                <span>Removed from current</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-green-400 rounded"></div>
                                <span>Added in proposed</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-4 h-4 bg-blue-400 rounded"></div>
                                <span>Modified</span>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                </aside>

                <!-- Constitution Display -->
                <div id="constitution-col" class="lg:col-span-3">
                    ${isDiffMode ? renderDiffView(currentVersion, compareVersion) : renderSingleView(currentVersion)}
                </div>
            </div>
        </div>`;
}

/**
 * Renders a single version of the constitution
 */
/**
 * Normalizes constitution content to standard markdown format with consistent headers
 */
function normalizeConstitutionMarkdown(content) {
    let normalized = content;
    
    // Define section patterns and their corresponding standard headers
    const sections = [
        {
            patterns: [/PREAMBLE/i],
            standardHeader: '## PREAMBLE',
            id: 'preamble'
        },
        {
            patterns: [/ARTICLE\s+I(?:\s|:|$)/i, /ARTICLE\s+1(?:\s|:|$)/i],
            standardHeader: '## ARTICLE I: CARDANO BLOCKCHAIN TENETS AND GUARDRAILS',
            id: 'article-i'
        },
        {
            patterns: [/ARTICLE\s+II(?:\s|:|$)/i, /ARTICLE\s+2(?:\s|:|$)/i],
            standardHeader: '## ARTICLE II: THE CARDANO BLOCKCHAIN COMMUNITY',
            id: 'article-ii'
        },
        {
            patterns: [/ARTICLE\s+III(?:\s|:|$)/i, /ARTICLE\s+3(?:\s|:|$)/i],
            standardHeader: '## ARTICLE III: PARTICIPATORY AND DECENTRALIZED GOVERNANCE',
            id: 'article-iii'
        },
        {
            patterns: [/ARTICLE\s+IV(?:\s|:|$)/i, /ARTICLE\s+4(?:\s|:|$)/i],
            standardHeader: '## ARTICLE IV: THE CARDANO BLOCKCHAIN ECOSYSTEM BUDGET',
            id: 'article-iv'
        },
        {
            patterns: [/ARTICLE\s+V(?:\s|:|$)/i, /ARTICLE\s+5(?:\s|:|$)/i],
            standardHeader: '## ARTICLE V: DELEGATED REPRESENTATIVES',
            id: 'article-v'
        },
        {
            patterns: [/ARTICLE\s+VI(?:\s|:|$)/i, /ARTICLE\s+6(?:\s|:|$)/i],
            standardHeader: '## ARTICLE VI: STAKE POOL OPERATORS',
            id: 'article-vi'
        },
        {
            patterns: [/ARTICLE\s+VII(?:\s|:|$)/i, /ARTICLE\s+7(?:\s|:|$)/i],
            standardHeader: '## ARTICLE VII: CONSTITUTIONAL COMMITTEE',
            id: 'article-vii'
        },
        {
            patterns: [/ARTICLE\s+VIII(?:\s|:|$)/i, /ARTICLE\s+8(?:\s|:|$)/i],
            standardHeader: '## ARTICLE VIII: AMENDMENT PROCESS',
            id: 'article-viii'
        },
        {
            patterns: [/APPENDIX\s+I(?:\s|:|$)/i],
            standardHeader: '## APPENDIX I: CARDANO BLOCKCHAIN GUARDRAILS',
            id: 'appendix-i'
        },
        {
            patterns: [/APPENDIX\s+II(?:\s|:|$)/i],
            standardHeader: '## APPENDIX II: SUPPORTING GUIDANCE',
            id: 'appendix-ii'
        }
    ];
    
    // Replace headers with standard format - replace any number of # at the start of lines
    for (const section of sections) {
        for (const pattern of section.patterns) {
            // Match lines that start with any number of # or just the text
            const linePattern = new RegExp(`^#+\\s*${pattern.source}|^${pattern.source}`, 'gmi');
            normalized = normalized.replace(linePattern, section.standardHeader);
        }
    }
    
    return normalized;
}

function renderSingleView(version) {
    if (!version) return '<p class="text-slate-400">Version not found.</p>';
    
    // Clean CAP preview metadata before processing
    let cleanedContent = version.content;

    // Extract and remove CIP-120 disclaimer (render separately)
    let disclaimerHtml = '';
    const disclaimerMatch = cleanedContent.match(/^\*This is a CIP-120 compliant copy[\s\S]*?https:\/\/[^\s*]+\*/);
    if (disclaimerMatch) {
        const urlMatch = disclaimerMatch[0].match(/https:\/\/[^\s*]+/);
        const url = urlMatch ? urlMatch[0] : '';
        disclaimerHtml = `
            <div class="mb-6 px-5 py-3 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs text-slate-500 dark:text-slate-400 italic">
                This is a CIP-120 compliant copy of the Cardano Constitution.
                The raw, authoritative version can be found at
                <a href="${url}" target="_blank" rel="noopener" class="text-blue-500 hover:underline break-all">${url}</a>
            </div>`;
        cleanedContent = cleanedContent.replace(disclaimerMatch[0], '').trimStart();
    }

    // Remove the CAP preview header comment
    cleanedContent = cleanedContent.replace(/<!--\s*CAP-\d+\s+PREVIEW.*?-->/is, '');
    // Remove the Changes Summary section and footer comment
    cleanedContent = cleanedContent.replace(/\n*---\n*##\s+CAP-\d+\s+Changes Summary[\s\S]*?<!--\s*GENERATION SUMMARY[\s\S]*?-->/i, '');
    // Remove trailing markdown separators
    cleanedContent = cleanedContent.replace(/\n*---\s*$/i, '');
    
    // Normalize the content to standard markdown format
    const normalizedContent = normalizeConstitutionMarkdown(cleanedContent);
    
    // Define the section IDs and their matching patterns (using regex for precise matching)
    const sectionMappings = [
        { id: 'preamble', patterns: [/preamble/i] },
        { id: 'defined-terms', patterns: [/defined\s+terms/i] },
        { id: 'article-i-cardano-blockchain-tenets-and-guardrails', patterns: [/article\s+i(?:[^v]|$)/i, /article\s+1(?:\.|:|\s|$)/i] },
        { id: 'article-ii-the-cardano-blockchain-community', patterns: [/article\s+ii(?:[^i]|$)/i, /article\s+2(?:\.|:|\s|$)/i] },
        { id: 'article-iii-participatory-and-decentralized-governance', patterns: [/article\s+iii(?:[^i]|$)/i, /article\s+3(?:\.|:|\s|$)/i] },
        { id: 'article-iv-the-cardano-blockchain-ecosystem-budget', patterns: [/article\s+iv(?:[^v]|$)/i, /article\s+4(?:\.|:|\s|$)/i] },
        { id: 'article-v-delegated-representatives', patterns: [/article\s+v(?:[^i]|$)/i, /article\s+5(?:\.|:|\s|$)/i] },
        { id: 'article-vi-stake-pool-operators', patterns: [/article\s+vi(?:[^i]|$)/i, /article\s+6(?:\.|:|\s|$)/i] },
        { id: 'article-vii-constitutional-committee', patterns: [/article\s+vii(?:[^i]|$)/i, /article\s+7(?:\.|:|\s|$)/i] },
        { id: 'article-viii-amendment-process', patterns: [/article\s+viii(?:[^i]|$)/i, /article\s+8(?:\.|:|\s|$)/i] },
        { id: 'appendix-i-cardano-blockchain-guardrails', patterns: [/appendix\s+i(?:[^i]|$)/i] },
        { id: 'appendix-ii-supporting-guidance', patterns: [/appendix\s+ii(?:[^i]|$)/i] }
    ];
    
    // Parse the normalized markdown to HTML
    let htmlContent = window.marked.parse(normalizedContent);
    
    // Inject IDs into all h2 headers
    htmlContent = htmlContent.replace(/<h2[^>]*>(.*?)<\/h2>/gi, (match, headerText) => {
        const textLower = headerText.toLowerCase();
        
        // Find the best matching section using regex patterns
        for (const mapping of sectionMappings) {
            for (const pattern of mapping.patterns) {
                if (pattern.test(headerText)) {
                    return `<h2 id="${mapping.id}" class="scroll-mt-32 font-black italic tracking-tighter text-3xl uppercase text-slate-900 dark:text-white mt-16 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">${headerText}</h2>`;
                }
            }
        }

        // If no mapping found, generate an ID from the header text
        const defaultId = headerText.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        return `<h2 id="${defaultId}" class="scroll-mt-32 font-black italic tracking-tighter text-3xl uppercase text-slate-900 dark:text-white mt-16 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">${headerText}</h2>`;
    });

    return `
        ${disclaimerHtml}
        <article id="constitution-content" class="bg-white dark:bg-slate-900 p-10 sm:p-20 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none text-left leading-relaxed selection:bg-blue-600 selection:text-white">
            ${htmlContent}
        </article>`;
}

// ─── DIFF ENGINE (paragraph-aware) ─────────────────────────────────────────

/**
 * Strip metadata, normalize line endings, collapse single newlines within
 * paragraphs, then return array of non-empty paragraph strings.
 * This makes the diff immune to different word-wrap widths between files.
 */
/**
 * Split text into paragraphs and build a heading map.
 * Returns { paragraphs: string[], headingMap: string[] }
 * headingMap[i] = the nearest heading context for paragraph i
 */
function normalizeParagraphsWithHeadings(text) {
    if (!text) return { paragraphs: [], headingMap: [] };
    text = text.replace(/<!--[\s\S]*?-->/g, '');
    text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

    const rawBlocks = text.split(/\n{2,}/);
    const paragraphs = [];
    const headingMap = [];
    let currentHeading = '';

    for (const block of rawBlocks) {
        let p = block.trim()
            .replace(/^[=\-*]{3,}$/gm, '')
            .trim();

        // Detect heading lines before collapsing
        const headingMatch = p.match(/^(#{1,6})\s+(.+)/);
        if (headingMatch) {
            const level = headingMatch[1].length;
            const title = headingMatch[2].replace(/\*\*/g, '').trim();
            if (level <= 2) {
                currentHeading = title;
            } else {
                // Sub-heading: show as "Parent > Sub"
                const parent = currentHeading.split(' > ')[0];
                currentHeading = parent ? `${parent} > ${title}` : title;
            }
        }

        p = p.replace(/\n/g, ' ').replace(/\s+/g, ' ');
        if (p.length > 3) {
            paragraphs.push(p);
            headingMap.push(currentHeading);
        }
    }

    return { paragraphs, headingMap };
}

function normalizeParagraphs(text) {
    return normalizeParagraphsWithHeadings(text).paragraphs;
}

/**
 * LCS-based paragraph diff.
 * Returns array of {type:'equal'|'delete'|'insert', value:string}
 */
function diffParagraphs(oldPs, newPs) {
    const m = oldPs.length, n = newPs.length;
    const dp = Array.from({length: m + 1}, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = oldPs[i-1] === newPs[j-1]
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);

    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && oldPs[i-1] === newPs[j-1]) {
            ops.push({type:'equal', value: oldPs[i-1], oldIdx: i-1, newIdx: j-1}); i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
            ops.push({type:'insert', value: newPs[j-1], newIdx: j-1}); j--;
        } else {
            ops.push({type:'delete', value: oldPs[i-1], oldIdx: i-1}); i--;
        }
    }
    return ops.reverse();
}

/**
 * Word-level diff between two paragraph strings.
 * Returns {oldHtml, newHtml} with <mark> highlights.
 */
function wordLevelDiff(oldText, newText) {
    // Tokenize preserving spaces so rendered output stays readable
    const tok = t => t.match(/\S+|\s+/g) || [];
    const ow = tok(oldText), nw = tok(newText);
    const m = ow.length, n = nw.length;

    const dp = Array.from({length: m + 1}, () => new Int32Array(n + 1));
    for (let i = 1; i <= m; i++)
        for (let j = 1; j <= n; j++)
            dp[i][j] = ow[i-1] === nw[j-1]
                ? dp[i-1][j-1] + 1
                : Math.max(dp[i-1][j], dp[i][j-1]);

    const ops = [];
    let i = m, j = n;
    while (i > 0 || j > 0) {
        if (i > 0 && j > 0 && ow[i-1] === nw[j-1]) {
            ops.push({t:'eq', v: ow[i-1]}); i--; j--;
        } else if (j > 0 && (i === 0 || dp[i][j-1] >= dp[i-1][j])) {
            ops.push({t:'ins', v: nw[j-1]}); j--;
        } else {
            ops.push({t:'del', v: ow[i-1]}); i--;
        }
    }
    ops.reverse();

    let oldHtml = '', newHtml = '';
    for (const op of ops) {
        const v = escapeHtml(op.v);
        if (op.t === 'eq')  { oldHtml += v; newHtml += v; }
        else if (op.t === 'del') oldHtml += `<mark class="diff-del">${v}</mark>`;
        else                     newHtml += `<mark class="diff-ins">${v}</mark>`;
    }
    return {oldHtml, newHtml};
}

/**
 * Renders a focused diff — shows only changed paragraphs, not the whole document.
 * Uses the paragraph-aware engine above so line-wrap differences are invisible.
 */
function renderDiffView(currentVersion, compareVersion) {
    if (!currentVersion || !compareVersion) {
        return '<p class="text-slate-400 p-10">Cannot render diff: missing version data.</p>';
    }

    const oldData = normalizeParagraphsWithHeadings(currentVersion.content);
    const newData = normalizeParagraphsWithHeadings(compareVersion.content);
    const oldPs = oldData.paragraphs;
    const newPs = newData.paragraphs;
    const oldHeadings = oldData.headingMap;
    const newHeadings = newData.headingMap;

    // ── Flattened-file detection ─────────────────────────────────────────────
    // When a CAP preview was generated with a whitespace-collapsing bug, the
    // entire constitution ends up as 1–3 giant "paragraphs", while the official
    // has 400–700 normal ones.  Comparing them paragraph-for-paragraph would
    // produce hundreds of false "removed" entries.  Detect that case and show
    // a friendly fallback instead.
    const ratio = oldPs.length > 0 && newPs.length > 0
        ? Math.max(oldPs.length, newPs.length) / Math.min(oldPs.length, newPs.length)
        : 0;
    const newAvgLen = newPs.length
        ? newPs.reduce((s, p) => s + p.length, 0) / newPs.length
        : 0;
    const isFlattened = (newPs.length < 10 && oldPs.length > 50) ||
                        newAvgLen > 4000 ||
                        ratio > 15;

    if (isFlattened) {
        // Extract the Changes Summary section from the raw preview content so
        // we can still show something useful.
        const summaryMatch = compareVersion.content.match(
            /##\s+CAP-\d+\s+Changes Summary([\s\S]*?)(?:<!--|$)/i
        );
        const summaryText = summaryMatch
            ? summaryMatch[1].trim()
            : 'No changes summary found in this preview file.';

        return `
            <div class="space-y-6">
                <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 p-8 rounded-[2.5rem]">
                    <div class="flex items-start gap-4">
                        <i data-lucide="alert-triangle" class="w-6 h-6 text-amber-500 flex-shrink-0 mt-0.5"></i>
                        <div>
                            <p class="font-black text-amber-800 dark:text-amber-300 text-sm mb-2">Preview file needs to be regenerated</p>
                            <p class="text-amber-700 dark:text-amber-400 text-xs leading-relaxed">
                                This preview was generated with an older version of the tool that collapsed all
                                paragraph formatting. A word-level diff cannot be shown accurately.
                                An editor can open the CAP and click <strong>Regenerate Preview</strong> to fix this.
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">Changes summary from preview file</p>
                    </div>
                    <div class="p-6 prose dark:prose-invert max-w-none text-sm">
                        ${window.marked ? window.marked.parse(summaryText) : `<pre class="text-xs whitespace-pre-wrap">${escapeHtml(summaryText)}</pre>`}
                    </div>
                </div>
            </div>`;
    }
    // ── End flattened-file detection ─────────────────────────────────────────

    const rawOps = diffParagraphs(oldPs, newPs);

    // Merge adjacent delete+insert pairs into a single 'modify' op so we can
    // show a side-by-side word-level diff instead of two separate blocks.
    const ops = [];
    for (let k = 0; k < rawOps.length; k++) {
        if (
            rawOps[k].type === 'delete' &&
            k + 1 < rawOps.length &&
            rawOps[k + 1].type === 'insert'
        ) {
            ops.push({
                type: 'modify',
                oldValue: rawOps[k].value,
                newValue: rawOps[k + 1].value,
                oldIdx: rawOps[k].oldIdx,
                newIdx: rawOps[k + 1].newIdx
            });
            k++;
        } else {
            ops.push(rawOps[k]);
        }
    }

    const changes = ops.filter(op => op.type !== 'equal');

    // Resolve heading context for each change
    const getHeading = (op) => {
        if (op.oldIdx != null && oldHeadings[op.oldIdx]) return oldHeadings[op.oldIdx];
        if (op.newIdx != null && newHeadings[op.newIdx]) return newHeadings[op.newIdx];
        return '';
    };

    if (changes.length === 0) {
        return `
            <div class="bg-white dark:bg-slate-900 p-20 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm text-center">
                <div class="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i data-lucide="check-circle" class="w-8 h-8 text-green-500"></i>
                </div>
                <p class="text-slate-400 font-bold uppercase tracking-widest text-xs mb-2">No Differences Found</p>
                <p class="text-slate-500 text-sm">These two versions appear to be identical.</p>
            </div>`;
    }

    const nRemoved  = changes.filter(c => c.type === 'delete').length;
    const nAdded    = changes.filter(c => c.type === 'insert').length;
    const nModified = changes.filter(c => c.type === 'modify').length;

    const changeBlocks = changes.map((op, idx) => {
        const label = `Change ${idx + 1} of ${changes.length}`;
        const heading = getHeading(op);
        const headingBadge = heading
            ? `<span class="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full truncate max-w-[300px]" title="${escapeHtml(heading)}"><i data-lucide="bookmark" class="w-3 h-3 inline -mt-0.5 mr-1"></i>${escapeHtml(heading)}</span>`
            : '';

        if (op.type === 'modify') {
            const { oldHtml, newHtml } = wordLevelDiff(op.oldValue, op.newValue);
            return `
                <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-blue-200 dark:border-blue-900/40 shadow-sm overflow-hidden">
                    <div class="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-900/30 flex items-center gap-2 flex-wrap">
                        <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400">Modified</span>
                        ${headingBadge}
                        <span class="text-[10px] text-blue-400 dark:text-blue-500 ml-auto">${label}</span>
                    </div>
                    <div class="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                        <div class="p-6">
                            <p class="text-[9px] font-black uppercase tracking-widest text-red-400 mb-3">Before (current)</p>
                            <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">${oldHtml}</p>
                        </div>
                        <div class="p-6">
                            <p class="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3">After (proposed)</p>
                            <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">${newHtml}</p>
                        </div>
                    </div>
                </div>`;
        }

        if (op.type === 'delete') {
            return `
                <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-red-200 dark:border-red-900/40 shadow-sm overflow-hidden">
                    <div class="px-6 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30 flex items-center gap-2 flex-wrap">
                        <div class="w-2 h-2 bg-red-500 rounded-full"></div>
                        <span class="text-[10px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Removed</span>
                        ${headingBadge}
                        <span class="text-[10px] text-red-400 dark:text-red-500 ml-auto">${label}</span>
                    </div>
                    <div class="p-6">
                        <p class="text-[9px] font-black uppercase tracking-widest text-red-400 mb-3">Paragraph removed from current</p>
                        <p class="text-sm leading-relaxed text-slate-500 dark:text-slate-400 line-through">${escapeHtml(op.value)}</p>
                    </div>
                </div>`;
        }

        // insert
        return `
            <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-green-200 dark:border-green-900/40 shadow-sm overflow-hidden">
                <div class="px-6 py-3 bg-green-50 dark:bg-green-900/20 border-b border-green-100 dark:border-green-900/30 flex items-center gap-2 flex-wrap">
                    <div class="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span class="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">Added</span>
                    ${headingBadge}
                    <span class="text-[10px] text-green-400 dark:text-green-500 ml-auto">${label}</span>
                </div>
                <div class="p-6">
                    <p class="text-[9px] font-black uppercase tracking-widest text-green-500 mb-3">New paragraph in proposed</p>
                    <p class="text-sm leading-relaxed text-slate-700 dark:text-slate-300">${escapeHtml(op.value)}</p>
                </div>
            </div>`;
    }).join('');

    return `
        <div class="space-y-6">
            <!-- Summary bar -->
            <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div class="flex flex-wrap items-center gap-4">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Comparing versions</p>
                        <p class="text-lg font-black text-slate-900 dark:text-white">
                            ${escapeHtml(currentVersion.name)}
                            <span class="text-slate-400 font-normal mx-2">→</span>
                            ${escapeHtml(compareVersion.name)}
                        </p>
                    </div>
                    <div class="ml-auto flex items-center gap-2 flex-wrap">
                        ${nRemoved  ? `<span class="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">${nRemoved} removed</span>` : ''}
                        ${nAdded    ? `<span class="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">${nAdded} added</span>` : ''}
                        ${nModified ? `<span class="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-xs font-bold">${nModified} modified</span>` : ''}
                    </div>
                </div>
            </div>

            <!-- Individual change blocks -->
            ${changeBlocks}
        </div>`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
