import React, { useState } from 'react';
import VideoCard from './VideoCard.jsx';
import {
  ListMusic,
  Plus,
  Dices,
  Trash2,
  FolderOpen,
  Film,
  ArrowLeft,
  Sparkles,
  Layers,
} from 'lucide-react';

export default function PlaylistsView({
  playlists = {},
  collection = {},
  activeStatus,
  isFavorite,
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  onCreatePlaylist,
  onDeletePlaylist,
  onRemoveFromPlaylist,
  onShufflePlaylist,
  t,
  lang = 'fr',
  isGamepadMode = false,
}) {
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newPlName, setNewPlName] = useState('');
  const [newPlDesc, setNewPlDesc] = useState('');

  const playlistList = Object.values(playlists);
  const selectedPlaylist = selectedPlaylistId ? playlists[selectedPlaylistId] : null;

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    await onCreatePlaylist({
      name: newPlName.trim(),
      description: newPlDesc.trim(),
    });
    setNewPlName('');
    setNewPlDesc('');
    setIsCreating(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#0d1117] text-[#f1f5f9] p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#1e293b]">
        <div className="flex items-center gap-3">
          {selectedPlaylist ? (
            <button
              onClick={() => setSelectedPlaylistId(null)}
              className="p-2.5 rounded-xl bg-[#161d2e] hover:bg-[#1e293b] text-[#8b9ab5] hover:text-white transition-all border border-[#1e293b]"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ListMusic className="w-5 h-5 text-white" />
            </div>
          )}
          <div>
            <h1 className="text-xl lg:text-2xl font-black text-white tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {selectedPlaylist ? selectedPlaylist.name : (t?.playlistsTitle || 'Mes Playlists d’Animations')}
            </h1>
            <p className="text-xs text-[#64748b] font-medium mt-0.5">
              {selectedPlaylist
                ? `${selectedPlaylist.videos?.length || 0} animation(s) dans cette sélection`
                : 'Créez des sélections thématiques et faites tourner vos animations préférées'}
            </p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center gap-3">
          {selectedPlaylist ? (
            <button
              onClick={() => onShufflePlaylist(selectedPlaylist.id)}
              disabled={!selectedPlaylist.videos || selectedPlaylist.videos.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#1a9fff] to-[#0060cc] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-xs font-bold shadow-lg shadow-[#1a9fff]/20 transition-all active:scale-95 disabled:opacity-40"
            >
              <Dices className="w-4 h-4 text-cyan-300" />
              <span>{t?.shufflePlaylist || 'Tirer au sort dans cette Playlist'}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{t?.createPlaylist || 'Créer une playlist'}</span>
            </button>
          )}
        </div>
      </div>

      {/* New Playlist Modal / Inline Form */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <form
            onSubmit={handleCreateSubmit}
            className="w-full max-w-md bg-[#0f1422] border border-[#1e293b] rounded-3xl p-6 shadow-2xl space-y-4"
          >
            <h3 className="text-base font-extrabold text-white font-display">
              {t?.createPlaylist || 'Créer une nouvelle playlist'}
            </h3>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                {t?.playlistName || 'Nom de la playlist'}
              </label>
              <input
                type="text"
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Ex: Animations Cyberpunk, Rétro 90s..."
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl bg-[#161d2e] border border-[#1e293b] text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                {t?.playlistDescription || 'Description'}
              </label>
              <input
                type="text"
                value={newPlDesc}
                onChange={(e) => setNewPlDesc(e.target.value)}
                placeholder="Description optionnelle..."
                className="w-full px-4 py-2.5 rounded-xl bg-[#161d2e] border border-[#1e293b] text-white text-sm focus:border-indigo-500 outline-none"
              />
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-[#8b9ab5] hover:text-white"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!newPlName.trim()}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 disabled:opacity-40"
              >
                Créer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mt-8 flex-1">
        {selectedPlaylist ? (
          /* Single Playlist Videos View */
          <div>
            {(!selectedPlaylist.videos || selectedPlaylist.videos.length === 0) ? (
              <div className="flex flex-col items-center justify-center text-center py-20 bg-[#131929]/30 rounded-3xl border border-white/5">
                <div className="w-16 h-16 rounded-2xl bg-[#161d2e] flex items-center justify-center text-indigo-400 mb-4 border border-[#1e293b]">
                  <Film className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  {t?.playlistEmpty || 'Cette playlist ne contient aucune animation.'}
                </h3>
                <p className="text-xs text-[#64748b] max-w-sm">
                  Parcourez le catalogue ou votre collection et cliquez sur "Ajouter à une playlist" pour enrichir cette sélection.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {selectedPlaylist.videos.map((post) => {
                  const postId = String(post.id || post.vid_id);
                  const isInCol = Boolean(collection[postId]);
                  const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === post.title;
                  const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === post.title;
                  const isActive = (post.type || 'boot_video') === 'boot_video' ? isBootActive : isSuspendActive;

                  return (
                    <div key={postId} className="relative group/plcard">
                      <VideoCard
                        post={post}
                        isInCollection={isInCol}
                        isActive={isActive}
                        isFavorite={isFavorite}
                        onPlay={onPlay}
                        onOpenDetails={onOpenDetails}
                        onDownload={onDownload}
                        onApply={onApply}
                        onToggleFavorite={onToggleFavorite}
                        onDelete={() => onRemoveFromPlaylist(selectedPlaylist.id, postId)}
                        isCollectionView={true}
                      />
                      <button
                        onClick={() => onRemoveFromPlaylist(selectedPlaylist.id, postId)}
                        title="Retirer de la playlist"
                        className="absolute top-3 right-3 z-20 p-2 rounded-xl bg-black/70 hover:bg-rose-600/90 text-white/70 hover:text-white backdrop-blur-md opacity-0 group-hover/plcard:opacity-100 transition-all duration-200 shadow-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Playlists List / Grid */
          <div>
            {playlistList.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center py-24 bg-[#131929]/30 rounded-3xl border border-white/5">
                <div className="w-20 h-20 rounded-3xl bg-[#161d2e] flex items-center justify-center text-indigo-400 mb-5 border border-[#1e293b] shadow-xl shadow-black/30">
                  <ListMusic className="w-9 h-9" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
                  Aucune playlist créée
                </h3>
                <p className="text-[13px] text-[#546380] max-w-sm mb-6 font-medium leading-relaxed">
                  Créez des listes personnalisées pour regrouper vos animations et configurer des rotations thématiques.
                </p>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white shadow-lg shadow-indigo-500/25 hover:scale-105 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>{t?.createPlaylist || 'Créer ma première playlist'}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {playlistList.map((pl) => {
                  const videoCount = pl.videos?.length || 0;
                  const firstVideoThumb = pl.videos?.[0]?.thumbnail;

                  return (
                    <div
                      key={pl.id}
                      onClick={() => setSelectedPlaylistId(pl.id)}
                      className="group cursor-pointer rounded-3xl bg-[#141b2c] border border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#182238] p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/10"
                    >
                      <div>
                        {/* Cover preview */}
                        <div className="w-full aspect-video rounded-2xl bg-[#090d16] border border-white/5 overflow-hidden relative mb-4 flex items-center justify-center">
                          {firstVideoThumb ? (
                            <img
                              src={firstVideoThumb}
                              alt={pl.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2 text-[#475569]">
                              <Layers className="w-8 h-8" />
                            </div>
                          )}
                          <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-sm text-[10px] font-bold text-white border border-white/10">
                            {videoCount} {videoCount > 1 ? 'vidéos' : 'vidéo'}
                          </div>
                        </div>

                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors font-display truncate">
                          {pl.name}
                        </h3>
                        {pl.description && (
                          <p className="text-xs text-[#64748b] line-clamp-2 mt-1 font-medium">
                            {pl.description}
                          </p>
                        )}
                      </div>

                      {/* Bottom actions */}
                      <div className="flex items-center justify-between pt-4 mt-3 border-t border-white/5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onShufflePlaylist(pl.id);
                          }}
                          disabled={videoCount === 0}
                          title="Tirer au sort dans cette playlist"
                          className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 disabled:opacity-30 transition-colors"
                        >
                          <Dices className="w-4 h-4" />
                          <span>Tirer au sort</span>
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t?.deletePlaylistConfirm?.replace('{name}', pl.name) || `Supprimer ${pl.name} ?`)) {
                              onDeletePlaylist(pl.id);
                            }
                          }}
                          title="Supprimer la playlist"
                          className="p-2 rounded-xl text-[#546380] hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
