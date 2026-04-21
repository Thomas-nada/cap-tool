import { APP_ID, EDITORS_FALLBACK } from './config.js?v=3';
import { GITHUB_TOKEN } from './env.js';
import {
    ghFetch,
    fetchAllProposals,
    fetchProposalDetail,
    fetchProposalComments,
    fetchProposalEvents,
    createGhIssue,
    updateGhIssueContent,
    postProposalComment,
    updateIssueState,
    deleteIssue,
    fetchLocalFile,
    uploadFileToRepo,
    fetchConstitutionVersions,
    generateCapConstitution,
    uploadCapConstitution,
    addLabel,
    removeLabel,
    fetchEditors
} from './api.js?v=6';

// Import UI Components
import { renderNav } from './components/nav.js?v=5';
import { renderDashboard } from './components/dashboard.js?v=2';
import { renderRegistry } from './components/registry.js?v=7';
import { renderDetail } from './components/detail.js?v=8';
import { renderCreate } from './components/create.js?v=2';
import { renderEdit } from './components/edit.js?v=2';
import { renderConstitution } from './components/constitution.js?v=7';
import { renderWizard } from './components/wizard.js?v=2';
import { renderLearnHub } from './components/learn.js?v=4';
import { initKanbanHandlers } from './components/kanban.js?v=15';


// --- Toast Notification System ---
window.showToast = (title, message, type = 'info') => {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.warn('Toast container not found');
        return;
    }
    
    const toast = document.createElement('div');
    const id = 'toast-' + Date.now();
    toast.id = id;
    
    const icons = {
        success: 'check-circle',
        error: 'x-circle',
        warning: 'alert-circle',
        info: 'info'
    };
    
    const colors = {
        success: 'from-green-500 to-emerald-600',
        error: 'from-red-500 to-rose-600',
        warning: 'from-amber-500 to-orange-600',
        info: 'from-blue-500 to-indigo-600'
    };
    
    toast.className = 'bg-gradient-to-r ' + colors[type] + ' text-white px-6 py-4 rounded-2xl shadow-2xl border-4 border-white dark:border-slate-950 animate-in slide-in-from-right-full fade-in duration-300 cursor-pointer hover:scale-105 transition-transform';
    toast.innerHTML = `
        <div class="flex items-start gap-3">
            <i data-lucide="${icons[type]}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
            <div class="flex-1">
                <p class="font-black text-sm uppercase tracking-wide">${title}</p>
                <p class="text-xs opacity-90 mt-1">${message}</p>
            </div>
            <button onclick="document.getElementById('${id}').remove()" class="ml-2 opacity-70 hover:opacity-100">
                <i data-lucide="x" class="w-4 h-4"></i>
            </button>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Re-initialize lucide icons for the new toast
    if (window.lucide) {
        window.lucide.createIcons();
    }
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
        if (document.getElementById(id)) {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }
    }, 4000);
    
    // Click to dismiss
    toast.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => toast.remove(), 300);
    };
};

// --- Bug Report System ---
const BUG_REPORT_REPO = 'Thomas-nada/cap-tool';
let _bugScreenshots = []; // array of { file: File, dataUrl: string }

window.openBugReport = () => {
    const existing = document.getElementById('bug-report-modal');
    if (existing) { existing.remove(); return; }
    _bugScreenshots = [];

    const modal = document.createElement('div');
    modal.id = 'bug-report-modal';
    modal.className = 'fixed inset-0 z-[400] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" onclick="window.closeBugReport()"></div>
        <div class="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg p-8 fade-in max-h-[90vh] overflow-y-auto no-scrollbar">
            <button onclick="window.closeBugReport()" class="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <i data-lucide="x" class="w-5 h-5"></i>
            </button>
            <div class="flex items-center gap-3 mb-6">
                <div class="w-10 h-10 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                    <i data-lucide="bug" class="w-5 h-5 text-red-500"></i>
                </div>
                <div>
                    <h2 class="text-xl font-black tracking-tight text-slate-900 dark:text-white">Report a Bug</h2>
                    <p class="text-xs text-slate-400 font-bold">Help us improve the CAP Portal</p>
                </div>
            </div>
            <form id="bug-report-form" onsubmit="window.submitBugReport(event)">
                <label class="block mb-1 text-xs font-black text-slate-500 uppercase tracking-widest">Title</label>
                <input id="bug-title" type="text" required placeholder="Brief summary of the issue"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none" />

                <label class="block mb-1 text-xs font-black text-slate-500 uppercase tracking-widest">Description</label>
                <textarea id="bug-description" required rows="4" placeholder="What happened? What did you expect? Steps to reproduce…"
                    class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-medium mb-4 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none resize-none"></textarea>

                <label class="block mb-1 text-xs font-black text-slate-500 uppercase tracking-widest">Screenshots</label>
                <div id="bug-drop-zone"
                    class="w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-4 mb-2 text-center cursor-pointer hover:border-red-400 dark:hover:border-red-500 transition-colors"
                    onclick="document.getElementById('bug-file-input').click()">
                    <i data-lucide="image-plus" class="w-6 h-6 mx-auto text-slate-400 mb-1"></i>
                    <p class="text-xs text-slate-400 font-bold">Click, drag & drop, or paste (Ctrl+V)</p>
                </div>
                <input id="bug-file-input" type="file" accept="image/*" multiple class="hidden" onchange="window.bugHandleFiles(this.files)" />
                <div id="bug-preview-strip" class="flex gap-2 flex-wrap mb-4"></div>

                <p class="text-[10px] text-slate-400 mb-4">Page, browser, and viewport info will be included automatically.</p>

                <div class="flex gap-3">
                    <button type="button" onclick="window.closeBugReport()"
                        class="flex-1 py-3 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        Cancel
                    </button>
                    <button type="submit" id="bug-submit-btn"
                        class="flex-1 py-3 rounded-xl text-sm font-black text-white bg-red-500 hover:bg-red-600 transition-colors shadow-lg">
                        Submit Report
                    </button>
                </div>
            </form>
        </div>`;

    document.body.appendChild(modal);
    if (window.lucide) window.lucide.createIcons();
    document.getElementById('bug-title').focus();

    // Drag & drop
    const dropZone = document.getElementById('bug-drop-zone');
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('border-red-400', 'dark:border-red-500', 'bg-red-50/50', 'dark:bg-red-900/10'); });
    dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('border-red-400', 'dark:border-red-500', 'bg-red-50/50', 'dark:bg-red-900/10'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-red-400', 'dark:border-red-500', 'bg-red-50/50', 'dark:bg-red-900/10');
        const files = [...e.dataTransfer.files].filter(f => f.type.startsWith('image/'));
        if (files.length) window.bugHandleFiles(files);
    });

    // Paste anywhere in the modal
    modal.addEventListener('paste', (e) => {
        const items = [...(e.clipboardData?.items || [])];
        const imageItems = items.filter(i => i.type.startsWith('image/'));
        if (imageItems.length) {
            e.preventDefault();
            const files = imageItems.map(i => i.getAsFile()).filter(Boolean);
            window.bugHandleFiles(files);
        }
    });
};

window.bugHandleFiles = (files) => {
    const fileArr = files instanceof FileList ? [...files] : files;
    fileArr.forEach(file => {
        if (!file.type.startsWith('image/') || _bugScreenshots.length >= 5) return;
        const reader = new FileReader();
        reader.onload = () => {
            _bugScreenshots.push({ file, dataUrl: reader.result });
            window._bugRenderPreviews();
        };
        reader.readAsDataURL(file);
    });
};

window.bugRemoveScreenshot = (index) => {
    _bugScreenshots.splice(index, 1);
    window._bugRenderPreviews();
};

window._bugRenderPreviews = () => {
    const strip = document.getElementById('bug-preview-strip');
    if (!strip) return;
    strip.innerHTML = _bugScreenshots.map((s, i) => `
        <div class="relative group">
            <img src="${s.dataUrl}" class="w-20 h-20 object-cover rounded-lg border border-slate-200 dark:border-slate-700" />
            <button type="button" onclick="window.bugRemoveScreenshot(${i})"
                class="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow">×</button>
        </div>
    `).join('');
};

