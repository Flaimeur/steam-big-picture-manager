import React from 'react';
import { X, Play, Download, Star, Check, ExternalLink, User, Heart, Clock, Trash2, ListMusic } from 'lucide-react';

export default function DetailModal({
  post,
  isOpen,
  onClose,
  collection = {},
  activeStatus,
  onPlay,
  onDownload,
  onApply,
  onToggleFavorite,
  onDelete,
  onOpenAddToPlaylist,
  isFavorite,
}) {
  if (!isOpen || !post) return null;

  const postId = String(post.id || post.vid_id || '');
  const title = post.title || 'Sans titre';
  const author = post.user?.steam_name || post.author || 'Inconnu';
  const vtype = post.type || 'boot_video';
  const duration = post.video_duration || post.duration || 0;
  const downloads = post.downloads || 0;
  const likes = post.likes || 0;
  const thumbUrl = post.thumbnail;
  const webUrl = post.url || `https://steamdeckrepo.com/post/${postId}`;

  const isInCol = Boolean(collection[postId]);
  const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === title;
  const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === title;
  const isActive = vtype === 'boot_video' ? isBootActive : isSuspendActive;
  const fav = isFavorite(postId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-lg rounded-3xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <h3 className="text-sm font-extrabold text-white truncate max-w-sm font-display">Détails de l'animation</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#64748b] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview */}
        <div 
          onClick={() => {
            onClose();
            onPlay(post);
          }}
          className="w-full aspect-video bg-black relative cursor-pointer group"
        >
          {thumbUrl ? (
            <img src={thumbUrl} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#64748b] text-xs">
              Aperçu indisponible
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a9eff] text-white text-xs font-bold shadow-xl shadow-[#1a9eff]/50">
              <Play className="w-4 h-4 fill-current" />
              <span>Lire l'Aperçu Vidéo</span>
            </div>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[#1a9eff]/20 text-[#38bdf8] border border-[#1a9eff]/30">
                {vtype === 'boot_video' ? '🎬 Boot Animation' : '🌙 Suspend Screen'}
              </span>
              {isActive && (
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
                  Actif dans Steam
                </span>
              )}
            </div>
            <h2 className="text-lg font-extrabold text-white leading-tight font-display">{title}</h2>
          </div>

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-2.5 text-xs bg-white/[0.03] p-3.5 rounded-2xl border border-white/5">
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <User className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Créateur : <b className="text-white">{author}</b></span>
            </div>
            {duration > 0 && (
              <div className="flex items-center gap-2 text-[#94a3b8]">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Durée : <b className="text-white">{duration}s</b></span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span>Likes : <b className="text-white">{likes}</b></span>
            </div>
            <div className="flex items-center gap-2 text-[#94a3b8]">
              <Download className="w-3.5 h-3.5 text-[#38bdf8]" />
              <span>Téléchargements : <b className="text-white">{downloads}</b></span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                onClose();
                onPlay(post);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-full bg-gradient-to-r from-[#1a9eff] to-[#0077e6] hover:from-[#38adff] hover:to-[#1a9eff] text-white text-xs font-bold shadow-lg shadow-[#1a9eff]/30 transition-all hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Lire la Vidéo</span>
            </button>

            {isActive ? (
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Actif dans Steam</span>
              </div>
            ) : isInCol ? (
              <button
                onClick={() => {
                  onApply(collection[postId] || post);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Activer</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  onDownload(post);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all hover:scale-[1.02]"
              >
                <Download className="w-4 h-4 text-[#38bdf8]" />
                <span>Installer</span>
              </button>
            )}

            {isInCol && onDelete && (
              <button
                onClick={() => {
                  onClose();
                  onDelete(postId, title);
                }}
                className="p-2.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 hover:text-rose-300 transition-all hover:scale-105"
                title="Supprimer de la collection"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {onOpenAddToPlaylist && (
              <button
                onClick={() => {
                  onClose();
                  onOpenAddToPlaylist(post);
                }}
                className="p-2.5 rounded-full bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-indigo-400 hover:text-indigo-300 transition-all hover:scale-105"
                title="Ajouter à une playlist"
              >
                <ListMusic className="w-4 h-4" />
              </button>
            )}

            <button
              onClick={() => onToggleFavorite(post)}
              className={`p-2.5 rounded-full border transition-all ${
                fav
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  : 'bg-white/5 border-white/10 text-[#64748b] hover:text-amber-400'
              }`}
            >
              <Star className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
            </button>

            <a
              href={webUrl}
              target="_blank"
              rel="noreferrer"
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#94a3b8] hover:text-white transition-all"
              title="Ouvrir sur steamdeckrepo.com"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
