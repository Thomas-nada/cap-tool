/**
 * Enhanced Dashboard Component
 * Features: Active Deliberations, Your CAPs, Trending, Recent Activity
 */

export function renderDashboard(state) {
    const s = state.stats;
    const cards = [
        { label: 'In Consultation', value: s.consultation, icon: 'message-circle', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20', onclick: `state.statusFilter='open'; state.docTypeFilter='ALL'; window.setView('list');` },
        { label: 'Ready', value: s.ready, icon: 'check-circle', color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20', onclick: `state.statusFilter='open'; state.docTypeFilter='ALL'; window.setView('list');` },
        { label: 'Done', value: s.done, icon: 'award', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', onclick: `state.statusFilter='closed'; state.docTypeFilter='ALL'; window.setView('list');` },
    ];

    // Get active deliberations (open CAPs/CIS with deliberation period)
    const activeDeliberations = state.proposals
        .filter(p => p.state === 'open' && (p.type === 'CAP' || p.type === 'CIS'))
        .map(p => {
            const expiryMatch = p.body?.match(/<!-- DELIBERATION_END: (.*?) -->/);
            const expiryDate = expiryMatch ? new Date(expiryMatch[1]) : new Date(new Date(p.created_at).getTime() + (30 * 24 * 60 * 60 * 1000));
            const now = new Date();
            const daysLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            const hoursLeft = Math.ceil((expiryDate - now) / (1000 * 60 * 60));
            const isUrgent = daysLeft <= 3;
            const isExpired = daysLeft < 0;
            
            return {
                ...p,
                expiryDate,
                daysLeft,
                hoursLeft,
                isUrgent,
                isExpired
            };
        })
        .filter(p => !p.isExpired)
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 5);

    // Get user's CAPs if logged in
    const yourCAPs = state.ghUser ? state.proposals
        .filter(p => p.user.login === state.ghUser.login)
        .slice(0, 5) : [];

    // Get trending (most commented recently)
    const trending = state.proposals
        .filter(p => p.state === 'open')
        .sort((a, b) => b.comments - a.comments)
        .slice(0, 5);

    // Get recent activity (most recently updated)
    const recentActivity = state.proposals
        .slice()
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 8);

    return `
        <div class="space-y-12 fade-in text-left">
            <!-- Header -->
            <header>
                <h1 class="text-4xl font-black tracking-tighter text-slate-900 dark:text-white">
                    Welcome, <span class="text-blue-600">${state.ghUser?.login}</span>.
                </h1>
                <p class="text-slate-400 text-sm font-black mt-2 uppercase tracking-[0.2em]">Put your CAP on!</p>
            </header>

            <!-- Stats Grid -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                ${cards.map(c => `
                    <div onclick="${c.onclick}" class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-blue-200 dark:hover:border-blue-900/30 transition-all cursor-pointer">
                        <div class="w-12 h-12 ${c.bg} ${c.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <i data-lucide="${c.icon}" class="w-6 h-6"></i>
                        </div>
                        <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">${c.label}</p>
                        <p class="text-4xl font-black italic tracking-tighter text-slate-900 dark:text-white">${c.value}</p>
                    </div>
                `).join('')}
            </div>

            <!-- Primary Actions -->
            <div class="flex flex-wrap gap-4 pt-4">
                <button onclick="window.setView('wizard')" 
                    class="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:-translate-y-1 active:scale-95 transition-all shadow-xl flex items-center gap-3">
                    <i data-lucide="wand-2" class="w-4 h-4"></i> Amendment Wizard
                </button>
                
                <!-- Manual create removed: use Amendment Wizard instead -->
                
                <button onclick="window.setView('constitution')" 
                    class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:-translate-y-1 active:scale-95 transition-all shadow-sm flex items-center gap-3">
                    <i data-lucide="book-open" class="w-4 h-4 text-blue-600"></i> Read Constitution
                </button>

                <button onclick="window.setView('learn')" 
                    class="bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-3xl font-black uppercase text-xs tracking-widest hover:-translate-y-1 active:scale-95 transition-all shadow-sm flex items-center gap-3">
                    <i data-lucide="graduation-cap" class="w-4 h-4 text-amber-600"></i> Learn & Guide
                </button>
            </div>

            <!-- Main Content Grid -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                <!-- Active Deliberations -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-amber-500 rounded-2xl flex items-center justify-center text-white">
                                <i data-lucide="clock" class="w-5 h-5"></i>
                            </div>
                            <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Active Deliberations</h2>
                        </div>
                        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">${activeDeliberations.length} Active</span>
                    </div>
                    
                    ${activeDeliberations.length === 0 ? `
                        <div class="text-center py-12">
                            <i data-lucide="inbox" class="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4"></i>
                            <p class="text-slate-400 font-bold text-sm">No active deliberations</p>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${activeDeliberations.map(p => `
                                <div onclick="window.openProposal(${p.number})" class="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div class="flex items-start justify-between gap-4">
                                        <div class="flex-1 min-w-0">
                                            <div class="flex items-center gap-2 mb-2">
                                                <span class="text-[10px] font-black uppercase tracking-widest ${p.type === 'CIS' ? 'text-amber-500' : 'text-blue-600'}">
                                                    ${p.type} #${p.number}
                                                </span>
                                                ${p.isUrgent ? `<span class="text-[8px] font-black px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full uppercase tracking-wider">Urgent</span>` : ''}
                                            </div>
                                            <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">${p.title}</h3>
                                            <p class="text-xs text-slate-500 flex items-center gap-2">
                                                <i data-lucide="message-square" class="w-3 h-3"></i>
                                                ${p.comments} comments
                                            </p>
                                        </div>
                                        <div class="flex flex-col items-end gap-1">
                                            <div class="text-right">
                                                <p class="text-2xl font-black ${p.isUrgent ? 'text-red-600' : 'text-slate-900 dark:text-white'}">${p.daysLeft}</p>
                                                <p class="text-[10px] font-black uppercase tracking-widest text-slate-400">days left</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    `}
                    
                    ${activeDeliberations.length > 0 ? `
                        <button onclick="window.setView('list'); state.docTypeFilter = 'ALL'; updateUI(true);" 
                            class="w-full mt-4 px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                            View All Active →
                        </button>
                    ` : ''}
                </div>

                <!-- Your CAPs -->
                ${state.ghUser ? `
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div class="flex items-center justify-between mb-6">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white">
                                <i data-lucide="user" class="w-5 h-5"></i>
                            </div>
                            <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Your Submissions</h2>
                        </div>
                        <span class="text-xs font-black text-slate-400 uppercase tracking-widest">${yourCAPs.length} Total</span>
                    </div>
                    
                    ${yourCAPs.length === 0 ? `
                        <div class="text-center py-12">
                            <i data-lucide="file-plus" class="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4"></i>
                            <p class="text-slate-400 font-bold text-sm mb-4">You haven't submitted anything yet</p>
                            <button onclick="window.setView('wizard')" class="px-6 py-3 bg-blue-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:-translate-y-1 transition-all">
                                Start an Amendment
                            </button>
                        </div>
                    ` : `
                        <div class="space-y-3">
                            ${yourCAPs.map(p => `
                                <div onclick="window.openProposal(${p.number})" class="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                    <div class="flex items-center gap-2 mb-2">
                                        <span class="text-[10px] font-black uppercase tracking-widest ${p.type === 'CIS' ? 'text-amber-500' : 'text-blue-600'}">
                                            ${p.type} #${p.number}
                                        </span>
                                        <span class="text-[8px] font-black px-2 py-0.5 ${p.state === 'open' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'} rounded-full uppercase tracking-wider">
                                            ${p.state}
                                        </span>
                                    </div>
                                    <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">${p.title}</h3>
                                    <p class="text-xs text-slate-500">${p.comments} comments • ${new Date(p.created_at).toLocaleDateString()}</p>
                                </div>
                            `).join('')}
                        </div>
                    `}
                </div>
                ` : ''}

                <!-- Trending Discussions -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-purple-600 rounded-2xl flex items-center justify-center text-white">
                            <i data-lucide="trending-up" class="w-5 h-5"></i>
                        </div>
                        <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Trending</h2>
                    </div>
                    
                    <div class="space-y-3">
                        ${trending.slice(0, 5).map((p, idx) => `
                            <div onclick="window.openProposal(${p.number})" class="p-4 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                <div class="flex items-start gap-4">
                                    <div class="flex items-center justify-center w-8 h-8 rounded-xl ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-300' : idx === 2 ? 'bg-amber-600' : 'bg-slate-100 dark:bg-slate-800'} text-white font-black text-sm">
                                        ${idx + 1}
                                    </div>
                                    <div class="flex-1 min-w-0">
                                        <div class="flex items-center gap-2 mb-1">
                                            <span class="text-[10px] font-black uppercase tracking-widest ${p.type === 'CIS' ? 'text-amber-500' : 'text-blue-600'}">
                                                ${p.type} #${p.number}
                                            </span>
                                        </div>
                                        <h3 class="font-bold text-sm text-slate-900 dark:text-white truncate mb-1">${p.title}</h3>
                                        <p class="text-xs text-slate-500">${p.comments} comments</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Recent Activity Feed -->
                <div class="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm p-8">
                    <div class="flex items-center gap-3 mb-6">
                        <div class="w-10 h-10 bg-emerald-600 rounded-2xl flex items-center justify-center text-white">
                            <i data-lucide="activity" class="w-5 h-5"></i>
                        </div>
                        <h2 class="text-2xl font-black italic tracking-tighter text-slate-900 dark:text-white uppercase">Recent Activity</h2>
                    </div>
                    
                    <div class="space-y-2">
                        ${recentActivity.map(p => {
                            const timeAgo = getTimeAgo(new Date(p.updated_at));
                            return `
                                <div onclick="window.openProposal(${p.number})" class="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                                    <div class="flex items-center gap-2 mb-1">
                                        <span class="text-[9px] font-black uppercase tracking-widest ${p.type === 'CIS' ? 'text-amber-500' : 'text-blue-600'}">
                                            ${p.type} #${p.number}
                                        </span>
                                        <span class="text-[9px] text-slate-400">•</span>
                                        <span class="text-[9px] text-slate-400">${timeAgo}</span>
                                    </div>
                                    <h3 class="font-bold text-xs text-slate-900 dark:text-white truncate">${p.title}</h3>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            </div>
        </div>`;
}

function getTimeAgo(date) {
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
}
