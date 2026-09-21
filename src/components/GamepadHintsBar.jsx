import React from 'react';
import { Gamepad2 } from 'lucide-react';

/**
 * Barre HUD flottante affichant les raccourcis de boutons manette selon le contexte actif.
 */
export default function GamepadHintsBar({ context = 'grid', t, isGamepadMode = true, isVisible = true }) {
  if (!isVisible && !isGamepadMode) return null;

  const ButtonBadge = ({ color, label, children }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2d]/80 border border-[#2b3a55]/60 shadow-sm backdrop-blur-md">
      <span
        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-black text-white shadow-sm ${color}`}
      >
        {children}
      </span>
      <span className="text-[12px] font-medium text-[#c4d1e6] whitespace-nowrap">{label}</span>
    </div>
  );

  const TriggerBadge = ({ label, children }) => (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2d]/80 border border-[#2b3a55]/60 shadow-sm backdrop-blur-md">
      <span className="px-1.5 h-5 rounded bg-[#2b3a55] flex items-center justify-center text-[10px] font-black text-white tracking-tight">
        {children}
      </span>
      <span className="text-[12px] font-medium text-[#c4d1e6] whitespace-nowrap">{label}</span>
    </div>
  );

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 px-4 py-2 rounded-2xl bg-[#090d16]/90 border border-[#1e293b] shadow-2xl shadow-black/80 backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2 duration-300 pointer-events-none select-none">
      <div className="flex items-center gap-1.5 text-[#1a9fff] font-bold text-[11px] uppercase tracking-wider pr-1 border-r border-[#1e293b]/80">
        <Gamepad2 className="w-4 h-4 text-[#1a9fff] animate-pulse" />
      </div>

      {context === 'modal' ? (
        <>
          <ButtonBadge color="bg-[#10b981]" label={t?.gamepadSelect || 'Sélectionner'}>
            A
          </ButtonBadge>
          <ButtonBadge color="bg-[#0284c7]" label={t?.gamepadFavorite || 'Favori'}>
            X
          </ButtonBadge>
          <ButtonBadge color="bg-[#f59e0b]" label={t?.gamepadApply || 'Appliquer'}>
            Y
          </ButtonBadge>
          <ButtonBadge color="bg-[#ef4444]" label={t?.gamepadBack || 'Fermer'}>
            B
          </ButtonBadge>
        </>
      ) : context === 'player' ? (
        <>
          <ButtonBadge color="bg-[#ef4444]" label={t?.gamepadBack || 'Quitter la vidéo'}>
            B
          </ButtonBadge>
          <ButtonBadge color="bg-[#f59e0b]" label={t?.gamepadApply || 'Appliquer à Steam'}>
            Y
          </ButtonBadge>
        </>
      ) : (
        <>
          <ButtonBadge color="bg-[#10b981]" label={t?.gamepadSelect || 'Aperçu / Lire'}>
            A
          </ButtonBadge>
          <ButtonBadge color="bg-[#0284c7]" label={t?.gamepadFavorite || 'Favori'}>
            X
          </ButtonBadge>
          <ButtonBadge color="bg-[#f59e0b]" label={t?.gamepadApply || 'Activer'}>
            Y
          </ButtonBadge>
          <TriggerBadge label={t?.gamepadTabs || 'Onglets'}>LB / RB</TriggerBadge>
        </>
      )}
    </div>
  );
}