window.closeBugReport = () => {
    const modal = document.getElementById('bug-report-modal');
    if (modal) modal.remove();
    _bugScreenshots = [];
};

window.submitBugReport = async (e) => {
    e.preventDefault();
    const title = document.getElementById('bug-title').value.trim();
    const description = document.getElementById('bug-description').value.trim();
    if (!title || !description) return;

    const btn = document.getElementById('bug-submit-btn');
    btn.disabled = true;
    btn.textContent = _bugScreenshots.length ? 'Uploading screenshots…' : 'Submitting…';

    // Collect environment metadata
    const meta = [
        `**Page:** \`${location.hash || '#/'}\``,
        `**Viewport:** ${window.innerWidth}×${window.innerHeight}`,
        `**User-Agent:** \`${navigator.userAgent}\``,
        `**Logged in:** ${state.ghToken ? 'Yes' : 'No'}`,
        state.ghUser ? `**User:** @${state.ghUser.login}` : '',
        `**Timestamp:** ${new Date().toISOString()}`
    ].filter(Boolean).join('\n');

    // Upload screenshots to repo (logged-in only)
    let screenshotMarkdown = '';
    if (_bugScreenshots.length && state.ghToken) {
        const ts = Date.now();
        const uploaded = [];
        for (let i = 0; i < _bugScreenshots.length; i++) {
            try {
                btn.textContent = `Uploading screenshot ${i + 1}/${_bugScreenshots.length}…`;
                const s = _bugScreenshots[i];
                const ext = s.file.name?.split('.').pop() || 'png';
                const path = `bug-screenshots/${ts}-${i}.${ext}`;
                const base64 = s.dataUrl.split(',')[1];
                await ghFetch(`/repos/${BUG_REPORT_REPO}/contents/${path}`, state.ghToken, {
                    method: 'PUT',
                    body: JSON.stringify({
                        message: `Bug screenshot ${ts}-${i}`,
                        content: base64
                    })
                });
                const rawUrl = `https://raw.githubusercontent.com/${BUG_REPORT_REPO}/main/${path}`;
                uploaded.push(`![Screenshot ${i + 1}](${rawUrl})`);
            } catch (err) {
                console.warn('Screenshot upload failed:', err);
            }
        }
        if (uploaded.length) {
            screenshotMarkdown = `\n\n### Screenshots\n${uploaded.join('\n\n')}`;
        }
    }

    btn.textContent = 'Submitting…';
    const body = `## Bug Report\n\n${description}${screenshotMarkdown}\n\n---\n\n### Environment\n${meta}`;

    if (state.ghToken) {
        try {
            await ghFetch(`/repos/${BUG_REPORT_REPO}/issues`, state.ghToken, {
                method: 'POST',
                body: JSON.stringify({
                    title: `[Bug] ${title}`,
                    body,
                    labels: ['bug']
                })
            });
            window.closeBugReport();
            window.showToast('Bug Reported', 'Thank you! Your report has been submitted.', 'success');
        } catch (err) {
            console.error('Bug report failed:', err);
            window.closeBugReport();
            const url = `https://github.com/${BUG_REPORT_REPO}/issues/new?` + new URLSearchParams({
                title: `[Bug] ${title}`, body, labels: 'bug'
            }).toString();
            window.open(url, '_blank');
            window.showToast('Redirected', 'Opening GitHub to complete your report.', 'info');
        }
    } else {
        // Anonymous: open pre-filled GitHub issue (screenshots can't be uploaded without auth)
        window.closeBugReport();
        const url = `https://github.com/${BUG_REPORT_REPO}/issues/new?` + new URLSearchParams({
            title: `[Bug] ${title}`, body: `## Bug Report\n\n${description}\n\n---\n\n### Environment\n${meta}`, labels: 'bug'
        }).toString();
        window.open(url, '_blank');
        window.showToast('Redirected', 'Opening GitHub — log in there to submit. Screenshots must be added manually.', 'info');
    }
};

// Helper functions for action panel
window.addTextToCAP = () => {
    if (!window.currentSelection || !window.currentSelection.text) {
        window.showToast('⚠️ No Text Selected', 'Please select text from the constitution first', 'error');
        return;
    }
    window.initiateProposalWithContext('CAP', {
        text: window.currentSelection.text,
        section: window.currentSelection.sectionId
    });
    window.showToast('✨ Added to CAP', 'Your selection has been added successfully', 'success');
};

window.addTextToCIS = () => {
    if (!window.currentSelection || !window.currentSelection.text) {
        window.showToast('⚠️ No Text Selected', 'Please select text from the constitution first', 'error');
        return;
    }
    window.initiateProposalWithContext('CIS', {
        text: window.currentSelection.text,
        section: window.currentSelection.sectionId
    });
    window.showToast('✨ Added to CIS', 'Your selection has been added successfully', 'success');
};

// --- Global Application State ---
window.state = {
    view: 'dashboard',
    lastRenderedView: null,
    lastRenderedTheme: null,
    detailTab: 'discussion', 
    docTypeFilter: 'ALL', 
    createType: 'CAP',
    ghUser: null,
    isEditor: false,
    ghToken: GITHUB_TOKEN || null,
    proposals: [],
    currentProposal: null,
    comments: [],
    proposalEvents: [], 
    proposalMarkdown: '',
    constitutionMarkdown: '', 
    constitutionVersions: [],
    constitutionCurrentVersion: null,
    constitutionCompareVersion: null,
    selectedReferences: [],
    expandedEventId: null, 
    theme: localStorage.getItem('theme') || 'light',
    draft: {
        title: '', category: '', abstract: '', motivation: '', analysis: '', impact: '', exhibits: '', files: [], revisions: {}, coAuthors: []
    },
    editFiles: [], 
    stats: { total: 0, draft: 0, review: 0, final: 0, cisCount: 0, capCount: 0 },
    loading: { 
        init: true, proposals: false, detail: false, submitting: false, 
        comments: false, postComment: false, action: false, constitution: false 
    },
    error: null,
    lastSync: null,
    
    // Wizard state
    wizardStep: 1,
    wizardData: {
        type: 'CAP',
        category: '',
        title: '',
        abstract: '',
        motivation: '',
        analysis: '',
        impact: '',
        selectedText: [],
        revisions: {},
        exhibits: '',
        coAuthors: []
    },
    
    // Search and filter state
    searchQuery: '',
    statusFilter: 'all',  // 'all', 'open', 'closed'
    registryView: 'list', // 'list' or 'kanban'

    // Kanban state
    kanbanCollapsed: [],
    kanbanTagPanelOpen: false,
    kanbanSearch: '',
    kanbanPreviewProposal: null
};

const state = window.state;

// --- Initialize Kanban Handlers ---
initKanbanHandlers(state);

// --- Markdown Formatting Logic ---

/**
 * applyMarkdown
 * Helper to inject Markdown syntax into a textarea at the cursor position.
 * Supports bold, italic, lists, links, and headings.
 */
window.applyMarkdown = (textareaId, type) => {
    const el = document.getElementById(textareaId);
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = el.value;
    const selected = text.substring(start, end);

    let replacement = '';
    let cursorOffset = 0;

    switch(type) {
        case 'bold': 
            replacement = `**${selected || 'bold text'}**`; 
            cursorOffset = selected ? replacement.length : 11;
            break;
        case 'italic': 
            replacement = `*${selected || 'italic text'}*`; 
            cursorOffset = selected ? replacement.length : 12;
            break;
        case 'link': 
            replacement = `[${selected || 'link text'}](https://)`; 
            cursorOffset = selected ? replacement.length : 11;
            break;
        case 'list': 
            replacement = `\n- ${selected || 'list item'}`; 
            cursorOffset = replacement.length;
            break;
        case 'numlist': 
            replacement = `\n1. ${selected || 'list item'}`; 
            cursorOffset = replacement.length;
            break;
        case 'heading': 
            replacement = `\n### ${selected || 'Heading'}`; 
            cursorOffset = replacement.length;
            break;
    }

    el.value = text.substring(0, start) + replacement + text.substring(end);
    
    // Trigger state sync for persistence
    const fieldName = el.name;
    window.updateDraftField(fieldName, el.value);
    
    // UI Refresh (Refocuses the element and handles state)
    el.focus();
    const newPos = start + cursorOffset;
    el.setSelectionRange(newPos, newPos);
};

