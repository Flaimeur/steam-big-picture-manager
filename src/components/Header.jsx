import React, { useState } from 'react';
import {
  Gamepad2,
  PauseCircle,
  Star,
  Film,
  Dices,
  Search,
  X,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function Header({
  activeTab,
  setActiveTab,
  stats,
  searchQuery,
  setSearchQuery,
  onLaunchBigPicture,
  onPickRandom,
  steamStatus,
  onSelectSteam,
}) {
  const [searchFocused, setSearchFocused] = useState(false);

  const navTabs = [
    { id: 'boot_video', label: 'Démarrage', icon: Gamepad2 },
    { id: 'suspend_video', label: 'Veille', icon: PauseCircle },
    { id: 'favorites', label: 'Favoris', icon: Star, count: stats?.favCount },
    { id: 'collection', label: 'Collection', icon: Film, count: stats?.colCount },
  ];

  return (
    <header className="h-14 bg-[#050709]/90 backdrop-blur-xl border-b border-white/[0.06] px-6 flex items-center justify-between gap-4 z-40 flex-shrink-0">
      {/* Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#1a9eff] to-[#0055b3] flex items-center justify-center shadow-lg shadow-[#1a9eff]/20">
          <Gamepad2 className="w-4 h-4 text-white" />
        </div>
        <div className="hidden md:block">
          <h1 className="text-[11px] font-black tracking-[0.15em] text-white uppercase font-display leading-none">
            STEAM DECK
          </h1>
          <span className="text-[9px] font-bold tracking-[0.2em] text-[#1a9eff] uppercase leading-none">
            REPO MANAGER
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-0.5 bg-white/[0.03] px-1 py-1 rounded-xl border border-white/[0.06]">
        {navTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 ${
                isActive
                  ? 'bg-[#1a9eff] text-white shadow-md shadow-[#1a9eff]/25'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#64748b]'}`} />
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-px rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-white/[0.08] text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}

        <div className="w-px h-5 bg-white/[0.08] mx-1" />

        <button
          onClick={onPickRandom}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold text-[#38bdf8] hover:bg-[#1a9eff]/10 transition-all"
          title="Activer une animation au hasard"
        >
          <Dices className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Aléatoire</span>
        </button>
      </nav>

      {/* Right: Search + Status + Launch */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        {/* Search */}
        <div className={`relative transition-all duration-300 ${searchFocused ? 'w-64' : 'w-48'}`}>
          <Search className="w-3.5 h-3.5 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Rechercher..."
            className="w-full bg-white/[0.04] border border-white/[0.06] focus:border-[#1a9eff]/40 focus:bg-white/[0.06] text-white text-[11px] rounded-lg pl-8 pr-7 py-1.5 outline-none transition-all placeholder-[#64748b]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748b] hover:text-white p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Steam Status */}
        <button
          onClick={onSelectSteam}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
            steamStatus?.detected
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:border-emerald-500/50'
              : 'bg-rose-500/10 border-rose-500/25 text-rose-400 hover:border-rose-500/50'
          }`}
          title={steamStatus?.detected ? 'Steam Détecté' : 'Cliquer pour localiser Steam'}
        >
          {steamStatus?.detected ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span className="hidden xl:inline">
            {steamStatus?.detected ? 'Steam Lié' : 'Lier Steam'}
          </span>
        </button>

        {/* Big Picture Launch */}
        <button
          onClick={onLaunchBigPicture}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-[11px] font-bold transition-all shadow-md shadow-emerald-500/20 hover:shadow-emerald-500/30 active:scale-95"
        >
          <Play className="w-3 h-3 fill-current" />
          <span>Big Picture</span>
        </button>
      </div>
    </header>
  );
}
