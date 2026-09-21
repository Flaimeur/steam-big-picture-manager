import React, { useState } from 'react';
import {
  FolderOpen,
  FolderSync,
  HardDrive,
  Settings as SettingsIcon,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Shuffle,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Info,
  Languages,
  ListMusic,
} from 'lucide-react';

export default function SettingsView({
  steamStatus,
  onSelectSteam,
  onOpenFolder,
  onOpenCollectionFolder,
  onRestoreDefault,
  onToggleShuffle,
  autoShuffle,
  onLaunchBigPicture,
  stats,
  playlists = {},
  lang = 'fr',
  onLanguageChange,
  t,
}) {
  const [customPathInput, setCustomPathInput] = useState('');
  const [isEditingPath, setIsEditingPath] = useState(false);

  const steamPath = steamStatus?.path || '';
  const isDetected = Boolean(steamStatus?.detected);

  const handleSaveCustomPath = async () => {
    if (!customPathInput.trim()) return;
    await onSelectSteam(customPathInput.trim());
    setIsEditingPath(false);
  };

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0e131f] h-full">
      <div className="p-6 md:p-8 max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1a9fff]/15 border border-[#1a9fff]/30 flex items-center justify-center text-[#38bdf8]">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div>
              <h1
                className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Options & Dossiers Locaux
              </h1>
              <p className="text-xs text-[#546380] font-medium mt-0.5">
                {lang === 'en'
                  ? 'Manage your Steam paths, local videos storage and system behaviors.'
                  : "Gérez vos répertoires Steam, l'emplacement de vos vidéos locales et les comportements système."}
              </p>
            </div>
          </div>
        </div>

        {/* Section 0: Langue de l'interface (Language) */}
        <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {lang === 'en' ? 'Interface Language' : "Langue de l'interface"}
              </span>
              <span className="text-xs text-[#546380]">
                {lang === 'en' ? 'Select your preferred language (French / English)' : 'Sélectionnez votre langue préférée (Français / Anglais)'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onLanguageChange && onLanguageChange('fr')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                lang === 'fr'
                  ? 'bg-[#1a9fff]/20 text-[#38bdf8] border-[#1a9fff]/50 shadow-md shadow-[#1a9fff]/20'
                  : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
              }`}
            >
              <span>🇫🇷 Français</span>
            </button>
            <button
              onClick={() => onLanguageChange && onLanguageChange('en')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                lang === 'en'
                  ? 'bg-[#1a9fff]/20 text-[#38bdf8] border-[#1a9fff]/50 shadow-md shadow-[#1a9fff]/20'
                  : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
              }`}
            >
              <span>🇬🇧 English</span>
            </button>
          </div>
        </div>

        {/* Section 1: Emplacements & Dossiers Locaux */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#64748b] px-1">
            <HardDrive className="w-4 h-4 text-[#38bdf8]" />
            <span>Emplacements & Dossiers</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dossier Steam Principal */}
            <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Installation Steam
                  </span>
                  <span
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      isDetected
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {isDetected ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Connecté
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3 h-3" /> Non trouvé
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs text-[#546380]">
                  Répertoire racine où Steam est installé sur votre ordinateur.
                </p>

                {isEditingPath ? (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      value={customPathInput}
                      onChange={(e) => setCustomPathInput(e.target.value)}
                      placeholder="C:\Program Files (x86)\Steam"
                      className="flex-1 bg-[#1a233a] border border-[#2d3a5a] text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-[#1a9fff]"
                    />
                    <button
                      onClick={handleSaveCustomPath}
                      className="px-3 py-2 rounded-xl bg-[#1a9fff] text-white text-xs font-bold hover:bg-[#38adff]"
                    >
                      Valider
                    </button>
                    <button
                      onClick={() => setIsEditingPath(false)}
                      className="px-3 py-2 rounded-xl bg-[#1e293b] text-[#94a3b8] text-xs font-bold hover:text-white"
                    >
                      Annuler
                    </button>
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-[#0e1320] border border-[#1e293b]/60 font-mono text-[11px] text-[#94a3b8] break-all select-all">
                    {steamPath || 'Non configuré'}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#1e293b]/60">
                <button
                  onClick={() => onSelectSteam()}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a243a] hover:bg-[#202d48] text-white text-xs font-bold border border-[#2d3a5a] transition-all"
                >
                  <FolderSync className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Parcourir / Choisir</span>
                </button>
                <button
                  onClick={() => {
                    setCustomPathInput(steamPath);
                    setIsEditingPath(true);
                  }}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-[#64748b] hover:text-white hover:bg-white/5 transition-all"
                >
                  Saisir manuellement
                </button>
              </div>
            </div>

            {/* Dossier des Vidéos Steam (Overrides Movies) */}
            <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Dossier Vidéos Steam
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#1a9fff]/10 text-[#38bdf8] border border-[#1a9fff]/20">
                    overrides/movies
                  </span>
                </div>
                <p className="text-xs text-[#546380] leading-relaxed">
                  C'est le dossier officiel lu en priorité par Steam pour charger les vidéos personnalisées au démarrage et en veille.
                </p>
                <div className="p-3 rounded-xl bg-[#0e1320] border border-[#1e293b]/60 font-mono text-[11px] text-[#94a3b8] break-all">
                  {steamPath ? `${steamPath}\\steamui\\overrides\\movies` : 'Dossier Steam requis'}
                </div>
              </div>

              <div className="pt-1 border-t border-[#1e293b]/60">
                <button
                  onClick={onOpenFolder}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#1a9fff] to-[#0070e0] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-xs font-bold shadow-md shadow-[#1a9fff]/20 transition-all active:scale-[0.98]"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Ouvrir le dossier Vidéos Steam</span>
                </button>
              </div>
            </div>

            {/* Dossier de Stockage Collection Local */}
            <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col justify-between space-y-4 md:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-sm font-bold text-white flex items-center gap-2">
                    Stockage de votre Collection Locale
                  </span>
                  <p className="text-xs text-[#546380]">
                    Dossier local sécurisé (AppData) où sont sauvegardées toutes vos vidéos téléchargées ({stats?.colCount || 0} animations) et vos favoris.
                  </p>
                </div>
                <button
                  onClick={onOpenCollectionFolder}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a243a] hover:bg-[#202d48] text-white text-xs font-bold border border-[#2d3a5a] hover:border-[#1a9fff]/40 transition-all whitespace-nowrap shadow-sm"
                >
                  <FolderOpen className="w-4 h-4 text-[#38bdf8]" />
                  <span>Ouvrir le dossier Collection</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Automatisation & Restauration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[#64748b] px-1">
            <Shuffle className="w-4 h-4 text-purple-400" />
            <span>Rotation Aléatoire & Restauration</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Rotation Automatique & Paramètres */}
            <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col justify-between space-y-5">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
                      <Shuffle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        Rotation Aléatoire (Auto-Shuffle)
                      </span>
                      <span className="text-[11px] text-[#64748b]">
                        Change vos animations au démarrage de Steam ou de l'application
                      </span>
                    </div>
                  </div>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-11 h-6 rounded-full p-1 transition-colors ${autoShuffle ? 'bg-purple-600' : 'bg-[#1e293b]'}`}>
                      <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform ${autoShuffle ? 'translate-x-5' : 'translate-x-0'}`} />
                    </div>
                    <input
                      type="checkbox"
                      checked={autoShuffle}
                      onChange={(e) => onToggleShuffle({ enabled: e.target.checked })}
                      className="sr-only"
                    />
                  </label>
                </div>

                {/* Source du tirage : Favoris vs Collection vs Playlist */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#94a3b8]">Source des animations</span>
                    <span className="text-[11px] text-[#546380]">
                      {steamStatus?.shuffle_source === 'favorites'
                        ? (lang === 'en' ? 'Favorites only' : 'Seulement vos favoris')
                        : steamStatus?.shuffle_source?.startsWith('playlist:')
                        ? (playlists[steamStatus.shuffle_source.replace('playlist:', '')]?.name || 'Playlist')
                        : (lang === 'en' ? 'All collection' : 'Toutes vos vidéos')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleShuffle({ source: 'all' })}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        !steamStatus?.shuffle_source || steamStatus?.shuffle_source === 'all'
                          ? 'bg-[#1a2b4c] text-[#38bdf8] border-[#1a9fff]/50 shadow-sm shadow-[#1a9fff]/10'
                          : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{lang === 'en' ? 'Full Collection' : 'Toute la collection'} ({stats?.colCount || 0})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleShuffle({ source: 'favorites' })}
                      className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                        steamStatus?.shuffle_source === 'favorites'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 shadow-sm shadow-amber-500/10'
                          : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <span>⭐ {lang === 'en' ? 'Favorites only' : 'Favoris uniquement'} ({stats?.favCount || 0})</span>
                    </button>
                  </div>

                  {Object.keys(playlists).length > 0 && (
                    <div className="pt-2">
                      <span className="text-[11px] font-semibold text-[#64748b] block mb-1.5">
                        {lang === 'en' ? 'Or choose a specific playlist :' : 'Ou cibler une playlist :'}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.values(playlists).map((pl) => {
                          const isPlSelected = steamStatus?.shuffle_source === `playlist:${pl.id}`;
                          return (
                            <button
                              key={pl.id}
                              type="button"
                              onClick={() => onToggleShuffle({ source: `playlist:${pl.id}` })}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                isPlSelected
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                                  : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                              }`}
                            >
                              <ListMusic className="w-3 h-3" />
                              <span className="truncate max-w-[120px]">{pl.name}</span>
                              <span className="text-[10px] opacity-70">({(pl.videos || []).length})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Cible du tirage : Boot vs Veille vs Les deux */}
                <div className="space-y-2 pt-2 border-t border-[#1e293b]/60">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#94a3b8]">Cible à renouveler</span>
                    <span className="text-[11px] text-[#546380]">
                      {steamStatus?.shuffle_target === 'suspend'
                        ? 'Veille uniquement'
                        : steamStatus?.shuffle_target === 'both'
                        ? 'Boot & Veille simultanés'
                        : 'Démarrage (Boot)'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleShuffle({ target: 'boot' })}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        (steamStatus?.shuffle_target || 'boot') === 'boot'
                          ? 'bg-[#1a2b4c] text-[#38bdf8] border-[#1a9fff]/50 shadow-sm'
                          : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <span>🎬 Démarrage</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleShuffle({ target: 'suspend' })}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        steamStatus?.shuffle_target === 'suspend'
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/40 shadow-sm'
                          : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <span>🌙 Veille</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onToggleShuffle({ target: 'both' })}
                      className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-bold border transition-all ${
                        steamStatus?.shuffle_target === 'both'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                          : 'bg-[#0e1320] text-[#64748b] border-[#1e293b] hover:text-white'
                      }`}
                    >
                      <span>⚡ Les deux</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Bouton de tirage instantané avec paramètres actuels */}
              <div className="pt-3 border-t border-[#1e293b]/60">
                <button
                  type="button"
                  onClick={() => onToggleShuffle({ triggerNow: true })}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/20 transition-all active:scale-[0.98]"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Tirer aléatoirement maintenant</span>
                </button>
              </div>
            </div>

            {/* Restauration Usine */}
            <div className="rounded-2xl bg-[#131929] border border-[#1e293b] p-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-bold text-white block">
                        Rétablir les Vidéos d'Origine
                      </span>
                      <span className="text-[11px] text-[#64748b]">
                        Restauration des animations officielles Valve
                      </span>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Valve Default
                  </span>
                </div>
                <p className="text-xs text-[#546380] leading-relaxed">
                  Supprime les animations personnalisées injectées dans le dossier overrides de Steam et restaure les sauvegardes officielles de Steam.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-[#1e293b]/60">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onRestoreDefault('boot_video')}
                    className="px-3 py-2.5 rounded-xl bg-[#1a243a] hover:bg-[#202d48] text-[#cbd5e1] hover:text-white text-xs font-bold border border-[#2d3a5a] transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                    Boot Défaut
                  </button>
                  <button
                    onClick={() => onRestoreDefault('suspend_video')}
                    className="px-3 py-2.5 rounded-xl bg-[#1a243a] hover:bg-[#202d48] text-[#cbd5e1] hover:text-white text-xs font-bold border border-[#2d3a5a] transition-all flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    Veille Défaut
                  </button>
                </div>
                <button
                  onClick={() => onRestoreDefault('all')}
                  className="w-full px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30 transition-all flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Tout Restaurer (Boot & Veille)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Statut Actuel & Lancement */}
        <div className="rounded-3xl bg-gradient-to-r from-[#11192b] via-[#141f38] to-[#101728] border border-[#1e293b] p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#38bdf8]">
              <Sparkles className="w-4 h-4" /> Statut Actuel dans Steam
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs font-bold">
              <div className="flex items-center gap-2 bg-[#0d1220] px-3.5 py-2 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[#64748b]">Démarrage :</span>
                <span className="text-white">{steamStatus?.boot_title || 'Par défaut'}</span>
              </div>
              <div className="flex items-center gap-2 bg-[#0d1220] px-3.5 py-2 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
                <span className="text-[#64748b]">Veille :</span>
                <span className="text-white">{steamStatus?.suspend_title || 'Par défaut'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onLaunchBigPicture}
            className="flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#1a9fff] to-[#0070e0] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-sm font-black shadow-xl shadow-[#1a9fff]/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Tester Big Picture</span>
          </button>
        </div>
      </div>
    </div>
  );
}