// --- Routing & Navigation Management ---

window.handleRouting = async () => {
    const hash = window.location.hash || '#/home';
    state.expandedEventId = null;
    state.error = null;

    if (hash === '#/home' || hash === '#/') {
        state.view = 'dashboard';
        loadProposals();
    } else if (hash === '#/registry') {
        state.view = 'list';
        loadProposals();
    } else if (hash === '#/constitution') {
        state.view = 'constitution';
        loadConstitution();
    } else if (hash === '#/create') {
        state.view = 'create';
    } else if (hash.startsWith('#/detail/')) {
        const proposalNumber = hash.split('/').pop();
        if (!state.currentProposal || state.currentProposal.number != proposalNumber) {
            window.openProposal(proposalNumber, false); 
        } else {
            state.view = 'detail';
        }
    } else if (hash === '#/wizard') {
        state.view = 'wizard';
    } else if (hash.startsWith('#/learn/')) {
        // Guide route: #/learn/{slug}
        const slug = hash.replace('#/learn/', '');
        state.view = 'learn';
        if (slug && slug !== state.activeGuide) {
            window.openGuide(slug);
        }
    } else if (hash === '#/learn') {
        state.view = 'learn';
        state.activeGuide = null;
        state.guideHtml = '';
    }
    window.updateUI(true);
};

window.setView = (view) => {
    if (state.view === 'create') window.syncDraft();
    const routes = {
        'dashboard': '#/home',
        'list': '#/registry',
        'constitution': '#/constitution',
        'create': '#/create',
        'wizard': '#/wizard',
        'learn': '#/learn'
    };
    if (routes[view]) {
        window.location.hash = routes[view];
    } else {
        state.view = view;
        window.updateUI(true);
    }
};

// --- Core UI & Rendering Logic ---

window.updateUI = async function(force = false) {
    const root = document.getElementById('app');
    if (state.loading.init || !root) return;

    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    
    if (!force) {
        if (isTyping) return;
        if (state.view === state.lastRenderedView && state.theme === state.lastRenderedTheme && !state.expandedEventId) {
            if (window.lucide) window.lucide.createIcons();
            return;
        }
    }

    state.lastRenderedView = state.view;
    state.lastRenderedTheme = state.theme;

    const isKanban = state.view === 'list' && state.registryView === 'kanban';

    // Clean up detail overlay if leaving kanban view
    if (!isKanban) {
        const overlay = document.getElementById('kanban-detail-overlay');
        if (overlay) overlay.remove();
        root.classList.remove('kanban-preview-active');
        state.kanbanPreviewProposal = null;
    }
    document.documentElement.className = state.theme;

    const mainCls = isKanban
        ? 'flex-grow overflow-hidden px-4 pt-4 pb-2'
        : 'flex-grow container mx-auto px-6 py-12 max-w-7xl';
    root.innerHTML = `
        <div id="toast-container" class="fixed top-24 right-8 z-[300] space-y-3" style="max-width: 400px;"></div>
        <div class="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-300 text-left">
            ${renderNav(state)}
            <main id="main-content" class="${mainCls}">
                ${renderActiveView()}
            </main>
        </div>
        <!-- Floating Bug Report Button -->
        <button onclick="window.openBugReport()" title="Report a Bug"
            class="fixed bottom-6 right-6 z-[200] w-12 h-12 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-110 transition-all flex items-center justify-center">
            <i data-lucide="bug" class="w-5 h-5"></i>
        </button>`;
    if (window.lucide) window.lucide.createIcons();
    if (window.fixPreCode) window.fixPreCode();
    if (isKanban && window.kanbanInitScroll) window.kanbanInitScroll();
    if (isKanban && window.kanbanInitCollapseAnimations) window.kanbanInitCollapseAnimations();
    if (isKanban && window.kanbanStartPolling) window.kanbanStartPolling();
    if (!isKanban && window.kanbanStopPolling) window.kanbanStopPolling();
    if (!isKanban && window.kanbanCloseTagPanel) window.kanbanCloseTagPanel();
    if (!isKanban && window.kanbanClosePreview) window.kanbanClosePreview();
};

function renderActiveView() {
    // Write-actions require login
    const requiresAuth = ['create', 'wizard', 'edit'];
    if (requiresAuth.includes(state.view) && !state.ghToken) {
        return renderLoginPrompt();
    }
    switch (state.view) {
        case 'dashboard': return renderDashboard(state);
        case 'list': return renderRegistry(state);
        case 'detail': return renderDetail(state);
        case 'create': return renderCreate(state);
        case 'edit': return renderEdit(state);
        case 'constitution': return renderConstitution(state);
        case 'wizard': return renderWizard(state);
        case 'learn': return renderLearnHub(state);
        default: return '<p class="text-slate-400">Unknown view.</p>';
    }
}

function renderLoginPrompt() {
    return `
        <div class="flex items-center justify-center min-h-[60vh]">
            <div class="text-center max-w-md">
                <div class="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-8">
                    <i data-lucide="log-in" class="w-10 h-10 text-blue-600"></i>
                </div>
                <h2 class="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white mb-4">Login Required</h2>
                <p class="text-slate-500 mb-8">You need to log in with GitHub to submit or edit proposals.</p>
                <button onclick="window.loginWithGitHub()"
                    class="inline-flex items-center gap-3 px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black text-sm hover:scale-105 transition-all shadow-xl">
                    <i data-lucide="github" class="w-5 h-5"></i>
                    Login with GitHub
                </button>
                <button onclick="window.setView('dashboard')"
                    class="block mx-auto mt-4 text-sm text-slate-400 hover:text-slate-600 font-bold">
                    Back to Home
                </button>
            </div>
        </div>`;
}

// --- Modal & Fragment Managers ---

window.openModal = (type) => {
    state.currentModal = type;
    window.updateUI(true);
};

window.closeModal = () => {
    state.currentModal = null;
    window.updateUI(true);
};

// Load and display a guide markdown file inside the Learn hub
window.openGuide = async (slug) => {
    try {
        state.loading.guide = true;
        state.activeGuide = slug;
        state.guideHtml = '';
        state.view = 'learn';
        // Give the guide its own hash so browser back navigates to #/learn
        window.location.hash = `#/learn/${slug}`;
        window.updateUI(true);

        const path = `docs/guides/${slug}.md`;
        const text = await fetchLocalFile(path);
        // Use marked (already used elsewhere) to parse markdown
        const html = window.marked ? window.marked.parse(text) : text;
        state.guideHtml = html;
    } catch (e) {
        console.error('Failed to load guide:', e);
        state.guideHtml = `<p class="text-red-600">Failed to load guide: ${e.message}</p>`;
    } finally {
        state.loading.guide = false;
        window.updateUI(true);
    }
};

window.closeGuide = () => {
    state.activeGuide = null;
    state.guideHtml = '';
    window.location.hash = '#/learn';
    window.updateUI(true);
};

// Insert markdown formatting around selected text or at cursor
window.insertMarkdown = (textarea, prefix, suffix, placeholder) => {
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end) || placeholder;
    
    const before = text.substring(0, start);
    const after = text.substring(end);
    
    textarea.value = before + prefix + selectedText + suffix + after;
    textarea.focus();
    
    // Position cursor after the prefix or at end if no selection
    if (text.substring(start, end)) {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    } else {
        textarea.setSelectionRange(start + prefix.length, start + prefix.length + placeholder.length);
    }
};

// File upload processor
window.handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    files.forEach(f => {
        const reader = new FileReader();
        reader.onload = (e) => {
            state.draft.files.push({ name: f.name, base64: e.target.result.split(',')[1], type: f.type });
            window.updateUI(true);
        };
        reader.readAsDataURL(f);
    });
};

