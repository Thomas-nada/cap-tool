/**
 * Navigation Component
 * Renders the primary navigation interface with the institutional brand 
 * and authenticated session controls.
 */
export function renderNav(state) {
    const menu = [
        { id: 'dashboard', label: 'Home', icon: 'home' },
        { id: 'list', label: 'Registry', icon: 'database' },
        { id: 'kanban', label: 'Kanban', icon: 'columns' },
        { id: 'constitution', label: 'Constitution', icon: 'book-open' },
        { id: 'learn', label: 'Guides', icon: 'book' },
        { id: 'wizard', label: 'New CAP', icon: 'plus-square' }
    ];

    return `
        <nav class="sticky top-6 z-50 mx-6 bg-white/70 dark:bg-slate-900/70 glass border border-slate-200/50 dark:border-slate-800/50 p-3 rounded-[2.5rem] shadow-2xl flex justify-between items-center transition-all duration-300">
            <!-- Brand Section with Logo -->
            <div class="flex items-center gap-4 px-4 cursor-pointer group" onclick="window.setView('dashboard')">
                <div class="w-10 h-10 flex items-center justify-center flex-shrink-0">
                    <img src="CAP.png" alt="CAP Logo"
                        class="w-10 h-10 object-contain dark:brightness-0 dark:invert transition-all duration-300">
                </div>
                <div class="hidden sm:block text-left">
                    <h1 class="font-extrabold text-lg leading-none tracking-tighter text-slate-900 dark:text-white">CAP Portal</h1>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Constitutional Amendments</p>
                </div>
            </div>

            <!-- Main Navigation Links -->
            <div class="flex items-center gap-1 bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[2.2rem]">
                ${menu.map(item => `
                    <button onclick="window.setView('${item.id}')" 
                        class="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all 
                        ${state.view === item.id ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'}">
                        <i data-lucide="${item.icon}" class="w-4 h-4"></i>
                        <span class="hidden md:inline">${item.label}</span>
                    </button>
                `).join('')}
            </div>

            <!-- Utility & Session Controls -->
            <div class="flex items-center gap-2 pr-2">
                <button onclick="window.toggleTheme()" class="w-10 h-10 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors" title="Toggle Theme">
                    <i data-lucide="${state.theme === 'light' ? 'moon' : 'sun'}" class="w-5 h-5 text-slate-500"></i>
                </button>
                
                <div class="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-1"></div>
                
                <button onclick="window.logout()" class="flex items-center gap-3 pl-2 pr-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all group">
                    <img src="${state.ghUser?.avatar_url || 'https://github.com/identicons/jasonlong.png'}" class="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm" />
                    <div class="hidden lg:block text-left">
                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Session</p>
                        <p class="text-xs font-bold text-red-500 group-hover:text-red-600">Logout</p>
                    </div>
                </button>
            </div>
        </nav>`;
}