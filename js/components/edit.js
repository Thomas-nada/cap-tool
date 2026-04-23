/**
 * Helper to render a consistent formatting toolbar for any textarea.
 * Maps to window.applyMarkdown in app.js.
 */
function renderToolbar(targetId) {
    const tools = [
        { id: 'bold', icon: 'bold', label: 'Bold' },
        { id: 'italic', icon: 'italic', label: 'Italic' },
        { id: 'heading', icon: 'heading', label: 'H3' },
        { id: 'list', icon: 'list', label: 'Bullets' },
        { id: 'numlist', icon: 'list-ordered', label: 'Numbered' },
        { id: 'link', icon: 'link', label: 'Link' }
    ];

    return `
        <div class="flex items-center gap-1 p-2 bg-slate-100 dark:bg-slate-800/50 rounded-2xl mb-2 w-fit border border-slate-200/50 dark:border-slate-700/50">
            ${tools.map(t => `
                <button type="button" onclick="window.applyMarkdown('${targetId}', '${t.id}')" 
                    class="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-all text-slate-500 hover:text-blue-600 focus:outline-none" title="${t.label}">
                    <i data-lucide="${t.icon}" class="w-4 h-4"></i>
                </button>
            `).join('')}
        </div>`;
}

/**
 * Edit Component
 * Allows authors to modify existing CAPs or CISs.
 * Mirrors the intake structure used in the creation component.
 */
