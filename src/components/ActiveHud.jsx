import React from 'react';
import { Gamepad2, PauseCircle, X, RefreshCw, Sparkles, Check } from 'lucide-react';

export default function ActiveHud({ activeStatus, onRestoreType, onRefresh }) {
  const bootTitle = activeStatus?.boot_title || 'Par défaut Steam';
  const suspendTitle = activeStatus?.suspend_title || 'Par défaut Steam';

  const isBootCustom = bootTitle !== 'Par défaut Steam';
  const isSuspendCustom = suspendTitle !== 'Par défaut Steam';

  return (
    <div className="mx-8 mt-5 mb-4 p-2.5 px-5 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-xl flex items-center justify-between gap-4 text-xs select-none shadow-lg">
      {/* Label */}
      <div className="flex items-center gap-2 font-extrabold text-[#1a9eff] tracking-wider text-[11px] uppercase font-display flex-shrink-0">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-[#1a9eff]" />
          Actif dans Steam :
        </span>
      </div>

      {/* Badges */}
      <div className="flex items-center gap-3 flex-1 overflow-hidden">
        {/* Boot Video Pill */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all truncate max-w-sm ${
          isBootCustom 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm' 
            : 'bg-white/[0.03] border-white/5 text-[#94a3b8]'
        }`}>
          <Gamepad2 className="w-3.5 h-3.5 flex-shrink-0 text-[#1a9eff]" />
          <span className="font-semibold truncate text-[11px]">
            Boot : <span className={isBootCustom ? 'text-white font-bold' : 'text-[#64748b]'}>{bootTitle}</span>
          </span>
          {isBootCustom && (
            <button
              onClick={() => onRestoreType('boot_video')}
              title="Rétablir animation par défaut"
              className="p-0.5 hover:bg-rose-500/20 text-[#64748b] hover:text-rose-400 rounded-full transition-colors ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Suspend Video Pill */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all truncate max-w-sm ${
          isSuspendCustom 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-sm' 
            : 'bg-white/[0.03] border-white/5 text-[#94a3b8]'
        }`}>
          <PauseCircle className="w-3.5 h-3.5 flex-shrink-0 text-[#1a9eff]" />
          <span className="font-semibold truncate text-[11px]">
            Veille : <span className={isSuspendCustom ? 'text-white font-bold' : 'text-[#64748b]'}>{suspendTitle}</span>
          </span>
          {isSuspendCustom && (
            <button
              onClick={() => onRestoreType('suspend_video')}
              title="Rétablir animation par défaut"
              className="p-0.5 hover:bg-rose-500/20 text-[#64748b] hover:text-rose-400 rounded-full transition-colors ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        title="Actualiser le statut"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[#94a3b8] hover:text-white bg-white/[0.03] hover:bg-white/[0.07] border border-white/5 transition-all font-semibold text-[11px] flex-shrink-0"
      >
        <RefreshCw className="w-3 h-3" />
        <span>Actualiser</span>
      </button>
    </div>
  );
}
