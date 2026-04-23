/**
 * Detail Component
 * Displays a proposal with its discussion, timeline, and author controls.
 * Features:
 * - Timeline View: Expandable events showing activity history and automation logs.
 * - Countdown Timer: Real-time countdown for the 30-day review period.
 * - Comments: Full Markdown rendering for community discussion.
 * - Author Tools: Context-aware options for authors (Edit, Archive).
 */
export function renderDetail(state) {
    const p = state.currentProposal;
    if (!p || state.loading.detail) {
        return `
            <div class="flex items-center justify-center py-40">
                <div class="flex flex-col items-center gap-6">
                    <div class="w-16 h-16 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin"></div>
                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading proposal...</p>
                </div>
            </div>`;
    }

    const isAuthor = state.ghUser?.login === p.user.login;
    const isEditor = state.isEditor === true;
    const createdDate = new Date(p.created_at);
    const expiryDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000));
    const githubUrl = p.html_url;

    // --- Interaction Handlers ---
    
    /**
     * Toggles the expansion state of an audit trail entry.
     * Uses string conversion for ID safety with GitHub's alphanumeric identifiers.
     */
    window.toggleEventExpansion = (eventId) => {
        state.expandedEventId = state.expandedEventId == eventId ? null : eventId;
        if (window.updateUI) window.updateUI(true);
    };

    /**
     * Toggles between showing 5 most recent audit trail items and the full list.
     */
    window.toggleAuditTrail = () => {
        state.auditTrailExpanded = !state.auditTrailExpanded;
        if (window.updateUI) window.updateUI(true);
    };

    /**
     * Manages the high-frequency UI updates for the deliberation clock.
     */
    if (window.detailTimerInterval) clearInterval(window.detailTimerInterval);
    window.detailTimerInterval = setInterval(() => {
        const timerEl = document.getElementById('deliberation-clock');
        if (timerEl) {
            timerEl.innerHTML = getTimerHTML(expiryDate, p.state);
        } else {
            clearInterval(window.detailTimerInterval);
        }
    }, 1000);
    
    return `
        <div class="max-w-7xl mx-auto pb-20 fade-in text-left">
            <!-- Navigation Header -->
            <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
                <button onclick="window.setView('list')" class="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">
                    <i data-lucide="arrow-left" class="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i>
                    Back to Registry
                </button>
                
                <a href="${githubUrl}" target="_blank" rel="noopener noreferrer" 
                    class="flex items-center gap-3 px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm text-slate-900 dark:text-white">
                    <i data-lucide="github" class="w-4 h-4 text-blue-600"></i>
                    Open in GitHub
                </a>
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-3 gap-16 items-start">
                
                <!-- Main Body: Document & Discussion -->
                <div class="lg:col-span-2 space-y-16">
                    <header class="space-y-8">
                        <div class="flex flex-wrap gap-3">
                            ${p.labels.filter(l => l.name !== 'author-ready').map(l => `
                                <span class="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
                                    ${l.name}
                                </span>
                            `).join('')}
                            ${p.labels.some(l => l.name === 'author-ready') ? `
                                <span class="flex items-center gap-1.5 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-800/50 text-green-700 dark:text-green-400">
                                    <i data-lucide="thumbs-up" class="w-3 h-3"></i>
                                    Author Ready
                                </span>
                            ` : ''}
                            ${p.state === 'closed' ? `
                                <span class="px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-950 text-white dark:bg-white dark:text-slate-950">
                                    Archived
                                </span>
                            ` : ''}
                        </div>
                        
                        <h1 class="text-6xl font-black tracking-tighter text-slate-900 dark:text-white leading-[1.1]">
                            ${p.title}
                        </h1>

                        <div class="flex items-center gap-8 text-slate-500 font-medium border-b border-slate-100 dark:border-slate-800 pb-10">
                            <div class="flex items-center gap-3">
                                <img src="${p.user.avatar_url}" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div class="flex flex-col">
                                    <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Author</span>
                                    <span class="text-sm font-bold text-slate-900 dark:text-slate-100">${p.user.login}</span>
                                </div>
                            </div>
                            <div class="w-px h-8 bg-slate-100 dark:bg-slate-800"></div>
                            <div class="flex flex-col">
                                <span class="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Submitted</span>
                                <span class="text-sm font-bold text-slate-900 dark:text-slate-100">${createdDate.toLocaleDateString()}</span>
                            </div>
                        </div>
                    </header>

                    <!-- Proposal Content -->
                    <article class="bg-white dark:bg-slate-900 p-10 sm:p-20 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none text-left leading-relaxed">
                        ${window.marked.parse(state.proposalMarkdown || 'No content provided.')}
                    </article>

                    <!-- Comments and Discussion -->
                    <section class="space-y-12 pt-16 border-t border-slate-100 dark:border-slate-800">
                        <div class="flex items-center justify-between px-4">
                            <h2 class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Discussion</h2>
                            <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">${state.comments.length} ${state.comments.length === 1 ? 'Comment' : 'Comments'}</span>
                        </div>
                        
                        <div class="space-y-8">
                            ${state.comments.length === 0 ? `
                                <div class="p-20 text-center border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem]">
                                    <p class="text-slate-400 font-bold uppercase tracking-widest text-xs">No comments yet.</p>
                                </div>
                            ` : state.comments.map(comment => `
                                <div class="flex gap-8 group">
                                    <img src="${comment.user.avatar_url}" class="w-14 h-14 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex-shrink-0 transition-transform group-hover:scale-105">
                                    <div class="flex-grow space-y-4">
                                        <div class="flex items-center gap-4">
                                            <span class="text-sm font-black text-slate-900 dark:text-white">${comment.user.login}</span>
                                            <span class="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">${new Date(comment.created_at).toLocaleString()}</span>
                                        </div>
                                        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm text-sm leading-relaxed prose dark:prose-invert max-w-none">
                                            ${window.marked.parse(comment.body)}
                                        </div>
                                    </div>
                                </div>
                            `).join('')}

                            <div class="pt-8 pl-0 sm:pl-20">
                                ${!state.ghToken ? `
                                <div class="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2rem] p-8 text-center">
                                    <p class="text-slate-500 font-bold mb-4">Login to join the discussion</p>
                                    <button onclick="window.loginWithGitHub()"
                                        class="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-xs font-black hover:scale-105 transition-all">
                                        <i data-lucide="github" class="w-4 h-4"></i> Login with GitHub
                                    </button>
                                </div>
                                ` : `
                                <form onsubmit="event.preventDefault(); window.postComment(this)" class="space-y-6">
                                    <!-- Markdown Formatting Toolbar -->
                                    <div class="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '**', '**', 'bold text')" title="Bold"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all" style="font-weight: bold;">
                                            B
                                        </button>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '*', '*', 'italic text')" title="Italic"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all" style="font-style: italic;">
                                            I
                                        </button>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '~~', '~~', 'strikethrough')" title="Strikethrough"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all" style="text-decoration: line-through;">
                                            S
                                        </button>
                                        <div class="w-px bg-slate-200 dark:bg-slate-700"></div>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '&#96;', '&#96;', 'code')" title="Inline code"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-mono hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                            &lt;&gt;
                                        </button>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '[', '](url)', 'link text')" title="Link"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                            🔗
                                        </button>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '### ', '', 'heading')" title="Heading"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                            H
                                        </button>
                                        <button type="button" onclick="window.insertMarkdown(document.querySelector('textarea[name=comment]'), '> ', '', 'quoted text')" title="Quote"
                                            class="px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                                            "
                                        </button>
                                    </div>
                                    <textarea name="comment" required placeholder="Share your thoughts..." 
                                        class="w-full bg-white dark:bg-slate-900 p-10 rounded-[3rem] min-h-[200px] font-medium text-lg outline-none border-2 border-slate-100 dark:border-slate-800 focus:border-blue-600 transition-all text-slate-900 dark:text-white shadow-sm resize-none"></textarea>
                                    <div class="flex justify-end">
                                        <button type="submit" ${state.loading.postComment ? 'disabled' : ''} 
                                            class="bg-slate-950 dark:bg-white text-white dark:text-slate-950 px-14 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em] hover:-translate-y-1 active:scale-95 transition-all shadow-2xl disabled:opacity-50">
                                            ${state.loading.postComment ? 'Posting...' : 'Post Comment'}
                                        </button>
                                    </div>
                                </form>
                                `}
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Right Column: Context, Audit & Admin -->
                <aside class="space-y-8 sticky top-12">
                    
                    <!-- Cycle Progress Clock -->
                    <div id="deliberation-clock">
                        ${getTimerHTML(expiryDate, p.state)}
                    </div>

                    <!-- Interactive Audit Trail -->
                    <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div class="flex items-center justify-between mb-10">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Audit Trail</h3>
                            <div class="flex gap-1">
                                <span class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                            </div>
                        </div>

                        ${(() => {
                            const AUDIT_LIMIT = 5;
                            const allEvents = state.proposalEvents || [];
                            const isExpanded = state.auditTrailExpanded;
                            const visibleEvents = isExpanded ? allEvents : allEvents.slice(0, AUDIT_LIMIT);
                            const hasMore = allEvents.length > AUDIT_LIMIT;

                            return `
                            <div class="space-y-6 relative">
                                <!-- Timeline connector line -->
                                <div class="absolute left-[13px] top-2 bottom-2 w-[2px] bg-slate-100 dark:bg-slate-800"></div>

                                ${visibleEvents.map(event => {
                                    const details = getEventDetails(event);
                                    const isEventExpanded = state.expandedEventId == event.id;
                                    const isBot = event.actor?.login?.includes('bot') || event.actor?.login?.includes('actions');

                                    return `
                                        <div class="flex gap-5 relative z-10">
                                            <!-- Actor Avatar -->
                                            <div class="relative cursor-pointer transition-transform hover:scale-110" onclick="window.toggleEventExpansion('${event.id}')">
                                                <img src="${event.actor?.avatar_url || 'https://github.com/identicons/jasonlong.png'}"
                                                     class="w-7 h-7 rounded-lg border-2 border-white dark:border-slate-900 shadow-sm relative z-20">
                                                <div class="absolute -right-1.5 -bottom-1.5 w-4 h-4 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center z-30 shadow-sm">
                                                    <i data-lucide="${details.icon}" class="w-2 h-2 ${details.color}"></i>
                                                </div>
                                            </div>

                                            <!-- Event Body -->
                                            <div class="flex-grow pt-0.5">
                                                <div class="flex items-center justify-between mb-1 cursor-pointer" onclick="window.toggleEventExpansion('${event.id}')">
                                                    <p class="text-[10px] font-black ${isBot ? 'text-blue-600' : 'text-slate-900 dark:text-white'} uppercase leading-none">
                                                        ${event.actor?.login || 'Governance Bot'}
                                                    </p>
                                                    <span class="text-[8px] text-slate-400 font-bold uppercase tracking-tighter">
                                                        ${new Date(event.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>

                                                <div class="text-[10px] text-slate-500 font-medium leading-relaxed bg-slate-50/50 dark:bg-slate-950/50 p-4 rounded-2xl border transition-all cursor-pointer hover:bg-slate-100/50 dark:hover:bg-slate-800/50 ${isEventExpanded ? 'border-blue-300 bg-blue-50/20 dark:border-blue-900/40 shadow-inner' : 'border-slate-100/50 dark:border-slate-800/50'}"
                                                     onclick="window.toggleEventExpansion('${event.id}')">

                                                    <span class="${isEventExpanded ? 'font-bold text-slate-900 dark:text-white' : ''}">
                                                        ${details.message}
                                                    </span>

                                                    ${isEventExpanded ? `
                                                        <div class="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-1">
                                                            <div class="space-y-3">
                                                                <span class="text-[8px] font-black uppercase text-slate-400 tracking-[0.2em]">Details</span>
                                                                <div class="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800 prose dark:prose-invert prose-sm max-w-none text-[11px] leading-relaxed break-words shadow-sm">
                                                                    ${window.marked.parse(details.fullDescription || details.message)}
                                                                </div>
                                                            </div>

                                                            <div class="flex items-center justify-between pt-2">
                                                                <div class="flex flex-col">
                                                                    <span class="text-[7px] font-black uppercase text-slate-400">TX Signature</span>
                                                                    <span class="text-[8px] font-mono text-blue-600 uppercase tracking-tighter">
                                                                        EVT-${event.id.toString().substring(0, 12)}
                                                                    </span>
                                                                </div>
                                                                <a href="${details.extUrl || event.html_url}" target="_blank" class="px-4 py-2 bg-slate-950 dark:bg-white text-white dark:text-slate-950 rounded-lg text-[8px] font-black uppercase tracking-widest hover:opacity-80 transition-opacity flex items-center gap-2">
                                                                    <i data-lucide="external-link" class="w-2.5 h-2.5"></i> Verification
                                                                </a>
                                                            </div>
                                                        </div>
                                                    ` : ''}
                                                </div>
                                            </div>
                                        </div>
                                    `;
                                }).join('')}
                            </div>

                            ${hasMore ? `
                            <button onclick="window.toggleAuditTrail()"
                                class="mt-6 w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all">
                                <i data-lucide="${isExpanded ? 'chevron-up' : 'chevron-down'}" class="w-3.5 h-3.5"></i>
                                ${isExpanded ? 'Show less' : `Show all ${allEvents.length} events`}
                            </button>
                            ` : ''}
                            `;
                        })()}
                    </div>

                    <!-- Author Administration Card -->
                    ${isAuthor ? (() => {
                        const lifecycleLabels = ['consultation','ready','done','withdrawn'];
                        const currentStage = p.labels.map(l => l.name).find(n => lifecycleLabels.includes(n)) || null;
                        const editorOkNow = p.labels.some(l => l.name === 'editor-ok');
                        const editorOkEver = state.proposalEvents?.some(e => e.event === 'labeled' && e.label?.name === 'editor-ok') || false;
                        const editorConcernNow = p.labels.some(l => l.name === 'editor-concern');
                        const authorReadyNow = p.labels.some(l => l.name === 'author-ready');
                        const isActive = currentStage === 'consultation' || currentStage === 'ready';

                        // Context-sensitive signal text
                        const signalText = currentStage === 'consultation' ? 'Signal Ready for Review Board'
                                         : currentStage === 'ready'        ? 'Signal Ready for Completion'
                                         : null;

                        // Editor review status badge
                        const reviewStatus = editorOkNow
                            ? { icon: 'check-circle', text: 'Editor approved',       cls: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800/40' }
                            : editorConcernNow
                            ? { icon: 'alert-circle', text: 'Editor has concerns',   cls: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800/40' }
                            : editorOkEver
                            ? { icon: 'check-circle', text: 'Editor approved (previously)', cls: 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700' }
                            : { icon: 'clock',        text: 'No editor review yet',  cls: 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/40' };

                        return `
                        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-blue-100 dark:border-blue-900/20 shadow-xl space-y-6">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Author Controls</h3>

                            <!-- Editor Review Status -->
                            <div class="flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-[10px] font-bold ${reviewStatus.cls}">
                                <i data-lucide="${reviewStatus.icon}" class="w-3.5 h-3.5 flex-shrink-0"></i>
                                <span>${reviewStatus.text}</span>
                            </div>

                            <div class="space-y-3">
                                <!-- Author Ready Signal — only when in an actionable stage -->
                                ${signalText ? `
                                <button onclick="window.authorSignalReady()"
                                    class="w-full flex items-center justify-between p-5 rounded-2xl transition-all group border ${
                                        authorReadyNow
                                        ? 'bg-green-600 border-green-600'
                                        : 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/20'
                                    }">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="${authorReadyNow ? 'check-circle' : 'thumbs-up'}" class="w-4 h-4 ${authorReadyNow ? 'text-white' : 'text-green-600'}"></i>
                                        <div>
                                            <span class="text-xs font-bold ${authorReadyNow ? 'text-white' : 'text-green-700 dark:text-green-300'} block">${authorReadyNow ? '✓ Ready Signal Active' : signalText}</span>
                                            <span class="text-[9px] ${authorReadyNow ? 'text-green-100' : 'text-green-500'}">
                                                ${authorReadyNow ? 'Click to withdraw your signal' : 'Advisory — editor still confirms the move'}
                                            </span>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 ${authorReadyNow ? 'text-green-200' : 'text-green-300'} group-hover:translate-x-1 transition-transform"></i>
                                </button>
                                ` : ''}

                                ${isActive ? `
                                <button onclick="window.startEdit()" class="w-full flex items-center justify-between p-5 rounded-2xl bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all group">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="edit-3" class="w-4 h-4 text-blue-600"></i>
                                        <span class="text-xs font-bold text-blue-600">Edit Proposal</span>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-blue-300 group-hover:translate-x-1 transition-transform"></i>
                                </button>
                                ` : ''}

                                <button onclick="window.authorWithdraw()" class="w-full flex items-center justify-between p-5 rounded-2xl bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group border border-slate-100 dark:border-slate-800">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="x-circle" class="w-4 h-4 text-slate-400 group-hover:text-slate-900 transition-colors"></i>
                                        <div>
                                            <span class="text-xs font-bold text-slate-600 dark:text-slate-400 block">Withdraw Proposal</span>
                                            <span class="text-[9px] text-slate-400">Closes and marks as withdrawn</span>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-slate-300"></i>
                                </button>

                                <button onclick="window.deleteProposal(${p.number})" class="w-full flex items-center justify-between p-5 rounded-2xl bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 transition-all group border border-red-100/50 dark:border-red-900/20">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="trash-2" class="w-4 h-4 text-red-500"></i>
                                        <span class="text-xs font-bold text-red-600">Delete</span>
                                    </div>
                                    <i data-lucide="alert-triangle" class="w-4 h-4 text-red-300"></i>
                                </button>
                            </div>

                            <p class="text-[9px] text-slate-400 leading-relaxed">
                                Editors control lifecycle stage progression. Your ready signal is advisory — the editor still confirms the move. All actions are permanently recorded in the audit trail.
                            </p>
                        </div>`;
                    })() : ''}

                    ${isEditor ? (() => {
                        const labels = p.labels.map(l => l.name);
                        const currentLifecycle = ['consultation','ready','done','withdrawn'].find(s => labels.includes(s)) || null;
                        const currentSignal = ['editor-ok','editor-concern','editor-suggested'].find(s => labels.includes(s)) || null;

                        const lifecycleConfig = {
                            'consultation': { color: 'purple',  icon: 'messages-square', label: 'Consultation' },
                            'ready':        { color: 'green',   icon: 'check-circle',    label: 'Ready' },
                            'done':         { color: 'emerald', icon: 'archive',          label: 'Done' },
                            'withdrawn':    { color: 'red',     icon: 'x-circle',         label: 'Withdrawn' },
                        };

                        // Context-sensitive status tags
                        const statusTagConfig = {
                            'review':     { color: 'amber',  icon: 'search',       label: 'Review',     stages: null },            // always
                            'revision':   { color: 'orange', icon: 'pencil',       label: 'Revision',   stages: ['consultation'] },
                            'finalizing': { color: 'cyan',   icon: 'check-square', label: 'Finalizing', stages: ['consultation'] },
                            'onchain':    { color: 'indigo', icon: 'link',         label: 'On-Chain',   stages: ['ready'] },
                        };

                        const signalConfig = {
                            'editor-ok':       { color: 'green',  icon: 'check-circle', label: 'OK' },
                            'editor-concern':   { color: 'red',    icon: 'alert-circle',  label: 'Concern' },
                            'editor-suggested': { color: 'amber',  icon: 'lightbulb',     label: 'Suggested' },
                        };
                        const specialConfig = {
                            'pause':      { color: 'slate', icon: 'pause-circle',  label: 'Pause' },
                            'fast-track': { color: 'green', icon: 'zap',           label: 'Fast-Track' },
                            'bundle':     { color: 'blue',  icon: 'layers',        label: 'Bundle' },
                            'minor':      { color: 'slate', icon: 'minus-circle',  label: 'Minor' },
                            'major':      { color: 'red',   icon: 'alert-triangle',label: 'Major' },
                        };

                        // Which status tags are available given the current stage
                        const availableStatusTags = Object.entries(statusTagConfig).filter(([, cfg]) =>
                            cfg.stages === null || (currentLifecycle && cfg.stages.includes(currentLifecycle))
                        );

                        // Forward-only single step: consultation→ready, ready→done
                        const editorNextStage = currentLifecycle === 'consultation' ? 'ready'
                                              : currentLifecycle === 'ready'        ? 'done'
                                              : null;
                        const nextCfg = editorNextStage ? lifecycleConfig[editorNextStage] : null;
                        const curCfg  = currentLifecycle ? lifecycleConfig[currentLifecycle] : null;
                        const authorReadyNow = labels.includes('author-ready');

                        return `
                        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-amber-100 dark:border-amber-900/20 shadow-xl space-y-8">
                            <h3 class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 flex items-center gap-2">
                                <i data-lucide="shield" class="w-3.5 h-3.5"></i> Editor Controls
                            </h3>

                            <!-- Lifecycle Stage -->
                            <div class="space-y-3">
                                <p class="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Lifecycle Stage</p>

                                <!-- Current stage badge -->
                                ${curCfg ? `
                                <div class="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-${curCfg.color}-50 dark:bg-${curCfg.color}-900/10 border border-${curCfg.color}-200 dark:border-${curCfg.color}-900/30 text-[10px] font-bold text-${curCfg.color}-700 dark:text-${curCfg.color}-300 uppercase tracking-wider">
                                    <i data-lucide="${curCfg.icon}" class="w-3.5 h-3.5 flex-shrink-0"></i>
                                    ${curCfg.label}
                                </div>
                                ` : ''}

                                ${nextCfg ? `
                                <!-- Author ready signal indicator -->
                                ${authorReadyNow ? `
                                <div class="flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/40 text-[10px] font-bold text-green-700 dark:text-green-400">
                                    <i data-lucide="thumbs-up" class="w-3.5 h-3.5 flex-shrink-0"></i>
                                    Author has signalled ready to advance
                                </div>
                                ` : ''}

                                <!-- Single forward transition button -->
                                <button onclick="window.editorSetLifecycle('${editorNextStage}')"
                                    class="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border bg-${nextCfg.color}-50 dark:bg-${nextCfg.color}-900/10 border-${nextCfg.color}-200 dark:border-${nextCfg.color}-900/30 hover:bg-${nextCfg.color}-100 dark:hover:bg-${nextCfg.color}-900/20 transition-all group">
                                    <div class="flex items-center gap-3">
                                        <i data-lucide="arrow-right-circle" class="w-4 h-4 text-${nextCfg.color}-600 flex-shrink-0"></i>
                                        <div>
                                            <span class="text-[10px] font-bold text-${nextCfg.color}-700 dark:text-${nextCfg.color}-300 uppercase tracking-wider block">Move to ${nextCfg.label}</span>
                                            <span class="text-[9px] text-${nextCfg.color}-500 dark:text-${nextCfg.color}-400">Permanently recorded in audit trail</span>
                                        </div>
                                    </div>
                                    <i data-lucide="chevron-right" class="w-4 h-4 text-${nextCfg.color}-300 group-hover:translate-x-1 transition-transform"></i>
                                </button>
                                ` : `
                                <p class="text-[10px] text-slate-400 italic">No further lifecycle transitions from this stage.</p>
                                `}
                            </div>

                            <!-- Status Tags (context-sensitive) -->
                            <div class="space-y-3">
                                <p class="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Status Tags <span class="text-slate-300 font-normal">(toggles)</span></p>
                                ${availableStatusTags.length === 0 ? `
                                <p class="text-[10px] text-slate-400 italic">No status tags available for this stage.</p>
                                ` : `
                                <div class="flex flex-wrap gap-2">
                                    ${availableStatusTags.map(([lbl, cfg]) => {
                                        const isActive = labels.includes(lbl);
                                        const activeCls = isActive
                                            ? `bg-${cfg.color}-600 text-white border-${cfg.color}-600`
                                            : `bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-${cfg.color}-400 hover:text-${cfg.color}-600`;
                                        return `<button onclick="window.editorToggleStatusTag('${lbl}')"
                                            class="flex items-center gap-2 px-3 py-2.5 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${activeCls}">
                                            <i data-lucide="${cfg.icon}" class="w-3 h-3 flex-shrink-0"></i>
                                            ${cfg.label}
                                        </button>`;
                                    }).join('')}
                                </div>`}
                            </div>

                            <!-- Editor Signals -->
                            <div class="space-y-3">
                                <p class="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Editor Signal <span class="text-slate-300 font-normal">(pick one)</span></p>
                                <div class="flex flex-col gap-2">
                                    ${Object.entries(signalConfig).map(([lbl, cfg]) => {
                                        const isActive = currentSignal === lbl;
                                        const activeCls = isActive
                                            ? `bg-${cfg.color}-600 text-white border-${cfg.color}-600`
                                            : `bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-${cfg.color}-400 hover:text-${cfg.color}-600`;
                                        return `<button onclick="window.editorToggleSignal('${lbl}')"
                                            class="flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${activeCls}">
                                            <i data-lucide="${cfg.icon}" class="w-3.5 h-3.5 flex-shrink-0"></i>
                                            ${cfg.label}
                                        </button>`;
                                    }).join('')}
                                </div>
                            </div>

                            <!-- Special Handling -->
                            <div class="space-y-3">
                                <p class="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">Special Handling <span class="text-slate-300 font-normal">(toggles)</span></p>
                                <div class="flex flex-wrap gap-2">
                                    ${Object.entries(specialConfig).map(([lbl, cfg]) => {
                                        const isActive = labels.includes(lbl);
                                        const activeCls = isActive
                                            ? `bg-${cfg.color}-600 text-white border-${cfg.color}-600`
                                            : `bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-${cfg.color}-400 hover:text-${cfg.color}-600`;
                                        return `<button onclick="window.editorToggleSpecial('${lbl}')"
                                            class="flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider transition-all ${activeCls}">
                                            <i data-lucide="${cfg.icon}" class="w-3 h-3 flex-shrink-0"></i>
                                            ${cfg.label}
                                        </button>`;
                                    }).join('')}
                                </div>
                            </div>
                        </div>`;
                    })() : ''}
                </aside>
            </div>
        </div>`;
}

