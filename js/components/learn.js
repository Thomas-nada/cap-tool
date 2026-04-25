/**
 * Learning Hub Component
 * Educational resources and guides for governance participation
 * Framework ready for content - to be filled in as process evolves
 */

export function renderLearnHub(state) {
    // If a guide is active, render the guide content viewer
    if (state.activeGuide) {
        return `
        <div class="max-w-6xl mx-auto pb-20 fade-in text-left">
            <div class="mb-8">
                <button onclick="window.closeGuide()" class="group flex items-center gap-2 text-slate-400 hover:text-blue-600 transition-colors font-bold uppercase text-xs tracking-widest">
                    <i data-lucide="arrow-left" class="w-4 h-4 group-hover:-translate-x-1 transition-transform"></i>
                    Back to Guides
                </button>
            </div>
            <article id="guide-content" class="bg-white dark:bg-slate-900 p-10 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm prose dark:prose-invert max-w-none">
                ${state.loading && state.loading.guide ? '<p class="text-slate-400">Loading…</p>' : (state.guideHtml || '<p class="text-slate-400">No content available.</p>')}
            </article>
        </div>`;
    }

    return `
        <div class="max-w-6xl mx-auto pb-20 fade-in text-left">
            <!-- Header -->
            <header class="mb-16">
                <div class="flex items-center gap-4 mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg text-white">
                        <i data-lucide="graduation-cap" class="w-6 h-6"></i>
                    </div>
                    <div>
                        <h1 class="text-6xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase leading-none">
                            Learn & Guide
                        </h1>
                        <p class="text-slate-500 text-xl font-medium mt-2">Master the governance process</p>
                    </div>
                </div>
            </header>

            <!-- Main Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-8">

                <!-- Editor Guides -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                    <div class="w-12 h-12 bg-amber-500 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="shield" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Editor Guides</h2>
                    <p class="text-slate-500 mb-6">Resources for CAP Editors managing the proposal lifecycle</p>

                    <div class="space-y-3">
                        <button onclick="window.openGuide('editor-guide')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🛡️ Complete Editor Guide
                        </button>
                        <button onclick="window.openGuide('editor-role')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            📜 Editor Role & Scope
                        </button>
                    </div>
                </div>

                <!-- Getting Started -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                    <div class="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="play" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Getting Started</h2>
                    <p class="text-slate-500 mb-6">New to Cardano governance? Start here.</p>
                    
                    <div class="space-y-3">
                        <button onclick="window.openGuide('about-the-cap-process')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🏛️ How the CAP Process Was Built
                        </button>
                        <button onclick="window.openGuide('intro-to-caps-and-cis')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            📘 Introduction to CAPs & CIS
                        </button>
                        <button onclick="window.openGuide('how-to-participate')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🎯 How to Participate
                        </button>
                        <button onclick="window.openGuide('deliberation-process')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            ⏱️ The Deliberation Process
                        </button>
                    </div>
                </div>

                <!-- Using GitHub -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                    <div class="w-12 h-12 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center mb-6 text-white dark:text-slate-900">
                        <i data-lucide="github" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Using GitHub</h2>
                    <p class="text-slate-500 mb-6">Learn to interact directly with GitHub Issues</p>
                    
                    <div class="space-y-3">
                        <button onclick="window.openGuide('creating-a-cap')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🔧 Creating a CAP in GitHub
                        </button>
                        <button onclick="window.openGuide('commenting-and-discussing')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            💬 Commenting & Discussion
                        </button>
                        <button onclick="window.openGuide('labels-and-workflow')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🏷️ Labels & Workflow
                        </button>
                    </div>
                </div>

                <!-- Writing CAPs -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                    <div class="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="pen-tool" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Writing CAPs</h2>
                    <p class="text-slate-500 mb-6">Best practices for effective proposals</p>
                    
                    <div class="space-y-3">
                        <button onclick="window.openGuide('cap-template-guide')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            ✍️ CAP Template Guide
                        </button>
                        <button onclick="window.openGuide('examples-of-successful-caps')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            📊 Examples of Successful CAPs
                        </button>
                        <button onclick="window.openGuide('common-mistakes')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            ❌ Common Mistakes to Avoid
                        </button>
                    </div>
                </div>

                <!-- Constitution Guide -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10">
                    <div class="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="book-open" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Constitution</h2>
                    <p class="text-slate-500 mb-6">Understanding the foundational document</p>
                    
                    <div class="space-y-3">
                        <button onclick="window.setView('constitution')" class="w-full p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-bold text-left hover:-translate-y-1 transition-all">
                            📖 Read the Constitution →
                        </button>
                        <button onclick="window.openGuide('article-by-article-breakdown')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            🔍 Article-by-Article Breakdown
                        </button>
                        <button onclick="window.openGuide('amendment-history')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                            📜 Amendment History
                        </button>
                    </div>
                </div>

                <!-- FAQ -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 md:col-span-2">
                    <div class="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="help-circle" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">Frequently Asked Questions</h2>
                    <p class="text-slate-500 mb-8">Common questions about the governance process</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        ${[
                            { label: 'What is a CAP?', slug: 'faq-what-is-a-cap' },
                            { label: 'What is a CIS?', slug: 'faq-what-is-a-cis' },
                            { label: 'Who can create a CAP?', slug: 'faq-who-can-create-a-cap' },
                            { label: 'How long is deliberation?', slug: 'faq-how-long-is-deliberation' },
                            { label: 'What CAP categories exist?', slug: 'faq-what-are-the-categories' },
                            { label: 'Procedural vs Substantive?', slug: 'faq-difference-procedural-substantive' },
                            { label: 'Can I edit my CAP?', slug: 'faq-can-i-edit-my-cap' },
                            { label: 'Can a CIS become a CAP?', slug: 'faq-can-a-cis-become-a-cap' },
                            { label: 'What happens after deliberation?', slug: 'faq-what-happens-after-30-days' },
                            { label: 'My CAP was accepted — what now?', slug: 'faq-my-cap-was-accepted' },
                            { label: 'How are CAPs approved?', slug: 'faq-how-are-caps-approved' },
                            { label: 'How do I vote?', slug: 'faq-how-do-i-vote' },
                            { label: 'What is a governance action?', slug: 'faq-what-is-a-governance-action' },
                            { label: 'What is the Constitutional Committee?', slug: 'faq-what-is-the-constitutional-committee' },
                            { label: 'What is a DRep?', slug: 'faq-what-is-a-drep' },
                            { label: 'What are the Guardrails?', slug: 'faq-what-are-guardrails' },
                            { label: 'Can I propose Guardrail changes?', slug: 'faq-can-i-propose-guardrail-changes' },
                            { label: 'What is a CAP Editor?', slug: 'faq-what-is-a-cap-editor' },
                            { label: 'What if the Editor disagrees?', slug: 'faq-what-if-editor-disagrees' },
                            { label: 'What if my CAP gets no engagement?', slug: 'faq-what-if-my-cap-gets-no-engagement' },
                            { label: 'Do I need a GitHub account?', slug: 'faq-do-i-need-a-github-account' },
                            { label: 'Can I submit anonymously?', slug: 'faq-can-i-submit-anonymously' },
                            { label: 'What is the Amendment Wizard?', slug: 'faq-what-is-the-amendment-wizard' }
                        ].map(q => `
                            <button onclick="window.openGuide('${q.slug}')" class="w-full p-4 rounded-2xl border-2 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-bold text-left hover:-translate-y-0.5 transition-all">
                                ${q.label}
                            </button>
                        `).join('')}
                    </div>
                </div>

                <!-- Resources -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-10 md:col-span-2">
                    <div class="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-6 text-white">
                        <i data-lucide="library" class="w-6 h-6"></i>
                    </div>
                    <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-4">External Resources</h2>
                    <p class="text-slate-500 mb-8">Links to related documentation and tools</p>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a href="https://github.com/Thomas-nada/cap" target="_blank" rel="noopener noreferrer"
                            class="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 transition-all group">
                            <div class="flex items-center gap-3 mb-3">
                                <i data-lucide="github" class="w-5 h-5 text-slate-600 dark:text-slate-300 group-hover:text-blue-600"></i>
                                <h3 class="font-black text-sm text-slate-900 dark:text-white">GitHub Repository</h3>
                            </div>
                            <p class="text-xs text-slate-500">View source code and full history</p>
                        </a>

                        <button class="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-left">
                            <div class="flex items-center gap-3 mb-3">
                                <i data-lucide="message-square" class="w-5 h-5 text-slate-400"></i>
                                <h3 class="font-black text-sm text-slate-400">Discord Channel</h3>
                            </div>
                            <p class="text-xs text-slate-400">Community chat (Coming Soon)</p>
                        </button>

                        <button class="p-6 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-left">
                            <div class="flex items-center gap-3 mb-3">
                                <i data-lucide="video" class="w-5 h-5 text-slate-400"></i>
                                <h3 class="font-black text-sm text-slate-400">Video Tutorials</h3>
                            </div>
                            <p class="text-xs text-slate-400">Step-by-step guides (Coming Soon)</p>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-10 rounded-[3rem] border border-blue-100 dark:border-blue-900/30">
                <h3 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase mb-6 text-center">Ready to Get Started?</h3>
                <div class="flex flex-wrap justify-center gap-4">
                    <button onclick="window.setView('wizard')" 
                        class="px-8 py-4 rounded-2xl bg-blue-600 text-white font-black uppercase text-sm tracking-widest hover:-translate-y-1 active:scale-95 transition-all shadow-xl flex items-center gap-3">
                        <i data-lucide="wand-2" class="w-5 h-5"></i>
                        Use Amendment Wizard
                    </button>
                    <button onclick="window.setView('constitution')" 
                        class="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-black uppercase text-sm tracking-widest hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3">
                        <i data-lucide="book-open" class="w-5 h-5 text-blue-600"></i>
                        Read Constitution
                    </button>
                    <button onclick="window.setView('list')" 
                        class="px-8 py-4 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 font-black uppercase text-sm tracking-widest hover:-translate-y-1 active:scale-95 transition-all flex items-center gap-3">
                        <i data-lucide="search" class="w-5 h-5 text-purple-600"></i>
                        Browse CAPs
                    </button>
                </div>
            </div>
        </div>`;
}
