import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const isSuccess = toast.type === 'success' || !toast.type;
  const isError = toast.type === 'error';

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fade-in select-none">
      <div className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-2xl backdrop-blur-2xl ${
        isSuccess
          ? 'bg-emerald-950/90 border-emerald-500/40 text-white shadow-emerald-950/50'
          : isError
          ? 'bg-rose-950/90 border-rose-500/40 text-white shadow-rose-950/50'
          : 'bg-[#0f1524]/95 border-[#1a9eff]/40 text-white shadow-black/60'
      }`}>
        {isSuccess ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        ) : isError ? (
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
        ) : (
          <Info className="w-4 h-4 text-[#38bdf8] flex-shrink-0" />
        )}

        <span className="text-xs font-bold tracking-wide">{toast.message}</span>

        <button
          onClick={onClose}
          className="p-1 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
