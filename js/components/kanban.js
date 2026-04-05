/**
 * Kanban Board Component -- GitHub Projects-style
 * Full-viewport horizontal board with lifecycle columns,
 * next-action callouts, integrated tag reference, and grab-to-scroll.
 * Includes: position-aware drops, mobile drag handles, saving spinners,
 * drag-over column expand, and multi-user polling.
 */

// ──────────────────────────────────────────────
// MOBILE DETECTION
// ──────────────────────────────────────────────
const IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

// ──────────────────────────────────────────────
// CARD POSITION CACHE (per-column ordering)
// ──────────────────────────────────────────────
const POSITION_CACHE_KEY = 'cap-kanban-positions';

function getPositionCache() {
    try { return JSON.parse(localStorage.getItem(POSITION_CACHE_KEY)) || {}; }
    catch { return {}; }
}

function setPositionCache(columnKey, orderedNumbers) {
    const cache = getPositionCache();
    cache[columnKey] = orderedNumbers;
    localStorage.setItem(POSITION_CACHE_KEY, JSON.stringify(cache));
}

function getColumnOrder(columnKey) {
    return getPositionCache()[columnKey] || [];
}

// ──────────────────────────────────────────────
// DATA: Lifecycle columns & transition graph
// ──────────────────────────────────────────────

const LIFECYCLE_COLUMNS = [
    { key: 'draft',         label: 'Draft',         color: 'slate',   icon: 'file-edit',       responsible: 'Author' },
    { key: 'submitted',     label: 'Submitted',     color: 'blue',    icon: 'send',            responsible: 'Author -> Editor' },
    { key: 'review',        label: 'Review',         color: 'amber',   icon: 'search',          responsible: 'Editor' },
    { key: 'consultation',  label: 'Consultation',   color: 'purple',  icon: 'messages-square', responsible: 'Editor' },
    { key: 'revision',      label: 'Revision',       color: 'orange',  icon: 'pencil',          responsible: 'Author / Editor' },
    { key: 'finalizing',    label: 'Finalizing',     color: 'cyan',    icon: 'check-square',    responsible: 'Editor' },
    { key: 'ready',         label: 'Ready',           color: 'green',   icon: 'check-circle',    responsible: 'Editor' },
    { key: 'onchain',       label: 'On-Chain',       color: 'indigo',  icon: 'link',            responsible: 'Author' },
    { key: 'done',          label: 'Done',            color: 'emerald', icon: 'archive',         responsible: 'Editor' },
    { key: 'withdrawn',     label: 'Withdrawn',      color: 'red',     icon: 'x-circle',        responsible: 'Author' },
];

/** Forward transitions: from -> { to, who, hint } */
const NEXT_TRANSITIONS = {
    'draft':        { to: 'submitted',    who: 'Author',              hint: 'Submit for review' },
    'submitted':    { to: 'review',       who: 'Editor',              hint: 'Begin editorial review' },
    'review':       { to: 'consultation', who: 'Editor',              hint: 'Open for consultation' },
    'consultation': { to: 'finalizing',   who: 'Editor',              hint: 'Move to finalizing (or revision)' },
    'revision':     { to: 'consultation', who: 'Author',              hint: 'Resubmit after revisions' },
    'finalizing':   { to: 'ready',        who: 'Editor',              hint: 'Mark as ready' },
    'ready':        { to: 'onchain',      who: 'Author',              hint: 'Submit on-chain' },
    'onchain':      { to: 'done',         who: 'Editor',              hint: 'Confirm completion' },
};