/**
 * Event Detail Parser
 * Converts GitHub events into readable activity summaries.
 * Interprets automation success messages and deployment logs.
 */
function getEventDetails(event) {
    const type = event.event;
    let details = {
        icon: 'activity',
        color: 'text-slate-400',
        message: type.replace(/_/g, ' '),
        fullDescription: '',
        extUrl: ''
    };

    const lifecycleLabels = ['consultation','ready','done','withdrawn'];
    const statusTagLabels = ['review','revision','finalizing','onchain'];
    const authorSignalLabels = ['author-ready'];
    const editorSignalLabels = ['editor-ok','editor-concern','editor-suggested'];

    switch (type) {
        case 'labeled': {
            const label = event.label?.name;
            if (lifecycleLabels.includes(label)) {
                details.icon = 'arrow-right-circle';
                details.color = 'text-blue-600';
                details.message = `Stage → <span class="font-black text-blue-600 uppercase">${label}</span>`;
                details.fullDescription = `This proposal was moved to the **"${label}"** stage by **${event.actor?.login || 'unknown'}**.`;
            } else if (statusTagLabels.includes(label)) {
                details.icon = 'tag';
                details.color = 'text-purple-500';
                details.message = `Status Tag Added: <span class="font-bold text-purple-600 uppercase">${label}</span>`;
                details.fullDescription = `The status tag **"${label}"** was added by **${event.actor?.login || 'unknown'}**.`;
            } else if (authorSignalLabels.includes(label)) {
                details.icon = 'thumbs-up';
                details.color = 'text-green-600';
                details.message = `Author Signalled: <span class="font-bold text-green-600">Ready to Advance</span>`;
                details.fullDescription = `**${event.actor?.login || 'The author'}** signalled that they are ready for the proposal to advance to the next stage.`;
            } else if (editorSignalLabels.includes(label)) {
                const sigConf = {
                    'editor-ok':        { icon: 'check-circle', color: 'text-green-600', msg: 'Editor Review: ✅ Approved' },
                    'editor-concern':   { icon: 'alert-circle',  color: 'text-red-500',   msg: 'Editor Review: ⚠️ Concern Raised' },
                    'editor-suggested': { icon: 'lightbulb',     color: 'text-amber-500', msg: 'Editor Review: 💡 Revision Suggested' },
                };
                const sc = sigConf[label];
                details.icon = sc.icon;
                details.color = sc.color;
                details.message = sc.msg;
                details.fullDescription = `**${event.actor?.login || 'An editor'}** applied the **"${label}"** signal to this proposal.`;
            } else {
                details.icon = 'tag';
                details.color = 'text-slate-500';
                details.message = `Label Added: <span class="font-bold">${label}</span>`;
                details.fullDescription = `The label **"${label}"** was applied by **${event.actor?.login || 'unknown'}**.`;
            }
            break;
        }

        case 'unlabeled': {
            const label = event.label?.name;
            if (lifecycleLabels.includes(label)) {
                details.icon = 'minus-circle';
                details.color = 'text-slate-400';
                details.message = `Stage Label Removed: <span class="font-bold text-slate-500">${label}</span>`;
                details.fullDescription = `The **"${label}"** stage label was removed by **${event.actor?.login || 'unknown'}**. This typically happens when the proposal is moved to a different stage.`;
            } else if (statusTagLabels.includes(label)) {
                details.icon = 'x';
                details.color = 'text-purple-400';
                details.message = `Status Tag Removed: <span class="font-bold">${label}</span>`;
                details.fullDescription = `The status tag **"${label}"** was removed by **${event.actor?.login || 'unknown'}**.`;
            } else if (authorSignalLabels.includes(label)) {
                details.icon = 'thumbs-down';
                details.color = 'text-slate-400';
                details.message = `Author Withdrew Ready Signal`;
                details.fullDescription = `**${event.actor?.login || 'The author'}** withdrew their ready-to-advance signal.`;
            } else if (editorSignalLabels.includes(label)) {
                details.icon = 'x-circle';
                details.color = 'text-orange-400';
                details.message = `Editor Signal Cleared: <span class="font-bold">${label}</span>`;
                details.fullDescription = `The editor signal **"${label}"** was removed by **${event.actor?.login || 'unknown'}**.`;
            } else {
                details.icon = 'x';
                details.color = 'text-slate-400';
                details.message = `Label Removed: <span class="font-bold">${label}</span>`;
                details.fullDescription = `The label **"${label}"** was removed by **${event.actor?.login || 'unknown'}**.`;
            }
            break;
        }

        case 'commented':
            const body = event.comment?.body || '';
            const isAutomation = body.includes('Success') || body.includes('Automation') || body.includes('Path:');
            details.icon = isAutomation ? 'check-circle' : 'message-square';
            details.color = isAutomation ? 'text-emerald-500' : 'text-slate-400';
            details.message = isAutomation ? '✅ Automation Success' : 'New Comment';
            details.fullDescription = body; 
            break;

        case 'cross-referenced':
            details.icon = 'link-2';
            details.color = 'text-blue-600';
            const source = event.source?.issue || event.source?.pull_request;
            const sourceBody = source?.body || '';
            const sourceIsAutomation = sourceBody.includes('Success') || sourceBody.includes('Path:');
            
            if (sourceIsAutomation) {
                details.message = '✅ Automation: Update Complete';
                details.fullDescription = sourceBody;
                details.icon = 'check-circle';
                details.color = 'text-emerald-500';
            } else {
                details.message = `Linked from Another Proposal`;
                details.fullDescription = source 
                    ? `**Reference from #${source.number}:** ${source.title}\n\n[View the related proposal](${source.html_url})\n\nThis proposal is mentioned or referenced elsewhere.`
                    : `This proposal has been linked to other related proposals.`;
            }
            if (source?.html_url) details.extUrl = source.html_url;
            break;

        case 'renamed':
            details.icon = 'type';
            details.color = 'text-blue-400';
            details.message = `Title Updated`;
            details.fullDescription = `**Original Title:**\n> ${event.rename.from}\n\n**New Title:**\n> ${event.rename.to}`;
            break;

        case 'closed':
            details.icon = 'archive';
            details.color = 'text-slate-900 dark:text-white';
            details.message = 'Closed';
            details.fullDescription = 'This proposal has been archived and is no longer open for discussion. It is part of the permanent record.';
            break;

        case 'locked':
            details.icon = 'shield-check';
            details.color = 'text-red-600';
            details.message = 'Locked';
            details.fullDescription = 'This proposal has been locked. No further comments, edits, or title changes can be made.';
            break;
            
        case 'milestoned':
            details.icon = 'flag';
            details.color = 'text-emerald-600';
            details.message = `Added to Milestone: ${event.milestone?.title}`;
            details.fullDescription = `This entry is now tracking toward the objective: **${event.milestone?.title}**.`;
            break;
    }

    return details;
}

