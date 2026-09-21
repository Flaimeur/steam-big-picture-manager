import React from 'react';
import {
  Gamepad2,
  PauseCircle,
  Star,
  Film,
  Dices,
  Play,
  FolderOpen,
  RotateCcw,
  Shuffle,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';

export default function Sidebar({
  activeTab,
  setActiveTab,
  stats,
  onLaunchBigPicture,
  onPickRandom,
  steamStatus,
  onSelectSteam,
  onOpenFolder,
  onRestoreDefault,
  onToggleShuffle,
  autoShuffle,
  lang = 'fr',
  t,
}) {
  const libraryLinks = [
    { id: 'boot_video', label: t?.tabBoot || (lang === 'en' ? 'Boot Videos' : 'Démarrage (Boot)'), icon: Gamepad2 },
    { id: 'suspend_video', label: t?.tabSuspend || (lang === 'en' ? 'Suspend Videos' : 'Mise en veille'), icon: PauseCircle },
  ];

  const personalLinks = [
    { id: 'collection', label: t?.tabCollection || (lang === 'en' ? 'My Collection' : 'Ma Collection'), icon: Film, count: stats?.colCount },
    { id: 'favorites', label: t?.tabFavorites || (lang === 'en' ? 'My Favorites' : 'Mes Favoris'), icon: Star, count: stats?.favCount },
  ];

  const NavItem = ({ id, label, icon: Icon, count, onClick }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={onClick || (() => setActiveTab(id))}
        className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${
          isActive
            ? 'bg-[#1a9fff] text-white shadow-lg shadow-[#1a9fff]/30'
            : 'text-[#8b9ab5] hover:text-white hover:bg-[#1c2438]'
        }`}
      >
        <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? 'text-white' : 'text-[#546380]'}`} />
        <span className="flex-1 text-left">{label}</span>
        {count > 0 && (
          <span className={`text-[10px] font-bold min-w-[20px] text-center px-1.5 py-0.5 rounded-full ${
            isActive ? 'bg-white/25 text-white' : 'bg-[#1c2438] text-[#546380]'
          }`}>
            {count}
          </span>
        )}
      </button>
    );
  };

  const ActionItem = ({ label, icon: Icon, onClick, iconColor = 'text-[#546380]' }) => (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-[#8b9ab5] hover:text-white hover:bg-[#1c2438] transition-all duration-200"
    >
      <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${iconColor}`} />
      <span className="flex-1 text-left">{label}</span>
    </button>
  );

  return (
    <aside className="w-[220px] flex-shrink-0 flex flex-col h-full bg-[#0d1117] border-r border-[#1e293b]/60 overflow-hidden">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a9fff] to-[#0060cc] flex items-center justify-center shadow-lg shadow-[#1a9fff]/20">
            <Gamepad2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <div
              className="text-[13px] font-black text-white tracking-wide leading-none"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              STEAM BIG PICTURE
            </div>
            <div className="text-[10px] font-extrabold text-[#1a9fff] tracking-[0.16em] leading-none mt-1 uppercase">
              MANAGER
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-[#1e293b] to-transparent mx-4 mb-3" />

      {/* Library */}
      <div className="px-3">
        <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.16em] px-4 mb-2">
          Bibliothèque
        </div>
        <div className="space-y-1">
          {libraryLinks.map((link) => (
            <NavItem key={link.id} {...link} />
          ))}
        </div>
      </div>

      {/* Personal */}
      <div className="px-3 mt-5">
        <div className="text-[10px] font-bold text-[#475569] uppercase tracking-[0.16em] px-4 mb-2">
          Personnel
        </div>
        <div className="space-y-1">
          {personalLinks.map((link) => (
            <NavItem key={link.id} {...link} />
          ))}
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Bottom */}
      <div className="px-3 pb-5 space-y-2">
        <div className="h-px bg-gradient-to-r from-transparent via-[#1e293b] to-transparent mx-1 mb-2" />

        <NavItem id="settings" label={t?.tabSettings || (lang === 'en' ? 'Settings' : 'Paramètres')} icon={Settings} />

        <button
          onClick={onSelectSteam}
          className={`w-full flex items-center gap-2.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all ${
            steamStatus?.detected
              ? 'text-emerald-400 hover:bg-emerald-500/10'
              : 'text-rose-400 hover:bg-rose-500/10'
          }`}
        >
          {steamStatus?.detected ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <span>{steamStatus?.detected ? (lang === 'en' ? 'Steam Linked' : 'Steam Lié') : (lang === 'en' ? 'Link Steam' : 'Lier Steam')}</span>
        </button>

        <button
          onClick={onLaunchBigPicture}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-[#1a9fff] to-[#0070e0] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-[13px] font-bold shadow-lg shadow-[#1a9fff]/25 hover:shadow-[#1a9fff]/40 transition-all active:scale-[0.97]"
        >
          <Play className="w-4 h-4 fill-current" />
          Big Picture
        </button>
      </div>
    </aside>
  );
}