window.removeFile = (fileName) => {
    state.draft.files = state.draft.files.filter(f => f.name !== fileName);
    window.updateUI(true);
};

// Draft synchronization for Create Form
window.updateDraftField = (field, value) => {
    state.draft[field] = value;
};

window.syncDraft = () => {
    ['title', 'category', 'abstract', 'motivation', 'analysis', 'impact', 'exhibits'].forEach(field => {
        const el = document.querySelector(`[name="${field}"]`);
        if (el) state.draft[field] = el.value;
    });
    state.selectedReferences.forEach(ref => {
        const el = document.getElementById(`revision-${ref.id}`);
        if (el) state.draft.revisions[ref.id] = el.value;
    });
};

// Toggle proposal type on the create form
window.setCreateType = (type) => {
    state.createType = type;
    window.updateUI(true);
};

// File upload handler for create & edit forms
window.handleFileSelect = (files) => {
    const target = state.view === 'edit' ? state.editFiles : state.draft.files;
    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target.result.split(',')[1];
            target.push({ name: file.name, type: file.type, base64 });
            window.updateUI(true);
        };
        reader.readAsDataURL(file);
    });
};

// Remove a file from the draft/edit file list
window.removeDraftFile = (index) => {
    if (state.view === 'edit') {
        state.editFiles.splice(index, 1);
    } else {
        state.draft.files.splice(index, 1);
    }
    window.updateUI(true);
};

// Edit form submission handler
window.handleEdit = async (event) => {
    event.preventDefault();
    const form = event.target;
    const title = form.querySelector('[name="title"]').value;
    const category = form.querySelector('[name="category"]').value;
    const abstract = form.querySelector('[name="abstract"]').value;
    const revisions = form.querySelector('[name="revisions"]')?.value || '';
    const motivation = form.querySelector('[name="motivation"]').value;
    const analysis = form.querySelector('[name="analysis"]')?.value || '';
    const impact = form.querySelector('[name="impact"]')?.value || '';
    const exhibits = form.querySelector('[name="specification_extra"]')?.value || '';
    const p = state.currentProposal;
    const isCIS = p.labels.some(l => l.name === 'CIS');
    const type = isCIS ? 'CIS' : 'CAP';

    if (!title || !category || !abstract || !motivation) {
        window.showToast('Missing Fields', 'Please complete all required fields.', 'warning');
        return;
    }

    state.loading.submitting = true;
    window.updateUI(true);

    let body = `### Summary\n${abstract}\n\n`;
    if (revisions) body += `### Structured Revisions (Contextual)\n${revisions}\n\n`;
    if (isCIS) {
        body += `### Problem\n${motivation}\n\n`;
        if (analysis) body += `### Context\n${analysis}\n\n`;
        if (impact) body += `### Impact\n${impact}\n\n`;
    } else {
        body += `### Why is this change needed?\n${motivation}\n\n`;
        if (analysis) body += `### Analysis & Test\n${analysis}\n\n`;
    }
    body += `### Links and Files\n${exhibits || 'None provided.'}\n\n`;

    // Preserve existing frontmatter, updating Title and Category if changed
    const existingFm = extractAndUpdateFrontmatter(state.currentProposal?.body || '', title, category);

    try {
        await updateGhIssueContent(p.number, title, existingFm + body, category, type, state.ghToken);

        for (const file of state.editFiles) {
            const path = `institutional-exhibits/${p.number}-${file.name}`;
            await uploadFileToRepo(path, file.base64, `Add exhibit for ${type} #${p.number}`, state.ghToken);
        }

        state.editFiles = [];
        window.showToast('Updated', `${type} #${p.number} updated successfully.`, 'success');
        window.openProposal(p.number);
    } catch (e) {
        window.showToast('Update Failed', e.message, 'error');
    } finally {
        state.loading.submitting = false;
        window.updateUI(true);
    }
};

// --- Frontmatter Helpers ---

/**
 * Builds a CIP-style YAML frontmatter block for a CAP or CIS issue.
 * Renders as a ```yaml code block so it displays with syntax highlighting in GitHub Issues.
 */
function buildFrontmatter(type, number, title, category, authorLogin, coAuthors, discussionUrl, createdDate, deliberationEnd) {
    let fm = '```yaml\n';
    fm += `${type}: ${number}\n`;
    fm += `Title: ${title}\n`;
    fm += `Category: ${category}\n`;
    fm += `Status: ${type === 'CAP' ? 'Draft' : 'Proposed'}\n`;
    fm += `Authors:\n    - @${authorLogin}\n`;
    if (coAuthors && coAuthors.length > 0) {
        fm += `Co-Authors:\n`;
        coAuthors.forEach(a => { fm += `    - @${a.replace('@', '')}\n`; });
    }
    fm += `Discussions:\n    - ${discussionUrl}\n`;
    fm += `Created: ${createdDate}\n`;
    fm += `License: CC-BY-4.0\n`;
    if (type === 'CAP' && deliberationEnd) {
        fm += `Deliberation-End: ${deliberationEnd}\n`;
    }
    fm += '```\n\n';
    return fm;
}

/**
 * Extracts the ```yaml frontmatter block from an existing issue body,
 * updates Title and Category fields, and returns the updated block.
 * Returns '' if no frontmatter is found.
 */
function extractAndUpdateFrontmatter(body, newTitle, newCategory) {
    if (!body) return '';
    const match = body.match(/^```yaml\n[\s\S]*?```\n\n/);
    if (!match) return '';
    let fm = match[0];
    fm = fm.replace(/^Title: .+$/m, `Title: ${newTitle}`);
    fm = fm.replace(/^Category: .+$/m, `Category: ${newCategory}`);
    return fm;
}

// --- Form Submission Logic ---