/**
 * Timer Renderer
 * Displays a countdown for the review period or shows completion status.
 */
function getTimerHTML(expiryDate, issueState) {
    const diff = expiryDate - new Date();
    const isExpired = diff <= 0 || issueState === 'closed';

    const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
    const hours = Math.max(0, Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    const minutes = Math.max(0, Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)));
    const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

    return `
        <div class="${issueState === 'closed' ? 'bg-slate-950 dark:bg-slate-800 shadow-inner' : 'bg-blue-600 shadow-2xl'} p-10 rounded-[3rem] text-white relative overflow-hidden transition-all">
            <div class="absolute -right-4 -top-4 opacity-10">
                <i data-lucide="clock" class="w-24 h-24"></i>
            </div>
            
            <div class="flex items-center gap-3 mb-8 relative z-10">
                <i data-lucide="timer" class="w-4 h-4 opacity-50"></i>
                <h3 class="text-[10px] font-black uppercase tracking-[0.4em] opacity-80">Review Period</h3>
            </div>
            
            ${isExpired ? `
                <div class="relative z-10 py-2">
                    <p class="text-4xl font-black italic tracking-tighter uppercase">COMPLETE</p>
                    <div class="w-12 h-1 bg-white/20 my-4 rounded-full"></div>
                    <p class="text-[9px] font-bold opacity-60 uppercase tracking-widest leading-relaxed">The 30-day review period has ended.</p>
                </div>
            ` : `
                <div class="grid grid-cols-4 gap-4 items-end relative z-10">
                    <div><p class="text-4xl font-black italic tracking-tighter">${days}</p><p class="text-[7px] font-black uppercase opacity-50 mt-1 tracking-widest">Days</p></div>
                    <div><p class="text-4xl font-black italic tracking-tighter">${hours}</p><p class="text-[7px] font-black uppercase opacity-50 mt-1 tracking-widest">Hrs</p></div>
                    <div><p class="text-4xl font-black italic tracking-tighter">${minutes}</p><p class="text-[7px] font-black uppercase opacity-50 mt-1 tracking-widest">Min</p></div>
                    <div class="text-blue-200"><p class="text-4xl font-black italic tracking-tighter">${seconds}</p><p class="text-[7px] font-black uppercase opacity-50 mt-1 tracking-widest">Sec</p></div>
                </div>
            `}
        </div>`;
}