/** Tag-aware action suggestions based on status labels */
const STATUS_ACTIONS = {
    'needs-feedback':  { icon: 'message-circle', text: 'Awaiting feedback',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    'needs-update':    { icon: 'edit-3',         text: 'Author update needed', cls: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800' },
    'blocked':         { icon: 'alert-triangle', text: 'Blocked',             cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
    'editor-concern':  { icon: 'alert-circle',   text: 'Editor concern',      cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800' },
    'editor-ok':       { icon: 'check-circle',   text: 'Editor approved',     cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800' },
    'editor-suggested':{ icon: 'lightbulb',      text: 'Editor suggestion',   cls: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800' },
    'pause':           { icon: 'pause-circle',   text: 'Paused',              cls: 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-950/40 dark:text-slate-400 dark:border-slate-700' },
    'fast-track':      { icon: 'zap',            text: 'Fast-tracked',        cls: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/40 dark:text-green-300 dark:border-green-800' },
};

// ──────────────────────────────────────────────
// TAG TAXONOMY (inline reference data)
// ──────────────────────────────────────────────

const TAG_TAXONOMY = [
    {
        title: 'Lifecycle (Required)',
        icon: 'git-branch',
        desc: 'Exactly one per proposal. Defines process stage.',
        tags: [
            { name: 'draft', color: 'slate', desc: 'Initial authoring stage' },
            { name: 'submitted', color: 'blue', desc: 'Author has submitted for review' },
            { name: 'review', color: 'amber', desc: 'Under editorial review' },
            { name: 'consultation', color: 'purple', desc: 'Open for community deliberation' },
            { name: 'revision', color: 'orange', desc: 'Author is revising based on feedback' },
            { name: 'finalizing', color: 'cyan', desc: 'Editor is preparing final version' },
            { name: 'ready', color: 'green', desc: 'Ready for on-chain submission' },
            { name: 'onchain', color: 'indigo', desc: 'Submitted to the blockchain' },
            { name: 'done', color: 'emerald', desc: 'Process complete' },
            { name: 'withdrawn', color: 'red', desc: 'Author has withdrawn the proposal' },
        ]
    },
    {
        title: 'Status (Optional)',
        icon: 'activity',
        desc: 'Action required. Max 1-2 per proposal.',
        tags: [
            { name: 'needs-feedback', color: 'amber', desc: 'Community feedback requested' },
            { name: 'needs-update', color: 'orange', desc: 'Author needs to update' },
            { name: 'ready', color: 'green', desc: 'Ready for next stage' },
            { name: 'blocked', color: 'red', desc: 'Blocked by external dependency' },
        ]
    },
    {
        title: 'Editor Signals',
        icon: 'shield',
        desc: 'Editor-only assessment tags.',
        tags: [
            { name: 'editor-ok', color: 'green', desc: 'Editor approved' },
            { name: 'editor-concern', color: 'red', desc: 'Editor flagged concerns' },
            { name: 'editor-suggested', color: 'amber', desc: 'Editor suggested changes' },
        ]
    },
    {
        title: 'Special Handling',
        icon: 'settings',
        desc: 'Process treatment classification.',
        tags: [
            { name: 'bundle', color: 'blue', desc: 'Grouped with related proposals' },
            { name: 'minor', color: 'slate', desc: 'Low-impact change' },
            { name: 'major', color: 'red', desc: 'Significant-impact change' },
            { name: 'pause', color: 'amber', desc: 'Temporarily paused' },
            { name: 'fast-track', color: 'green', desc: 'Expedited review' },
        ]
    },
    {
        title: 'Proposal Type (Required)',
        icon: 'layers',
        desc: 'Exactly one per proposal.',
        tags: [
            { name: 'procedural', color: 'blue', desc: 'Governance procedures' },
            { name: 'substantive', color: 'purple', desc: 'Constitutional substance' },
            { name: 'technical', color: 'cyan', desc: 'Technical/protocol changes' },
            { name: 'interpretive', color: 'amber', desc: 'Clarifications' },
            { name: 'editorial', color: 'slate', desc: 'Formatting/typos' },
            { name: 'other', color: 'gray', desc: 'Uncategorized' },
        ]
    },
];

// Flat lookup: tagName -> { desc, color, category }
const TAG_LOOKUP = {};
TAG_TAXONOMY.forEach(cat => {
    cat.tags.forEach(t => {
        TAG_LOOKUP[t.name.toLowerCase()] = { ...t, category: cat.title };
    });
});

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return mins + 'm ago';
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    const days = Math.floor(hrs / 24);
    if (days < 30) return days + 'd ago';
    return Math.floor(days / 30) + 'mo ago';
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Column collapse cache (localStorage) ──
const COLLAPSE_CACHE_KEY = 'cap-kanban-collapsed';

function getCollapseCache() {
    try { return JSON.parse(localStorage.getItem(COLLAPSE_CACHE_KEY)) || {}; }
    catch { return {}; }
}

function setCollapseCache(key, isUserCollapsed) {
    const cache = getCollapseCache();
    if (isUserCollapsed) cache[key] = true;
    else delete cache[key];
    localStorage.setItem(COLLAPSE_CACHE_KEY, JSON.stringify(cache));
}

function isUserCollapsed(key) {
    return !!getCollapseCache()[key];
}

function getLifecycleStage(proposal) {
    const labelNames = (proposal.labels || []).map(l => l.name.toLowerCase());
    for (const col of LIFECYCLE_COLUMNS) {
        if (labelNames.includes(col.key)) return col.key;
    }
    if (proposal.state === 'closed') return 'done';
    return 'draft';
}

/** Get the priority action for a card based on its labels */
function getCardAction(proposal, stage) {
    const labelNames = (proposal.labels || []).map(l => l.name.toLowerCase());

    // Check status/editor labels first -- they override the default next-step
    for (const [tag, action] of Object.entries(STATUS_ACTIONS)) {
        if (labelNames.includes(tag)) return { ...action, source: 'tag' };
    }

    // Default: show next lifecycle transition
    const next = NEXT_TRANSITIONS[stage];
    if (next) {
        return {
            icon: 'arrow-right-circle',
            text: `Next: ${next.hint}`,
            cls: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
            who: next.who,
            source: 'lifecycle'
        };
    }
    return null;
}

// ──────────────────────────────────────────────
// TAG PILL with hover tooltip
// ──────────────────────────────────────────────

function renderTagWithTooltip(label) {
    const name = typeof label === 'string' ? label : label.name;
    const lc = name.toLowerCase();
    const info = TAG_LOOKUP[lc];

    let cls = 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300';
    if (info) {
        cls = `bg-${info.color}-100 text-${info.color}-700 dark:bg-${info.color}-900/40 dark:text-${info.color}-300`;
    }

    const tooltip = info
        ? `<div class="kanban-tag-tooltip">${escapeHtml(info.category)}<br><strong>${escapeHtml(name)}</strong>: ${escapeHtml(info.desc)}</div>`
        : '';

    return `<span class="kanban-tag-pill relative group/tag inline-block text-[10px] font-bold px-2 py-0.5 rounded-full cursor-default ${cls}">
        ${escapeHtml(name)}
        ${tooltip}
    </span>`;
}

// ──────────────────────────────────────────────
// CARD RENDERER
// ──────────────────────────────────────────────

function renderCard(proposal, stage) {
    const labels = (proposal.labels || []).filter(l => {
        const lc = l.name.toLowerCase();
        return !LIFECYCLE_COLUMNS.some(c => c.key === lc);
    });
    const isCIS = proposal.labels.some(l => l.name === 'CIS');
    const type = isCIS ? 'CIS' : 'CAP';
    const typeColor = isCIS ? 'bg-teal-500' : 'bg-blue-600';
    const action = getCardAction(proposal, stage);

    return `
    <div class="kanban-card group" draggable="true" data-number="${proposal.number}"
         ondragstart="window.kanbanDragStart(event, ${proposal.number})"
         ondragend="window.kanbanDragEnd(event)"
         ${IS_TOUCH ? 'ontouchstart="window.kanbanTouchStart(event, ' + proposal.number + ')" ontouchmove="window.kanbanTouchMove(event)" ontouchend="window.kanbanTouchEnd(event)"' : ''}>
        <!-- Mobile drag handle -->
        ${IS_TOUCH ? `<div class="kanban-drag-handle" aria-label="Drag to reorder">
            <i data-lucide="grip-vertical" class="w-4 h-4"></i>
        </div>` : ''}
        <!-- Top row: type + number + comments -->
        <div class="flex items-center justify-between mb-1.5">
            <div class="flex items-center gap-1.5">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded text-white ${typeColor} leading-none">${type}</span>
                <span class="text-[11px] font-mono text-slate-400 dark:text-slate-500">#${proposal.number}</span>
            </div>
            ${proposal.comments > 0 ? `
            <span class="flex items-center gap-0.5 text-[10px] text-slate-400" title="${proposal.comments} comments">
                <i data-lucide="message-square" class="w-3 h-3"></i>${proposal.comments}
            </span>` : ''}
        </div>

        <!-- Clickable title row: arrow + title -->
        <div class="kanban-card-title-row" onclick="event.stopPropagation(); window.kanbanOpenPreview(${proposal.number})">
            <i data-lucide="move-right" class="w-4 h-4 flex-shrink-0"></i>
            <span class="text-[13px] font-semibold text-slate-900 dark:text-white leading-snug line-clamp-2">
                ${escapeHtml(proposal.title)}
            </span>
        </div>

        <!-- Tags row -->
        ${labels.length > 0 ? `<div class="flex flex-wrap gap-1 mb-2">${labels.map(l => renderTagWithTooltip(l)).join('')}</div>` : ''}

        <!-- Next-action callout -->
        ${action ? `
        <div class="flex items-start gap-1.5 p-2 rounded-lg border text-[10px] leading-tight mb-2 ${action.cls}">
            <i data-lucide="${action.icon}" class="w-3 h-3 flex-shrink-0 mt-0.5"></i>
            <div>
                <span class="font-bold">${escapeHtml(action.text)}</span>
                ${action.who ? `<span class="opacity-70 ml-1">-- ${escapeHtml(action.who)}</span>` : ''}
            </div>
        </div>` : ''}

        <!-- Footer: author + time -->
        <div class="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span class="flex items-center gap-1 truncate">
                ${proposal.user?.avatar_url ? `<img src="${escapeHtml(proposal.user.avatar_url)}" class="w-4 h-4 rounded-full ring-1 ring-white dark:ring-slate-800"/>` : ''}
                <span class="truncate">${escapeHtml(proposal.user?.login || 'unknown')}</span>
            </span>
            <span class="whitespace-nowrap ml-2">${timeAgo(proposal.updated_at || proposal.created_at)}</span>
        </div>
    </div>`;
}

// ──────────────────────────────────────────────
// COLUMN RENDERER
// ──────────────────────────────────────────────

function renderColumn(col, cards) {
    const c = col.color;

    return `
    <div class="kanban-col" data-col-key="${col.key}" data-card-count="${cards.length}">
        <!-- Collapsed overlay (visible when is-collapsed) -->
        <div class="kanban-col-collapsed-view">
            <div class="flex flex-col items-center gap-1.5 py-4 px-1">
                ${cards.length > 0 ? `
                <button onclick="event.stopPropagation(); window.kanbanPinOpen('${col.key}')"
                    class="kanban-pin-btn w-7 h-7 flex items-center justify-center rounded-lg bg-${c}-100 dark:bg-${c}-900/40 text-${c}-500 hover:bg-${c}-200 dark:hover:bg-${c}-800/60 transition-colors"
                    title="Pin column open">
                    <i data-lucide="pin" class="w-4 h-4"></i>
                </button>` : ''}
                <i data-lucide="${col.icon}" class="w-4 h-4 text-${c}-500"></i>
                <span class="text-[10px] font-black text-${c}-500 bg-${c}-100 dark:bg-${c}-900/40 px-2 py-0.5 rounded-full">${cards.length}</span>
                <span class="kanban-col-collapsed-label text-${c}-600 dark:text-${c}-400">${col.label.length <= 6 ? col.label : col.label.slice(0, 4) + '..'}</span>
            </div>
        </div>

        <!-- Expanded content -->
        <div class="kanban-col-expanded-view">
            <!-- Sticky Header -->
            <div class="kanban-col-header bg-${c}-50 dark:bg-${c}-950/30 border-b-2 border-${c}-300 dark:border-${c}-700">
                <div class="flex items-center gap-2 min-w-0">
                    <span class="w-2.5 h-2.5 rounded-full bg-${c}-500 flex-shrink-0"></span>
                    <span class="text-sm font-extrabold text-${c}-700 dark:text-${c}-300 truncate">${col.label}</span>
                    <span class="text-[10px] font-black text-${c}-500 bg-${c}-100 dark:bg-${c}-900/40 px-2 py-0.5 rounded-full flex-shrink-0">${cards.length}</span>
                </div>
                <div class="flex items-center gap-1">
                    <!-- Column info hover -->
                    <div class="relative group/colinfo">
                        <button class="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-${c}-100 dark:hover:bg-${c}-900/40 text-${c}-400 transition-colors">
                            <i data-lucide="info" class="w-3.5 h-3.5"></i>
                        </button>
                        <div class="kanban-col-tooltip">
                            <p class="font-bold text-slate-900 dark:text-white mb-1">${col.label}</p>
                            <p class="text-slate-500 text-[11px] mb-2">Responsible: <strong>${col.responsible}</strong></p>
                            ${NEXT_TRANSITIONS[col.key] ? `
                            <div class="flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400">
                                <i data-lucide="arrow-right" class="w-3 h-3"></i>
                                Next: <strong>${NEXT_TRANSITIONS[col.key].to}</strong> (${NEXT_TRANSITIONS[col.key].who})
                            </div>` : '<span class="text-[11px] text-slate-400">Terminal stage</span>'}
                        </div>
                    </div>
                    <button onclick="event.stopPropagation(); window.kanbanToggleCol('${col.key}')"
                        class="kanban-col-toggle w-6 h-6 flex items-center justify-center rounded-lg hover:bg-${c}-100 dark:hover:bg-${c}-900/40 text-${c}-400 transition-colors"
                        data-col-key="${col.key}"
                        title="${isUserCollapsed(col.key) ? 'Pin open' : 'Collapse column'}">
                        <i data-lucide="${isUserCollapsed(col.key) ? 'panel-left-open' : 'panel-left-close'}" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            </div>

            <!-- Cards area (drop zone) -->
            <div class="kanban-col-body"
                 ondragover="window.kanbanDragOver(event)"
                 ondragleave="window.kanbanDragLeave(event)"
                 ondrop="window.kanbanDrop(event, '${col.key}')">
                ${cards.length > 0
                    ? cards.map(p => renderCard(p, col.key)).join('')
                    : `<div class="kanban-empty-placeholder flex flex-col items-center justify-center py-10 opacity-40">
                           <i data-lucide="${col.icon}" class="w-8 h-8 mb-2 text-${c}-300 dark:text-${c}-700"></i>
                           <p class="text-xs text-slate-400">No proposals</p>
                       </div>`
                }
            </div>
        </div>
    </div>`;
}

// ──────────────────────────────────────────────
// TAG REFERENCE PANEL (expandable sidebar)
// ──────────────────────────────────────────────

function buildTagPanelHTML() {
    return `
            <!-- Panel header -->
            <div class="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 sticky top-0 z-10 flex-shrink-0">
                <h3 class="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                    <i data-lucide="tag" class="w-4 h-4 text-blue-500"></i> Tag Reference
                </h3>
                <button onclick="window.kanbanCloseTagPanel()" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">
                    <i data-lucide="x" class="w-4 h-4 text-slate-400"></i>
                </button>
            </div>
            <!-- Panel body -->
            <div class="p-4 space-y-5 overflow-y-auto flex-1">
                ${TAG_TAXONOMY.map(cat => `
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="${cat.icon}" class="w-3.5 h-3.5 text-blue-500"></i>
                        <span class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">${cat.title}</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mb-2">${cat.desc}</p>
                    <div class="space-y-1">
                        ${cat.tags.map(t => `
                        <div class="flex items-center gap-2 py-1 px-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <span class="w-2 h-2 rounded-full bg-${t.color}-500 flex-shrink-0"></span>
                            <span class="text-[11px] font-bold text-slate-700 dark:text-slate-300 min-w-[90px]">${t.name}</span>
                            <span class="text-[10px] text-slate-400">${t.desc}</span>
                        </div>`).join('')}
                    </div>
                </div>`).join('')}

                <!-- Lifecycle transitions -->
                <div>
                    <div class="flex items-center gap-2 mb-2">
                        <i data-lucide="git-merge" class="w-3.5 h-3.5 text-blue-500"></i>
                        <span class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Transitions</span>
                    </div>
                    <div class="space-y-1 text-[11px]">
                        ${Object.entries(NEXT_TRANSITIONS).map(([from, t]) => `
                        <div class="flex items-center gap-1 py-0.5 text-slate-500 dark:text-slate-400">
                            <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${from}</span>
                            <i data-lucide="arrow-right" class="w-3 h-3 text-slate-400"></i>
                            <span class="font-mono font-bold text-slate-700 dark:text-slate-300">${t.to}</span>
                            <span class="text-slate-400 ml-1">(${t.who})</span>
                        </div>`).join('')}
                        <div class="flex items-center gap-1 py-0.5 text-red-500">
                            <span class="font-mono font-bold">any</span>
                            <i data-lucide="arrow-right" class="w-3 h-3"></i>
                            <span class="font-mono font-bold">withdrawn</span>
                            <span class="ml-1">(Author)</span>
                        </div>
                    </div>
                </div>

                <!-- General rules -->
                <div class="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                    <p class="text-[10px] font-black text-blue-500 uppercase tracking-wider mb-2">Rules</p>
                    <ul class="space-y-1 text-[10px] text-blue-700 dark:text-blue-300">
                        <li>Each proposal MUST have one lifecycle + one type tag</li>
                        <li>All other tags optional, use sparingly</li>
                        <li>Editors control forward progression</li>
                        <li>Authors control content, revisions, withdrawal</li>
                    </ul>
                </div>
            </div>
    `;
}

// ──────────────────────────────────────────────
// DETAIL PREVIEW PANEL (GitHub-style side panel)
// ──────────────────────────────────────────────

function buildDetailPanelHTML(proposal) {
    const stage = getLifecycleStage(proposal);
    const stageCol = LIFECYCLE_COLUMNS.find(c => c.key === stage);
    const action = getCardAction(proposal, stage);
    const isCIS = proposal.labels.some(l => l.name === 'CIS');
    const type = isCIS ? 'CIS' : 'CAP';
    const typeColor = isCIS ? 'bg-teal-500' : 'bg-blue-600';
    const labels = (proposal.labels || []).filter(l => {
        const lc = l.name.toLowerCase();
        return !LIFECYCLE_COLUMNS.some(c => c.key === lc);
    });

    // Truncate body to ~20 lines
    let bodyPreview = 'No description provided.';
    let bodyTruncated = false;
    if (proposal.body) {
        const lines = proposal.body.split('\n');
        if (lines.length > 20) {
            bodyPreview = escapeHtml(lines.slice(0, 20).join('\n'));
            bodyTruncated = true;
        } else {
            bodyPreview = escapeHtml(proposal.body);
        }
    }

    return `
        <!-- Panel header -->
        <div class="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-shrink-0">
            <div class="flex items-center gap-2 min-w-0">
                <span class="text-[9px] font-black px-1.5 py-0.5 rounded text-white ${typeColor} leading-none flex-shrink-0">${type}</span>
                <span class="text-sm font-mono text-slate-500 dark:text-slate-400 flex-shrink-0">#${proposal.number}</span>
            </div>
            <button onclick="window.kanbanClosePreview()" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex-shrink-0">
                <i data-lucide="x" class="w-4 h-4 text-slate-400"></i>
            </button>
        </div>

        <!-- Panel body -->
        <div class="p-5 space-y-4 overflow-y-auto flex-1">
            <!-- Title -->
            <h3 class="text-base font-extrabold text-slate-900 dark:text-white leading-snug">${escapeHtml(proposal.title)}</h3>

            <!-- Lifecycle stage badge -->
            ${stageCol ? `
            <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-${stageCol.color}-500 flex-shrink-0"></span>
                <span class="text-xs font-bold text-${stageCol.color}-700 dark:text-${stageCol.color}-300">${stageCol.label}</span>
                <span class="text-[10px] text-slate-400">-- ${stageCol.responsible}</span>
            </div>` : ''}

            <!-- Next-action callout -->
            ${action ? `
            <div class="flex items-start gap-1.5 p-2.5 rounded-lg border text-[11px] leading-tight ${action.cls}">
                <i data-lucide="${action.icon}" class="w-3.5 h-3.5 flex-shrink-0 mt-0.5"></i>
                <div>
                    <span class="font-bold">${escapeHtml(action.text)}</span>
                    ${action.who ? `<span class="opacity-70 ml-1">-- ${escapeHtml(action.who)}</span>` : ''}
                </div>
            </div>` : ''}

            <!-- Author -->
            <div class="flex items-center gap-2 py-2 border-y border-slate-100 dark:border-slate-800">
                ${proposal.user?.avatar_url ? `<img src="${escapeHtml(proposal.user.avatar_url)}" class="w-6 h-6 rounded-full ring-1 ring-white dark:ring-slate-800"/>` : ''}
                <div>
                    <span class="text-xs font-bold text-slate-700 dark:text-slate-300">${escapeHtml(proposal.user?.login || 'unknown')}</span>
                    <span class="text-[10px] text-slate-400 ml-2">${timeAgo(proposal.created_at)}</span>
                </div>
            </div>

            <!-- Labels -->
            ${labels.length > 0 ? `
            <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Labels</span>
                <div class="flex flex-wrap gap-1 mt-1.5">${labels.map(l => renderTagWithTooltip(l)).join('')}</div>
            </div>` : ''}

            <!-- Body preview (max 20 lines) -->
            <div>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-wider">Description</span>
                <p class="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5 whitespace-pre-line">${bodyPreview}</p>
                ${bodyTruncated ? `<p class="text-[11px] text-slate-400 italic mt-1">Content truncated -- click below to read more.</p>` : ''}
            </div>

            <!-- Stats row -->
            <div class="flex items-center gap-4 text-[11px] text-slate-400 py-2 border-t border-slate-100 dark:border-slate-800">
                ${proposal.comments > 0 ? `
                <span class="flex items-center gap-1">
                    <i data-lucide="message-square" class="w-3.5 h-3.5"></i>
                    ${proposal.comments} comments
                </span>` : ''}
                <span class="flex items-center gap-1">
                    <i data-lucide="clock" class="w-3.5 h-3.5"></i>
                    Updated ${timeAgo(proposal.updated_at || proposal.created_at)}
                </span>
            </div>

            <!-- Open full detail link -->
            <a href="#/detail/${proposal.number}"
                class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors">
                <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                Open Full Detail
            </a>
        </div>`;
}

// ──────────────────────────────────────────────
// FILTER BAR
// ──────────────────────────────────────────────

function renderFilterBar(state, totalCount, filteredCount) {
    const typeFilter = state.kanbanTypeFilter || 'ALL';
    const types = ['ALL', 'CAP', 'CIS'];

    return `
    <div class="flex items-center gap-3 flex-wrap">
        <!-- Type toggle -->
        <div class="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-0.5">
            ${types.map(t => `
            <button onclick="window.kanbanSetTypeFilter('${t}')"
                class="px-3 py-1.5 text-xs font-bold rounded-lg transition-all
                ${typeFilter === t ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}">
                ${t}
            </button>`).join('')}
        </div>

        <!-- Search -->
        <div class="relative flex-1 max-w-xs">
            <i data-lucide="search" class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"></i>
            <input type="text" placeholder="Filter proposals..."
                value="${escapeHtml(state.kanbanSearch || '')}"
                onkeyup="window.kanbanSetSearch(this.value)"
                class="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 outline-none transition-all" />
        </div>

        <span class="text-[11px] text-slate-400 font-bold">
            ${filteredCount === totalCount ? `${totalCount} proposals` : `${filteredCount} of ${totalCount}`}
        </span>
    </div>`;
}

// ──────────────────────────────────────────────
// MAIN EXPORT
// ──────────────────────────────────────────────

export function renderKanban(state) {
    const proposals = state.proposals || [];
    const typeFilter = state.kanbanTypeFilter || 'ALL';
    const searchQ = (state.kanbanSearch || '').toLowerCase();
    const tagPanelOpen = state.kanbanTagPanelOpen || false;

    // Filter
    let filtered = proposals;
    if (typeFilter !== 'ALL') {
        filtered = filtered.filter(p =>
            typeFilter === 'CIS'
                ? p.labels.some(l => l.name === 'CIS')
                : !p.labels.some(l => l.name === 'CIS')
        );
    }
    if (searchQ) {
        filtered = filtered.filter(p =>
            (p.title || '').toLowerCase().includes(searchQ) ||
            (p.user?.login || '').toLowerCase().includes(searchQ) ||
            String(p.number).includes(searchQ) ||
            (p.labels || []).some(l => l.name.toLowerCase().includes(searchQ))
        );
    }

    // Bucket
    const buckets = {};
    LIFECYCLE_COLUMNS.forEach(c => { buckets[c.key] = []; });
    filtered.forEach(p => {
        const stage = getLifecycleStage(p);
        (buckets[stage] || buckets['draft']).push(p);
    });

    // Apply custom position ordering from cache
    const posCache = getPositionCache();
    for (const [colKey, cards] of Object.entries(buckets)) {
        const order = posCache[colKey];
        if (order && order.length > 0) {
            cards.sort((a, b) => {
                const ia = order.indexOf(a.number);
                const ib = order.indexOf(b.number);
                if (ia === -1 && ib === -1) return 0;
                if (ia === -1) return 1;
                if (ib === -1) return -1;
                return ia - ib;
            });
        }
    }

    return `
    <div class="kanban-wrapper fade-in">
        <!-- Top bar -->
        <div class="kanban-topbar">
            <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                    <i data-lucide="trello" class="w-5 h-5 text-blue-500"></i>
                    <h2 class="text-lg font-black text-slate-900 dark:text-white tracking-tight">Kanban Board</h2>
                </div>
            </div>
            <div class="flex items-center gap-2">
                ${renderFilterBar(state, proposals.length, filtered.length)}
                <button onclick="window.kanbanToggleTagPanel()"
                    class="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all
                    ${tagPanelOpen
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}">
                    <i data-lucide="book-open" class="w-3.5 h-3.5"></i>
                    <span class="hidden sm:inline">Tags</span>
                </button>
            </div>
        </div>

        <!-- Board -->
        <div class="kanban-body">
            <div class="kanban-board" id="kanban-board">
                ${LIFECYCLE_COLUMNS.map(col => renderColumn(col, buckets[col.key])).join('')}
            </div>
        </div>
    </div>`;
}

// ──────────────────────────────────────────────
// EVENT HANDLERS (attached to window in app.js)
// ──────────────────────────────────────────────

export function initKanbanHandlers(state) {
    // Column collapse toggle -- DOM-based for smooth animation
    // Toggle collapse mode: if pinned open -> set user-collapsed; if user-collapsed -> pin open
    window.kanbanToggleCol = (key) => {
        const col = document.querySelector(`.kanban-col[data-col-key="${key}"]`);
        if (!col) return;

        if (isUserCollapsed(key)) {
            // Was user-collapsed -> pin open
            setCollapseCache(key, false);
            col.classList.remove('is-collapsed', 'temp-expanded');
        } else {
            // Was pinned open -> user-collapse
            setCollapseCache(key, true);
            col.classList.add('is-collapsed');
            col.classList.remove('temp-expanded');
        }
        _updateToggleButton(col, key);
    };

    // Pin open from collapsed overlay button
    window.kanbanPinOpen = (key) => {
        const col = document.querySelector(`.kanban-col[data-col-key="${key}"]`);
        if (!col) return;
        setCollapseCache(key, false);
        col.classList.remove('is-collapsed', 'temp-expanded');
        _updateToggleButton(col, key);
    };

    // Update the header toggle button icon/title to reflect current state
    function _updateToggleButton(col, key) {
        const btn = col.querySelector('.kanban-col-toggle');
        if (!btn) return;
        const userCollapsed = isUserCollapsed(key);
        btn.title = userCollapsed ? 'Pin open' : 'Collapse column';
        const icon = btn.querySelector('[data-lucide]');
        if (icon) {
            icon.setAttribute('data-lucide', userCollapsed ? 'panel-left-open' : 'panel-left-close');
            if (window.lucide) window.lucide.createIcons({ nodes: [icon] });
        }
    }

    // Tag reference panel -- DOM-injected overlay (like detail preview)
    window.kanbanToggleTagPanel = () => {
        const existing = document.getElementById('kanban-tag-overlay');
        if (existing) {
            window.kanbanCloseTagPanel();
            return;
        }
        // Close detail preview if open
        window.kanbanClosePreview();
        state.kanbanTagPanelOpen = true;
        window._injectTagPanel();
    };

    window._injectTagPanel = () => {
        const old = document.getElementById('kanban-tag-overlay');
        if (old) old.remove();

        const overlay = document.createElement('div');
        overlay.id = 'kanban-tag-overlay';
        overlay.className = 'kanban-tag-overlay';
        overlay.innerHTML = `<div class="kanban-tag-panel-inner">${buildTagPanelHTML()}</div>`;
        document.body.appendChild(overlay);

        const root = document.getElementById('app');
        if (root) root.classList.add('kanban-tags-active');

        requestAnimationFrame(() => {
            overlay.classList.add('kanban-tag-overlay-open');
            if (window.lucide) window.lucide.createIcons();
        });
    };

    window.kanbanCloseTagPanel = () => {
        state.kanbanTagPanelOpen = false;
        const overlay = document.getElementById('kanban-tag-overlay');
        const root = document.getElementById('app');
        if (overlay) {
            overlay.classList.remove('kanban-tag-overlay-open');
            if (root) root.classList.remove('kanban-tags-active');
            setTimeout(() => overlay.remove(), 300);
        }
    };

    // Detail preview panel -- DOM-injected, no full re-render
    window.kanbanOpenPreview = (number) => {
        const proposal = (state.proposals || []).find(p => p.number === number);
        if (!proposal) return;

        // If the same item is already open, trigger refresh animation instead
        if (state.kanbanPreviewProposal && state.kanbanPreviewProposal.number === number) {
            window._refreshDetailPanel(proposal);
            return;
        }

        state.kanbanPreviewProposal = proposal;

        // Close tag panel if open
        if (state.kanbanTagPanelOpen) {
            window.kanbanCloseTagPanel();
        }
        window._injectDetailPanel(proposal);
    };

    /** Refresh animation when re-clicking the same open item */
    window._refreshDetailPanel = (proposal) => {
        const overlay = document.getElementById('kanban-detail-overlay');
        if (!overlay) return;
        const inner = overlay.querySelector('.kanban-detail-panel-inner');
        if (!inner) return;

        // ── 1. Inject keyframes if not already present ──
        if (!document.getElementById('kanban-refresh-keyframes')) {
            const style = document.createElement('style');
            style.id = 'kanban-refresh-keyframes';
            style.textContent = `
                @keyframes kbRefreshSpin {
                    0%   { transform: rotate(0deg);   opacity: 0; }
                    15%  { opacity: 1; }
                    85%  { opacity: 1; }
                    100% { transform: rotate(360deg); opacity: 0; }
                }
                @keyframes kbRefreshFlash {
                    0%   { background-color: rgba(99,102,241,0.18); }
                    100% { background-color: transparent; }
                }
            `;
            document.head.appendChild(style);
        }

        // ── 2. Flash highlight on the panel inner ──
        inner.style.animation = 'none';
        void inner.offsetWidth;
        inner.style.animation = 'kbRefreshFlash 1s ease-out forwards';

        // ── 3. Show rotating refresh spinner ──
        let spinner = overlay.querySelector('.kb-refresh-spin');
        if (!spinner) {
            spinner = document.createElement('div');
            spinner.className = 'kb-refresh-spin';
            Object.assign(spinner.style, {
                position: 'absolute',
                top: '50%',
                left: '50%',
                zIndex: '999',
                pointerEvents: 'none',
                marginTop: '-28px',
                marginLeft: '-28px',
            });
            spinner.innerHTML = `
                <svg width="56" height="56" viewBox="0 0 24 24" fill="none"
                     stroke="#6366f1" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     style="filter: drop-shadow(0 2px 10px rgba(99,102,241,0.5));">
                    <polyline points="23 4 23 10 17 10"></polyline>
                    <polyline points="1 20 1 14 7 14"></polyline>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                </svg>
            `;
            overlay.appendChild(spinner);
        }
        // Reset and replay spin animation
        spinner.style.animation = 'none';
        void spinner.offsetWidth;
        spinner.style.animation = 'kbRefreshSpin 900ms cubic-bezier(0.4,0,0.2,1) forwards';

        // ── 4. Pulse the panel shadow ──
        overlay.style.boxShadow = '-4px 0 35px rgba(99,102,241,0.45)';
        setTimeout(() => {
            overlay.style.transition = 'box-shadow 600ms ease-out';
            overlay.style.boxShadow = '';
        }, 400);

        // ── 5. Rebuild content after flash peaks ──
        setTimeout(() => {
            inner.innerHTML = buildDetailPanelHTML(proposal);
            if (window.lucide) window.lucide.createIcons();
        }, 450);

        // ── 6. Cleanup ──
        setTimeout(() => {
            inner.style.animation = '';
            overlay.style.transition = '';
        }, 1100);
    };

    window._injectDetailPanel = (proposal) => {
        // Remove old panel if present
        const old = document.getElementById('kanban-detail-overlay');
        if (old) old.remove();

        // Build the overlay container
        const overlay = document.createElement('div');
        overlay.id = 'kanban-detail-overlay';
        overlay.className = 'kanban-detail-overlay';
        overlay.innerHTML = `<div class="kanban-detail-panel-inner">${buildDetailPanelHTML(proposal)}</div>`;
        document.body.appendChild(overlay);

        // Squeeze the main app content
        const root = document.getElementById('app');
        if (root) root.classList.add('kanban-preview-active');

        // Trigger animation on next frame
        requestAnimationFrame(() => {
            overlay.classList.add('kanban-detail-overlay-open');
            if (window.lucide) window.lucide.createIcons();
        });
    };

    window.kanbanClosePreview = () => {
        state.kanbanPreviewProposal = null;
        const overlay = document.getElementById('kanban-detail-overlay');
        const root = document.getElementById('app');
        if (overlay) {
            overlay.classList.remove('kanban-detail-overlay-open');
            if (root) root.classList.remove('kanban-preview-active');
            // Remove after transition
            setTimeout(() => overlay.remove(), 300);
        }
    };

    // Filters
    window.kanbanSetTypeFilter = (type) => {
        state.kanbanTypeFilter = type;
        window.updateUI(true);
    };

    window.kanbanSetSearch = (q) => {
        state.kanbanSearch = q;
        // Debounced re-render
        clearTimeout(window._kanbanSearchTimer);
        window._kanbanSearchTimer = setTimeout(() => window.updateUI(true), 200);
    };

    // ── Drag-and-drop between columns (position-aware) ──
    window._kanbanDragNumber = null;
    window._kanbanDragActive = false;

    window.kanbanDragStart = (e, number) => {
        window._kanbanDragNumber = number;
        window._kanbanDragActive = true;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', String(number));
        // Add visual feedback
        requestAnimationFrame(() => {
            const card = e.target.closest('.kanban-card');
            if (card) card.classList.add('kanban-card-dragging');
        });
    };

    window.kanbanDragEnd = (e) => {
        window._kanbanDragNumber = null;
        window._kanbanDragActive = false;
        window._kanbanDragHoverCol = null;
        const card = e.target.closest('.kanban-card');
        if (card) card.classList.remove('kanban-card-dragging');
        // Remove all drop highlights and insertion markers
        document.querySelectorAll('.kanban-col-body').forEach(el => el.classList.remove('kanban-drop-target'));
        _removeAllInsertionMarkers();
        // Re-collapse any drag-expanded columns
        _collapseDragExpanded();
    };

    window.kanbanDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        const colBody = e.target.closest('.kanban-col-body');
        if (colBody) {
            colBody.classList.add('kanban-drop-target');
            _updateInsertionMarker(colBody, e.clientY);
        }
        // Track which column the drag cursor is currently over
        const hoveredCol = e.target.closest('.kanban-col[data-col-key]') || null;
        if (hoveredCol !== window._kanbanDragHoverCol) {
            window._kanbanDragHoverCol = hoveredCol;
            _resetDragIdleTimers(hoveredCol);
        }
    };

    window.kanbanDragLeave = (e) => {
        const colBody = e.target.closest('.kanban-col-body');
        if (colBody && !colBody.contains(e.relatedTarget)) {
            colBody.classList.remove('kanban-drop-target');
            _removeInsertionMarker(colBody);
        }
    };

    /** Find the insertion index based on cursor Y within the column body */
    function _getInsertionIndex(colBody, clientY) {
        const cards = [...colBody.querySelectorAll('.kanban-card:not(.kanban-card-dragging)')];
        if (cards.length === 0) return 0;
        for (let i = 0; i < cards.length; i++) {
            const rect = cards[i].getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (clientY < midY) return i;
        }
        return cards.length;
    }

    /** Show a dashed insertion line at the correct position */
    function _updateInsertionMarker(colBody, clientY) {
        let marker = colBody.querySelector('.kanban-insertion-marker');
        if (!marker) {
            marker = document.createElement('div');
            marker.className = 'kanban-insertion-marker';
            marker.innerHTML = '<div class=\"kanban-insertion-line\"></div>';
            colBody.appendChild(marker);
        }
        const idx = _getInsertionIndex(colBody, clientY);
        const cards = [...colBody.querySelectorAll('.kanban-card:not(.kanban-card-dragging)')];
        // Position the marker
        marker.remove();
        if (idx >= cards.length) {
            colBody.appendChild(marker);
        } else {
            colBody.insertBefore(marker, cards[idx]);
        }
        colBody._dropIndex = idx;
    }

    function _removeInsertionMarker(colBody) {
        const marker = colBody.querySelector('.kanban-insertion-marker');
        if (marker) marker.remove();
        delete colBody._dropIndex;
    }

    function _removeAllInsertionMarkers() {
        document.querySelectorAll('.kanban-insertion-marker').forEach(m => m.remove());
    }

    window.kanbanDrop = (e, targetStage) => {
        e.preventDefault();
        const colBody = e.target.closest('.kanban-col-body');
        const dropIndex = colBody?._dropIndex ?? -1;
        if (colBody) colBody.classList.remove('kanban-drop-target');
        _removeAllInsertionMarkers();

        const number = parseInt(e.dataTransfer.getData('text/plain'), 10);
        if (!number) return;

        const proposal = (state.proposals || []).find(p => p.number === number);
        if (!proposal) return;

        const currentStage = getLifecycleStage(proposal);
        const isStageChange = currentStage !== targetStage;

        // Optimistic: swap the lifecycle label locally
        if (isStageChange) {
            proposal.labels = proposal.labels.filter(l => {
                return !LIFECYCLE_COLUMNS.some(c => c.key === l.name.toLowerCase());
            });
            proposal.labels.push({ name: targetStage });
        }

        // Update position cache for the target column
        _updatePositionAfterDrop(targetStage, number, dropIndex, isStageChange ? currentStage : null);

        // Show saving indicator on the card
        _showCardSaving(number, isStageChange ? currentStage : null, targetStage);

        window.updateUI(true);

        // TODO: persist via GitHub API (add/remove labels)
        console.log(`[Kanban] Moved #${number} ${isStageChange ? 'from ' + currentStage + ' to ' + targetStage : 'reordered in ' + targetStage} at position ${dropIndex} (local only)`);
    };

    /** Update the position cache when a card is dropped */
    function _updatePositionAfterDrop(targetCol, number, dropIndex, sourceCol) {
        // Remove from source column cache if moving between columns
        if (sourceCol) {
            const srcOrder = getColumnOrder(sourceCol).filter(n => n !== number);
            setPositionCache(sourceCol, srcOrder);
        }

        // Get current target column order, remove the card if already present
        const colBody = document.querySelector(`.kanban-col[data-col-key="${targetCol}"] .kanban-col-body`);
        const existingCards = colBody
            ? [...colBody.querySelectorAll('.kanban-card')].map(c => parseInt(c.dataset.number, 10)).filter(n => n !== number)
            : getColumnOrder(targetCol).filter(n => n !== number);

        // Insert at the drop index
        if (dropIndex >= 0 && dropIndex <= existingCards.length) {
            existingCards.splice(dropIndex, 0, number);
        } else {
            existingCards.push(number);
        }
        setPositionCache(targetCol, existingCards);
    }

    /** Show saving spinner overlay on a card after move */
    function _showCardSaving(number, fromCol, toCol) {
        // Delay to let the DOM re-render first
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const card = document.querySelector(`.kanban-card[data-number="${number}"]`);
                if (!card) return;
                card.classList.add('kanban-card-saving');
                // Create spinner overlay
                const spinner = document.createElement('div');
                spinner.className = 'kanban-card-save-overlay';
                spinner.innerHTML = `<i data-lucide="loader" class="w-5 h-5 kanban-save-spin"></i>`;
                card.appendChild(spinner);
                if (window.lucide) window.lucide.createIcons();

                // Remove after 800ms
                setTimeout(() => {
                    card.classList.remove('kanban-card-saving');
                    spinner.remove();
                }, 800);
            });
        });
    }

    // ── Drag-over column auto-expand (works during active drag) ──
    window._kanbanDragHoverCol = null;

    /** Start/reset 5s idle timers: the column the drag cursor is on gets its timer cleared;
     *  all OTHER drag-expanded columns get a 5s countdown to re-collapse.
     *  activeCol can be null if drag cursor is not over any column. */
    function _resetDragIdleTimers(activeCol) {
        document.querySelectorAll('.kanban-col.drag-expanded').forEach(col => {
            if (col === activeCol) {
                // Mouse is here - cancel any pending collapse
                if (col._dragIdleTimer) { clearTimeout(col._dragIdleTimer); col._dragIdleTimer = null; }
            } else {
                // Mouse left this column - start 5s idle countdown (if not already running)
                if (!col._dragIdleTimer) {
                    col._dragIdleTimer = setTimeout(() => {
                        col._dragIdleTimer = null;
                        if (!col.classList.contains('drag-expanded')) return;
                        col.classList.remove('drag-expanded');
                        col.classList.add('drag-slow-collapse');
                        // During drag, collapse directly (bypass _scheduleCollapse deferral)
                        col.style.transition = 'none';
                        col.offsetWidth;
                        col.style.transition = '';
                        requestAnimationFrame(() => {
                            col.classList.add('is-collapsed');
                            setTimeout(() => col.classList.remove('drag-slow-collapse'), 1200);
                        });
                    }, 5000);
                }
            }
        });
    }

    function _initDragExpandOnColumns() {
        document.querySelectorAll('.kanban-col[data-col-key]').forEach(col => {
            if (col._dragExpandInit) return;
            col._dragExpandInit = true;

            col.addEventListener('dragenter', (e) => {
                if (!window._kanbanDragActive) return;
                if (!col.classList.contains('is-collapsed')) return;

                e.preventDefault();
                // 100ms delay so passing over doesn't trigger expand
                if (col._dragExpandTimer) clearTimeout(col._dragExpandTimer);
                col._dragExpandTimer = setTimeout(() => {
                    if (!window._kanbanDragActive) return;
                    if (!col.classList.contains('is-collapsed')) return;
                    col.classList.remove('is-collapsed');
                    col.classList.add('drag-expanded');
                    requestAnimationFrame(() => {
                        if (window.lucide) window.lucide.createIcons();
                    });
                    // Start idle timers for any OTHER previously expanded columns
                    _resetDragIdleTimers(col);
                }, 100);
            });

            col.addEventListener('dragleave', (e) => {
                // Only cancel pending timer if actually leaving the column
                if (!col.contains(e.relatedTarget)) {
                    if (col._dragExpandTimer) {
                        clearTimeout(col._dragExpandTimer);
                        col._dragExpandTimer = null;
                    }
                }
            });
        });
    }

    /** Re-collapse columns that were only expanded due to drag */
    function _collapseDragExpanded() {
        document.querySelectorAll('.kanban-col.drag-expanded').forEach(col => {
            // Clear any pending idle timer
            if (col._dragIdleTimer) { clearTimeout(col._dragIdleTimer); col._dragIdleTimer = null; }
            col.classList.remove('drag-expanded');
            const key = col.dataset.colKey;
            const cardCount = parseInt(col.dataset.cardCount, 10) || 0;
            // Re-collapse if user had it collapsed or if empty
            if (isUserCollapsed(key) || cardCount === 0) {
                col.classList.add('is-collapsed');
            }
        });
    }

    // ── Touch drag support for mobile ──
    window._kanbanTouchState = null;

    window.kanbanTouchStart = (e, number) => {
        const touch = e.touches[0];
        const card = e.target.closest('.kanban-card');
        // Only start if touching the drag handle
        if (!e.target.closest('.kanban-drag-handle')) return;
        e.preventDefault();

        window._kanbanTouchState = {
            number,
            startX: touch.clientX,
            startY: touch.clientY,
            card,
            clone: null,
            moved: false
        };
    };

    window.kanbanTouchMove = (e) => {
        const ts = window._kanbanTouchState;
        if (!ts) return;
        const touch = e.touches[0];
        const dx = Math.abs(touch.clientX - ts.startX);
        const dy = Math.abs(touch.clientY - ts.startY);

        // Require minimum movement to start drag
        if (!ts.moved && dx < 5 && dy < 5) return;
        e.preventDefault();
        ts.moved = true;
        window._kanbanDragActive = true;

        // Create floating clone on first move
        if (!ts.clone) {
            ts.card.classList.add('kanban-card-dragging');
            ts.clone = ts.card.cloneNode(true);
            ts.clone.className = 'kanban-touch-clone';
            ts.clone.style.width = ts.card.offsetWidth + 'px';
            document.body.appendChild(ts.clone);
        }

        ts.clone.style.left = (touch.clientX - 20) + 'px';
        ts.clone.style.top = (touch.clientY - 20) + 'px';

        // Highlight drop target
        const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        document.querySelectorAll('.kanban-col-body').forEach(el => el.classList.remove('kanban-drop-target'));
        _removeAllInsertionMarkers();
        const colBody = elBelow?.closest('.kanban-col-body');
        if (colBody) {
            colBody.classList.add('kanban-drop-target');
            _updateInsertionMarker(colBody, touch.clientY);
        }

        // Auto-expand collapsed columns on touch drag
        const col = elBelow?.closest('.kanban-col.is-collapsed');
        if (col && col.classList.contains('is-collapsed')) {
            col.classList.remove('is-collapsed');
            col.classList.add('drag-expanded');
            requestAnimationFrame(() => { if (window.lucide) window.lucide.createIcons(); });
        }
    };

    window.kanbanTouchEnd = (e) => {
        const ts = window._kanbanTouchState;
        window._kanbanTouchState = null;
        window._kanbanDragActive = false;
        if (!ts || !ts.moved) return;

        // Find drop target
        const touch = e.changedTouches[0];
        const elBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        const colBody = elBelow?.closest('.kanban-col-body');
        const colEl = colBody?.closest('.kanban-col');
        const targetStage = colEl?.dataset.colKey;

        // Clean up
        if (ts.clone) ts.clone.remove();
        ts.card.classList.remove('kanban-card-dragging');
        document.querySelectorAll('.kanban-col-body').forEach(el => el.classList.remove('kanban-drop-target'));
        _removeAllInsertionMarkers();
        _collapseDragExpanded();

        if (!targetStage) return;

        const proposal = (state.proposals || []).find(p => p.number === ts.number);
        if (!proposal) return;

        const currentStage = getLifecycleStage(proposal);
        const dropIndex = colBody?._dropIndex ?? -1;
        const isStageChange = currentStage !== targetStage;

        if (isStageChange) {
            proposal.labels = proposal.labels.filter(l => !LIFECYCLE_COLUMNS.some(c => c.key === l.name.toLowerCase()));
            proposal.labels.push({ name: targetStage });
        }

        _updatePositionAfterDrop(targetStage, ts.number, dropIndex, isStageChange ? currentStage : null);
        _showCardSaving(ts.number, isStageChange ? currentStage : null, targetStage);
        window.updateUI(true);
        console.log(`[Kanban] Touch-moved #${ts.number} ${isStageChange ? 'from ' + currentStage + ' to ' + targetStage : 'reordered in ' + targetStage} at position ${dropIndex}`);
    };

    // ── Multi-user polling ──
    let _pollTimer = null;
    let _lastPollEtag = null;

    window.kanbanStartPolling = () => {
        if (_pollTimer) return;
        const interval = 30000; // 30 seconds
        _pollTimer = setInterval(async () => {
            if (window._kanbanDragActive) return; // Skip while dragging
            if (!state.ghToken || state.view !== 'kanban') return;

            try {
                // Check if data has changed via ETag / conditional request
                const { fetchAllProposals } = await import('../api.js');
                const freshProposals = await fetchAllProposals(state.ghToken);

                // Compare: has anything actually changed?
                const oldHash = _proposalsHash(state.proposals);
                const newHash = _proposalsHash(freshProposals);

                if (oldHash !== newHash) {
                    console.log('[Kanban Poll] Changes detected, refreshing board...');
                    state.proposals = freshProposals;
                    state.stats = {
                        total: freshProposals.length,
                        draft: freshProposals.filter(x => x.state === 'open').length,
                        review: 0,
                        final: freshProposals.filter(x => x.state === 'closed').length
                    };
                    // Show a subtle sync indicator
                    _showSyncIndicator();
                    window.updateUI(true);
                }
            } catch (e) {
                console.warn('[Kanban Poll] Error:', e.message);
            }
        }, interval);
    };

    window.kanbanStopPolling = () => {
        if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    };

    /** Hash proposals for quick change detection */
    function _proposalsHash(proposals) {
        if (!proposals || !proposals.length) return '';
        return proposals.map(p =>
            p.number + ':' + p.updated_at + ':' + (p.labels || []).map(l => l.name).sort().join(',')
        ).join('|');
    }

    /** Flash a small sync notification on the board */
    function _showSyncIndicator() {
        const board = document.getElementById('kanban-board');
        if (!board) return;
        const indicator = document.createElement('div');
        indicator.className = 'kanban-sync-indicator';
        indicator.innerHTML = `<i data-lucide=\"refresh-cw\" class=\"w-3.5 h-3.5\"></i> Board updated`;
        board.parentElement.appendChild(indicator);
        if (window.lucide) window.lucide.createIcons();
        setTimeout(() => indicator.classList.add('kanban-sync-indicator-show'), 10);
        setTimeout(() => {
            indicator.classList.remove('kanban-sync-indicator-show');
            setTimeout(() => indicator.remove(), 300);
        }, 3000);
    }

    // ── Post-render: apply collapse states + attach hover handlers ──
    window.kanbanInitCollapseAnimations = () => {
        const cache = getCollapseCache();

        document.querySelectorAll('.kanban-col[data-col-key]').forEach(col => {
            const key = col.dataset.colKey;
            const cardCount = parseInt(col.dataset.cardCount, 10) || 0;

            // Suppress transition on initial render / data refresh
            col.style.transition = 'none';
            col.querySelectorAll('.kanban-col-collapsed-view, .kanban-col-expanded-view').forEach(el => {
                el.style.transition = 'none';
            });

            // Determine collapse: user-cached or empty column
            if (cache[key] || cardCount === 0) {
                col.classList.add('is-collapsed');
            } else {
                col.classList.remove('is-collapsed');
            }

            // Re-enable transitions after layout settles
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    col.style.transition = '';
                    col.querySelectorAll('.kanban-col-collapsed-view, .kanban-col-expanded-view').forEach(el => {
                        el.style.transition = '';
                    });
                });
            });
        });

        // Attach hover handlers for auto-expand on empty columns
        _initKanbanHoverExpand();

        // Attach drag-enter handlers for column auto-expand during drag
        _initDragExpandOnColumns();

        // Board-level: collapse all placeholders when mouse leaves the board
        const board = document.getElementById('kanban-board');
        if (board && !board._placeholderCleanupInit) {
            board._placeholderCleanupInit = true;
            board.addEventListener('mouseleave', () => {
                window._kanbanFocusedCol = null;
                _flushDeferredCollapses();
            });
        }
    };

    // ── Focused-column tracking & deferred collapse queue ──
    // Prevents layout shifts while the mouse is on a column.
    window._kanbanFocusedCol = null;
    const _deferredCollapses = new Set();

    /** Queue a column for collapse. If the mouse is on any column, defer it. */
    function _scheduleCollapse(col) {
        if (window._kanbanFocusedCol && window._kanbanFocusedCol !== col) {
            // Mouse is on another column -- defer this collapse so it doesn't shift layout
            _deferredCollapses.add(col);
            return;
        }
        _doCollapse(col);
    }

    function _doCollapse(col) {
        _deferredCollapses.delete(col);
        const wasPlaceholder = col.classList.contains('collapse-placeholder');
        col.classList.remove('collapse-placeholder');
        if (col._placeholderTimer) { clearTimeout(col._placeholderTimer); col._placeholderTimer = null; }

        if (wasPlaceholder) {
            // Coming from placeholder (which had transition:0ms !important).
            // Force layout at 280px with normal transition before adding is-collapsed.
            col.style.transition = 'none';
            col.offsetWidth; // force reflow
            col.style.transition = '';
        }

        requestAnimationFrame(() => {
            col.classList.add('is-collapsed');
        });
    }

    /** Flush all deferred collapses (called when mouse leaves the board entirely) */
    function _flushDeferredCollapses() {
        if (window._kanbanDeferredFlushTimer) { clearTimeout(window._kanbanDeferredFlushTimer); window._kanbanDeferredFlushTimer = null; }
        // Also collapse any lingering placeholders
        document.querySelectorAll('.kanban-col.collapse-placeholder').forEach(col => {
            if (col._placeholderTimer) { clearTimeout(col._placeholderTimer); col._placeholderTimer = null; }
            _deferredCollapses.add(col);
        });
        _deferredCollapses.forEach(col => _doCollapse(col));
        _deferredCollapses.clear();
    }

    /** Delayed flush: waits 50ms for the next column's mouseenter to claim focus.
     *  If a column takes focus in the meantime, the flush is skipped. */
    function _deferredFlushCheck() {
        if (window._kanbanDeferredFlushTimer) clearTimeout(window._kanbanDeferredFlushTimer);
        window._kanbanDeferredFlushTimer = setTimeout(() => {
            window._kanbanDeferredFlushTimer = null;
            if (!window._kanbanFocusedCol) {
                _flushDeferredCollapses();
            }
        }, 50);
    }

    function _initKanbanHoverExpand() {
        document.querySelectorAll('.kanban-col[data-col-key]').forEach(col => {
            if (col._hoverInit) return;
            col._hoverInit = true;

            let collapseTimer = null;

            // Standard mouse hover (non-drag): expand collapsed column with 100ms delay
            col.addEventListener('mouseenter', () => {
                col._mouseInside = true;
                window._kanbanFocusedCol = col;
                // Cancel any pending deferred flush -- a column now has focus
                if (window._kanbanDeferredFlushTimer) { clearTimeout(window._kanbanDeferredFlushTimer); window._kanbanDeferredFlushTimer = null; }
                if (collapseTimer) { clearTimeout(collapseTimer); collapseTimer = null; }

                // If re-entering a collapse-placeholder, restore it immediately
                if (col.classList.contains('collapse-placeholder')) {
                    if (col._placeholderTimer) { clearTimeout(col._placeholderTimer); col._placeholderTimer = null; }
                    col.classList.remove('collapse-placeholder');
                    col.classList.add('temp-expanded');
                    return;
                }

                if (!col.classList.contains('is-collapsed')) return;
                if (window._kanbanDragActive) return; // Handled by dragenter instead

                const key = col.dataset.colKey;
                // 100ms delay so quick pass-overs don't trigger expand
                if (col._expandTimer) clearTimeout(col._expandTimer);
                col._expandTimer = setTimeout(() => {
                    if (!col._mouseInside) return; // mouse already left
                    if (!col.classList.contains('is-collapsed')) return;
                    col._hoverTriggeredExpand = true;
                    col.classList.remove('is-collapsed');
                    if (isUserCollapsed(key)) {
                        col.classList.add('temp-expanded');
                    }
                }, 100);
            });

            col.addEventListener('mouseleave', () => {
                col._mouseInside = false;
                const wasFocused = (window._kanbanFocusedCol === col);
                window._kanbanFocusedCol = null;
                // Cancel pending expand if user left before 100ms
                if (col._expandTimer) { clearTimeout(col._expandTimer); col._expandTimer = null; }

                if (window._kanbanDragActive) return; // Handled by _collapseDragExpanded on dragEnd
                const key = col.dataset.colKey;
                const cardCount = parseInt(col.dataset.cardCount, 10) || 0;

                // If the column is mid-expand or fully expanded via hover and NOT temp-expanded/placeholder,
                // re-collapse it smoothly (let the CSS 900ms collapse animation run)
                if (col._hoverTriggeredExpand && !col.classList.contains('is-collapsed') && !col.classList.contains('temp-expanded') && !col.classList.contains('collapse-placeholder')) {
                    col._hoverTriggeredExpand = false;
                    col.classList.add('is-collapsed');
                    if (wasFocused) _deferredFlushCheck();
                    return;
                }
                col._hoverTriggeredExpand = false;

                // Re-collapse temp-expanded: use placeholder to avoid layout shift
                if (col.classList.contains('temp-expanded')) {
                    col.classList.remove('temp-expanded');
                    col.classList.add('collapse-placeholder');
                    col._placeholderTimer = setTimeout(() => {
                        _scheduleCollapse(col);
                    }, 1500);
                    // Try to flush any OTHER deferred collapses (delayed so next column can claim focus)
                    if (wasFocused) _deferredFlushCheck();
                    return;
                }

                // Auto-collapse empty columns (not user-collapsed, just empty)
                if (cardCount === 0 && !isUserCollapsed(key)) {
                    collapseTimer = setTimeout(() => {
                        col.classList.add('is-collapsed');
                    }, 500);
                }

                // Flush deferred collapses from other columns (delayed)
                if (wasFocused) _deferredFlushCheck();
            });
        });
    }

    // Grab-to-scroll on the board
    window.kanbanInitScroll = () => {
        const board = document.getElementById('kanban-board');
        if (!board || board._grabScrollInit) return;
        board._grabScrollInit = true;

        let isDown = false, startX, scrollLeft;
        board.addEventListener('mousedown', (e) => {
            // Don't grab on interactive children
            if (e.target.closest('.kanban-card, button, input, a')) return;
            isDown = true;
            board.classList.add('kanban-grabbing');
            startX = e.pageX - board.offsetLeft;
            scrollLeft = board.scrollLeft;
        });
        board.addEventListener('mouseleave', () => { isDown = false; board.classList.remove('kanban-grabbing'); });
        board.addEventListener('mouseup', () => { isDown = false; board.classList.remove('kanban-grabbing'); });
        board.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - board.offsetLeft;
            board.scrollLeft = scrollLeft - (x - startX);
        });
    };
}