export function renderEdit(state) {
    const p = state.currentProposal;
    if (!p) return '';

    const isCIS = p.labels.some(l => l.name === 'CIS');
    const type = isCIS ? 'CIS' : 'CAP';
    
    // Extraction helper to pull content from Markdown headers
    const getSection = (header) => {
        // Escaping backslashes for the RegExp constructor
        const regex = new RegExp(`### ${header}\\n([\\s\\S]*?)(?=\\n### |$)`, 'i');
        const match = p.body?.match(regex);
        return match ? match[1].trim() : '';
    };

    const categories = [
        {
            id: 'Procedural',
            label: 'Procedural',
            desc: 'Changes a governance procedure or process step within the Constitution.',
            consultation: '60 days'
        },
        {
            id: 'Substantive',
            label: 'Substantive',
            desc: 'Alters the foundational values of the Constitution — adding or modifying a principle, tenet, or core commitment.',
            consultation: '60 days'
        },
        {
            id: 'Technical',
            label: 'Technical',
            desc: 'Updates on-chain technical or economic validation scripts and guardrail parameters. Consultation time may vary based on related parameter dependencies.',
            consultation: 'Variable'
        },
        {
            id: 'Interpretive',
            label: 'Interpretive',
            desc: 'Clarifies or refines existing language to reduce ambiguity, without changing the underlying intent or principle.',
            consultation: '30 days'
        },
        {
            id: 'Editorial',
            label: 'Editorial',
            desc: 'Purely cosmetic fixes: typos, formatting, grammar, or broken cross-references. No substantive change to meaning.',
            consultation: '14 days'
        },
        {
            id: 'Other',
            label: 'Other',
            desc: 'Doesn\'t fit neatly into the above categories. Editors will assess and recommend an appropriate consultation period.',
            consultation: '30 days'
        }
    ];

    const currentCatLabel = p.labels.find(l => categories.some(c => c.id === l.name))?.name || '';

    return `
        <div class="max-w-4xl mx-auto pb-20 text-left fade-in">
            <!-- Header Section -->
            <header class="mb-16">
                <button onclick="window.setView('detail')" class="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors mb-6 font-bold uppercase text-xs tracking-widest">
                    <i data-lucide="arrow-left" class="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i>
                    Discard Changes
                </button>
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <i data-lucide="edit-3" class="w-6 h-6"></i>
                    </div>
                    <h1 class="text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">Edit</h1>
                </div>
                <p class="text-slate-500 text-xl font-medium">Modifying <span class="text-blue-600 font-bold">${type} #${p.number}</span>.</p>
            </header>

            ${state.activeSuggestionRef ? `
            <div class="mb-10 p-6 rounded-[2rem] border-2 border-violet-200 dark:border-violet-800/40 bg-violet-50 dark:bg-violet-900/10 space-y-4">
                <div class="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                    <i data-lucide="message-square-plus" class="w-4 h-4 flex-shrink-0"></i>
                    <span class="text-xs font-black uppercase tracking-wider">Editor's Suggestion — Reference</span>
                    <span class="ml-auto text-[10px] text-violet-400 font-bold">Apply the changes below using this as a guide</span>
                </div>
                <div class="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 rounded-xl p-5 border border-violet-100 dark:border-violet-900/30 leading-relaxed prose dark:prose-invert max-w-none max-h-56 overflow-y-auto">
                    ${window.marked ? window.marked.parse(state.activeSuggestionRef.text) : state.activeSuggestionRef.text}
                </div>
            </div>
            ` : ''}

            <form onsubmit="window.handleEdit(event)" class="space-y-12">
                
                <!-- Section 1: Classification & Core Meta -->
                <div class="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-10">
                    <div class="space-y-10">
                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 ml-4">Title</label>
                            <input name="title" required value="${p.title}"
                                class="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl text-2xl font-black outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">
                        </div>

                        <div class="space-y-6">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Category</label>
                            <div class="relative">
                                <select id="category-select" name="category" required
                                    onchange="var o=this.options[this.selectedIndex]; document.getElementById('cat-desc').innerHTML=o.dataset.desc+'<span class=&quot;block mt-2 font-black not-italic text-blue-600&quot;>Recommended consultation time: '+o.dataset.consultation+'</span>';"
                                    class="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl font-bold outline-none border-2 border-transparent focus:border-blue-600 appearance-none text-slate-900 dark:text-white cursor-pointer">
                                    ${categories.map(c => `<option value="${c.id}" data-desc="${c.desc}" data-consultation="${c.consultation}" ${currentCatLabel === c.id ? 'selected' : ''}>${c.label}</option>`).join('')}
                                </select>
                                <i data-lucide="chevron-down" class="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none"></i>
                            </div>
                            <div class="mx-4 p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                <p id="cat-desc" class="text-xs font-medium text-slate-400 italic leading-relaxed">
                                    ${currentCatLabel ? (() => { const c = categories.find(c => c.id === currentCatLabel); return c ? `${c.desc}<span class="block mt-2 font-black not-italic text-blue-600">Recommended consultation time: ${c.consultation}</span>` : 'Select a category to see its description.'; })() : 'Select a category to see its description.'}
                                </p>
                            </div>
                        </div>

                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Summary</label>
                            ${renderToolbar('edit-abstract')}
                            <textarea name="abstract" id="edit-abstract" required
                                class="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl min-h-[120px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white resize-none">${getSection('Summary') || getSection('Abstract')}</textarea>
                        </div>
                    </div>
                </div>

                <!-- Section 2: Revisions Block -->
                <div class="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-8 bg-blue-600 rounded-full"></div>
                        <h2 class="text-xs font-black uppercase tracking-[0.3em] text-slate-400">Structured Revisions</h2>
                    </div>
                    <p class="text-xs font-bold text-slate-400 px-4 mb-4">Modify the combined contextual revision block below.</p>
                    ${renderToolbar('edit-revisions')}
                    <textarea name="revisions" id="edit-revisions" required 
                        class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-[3rem] min-h-[300px] font-mono text-sm outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white shadow-inner">${getSection('Structured Revisions (Contextual)')}</textarea>
                </div>

                <!-- Section 3: Why? / Motivation & Assets -->
                <div class="bg-white dark:bg-slate-900 p-10 sm:p-14 rounded-[4rem] border border-slate-100 dark:border-slate-800 shadow-sm space-y-12">
                    ${isCIS ? `
                    <div class="space-y-8">
                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Problem</label>
                            <p class="text-[10px] text-slate-400 ml-4">What specific constitutional issue have you identified?</p>
                            ${renderToolbar('edit-motivation')}
                            <textarea name="motivation" id="edit-motivation" required
                                class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl min-h-[160px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">${getSection('Problem') || getSection('Statement of Problem')}</textarea>
                        </div>
                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Context</label>
                            <p class="text-[10px] text-slate-400 ml-4">Background and circumstances surrounding the issue.</p>
                            ${renderToolbar('edit-analysis')}
                            <textarea name="analysis" id="edit-analysis"
                                class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl min-h-[160px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">${getSection('Context')}</textarea>
                        </div>
                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Impact</label>
                            <p class="text-[10px] text-slate-400 ml-4">Consequences if this issue goes unaddressed.</p>
                            ${renderToolbar('edit-impact')}
                            <textarea name="impact" id="edit-impact"
                                class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl min-h-[160px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">${getSection('Impact')}</textarea>
                        </div>
                    </div>
                    ` : `
                    <div class="space-y-2">
                        <h3 class="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 ml-4">Why?</h3>
                        <div class="space-y-8 pt-2">
                            <div class="space-y-3">
                                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Why is this change needed?</label>
                                <p class="text-[10px] text-slate-400 ml-4">High-level objective and rationale. Limited to 500 words.</p>
                                ${renderToolbar('edit-motivation')}
                                <textarea name="motivation" id="edit-motivation" required
                                    class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl min-h-[180px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">${getSection('Why is this change needed?') || getSection('Motivation')}</textarea>
                            </div>
                            <div class="space-y-3">
                                <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Analysis &amp; Test</label>
                                <p class="text-[10px] text-slate-400 ml-4">Expected consequences across stakeholders and the Cardano ecosystem, plus measurable "Test" criteria.</p>
                                ${renderToolbar('edit-analysis')}
                                <textarea name="analysis" id="edit-analysis"
                                    class="w-full bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl min-h-[200px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 transition-all text-slate-900 dark:text-white">${getSection('Analysis & Test')}</textarea>
                            </div>
                        </div>
                    </div>
                    `}

                    <!-- Asset Block -->
                    <div class="pt-10 border-t border-slate-50 dark:border-slate-800 space-y-10">
                        <div class="flex items-center gap-3">
                            <i data-lucide="paperclip" class="w-4 h-4 text-blue-600"></i>
                            <h3 class="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">Links and Files</h3>
                        </div>

                        <div class="space-y-3">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Links to research, files, or extra info</label>
                            ${renderToolbar('edit-exhibits')}
                            <textarea name="specification_extra" id="edit-exhibits"
                                placeholder="Edit existing or add new URLs..."
                                class="w-full bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl min-h-[120px] font-medium text-lg outline-none border-2 border-transparent focus:border-blue-600 text-slate-900 dark:text-white resize-none">${getSection('Links and Files') || getSection('Supporting Exhibits (Links)')}</textarea>
                        </div>

                        <!-- Existing Files Display -->
                        <div class="space-y-3 px-4">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-0 italic">Currently Linked Assets</label>
                            <div class="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl text-xs font-mono text-slate-500 border border-slate-100 dark:border-slate-800 whitespace-pre-wrap">
${getSection('Institutional Assets')}
                            </div>
                        </div>

                        <!-- New File Upload -->
                        <div class="space-y-4">
                            <label class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4 italic">Add Additional Assets (Hidden Registry)</label>
                            <div class="relative group">
                                <input type="file" multiple class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    onchange="window.handleFileSelect(this.files)">
                                <div class="w-full bg-slate-50 dark:bg-slate-950 p-10 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 group-hover:border-blue-400 transition-all text-center">
                                    <i data-lucide="upload-cloud" class="w-8 h-8 text-slate-300 mx-auto mb-4 group-hover:text-blue-600"></i>
                                    <p class="text-sm font-bold text-slate-400">Upload additional record evidence</p>
                                </div>
                            </div>
                            <!-- Selected Files List -->
                            <div class="space-y-2 mt-4 px-4">
                                ${state.editFiles.map((file, i) => `
                                    <div class="flex items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 animate-in fade-in">
                                        <div class="flex items-center gap-3 text-xs font-bold text-blue-600">
                                            <i data-lucide="file-text" class="w-4 h-4"></i> ${file.name}
                                        </div>
                                        <button type="button" onclick="window.removeDraftFile(${i})" class="text-red-400 hover:text-red-600 p-1">
                                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                                        </button>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Section 4: Governance Verification -->
                <div class="bg-blue-50/50 dark:bg-blue-900/10 p-10 sm:p-14 rounded-[4rem] border border-blue-100 dark:border-blue-800/30 space-y-8">
                    <h3 class="text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 ml-4 mb-4">Governance Verification</h3>
                    <div class="space-y-6">
                        <label class="flex items-start gap-4 cursor-pointer group">
                            <div class="relative flex items-center justify-center mt-1">
                                <input type="checkbox" required class="peer appearance-none w-6 h-6 border-2 border-blue-200 dark:border-blue-800 rounded-lg checked:bg-blue-600 transition-all">
                                <i data-lucide="check" class="absolute w-4 h-4 text-white opacity-0 peer-checked:opacity-100 pointer-events-none"></i>
                            </div>
                            <span class="text-sm font-bold text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors leading-relaxed">
                                I verify these modifications comply with the public consultation requirements for the amendment category and that I have documented all version changes.
                            </span>
                        </label>
                    </div>
                </div>

                <div class="flex flex-col sm:flex-row gap-6">
                    <button type="button" onclick="window.setView('detail')" 
                        class="flex-1 bg-white dark:bg-slate-900 text-slate-500 p-8 rounded-[3rem] text-xl font-black border border-slate-200 dark:border-slate-800 hover:bg-slate-50 transition-all">
                        Cancel
                    </button>
                    <button type="submit" ${state.loading.submitting ? 'disabled' : ''} 
                        class="flex-[2] group bg-blue-600 hover:bg-blue-700 text-white p-8 rounded-[3rem] text-2xl font-black shadow-2xl hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50">
                        ${state.loading.submitting ? 'Syncing...' : '<i data-lucide="save" class="w-6 h-6"></i> Update Record'}
                    </button>
                </div>
            </form>
        </div>`;
}
