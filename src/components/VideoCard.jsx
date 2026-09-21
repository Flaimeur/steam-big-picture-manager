import React from 'react';
import { Play, Download, Star, Check, Trash2, Clock, Heart, Eye } from 'lucide-react';

export default function VideoCard({
  post,
  isInCollection,
  isActive,
  isFavorite,
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  onDelete,
  isCollectionView = false,
}) {
  const postId = String(post.id || post.vid_id || '');
  const title = post.title || 'Sans titre';
  const author = post.user?.steam_name || post.author || 'Inconnu';
  const duration = post.video_duration || post.duration || 0;
  const downloads = post.downloads || 0;
  const likes = post.likes || 0;
  const thumbUrl = post.thumbnail;
  const fav = isFavorite(postId);

  return (
    <div
      className={`rounded-2xl overflow-hidden flex flex-col group select-none transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:shadow-2xl hover:shadow-[#1a9fff]/10 ${
        isActive
          ? 'bg-[#131b2e] border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/15'
          : 'bg-[#161d2e] border border-[#1e293b] hover:border-[#1a9fff]/40 hover:bg-[#1a2340]'
      }`}
    >
      {/* Thumbnail */}
      <div
        onClick={() => onPlay(post)}
        className="relative w-full aspect-video bg-[#0d1117] cursor-pointer overflow-hidden group/thumb"
      >
        {thumbUrl ? (
          <img
            src={thumbUrl}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover/thumb:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#334155] text-xs font-medium bg-[#0f1626]">
            Aperçu indisponible
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover/thumb:opacity-100 transition-opacity duration-250 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center transform scale-75 group-hover/thumb:scale-100 transition-transform duration-300 border border-white/20">
            <Play className="w-6 h-6 text-white fill-current ml-0.5" />
          </div>
        </div>

        {/* Duration */}
        {duration > 0 && (
          <div className="absolute bottom-2.5 left-2.5 text-[10px] font-bold px-2 py-1 rounded-lg bg-black/70 backdrop-blur-sm text-white/90 border border-white/10">
            {duration}s
          </div>
        )}

        {/* Active badge */}
        {isActive && (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1 text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-500 text-white shadow-lg shadow-emerald-500/40">
            <Check className="w-3 h-3" /> Actif
          </div>
        )}

        {/* Eye icon */}
        <div className="absolute bottom-2.5 right-2.5">
          <Eye className="w-4 h-4 text-white/30" />
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex flex-col gap-2.5 flex-1">
        <h4
          onClick={() => onOpenDetails(post)}
          className="text-[13px] font-bold text-white/95 leading-snug line-clamp-2 cursor-pointer hover:text-[#38bdf8] transition-colors min-h-[36px]"
          style={{ fontFamily: "'Outfit', sans-serif" }}
          title={title}
        >
          {title}
        </h4>

        <div className="flex items-center justify-between text-[11px] text-[#546380]">
          <span className="font-medium truncate max-w-[110px]">{author}</span>
          <div className="flex items-center gap-3 font-semibold">
            {likes > 0 && (
              <span className="flex items-center gap-1 text-[#546380]">
                <Heart className="w-3 h-3" /> {likes}
              </span>
            )}
            {downloads > 0 && (
              <span className="flex items-center gap-1 text-[#546380]">
                <Download className="w-3 h-3" /> {downloads}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 pt-0 mt-auto flex items-center gap-2">
        {isActive ? (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 text-[11px] font-bold border border-emerald-500/25">
            <Check className="w-3.5 h-3.5" /> Actif dans Steam
          </div>
        ) : isInCollection ? (
          <button
            onClick={() => onApply(post)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a9fff] to-[#0070e0] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-[11px] font-bold shadow-md shadow-[#1a9fff]/20 transition-all active:scale-[0.97]"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> Activer
          </button>
        ) : (
          <button
            onClick={() => onDownload(post)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#1a2540] hover:bg-[#1e2d50] text-white/80 hover:text-white text-[11px] font-bold border border-[#1e293b] hover:border-[#1a9fff]/30 transition-all active:scale-[0.97]"
          >
            <Download className="w-3.5 h-3.5 text-[#1a9fff]" /> Installer
          </button>
        )}

        <button
          onClick={() => onToggleFavorite(post)}
          className={`p-2.5 rounded-xl border transition-all ${
            fav
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400 shadow-md shadow-amber-500/10'
              : 'bg-[#1a2540] border-[#1e293b] text-[#546380] hover:text-amber-400 hover:border-amber-500/30'
          }`}
          title={fav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        >
          <Star className={`w-3.5 h-3.5 ${fav ? 'fill-current' : ''}`} />
        </button>

        {isCollectionView && onDelete && (
          <button
            onClick={() => onDelete(postId, title)}
            className="p-2.5 rounded-xl bg-[#1a2540] border border-[#1e293b] text-[#546380] hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/25 transition-all"
            title="Supprimer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
