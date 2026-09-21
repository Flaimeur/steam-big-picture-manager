import React, { useRef, useState, useEffect } from 'react';
import { Play, Heart, Download, ChevronLeft, ChevronRight, Volume2, VolumeX, Check, Sparkles } from 'lucide-react';

export default function HeroShowcase({
  posts = [],
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  isFavorite,
  collection = {},
  activeStatus,
}) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  const items = (posts || []).slice(0, 5);

  useEffect(() => {
    if (items.length <= 1) return;
    timerRef.current = setInterval(() => {
      setFading(true);
      setTimeout(() => {
        setIdx((i) => (i + 1) % items.length);
        setFading(false);
      }, 350);
    }, 9000);
    return () => clearInterval(timerRef.current);
  }, [items.length]);

  // When index changes, replay video
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }, [idx]);

  if (items.length === 0) return null;

  const post = items[idx];
  const postId = String(post?.id || post?.vid_id || '');
  const title = post?.title || 'Animation';
  const author = post?.user?.steam_name || post?.author || '';
  const likes = post?.likes || 0;
  const downloads = post?.downloads || 0;
  const thumb = post?.thumbnail;
  const vtype = post?.type || 'boot_video';

  const localFile = post?.local_file || collection[postId]?.local_file;
  const videoSrc = localFile
    ? `/media/local?path=${encodeURIComponent(localFile)}`
    : (post?.video_preview || post?.video || post?.url || '');

  const isInCol = Boolean(collection[postId]);
  const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === title;
  const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === title;
  const isActive = vtype === 'boot_video' ? isBootActive : isSuspendActive;
  const fav = isFavorite ? isFavorite(postId) : false;

  const go = (i) => {
    if (timerRef.current) clearInterval(timerRef.current);
    setFading(true);
    setTimeout(() => {
      setIdx(i);
      setFading(false);
    }, 300);
  };

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden group/hero mb-7 border border-[#1e293b]/80 shadow-2xl shadow-black/50 bg-[#0c101c]"
      style={{ minHeight: '320px', height: '340px' }}
    >
      {/* Background Media */}
      <div className={`absolute inset-0 transition-opacity duration-500 overflow-hidden ${fading ? 'opacity-0' : 'opacity-100'}`}>
        {videoSrc ? (
          <video
            ref={videoRef}
            key={videoSrc}
            src={videoSrc}
            poster={thumb}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            className="w-full h-full object-cover scale-[1.03] transform origin-center transition-transform duration-700"
          />
        ) : thumb ? (
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `url(${thumb})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 30%',
            }}
          />
        ) : (
          <div className="w-full h-full bg-[#131b2e]" />
        )}
      </div>

      {/* Aesthetic Gradients & Overlays for perfect legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0b0e17] via-[#0b0e17]/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e17] via-[#0b0e17]/70 to-transparent w-full md:w-3/4" />
      <div className="absolute inset-0 bg-black/20" />

      {/* Arrows */}
      {items.length > 1 && (
        <>
          <button
            onClick={() => go((idx - 1 + items.length) % items.length)}
            aria-label="Précédent"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/70 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-all hover:scale-105 shadow-xl"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={() => go((idx + 1) % items.length)}
            aria-label="Suivant"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/70 hover:text-white hover:bg-black/90 flex items-center justify-center opacity-0 group-hover/hero:opacity-100 transition-all hover:scale-105 shadow-xl"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {/* Sound Toggle Button in Hero */}
      {videoSrc && (
        <button
          onClick={() => setIsMuted(!isMuted)}
          title={isMuted ? 'Activer le son' : 'Couper le son'}
          className="absolute top-4 right-4 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/15 text-white/80 hover:text-white text-[11px] font-semibold transition-all shadow-lg"
        >
          {isMuted ? (
            <>
              <VolumeX className="w-4 h-4 text-[#94a3b8]" />
              <span className="hidden sm:inline">Muet</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-[#38bdf8] animate-pulse" />
              <span className="hidden sm:inline text-[#38bdf8]">Son activé</span>
            </>
          )}
        </button>
      )}

      {/* Hero Content */}
      <div className={`absolute bottom-0 left-0 right-0 pl-20 pr-6 py-6 sm:pl-24 sm:pr-8 sm:py-8 z-20 flex flex-col justify-end transition-all duration-500 max-w-3xl ${fading ? 'opacity-0 translate-y-2' : 'opacity-100'}`}>
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30">
            <Sparkles className="w-3 h-3" /> EN VEDETTE
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white/90 border border-white/15 shadow-sm">
            {vtype === 'boot_video' ? '🎬 BOOT ANIMATION' : '🌙 SUSPEND SCREEN'}
          </span>
          {isActive && (
            <span className="flex items-center gap-1 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              <Check className="w-3 h-3" /> ACTIF DANS STEAM
            </span>
          )}
        </div>

        {/* Title with overflow protection */}
        <h2
          onClick={() => onOpenDetails && onOpenDetails(post)}
          className="text-2xl sm:text-3xl font-black text-white leading-snug sm:leading-tight mb-2.5 drop-shadow-2xl cursor-pointer hover:text-[#38bdf8] transition-colors line-clamp-2 break-words"
          style={{ fontFamily: "'Outfit', sans-serif" }}
          title={title}
        >
          {title}
        </h2>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 text-xs text-white/75 mb-4">
          {author && (
            <span className="font-semibold text-white/95 flex items-center gap-1.5">
              Par <span className="text-[#38bdf8]">{author}</span>
            </span>
          )}
          {downloads > 0 && (
            <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
              <Download className="w-3.5 h-3.5 text-white/60" /> {downloads.toLocaleString()}
            </span>
          )}
          {likes > 0 && (
            <span className="flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-lg border border-white/10">
              <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" /> {likes.toLocaleString()}
            </span>
          )}
        </div>

        {/* Quick Actions in Banner */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onPlay && onPlay(post)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a9fff] to-[#0070e0] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-xs font-bold shadow-lg shadow-[#1a9fff]/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Plein écran</span>
          </button>

          {onApply && (
            <button
              onClick={() => onApply(post)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/15'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isActive ? 'Active dans Steam' : 'Activer'}</span>
            </button>
          )}

          {onDownload && !isInCol && (
            <button
              onClick={() => onDownload(post)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all"
              title="Télécharger dans ma collection"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Télécharger</span>
            </button>
          )}

          {onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(post)}
              className={`p-2.5 rounded-xl border transition-all ${
                fav
                  ? 'bg-amber-400/20 text-amber-300 border-amber-400/40'
                  : 'bg-white/10 hover:bg-white/20 text-white/70 hover:text-white border-white/15'
              }`}
              title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            >
              <Heart className={`w-4 h-4 ${fav ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Progress Dots */}
      {items.length > 1 && (
        <div className="absolute bottom-5 right-6 z-20 flex items-center gap-2">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              aria-label={`Slide ${i + 1}`}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === idx
                  ? 'w-7 bg-[#1a9fff] shadow-md shadow-[#1a9fff]/50'
                  : 'w-2 bg-white/30 hover:bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
