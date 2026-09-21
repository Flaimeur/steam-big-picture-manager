import React, { useState } from 'react';
import { Play, Info, Download, Star, Check, ChevronLeft, ChevronRight, Flame } from 'lucide-react';

export default function HeroTrending({
  posts = [],
  collection = {},
  activeStatus,
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  isFavorite,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!posts || posts.length === 0) return null;

  const heroPosts = posts.slice(0, 5);
  const currentPost = heroPosts[currentIndex] || heroPosts[0];

  const postId = String(currentPost.id);
  const title = currentPost.title || 'Sans titre';
  const author = currentPost.user?.steam_name || 'Inconnu';
  const vtype = currentPost.type || 'boot_video';
  const duration = currentPost.video_duration || 0;
  const thumbUrl = currentPost.thumbnail;

  const isInCollection = Boolean(collection[postId]);
  const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === title;
  const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === title;
  const isActive = vtype === 'boot_video' ? isBootActive : isSuspendActive;
  const fav = isFavorite(postId);

  const prev = () => {
    setCurrentIndex((p) => (p === 0 ? heroPosts.length - 1 : p - 1));
  };

  const next = () => {
    setCurrentIndex((p) => (p === heroPosts.length - 1 ? 0 : p + 1));
  };

  return (
    <div className="mx-6 mb-6 p-4 rounded-xl bg-[#10141f] border border-white/5 flex items-center justify-between gap-6 relative overflow-hidden">
      {/* Left content */}
      <div className="flex-1 space-y-2 z-10">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
            <Flame className="w-3 h-3" />
            Tendance
          </span>
          <span className="text-[10px] text-[#64748b]">
            Par {author} {duration > 0 ? `• ${duration}s` : ''}
          </span>
        </div>

        <h3 className="text-base md:text-lg font-bold text-white font-display line-clamp-1">
          {title}
        </h3>

        {/* Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => onPlay(currentPost)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#1a9eff] hover:bg-[#0084f0] text-white text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Aperçu</span>
          </button>

          {isActive ? (
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/40 text-emerald-400 text-xs font-semibold">
              <Check className="w-3.5 h-3.5" />
              <span>Actif dans Steam</span>
            </div>
          ) : isInCollection ? (
            <button
              onClick={() => onApply(collection[postId] || currentPost)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Activer</span>
            </button>
          ) : (
            <button
              onClick={() => onDownload(currentPost)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white text-xs font-semibold border border-white/5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#1a9eff]" />
              <span>Installer</span>
            </button>
          )}

          <button
            onClick={() => onOpenDetails(currentPost)}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
            title="Détails"
          >
            <Info className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => onToggleFavorite(currentPost)}
            className={`p-1.5 rounded-lg transition-colors ${
              fav ? 'text-amber-400' : 'text-[#64748b] hover:text-amber-400'
            }`}
            title="Favoris"
          >
            <Star className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Right thumbnail & controls */}
      <div className="flex items-center gap-3 flex-shrink-0 z-10">
        <div
          onClick={() => onPlay(currentPost)}
          className="w-40 aspect-video rounded-lg overflow-hidden bg-black/60 relative cursor-pointer group"
        >
          {thumbUrl ? (
            <img src={thumbUrl} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">Aperçu</div>
          )}
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-5 h-5 text-white fill-current" />
          </div>
        </div>

        {/* Next / Prev */}
        <div className="flex flex-col gap-1">
          <button onClick={prev} className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#94a3b8]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={next} className="p-1 rounded bg-white/5 hover:bg-white/10 text-[#94a3b8]">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