window.handleForm = async (event) => {
    event.preventDefault();
    window.syncDraft();

    const { title, category, abstract, motivation, analysis, impact, exhibits } = state.draft;
    const type = state.createType;

    if (!title || !category || !abstract || !motivation) {
        window.showToast('Missing Fields', 'Please complete all required fields.', 'warning');
        return;
    }

    state.loading.submitting = true;
    window.updateUI(true);

    // Pre-compute deliberation for CAP (used in both body and frontmatter)
    let deliberationExpiry = null;
    let deliberationEndStr = null;
    if (type === 'CAP') {
        const consultationDays = { Procedural: 60, Substantive: 60, Technical: 60, Interpretive: 30, Editorial: 14, Other: 30 };
        const days = consultationDays[category] || 30;
        deliberationExpiry = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
        deliberationEndStr = deliberationExpiry.toISOString().split('T')[0];
    }

    let body = `### Summary\n${abstract}\n\n`;
    if (type === 'CAP') {
        body += `### Why is this change needed?\n${motivation}\n\n`;
        if (analysis) body += `### Analysis & Test\n${analysis}\n\n`;
    } else {
        body += `### Problem\n${motivation}\n\n`;
        if (analysis) body += `### Context\n${analysis}\n\n`;
        if (impact) body += `### Impact\n${impact}\n\n`;
    }

    // CAP-specific revision section
    if (type === 'CAP' && state.selectedReferences.length > 0) {
        body += `### Revisions\n\n`;
        state.selectedReferences.forEach(ref => {
            const revision = state.draft.revisions[ref.id] || '';
            body += `#### ${ref.section}\n**Original Text:**\n> ${ref.text}\n\n**Proposed Revision:**\n${revision}\n\n`;
        });
    }

    body += `### Links and Files\n${exhibits || 'None provided.'}\n\n`;
    if (type === 'CAP') {
        body += `### Institutional Metadata\n- **License:** CC-BY-4.0\n- **Deliberation End:** ${deliberationEndStr}\n\n`;
        body += `<!-- DELIBERATION_END: ${deliberationExpiry.toISOString()} -->`;
    } else {
        body += `### Institutional Metadata\n- **License:** CC-BY-4.0\n`;
    }

    try {
        // Create the GitHub issue
        const issue = await createGhIssue(title, body, category, type, state.ghToken);

        // Prepend CIP-style frontmatter header and update issue body
        const today = new Date().toISOString().split('T')[0];
        const fm = buildFrontmatter(type, issue.number, title, category, state.ghUser?.login || 'unknown', state.draft.coAuthors || [], issue.html_url, today, deliberationEndStr);
        await updateGhIssueContent(issue.number, title, fm + body, state.ghToken);

        // Upload institutional exhibits (if any)
        for (const file of state.draft.files) {
            const path = `institutional-exhibits/${issue.number}-${file.name}`;
            await uploadFileToRepo(path, file.base64, `Add exhibit for ${type} #${issue.number}`, state.ghToken);
        }

        // For CAP with constitutional changes, generate and upload preview constitution
        if (type === 'CAP' && state.selectedReferences.length > 0) {
            try {
                // Get current constitution
                if (!state.constitutionVersions || state.constitutionVersions.length === 0) {
                    await loadConstitution();
                }

                const currentConstitution = state.constitutionVersions.find(v => v.isCurrent);
                if (currentConstitution) {
                    const revisions = state.selectedReferences.map(ref => ({
                        section: ref.section,
                        originalText: ref.text,
                        proposedText: state.draft.revisions[ref.id] || ''
                    }));
                    
                    const today = new Date().toISOString().split('T')[0];
                    const newConstitution = generateCapConstitution(
                        currentConstitution.content,
                        revisions,
                        issue.number,
                        today
                    );
                    
                    // Upload the new constitution preview
                    await uploadCapConstitution(issue.number, today, newConstitution, state.ghToken);

                    // Immediately add the new preview to local state so it appears instantly
                    try {
                        const filename = `CAP-${issue.number}-${today}.txt`;
                        const displayName = `CAP-${issue.number}-${today}`;
                        const newVersionObj = {
                            name: displayName,
                            filename: filename,
                            path: `constitution/CAP%20Constitutions/${filename}`,
                            downloadUrl: '',
                            date: today,
                            sha: '',
                            isOfficial: false,
                            content: newConstitution,
                            isPreview: true
                        };

                        // Insert at the front so it's selected by default
                        state.constitutionVersions = [newVersionObj, ...state.constitutionVersions.filter(v => v.name !== displayName)];
                        state.constitutionCurrentVersion = displayName;
                        state.constitutionMarkdown = newConstitution;
                        window.updateUI(true);

                        // Kick off a background reload to reconcile with GitHub later
                        window.reloadConstitution();
                    } catch (e) {
                        console.warn('Failed to inject preview locally:', e);
                        // Fallback: force a full reload
                        await window.reloadConstitution();
                    }
                }
            } catch (constitutionError) {
                console.error('Failed to generate constitution preview:', constitutionError);
                // Don't fail the entire submission if constitution preview fails
            }
        }

        // Clear draft and navigate
        state.draft = { title: '', category: '', abstract: '', motivation: '', analysis: '', impact: '', exhibits: '', files: [], revisions: {}, coAuthors: [] };
        state.selectedReferences = [];
        
        window.showToast('Submitted', `${type} #${issue.number} created successfully.`, 'success');
        window.location.hash = `#/detail/${issue.number}`;
    } catch (e) {
        state.error = e.message;
        window.showToast('Submission Failed', e.message, 'error');
    } finally {
        state.loading.submitting = false;
        window.updateUI(true);
    }
};

window.openProposal = async (number, addToHistory = true) => {
    state.loading.detail = true;
    state.view = 'detail';
    if (addToHistory) window.location.hash = `#/detail/${number}`;
    window.updateUI(true);

    try {
        state.currentProposal = await fetchProposalDetail(number, state.ghToken);
        state.proposalMarkdown = state.currentProposal.body || '(No description provided)';

        state.loading.comments = true;
        window.updateUI(true);
        
        state.comments = await fetchProposalComments(number, state.ghToken);
        
        state.loading.comments = false;
        window.updateUI(true);
        
        await checkDeliberationExpiry(state.currentProposal, state.comments);
        state.proposalEvents = await fetchProposalEvents(number, state.ghToken);
    } catch (e) {
        state.error = e.message;
    } finally {
        state.loading.detail = false;
        window.updateUI(true);
    }
};

window.initiateProposalWithContext = (type, ref) => {
    // Check if we're in wizard mode
    if (state.view === 'constitution' && state.wizardStep > 0) {
        // Add to wizard's selected text directly
        if (!state.wizardData.selectedText) {
            state.wizardData.selectedText = [];
        }
        
        // Check for duplicates
        const isDuplicate = state.wizardData.selectedText.some(
            item => item.text === ref.text && item.section === ref.section
        );
        
        if (!isDuplicate) {
            state.wizardData.selectedText.push({
                text: ref.text,
                section: ref.section
            });
            
            // Save to localStorage for persistence
            localStorage.setItem('wizard_in_progress', JSON.stringify({
                step: state.wizardStep,
                data: state.wizardData
            }));
            
            // Show success toast
            const count = state.wizardData.selectedText.length;
            window.showToast(`Added to ${type}!`, `${count} selection${count !== 1 ? 's' : ''} so far`, 'success');
            
            // Update the UI to show the return button
            window.updateUI(true);
        } else {
            window.showToast('Already selected', 'This text is already in your selections', 'warning');
        }
        return;
    }
    
    // Original flow - add to selectedReferences for create view
    if (!state.selectedReferences.find(r => r.id === ref.section + '-' + ref.text.substring(0, 20))) {
        state.selectedReferences.push({
            id: ref.section + '-' + ref.text.substring(0, 20),
            text: ref.text,
            section: ref.section
        });
    }
    
    state.createType = type;
    window.setView('create');
};

window.removeReference = (id) => {
    state.selectedReferences = state.selectedReferences.filter(r => r.id !== id);
    delete state.draft.revisions[id];
    window.updateUI(true);
};

window.startEdit = () => {
    state.view = 'edit';
    window.updateUI(true);
};

// --- Data Fetching & Deliberation Bot ---

async function checkDeliberationExpiry(p, comments) {
    const isCIS = p.labels.some(l => l.name === 'CIS');
    if (!isCIS) return;
    const expiryDate = new Date(new Date(p.created_at).getTime() + (30 * 24 * 60 * 60 * 1000));
    if (new Date() > expiryDate) {
        const signature = "<!-- SYSTEM_DELIBERATION_EXPIRED -->";
        if (!comments.some(c => c.body.includes(signature))) {
            const msg = `### 🕒 Deliberation Period Expired\n\nThe mandatory 30-day deliberation period has now concluded.\n\n${signature}`;
            try {
                const nc = await postProposalComment(p.number, msg, state.ghToken);
                state.comments.push(nc);
                window.updateUI(true);
            } catch (e) { console.error("Bot synthesis failed", e); }
        }
    }
}

async function loadConstitution() {
    if (state.constitutionVersions.length > 0) {
        return;
    }
    state.loading.constitution = true;
    window.updateUI(true);
    try {
        state.constitutionVersions = await fetchConstitutionVersions(state.ghToken);
        if (state.constitutionVersions.length > 0) {
            state.constitutionCurrentVersion = state.constitutionVersions[0].name;
            // Keep backward compatibility
            state.constitutionMarkdown = state.constitutionVersions[0].content;
        }
    } catch (e) {
        console.error('Failed to load constitution:', e);
        state.error = "Constitution versions unavailable: " + e.message;
    } finally {
        state.loading.constitution = false;
        window.updateUI(true);
    }
}

// Force reload constitution versions (used after CAP submission)
window.reloadConstitution = async () => {
    state.constitutionVersions = [];
    state.constitutionCurrentVersion = null;
    state.constitutionCompareVersion = null;
    state.constitutionMarkdown = '';
    await loadConstitution();
};

// Constitution version management
window.downloadConstitution = () => {
    const version = state.constitutionVersions.find(v => v.name === state.constitutionCurrentVersion);
    if (!version || !version.content) {
        window.showToast('Download Failed', 'No constitution content available.', 'error');
        return;
    }
    const filename = version.filename || `constitution-${version.name}.txt`;
    const blob = new Blob([version.content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
};

window.switchConstitutionVersion = (versionName) => {
    state.constitutionCurrentVersion = versionName;
    const version = state.constitutionVersions.find(v => v.name === versionName);
    if (version) {
        state.constitutionMarkdown = version.content;
    }
    window.updateUI(true);
};

window.enableDiffMode = () => {
    // Default diff: Current Constitution (left) vs Newest CAP Preview (right)
    // This lets users immediately see what the latest proposal would change.
    const currentConstitution = state.constitutionVersions.find(v => v.isCurrent && v.isOfficial);
    const newestCapPreview = state.constitutionVersions.find(v => !v.isOfficial);

    if (currentConstitution && newestCapPreview) {
        // Set the left side (main version selector) to the current constitution
        state.constitutionCurrentVersion = currentConstitution.name;
        state.constitutionMarkdown = currentConstitution.content;
        // Set the right side (compare dropdown) to the newest CAP preview
        state.constitutionCompareVersion = newestCapPreview.name;
    } else {
        // Fallback: pick the next chronological version (original behavior)
        const currentIndex = state.constitutionVersions.findIndex(v => v.name === state.constitutionCurrentVersion);
        if (currentIndex < state.constitutionVersions.length - 1) {
            state.constitutionCompareVersion = state.constitutionVersions[currentIndex + 1].name;
        } else if (state.constitutionVersions.length > 1) {
            state.constitutionCompareVersion = state.constitutionVersions[state.constitutionVersions.length - 1].name;
        }
    }
    window.updateUI(true);
};

window.disableDiffMode = () => {
    state.constitutionCompareVersion = null;
    window.updateUI(true);
};

window.setCompareVersion = (versionName) => {
    state.constitutionCompareVersion = versionName;
    window.updateUI(true);
};

async function loadProposals() {
    try {
        const ps = await fetchAllProposals(state.ghToken);
        state.proposals = ps;
        state.stats = {
            total: ps.length,
            draft: ps.filter(x => x.state === 'open').length,
            review: 0,
            final: ps.filter(x => x.state === 'closed').length
        };
    } catch (e) {
        if (e.message === "AUTH_EXPIRED") {
            // Token has expired — clear it and keep browsing as public
            state.ghToken = null;
            state.ghUser = null;
            state.isEditor = false;
            localStorage.removeItem('gh_token');
            // Retry without auth
            try {
                const ps = await fetchAllProposals(null);
                state.proposals = ps;
                state.stats = {
                    total: ps.length,
                    draft: ps.filter(x => x.state === 'open').length,
                    review: 0,
                    final: ps.filter(x => x.state === 'closed').length
                };
            } catch {}
        }
    }
    window.updateUI(true);
}

// --- Administrative Handlers ---

window.postComment = async (form) => {
    const b = new FormData(form).get('comment');
    if (!b || state.loading.postComment) return;
    state.loading.postComment = true;
    window.updateUI(true);
    try {
        const nc = await postProposalComment(state.currentProposal.number, b, state.ghToken);
        state.comments.push(nc);
        form.reset();
    } catch (e) { state.error = e.message; }
    finally { state.loading.postComment = false; window.updateUI(true); }
};

window.closeProposal = async (n) => {
    if (!confirm("Archive this record?")) return;
    try {
        await updateIssueState(n, 'closed', state.ghToken);
        window.openProposal(n);
    } catch (e) { state.error = e.message; }
};

window.deleteProposal = async (n) => {
    if (!confirm("CRITICAL: Lock and archive permanently?")) return;
    try {
        await deleteIssue(n, state.ghToken);
        window.location.hash = '#/registry';
    } catch (e) { state.error = e.message; }
};

// --- Author Stage Advance ---

// Authors no longer advance lifecycle stages — editors control all stage transitions.
const AUTHOR_PERMITTED_TRANSITIONS = {};

window.authorAdvanceStage = async (targetStage) => {
    if (!state.ghToken || !state.currentProposal) return;
    const isAuthor = state.ghUser?.login === state.currentProposal.user.login;
    if (!isAuthor) return;

    const current = state.currentProposal.labels.find(l => LIFECYCLE_LABELS.includes(l.name))?.name || 'none';
    const permitted = AUTHOR_PERMITTED_TRANSITIONS[current];
    if (permitted !== targetStage) {
        window.showToast('Not Permitted', `Authors cannot move from "${current}" to "${targetStage}".`, 'error');
        return;
    }

    const confirmMsg = `Move proposal to "${targetStage}"?`;

    if (!confirm(confirmMsg)) return;

    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const existing = state.currentProposal.labels.map(l => l.name);
        for (const lbl of LIFECYCLE_LABELS) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        await addLabel(number, targetStage, token);
        state.currentProposal = await fetchProposalDetail(number, token);
        state.proposalEvents = await fetchProposalEvents(number, token);
        updateUI(true);
        window.showToast('Stage Updated', `Your proposal is now: ${targetStage}`, 'success');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

window.authorSignalReady = async () => {
    if (!state.ghToken || !state.currentProposal) return;
    const isAuthor = state.ghUser?.login === state.currentProposal.user.login;
    if (!isAuthor) return;
    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const isOn = state.currentProposal.labels.some(l => l.name === 'author-ready');
        if (isOn) {
            await removeLabel(number, 'author-ready', token);
        } else {
            await addLabel(number, 'author-ready', token);
        }
        state.currentProposal = await fetchProposalDetail(number, token);
        updateUI(true);
        window.showToast(
            isOn ? 'Signal Withdrawn' : 'Ready Signal Sent',
            isOn ? 'Your ready signal has been removed.' : 'Editors can now see you are ready to advance.',
            isOn ? 'info' : 'success'
        );
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

window.authorWithdraw = async () => {
    if (!state.ghToken || !state.currentProposal) return;
    const isAuthor = state.ghUser?.login === state.currentProposal.user.login;
    if (!isAuthor) return;
    if (!confirm('Withdraw this proposal? This marks it as withdrawn and closes the issue. This is recorded in the proposal history.')) return;

    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const existing = state.currentProposal.labels.map(l => l.name);
        // Clear lifecycle labels
        for (const lbl of LIFECYCLE_LABELS) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        // Clear all status tags and author signal — they're meaningless on a withdrawn proposal
        for (const lbl of [...STATUS_TAG_LABELS, 'author-ready']) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        await addLabel(number, 'withdrawn', token);
        await updateIssueState(number, 'closed', token);
        state.currentProposal = await fetchProposalDetail(number, token);
        state.proposalEvents = await fetchProposalEvents(number, token);
        updateUI(true);
        window.showToast('Proposal Withdrawn', 'Marked as withdrawn and closed.', 'info');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

// --- Editor Actions ---

const LIFECYCLE_LABELS = ['consultation','ready','done','withdrawn'];
const STATUS_TAG_LABELS = ['review','revision','finalizing','onchain'];
const EDITOR_SIGNAL_LABELS = ['editor-ok','editor-concern','editor-suggested'];
const SPECIAL_HANDLING_LABELS = ['bundle','minor','major','pause','fast-track'];

window.editorSetLifecycle = async (stage) => {
    if (!state.isEditor || !state.currentProposal) return;
    const current = state.currentProposal.labels.find(l => LIFECYCLE_LABELS.includes(l.name))?.name || 'none';

    // Forward transitions require the author to have signalled readiness first
    const FORWARD = { 'consultation': 'ready', 'ready': 'done' };
    if (FORWARD[current] === stage) {
        const authorReady = state.currentProposal.labels.some(l => l.name === 'author-ready');
        if (!authorReady) {
            window.showToast(
                'Author Signal Required',
                'The author must signal readiness before this proposal can advance.',
                'warning'
            );
            return;
        }
    }

    if (!confirm(`Move proposal from "${current}" → "${stage}"?`)) return;
    const number = state.currentProposal.number;
    const token = state.ghToken;
    // Tags that are only meaningful in a specific stage — auto-clear when leaving that stage
    const STAGE_CLEANUP_TAGS = {
        'consultation': ['revision', 'finalizing'],
        'ready': ['onchain'],
    };
    try {
        // Remove all existing lifecycle labels, then add new one
        const existing = state.currentProposal.labels.map(l => l.name);
        for (const lbl of LIFECYCLE_LABELS) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        // Clear author-ready signal — it was for this step only
        if (existing.includes('author-ready')) await removeLabel(number, 'author-ready', token);
        // Clear stage-specific status tags that no longer apply
        for (const lbl of (STAGE_CLEANUP_TAGS[current] || [])) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        await addLabel(number, stage, token);
        // Refresh
        state.currentProposal = await fetchProposalDetail(number, token);
        updateUI(true);
        window.showToast('Stage Updated', `Moved to: ${stage}`, 'success');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

window.editorToggleStatusTag = async (label) => {
    if (!state.isEditor || !state.currentProposal) return;
    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const existing = state.currentProposal.labels.map(l => l.name);
        const isOn = existing.includes(label);
        if (isOn) {
            await removeLabel(number, label, token);
        } else {
            await addLabel(number, label, token);
        }
        state.currentProposal = await fetchProposalDetail(number, token);
        updateUI(true);
        window.showToast('Tag Updated', isOn ? `Removed: ${label}` : `Added: ${label}`, 'success');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

window.editorToggleSignal = async (label) => {
    if (!state.isEditor || !state.currentProposal) return;
    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const existing = state.currentProposal.labels.map(l => l.name);
        const isOn = existing.includes(label);
        // Remove all signal labels (mutually exclusive)
        for (const lbl of EDITOR_SIGNAL_LABELS) {
            if (existing.includes(lbl)) await removeLabel(number, lbl, token);
        }
        // If it wasn't already on, set it
        if (!isOn) await addLabel(number, label, token);
        state.currentProposal = await fetchProposalDetail(number, token);
        updateUI(true);
        window.showToast('Signal Updated', isOn ? `Removed: ${label}` : `Set: ${label}`, 'success');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

window.editorToggleSpecial = async (label) => {
    if (!state.isEditor || !state.currentProposal) return;
    const number = state.currentProposal.number;
    const token = state.ghToken;
    try {
        const existing = state.currentProposal.labels.map(l => l.name);
        const isOn = existing.includes(label);
        if (isOn) {
            await removeLabel(number, label, token);
        } else {
            await addLabel(number, label, token);
        }
        state.currentProposal = await fetchProposalDetail(number, token);
        updateUI(true);
        window.showToast('Label Updated', isOn ? `Removed: ${label}` : `Added: ${label}`, 'success');
    } catch (e) {
        window.showToast('Error', e.message, 'error');
    }
};

// --- Authentication & Theme ---

// --- GitHub OAuth ---

const GITHUB_CLIENT_ID  = 'Ov23liqj7BQRN5PwhEGV';
const GATEKEEPER_URL    = 'https://cap-portal-auth.onrender.com';

window.loginWithGitHub = () => {
    const redirect = window.location.origin + window.location.pathname;
    window.location.href =
        `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=public_repo&redirect_uri=${encodeURIComponent(redirect)}`;
};

window.submitToken = async () => {
    const input = document.getElementById('token-input');
    const error = document.getElementById('token-error');
    const token = input?.value?.trim();
    if (!token) return;
    try {
        const user = await ghFetch('/user', token);
        state.ghToken = token;
        localStorage.setItem('gh_token', token);
        state.ghUser = user;
        const editorsList = await fetchEditors();
        const editors = editorsList.length > 0 ? editorsList : EDITORS_FALLBACK;
        state.isEditor = editors.includes(user.login);
        window.handleRouting();
    } catch (e) {
        if (error) {
            error.textContent = 'Invalid token or insufficient permissions. Make sure it has repo scope.';
            error.classList.remove('hidden');
        }
    }
};

window.logout = () => {
    state.ghToken = null;
    state.ghUser = null;
    state.isEditor = false;
    window.location.hash = '';
    window.updateUI(true);
};

window.toggleTheme = () => {
    state.theme = state.theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('theme', state.theme);
    window.updateUI(true);
};

// --- Wizard Management Functions ---

// FIXED: Don't re-render UI on every keystroke - just update state
window.updateWizard = (updates) => {
    state.wizardData = { ...state.wizardData, ...updates };
    // Don't call updateUI unless it's not a text input change
    if (!updates.title && !updates.abstract && !updates.motivation && !updates.exhibits) {
        window.updateUI(true);
    }
};

// FIXED: Don't re-render on every keystroke in revision fields
window.updateWizardRevision = (index, value) => {
    state.wizardData.revisions[index] = value;
    // Don't re-render while typing
};

window.removeWizardSelection = (index) => {
    state.wizardData.selectedText.splice(index, 1);
    // Reindex revisions
    const newRevisions = {};
    Object.keys(state.wizardData.revisions).forEach(key => {
        const idx = parseInt(key);
        if (idx < index) {
            newRevisions[idx] = state.wizardData.revisions[key];
        } else if (idx > index) {
            newRevisions[idx - 1] = state.wizardData.revisions[key];
        }
    });
    state.wizardData.revisions = newRevisions;
    window.updateUI(true);
};

window.wizardNextStep = () => {
    // Validation
    if (state.wizardStep === 1) {
        if (!state.wizardData.type || !state.wizardData.category || !state.wizardData.title.trim()) {
            window.showToast('Missing Fields', 'Please complete all required fields.', 'warning');
            return;
        }
    }

    if (state.wizardStep === 2 && state.wizardData.type === 'CAP') {
        if (!state.wizardData.selectedText || state.wizardData.selectedText.length === 0) {
            if (!confirm('No constitution text selected. Continue anyway?')) {
                return;
            }
        }
    }

    if (state.wizardStep === 4) {
        if (!state.wizardData.abstract.trim() || !state.wizardData.motivation.trim()) {
            const requiredField = state.wizardData.type === 'CAP' ? 'Why is this change needed?' : 'Problem';
            window.showToast('Missing Fields', `Please fill in the Summary and "${requiredField}" fields.`, 'warning');
            return;
        }
        if (state.wizardData.type === 'CAP' && !state.wizardData.analysis.trim()) {
            window.showToast('Missing Fields', 'Please complete the Analysis & Test field.', 'warning');
            return;
        }
    }
    
    // Handle step progression (CIS skips text selection)
    if (state.wizardData.type === 'CIS' && state.wizardStep === 1) {
        state.wizardStep = 4; // Jump to explanation
    } else if (state.wizardData.type === 'CIS' && state.wizardStep === 4) {
        state.wizardStep = 5; // Jump to review
    } else if (state.wizardData.type === 'CAP') {
        state.wizardStep++;
    } else {
        state.wizardStep++;
    }
    
    window.updateUI(true);
    window.scrollTo(0, 0);
};

window.wizardPrevStep = () => {
    // Handle step regression (CIS skips text selection)
    if (state.wizardData.type === 'CIS' && state.wizardStep === 4) {
        state.wizardStep = 1;
    } else if (state.wizardData.type === 'CIS' && state.wizardStep === 5) {
        state.wizardStep = 4;
    } else {
        state.wizardStep--;
    }
    
    window.updateUI(true);
    window.scrollTo(0, 0);
};

window.wizardReset = () => {
    if (confirm('Start over? All wizard data will be lost.')) {
        state.wizardStep = 1;
        state.wizardData = {
            type: 'CAP',
            category: '',
            title: '',
            abstract: '',
            motivation: '',
            analysis: '',
            impact: '',
            selectedText: [],
            revisions: {},
            exhibits: '',
            coAuthors: []
        };
        localStorage.removeItem('wizard_in_progress');
        window.setView('dashboard');
    }
};

// IMPROVED: Better wizard-constitution integration
window.openConstitutionForWizard = () => {
    // Save wizard state to localStorage for recovery
    localStorage.setItem('wizard_in_progress', JSON.stringify({
        step: state.wizardStep,
        data: state.wizardData
    }));
    
    // Navigate to constitution
    window.setView('constitution');
};

// NEW: Return from constitution to wizard
window.returnToWizard = () => {
    const saved = localStorage.getItem('wizard_in_progress');
    if (saved) {
        try {
            const { step, data } = JSON.parse(saved);
            state.wizardStep = step;
            state.wizardData = data;
            window.setView('wizard');
        } catch (e) {
            console.error('Failed to recover wizard:', e);
            window.setView('wizard');
        }
    } else {
        window.setView('wizard');
    }
};

window.manualTextEntry = () => {
    const section = prompt('Section name (e.g., "Article III"):');
    if (!section) return;
    
    const text = prompt('Original text to change:');
    if (!text) return;
    
    state.wizardData.selectedText.push({ section, text });
    window.updateUI(true);
};

window.copyGitHubMarkdown = () => {
    const wizard = state.wizardData;

    // Pre-compute deliberation for CAP
    let deliberationEndStr = null;
    let deliberationExpiry = null;
    if (wizard.type === 'CAP') {
        const consultationDays = { Procedural: 60, Substantive: 60, Technical: 60, Interpretive: 30, Editorial: 14, Other: 30 };
        const days = consultationDays[wizard.category] || 30;
        deliberationExpiry = new Date(Date.now() + (days * 24 * 60 * 60 * 1000));
        deliberationEndStr = deliberationExpiry.toISOString().split('T')[0];
    }

    // Build CIP-style frontmatter (number/URL filled in manually after posting)
    const today = new Date().toISOString().split('T')[0];
    const authorLogin = state.ghUser?.login || 'your-github-username';
    const fm = buildFrontmatter(wizard.type, 'TBD', wizard.title || 'Your Title', wizard.category, authorLogin, wizard.coAuthors || [], 'TBD — add this issue\'s URL after posting', today, deliberationEndStr);

    let markdown = fm;
    markdown += `### Summary\n${wizard.abstract || 'Not provided'}\n\n`;

    if (wizard.type === 'CAP') {
        markdown += `### Why is this change needed?\n${wizard.motivation || 'Not provided'}\n\n`;
        markdown += `### Analysis & Test\n${wizard.analysis || 'Not provided'}\n\n`;
    } else {
        markdown += `### Problem\n${wizard.motivation || 'Not provided'}\n\n`;
        if (wizard.analysis) markdown += `### Context\n${wizard.analysis}\n\n`;
        if (wizard.impact) markdown += `### Impact\n${wizard.impact}\n\n`;
    }

    if (wizard.type === 'CAP' && wizard.selectedText && wizard.selectedText.length > 0) {
        markdown += `### Revisions\n\n`;
        wizard.selectedText.forEach((sel, idx) => {
            markdown += `#### Revision #${idx + 1}: ${sel.section || 'General'}\n`;
            markdown += `**Original Text:**\n> ${sel.text}\n\n`;
            markdown += `**Proposed Revision:**\n${wizard.revisions[idx] || 'Not provided'}\n\n`;
        });
    }

    markdown += `### Links and Files\n${wizard.exhibits || 'None provided.'}\n\n`;

    if (wizard.type === 'CAP') {
        markdown += `### Institutional Metadata\n- **License:** CC-BY-4.0\n- **Deliberation End:** ${deliberationExpiry.toLocaleDateString()}\n\n`;
        markdown += `<!-- DELIBERATION_END: ${deliberationExpiry.toISOString()} -->`;
    } else {
        markdown += `### Institutional Metadata\n- **License:** CC-BY-4.0\n`;
    }

    // Copy to clipboard
    navigator.clipboard.writeText(markdown).then(() => {
        window.showToast('Copied to Clipboard', 'Paste into a new GitHub Issue and add labels: ' + wizard.type + ', Draft, ' + wizard.category, 'success');
    }).catch(() => {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = markdown;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            window.showToast('Copied to Clipboard', 'Markdown copied successfully.', 'success');
        } catch (e) {
            prompt('Copy this markdown manually:', markdown);
        }
        document.body.removeChild(textarea);
    });
};

window.wizardSubmit = async () => {
    const wizard = state.wizardData;
    
    if (!confirm(`Submit this ${wizard.type} to GitHub?\n\nTitle: ${wizard.title}\nCategory: ${wizard.category}`)) {
        return;
    }
    
    // Map wizard data to existing draft format
    state.draft = {
        title: wizard.title,
        category: wizard.category,
        abstract: wizard.abstract,
        motivation: wizard.motivation,
        analysis: wizard.analysis || '',
        impact: wizard.impact || '',
        exhibits: wizard.exhibits,
        files: [],
        revisions: {},
        coAuthors: wizard.coAuthors || []
    };
    
    state.createType = wizard.type;
    
    // Map selected text to references format
    state.selectedReferences = wizard.selectedText.map((sel, idx) => ({
        id: `wizard-ref-${idx}`,
        text: sel.text,
        section: sel.section || 'General'
    }));
    
    // Map revisions to the draft format expected by handleForm
    wizard.selectedText.forEach((sel, idx) => {
        state.draft.revisions[`wizard-ref-${idx}`] = wizard.revisions[idx] || '';
    });
    
    // Use existing submission handler
    const mockEvent = { preventDefault: () => {} };
    
    try {
        await window.handleForm(mockEvent);
        
        // Success - reset wizard and go to registry
        if (!state.error) {
            localStorage.removeItem('wizard_in_progress');
            state.wizardStep = 1;
            state.wizardData = {
                type: 'CAP',
                category: '',
                title: '',
                abstract: '',
                motivation: '',
                analysis: '',
                selectedText: [],
                revisions: {},
                exhibits: '',
                coAuthors: []
            };
            window.setView('list');
            window.showToast('Submitted', wizard.type + ' submitted successfully.', 'success');
        }
    } catch (err) {
        window.showToast('Submission Failed', err.message || 'Unknown error', 'error');
    }
};

// --- Wizard Recovery (on page load) ---

// Check if there's a wizard session to recover
function checkWizardRecovery() {
    // Wizard recovery is handled by the return button in the constitution view
}

// Call on page ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkWizardRecovery);
} else {
    checkWizardRecovery();
}

// --- Lifecycle Initialization ---

(async () => {
    // Check for GitHub OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const oauthCode = urlParams.get('code');
    if (oauthCode) {
        // Remove code from URL immediately so it can't be replayed
        window.history.replaceState({}, document.title, window.location.pathname);

        // Show a warm-up notice in case the gatekeeper is cold-starting
        const warmupTimeout = setTimeout(() => {
            const root = document.getElementById('app');
            if (root && state.loading.init) {
                root.innerHTML = `
                    <div class="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950 gap-6">
                        <div class="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                        <p class="text-slate-500 font-bold uppercase tracking-widest text-xs">Warming up auth server…</p>
                        <p class="text-slate-400 text-xs">This can take up to 30 seconds on a cold start.</p>
                    </div>`;
            }
        }, 2500);

        try {
            const res = await fetch(`${GATEKEEPER_URL}/authenticate/${oauthCode}`);
            const data = await res.json();
            if (data.access_token) {
                state.ghToken = data.access_token;
                localStorage.setItem('gh_token', data.access_token);
            }
        } catch (e) {
            console.error('OAuth exchange failed:', e);
        } finally {
            clearTimeout(warmupTimeout);
        }
    }

    // Token priority: env.js (dev) → localStorage (production)
    if (!state.ghToken) {
        state.ghToken = localStorage.getItem('gh_token') || null;
    }

    // Try to resolve user identity if we have a token
    if (state.ghToken) {
        try {
            state.ghUser = await ghFetch('/user', state.ghToken);
            const editorsList = await fetchEditors();
            const editors = editorsList.length > 0 ? editorsList : EDITORS_FALLBACK;
            state.isEditor = editors.includes(state.ghUser.login);
        } catch (e) {
            // Token is invalid — clear it, but still allow public browsing
            state.ghToken = null;
            localStorage.removeItem('gh_token');
        }
    }

    // Always route and render — public browsing works without login
    state.loading.init = false;
    window.handleRouting();
})();

window.onhashchange = window.handleRouting;
