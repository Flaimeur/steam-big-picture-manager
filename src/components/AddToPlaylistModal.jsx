import React, { useState } from 'react';
import { X, ListMusic, Plus, Check, Film } from 'lucide-react';

export default function AddToPlaylistModal({
  isOpen,
  onClose,
  post,
  playlists = {},
  onAddToPlaylist,
  onCreateAndAdd,
  t,
  lang = 'fr',
}) {
  const [newPlName, setNewPlName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isOpen || !post) return null;

  const playlistList = Object.values(playlists);
  const postId = String(post.id || post.vid_id || '');

  const handleCreateAndAddSubmit = async (e) => {
    e.preventDefault();
    if (!newPlName.trim()) return;
    await onCreateAndAdd(newPlName.trim(), post);
    setNewPlName('');
    setIsCreatingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-3xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <ListMusic className="w-4 h-4" />
            </div>
            <h3 className="text-base font-extrabold text-white font-display">
              {t?.addToPlaylist || 'Ajouter à une playlist'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#64748b] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Post preview pill */}
        <div className="px-6 py-3 bg-white/[0.02] border-b border-white/5 flex items-center gap-3">
          {post.thumbnail ? (
            <img src={post.thumbnail} alt={post.title} className="w-12 h-8 rounded-lg object-cover bg-black" />
          ) : (
            <div className="w-12 h-8 rounded-lg bg-[#141b2d] flex items-center justify-center text-[#546380]">
              <Film className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{post.title || 'Sans titre'}</div>
            <div className="text-[10px] text-[#64748b] font-medium">
              {post.type === 'suspend_video' ? 'Suspend Screen' : 'Boot Animation'}
            </div>
          </div>
        </div>

        {/* Playlists Selection List */}
        <div className="p-6 space-y-2.5 max-h-72 overflow-y-auto">
          {playlistList.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#64748b]">
              Aucune playlist existante. Créez-en une ci-dessous !
            </div>
          ) : (
            playlistList.map((pl) => {
              const containsVideo = pl.videos?.some((v) => String(v.id || v.vid_id) === postId);

              return (
                <button
                  key={pl.id}
                  onClick={async () => {
                    await onAddToPlaylist(pl.id, post);
                    onClose();
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all text-left ${
                    containsVideo
                      ? 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300'
                      : 'bg-[#131b2e] border-[#1e293b] hover:border-indigo-500/50 hover:bg-[#18233c] text-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold font-display">{pl.name}</div>
                    <div className="text-[10px] text-[#64748b]">{pl.videos?.length || 0} animation(s)</div>
                  </div>
                  {containsVideo && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-400">
                      <Check className="w-3.5 h-3.5" />
                      <span>Déjà dedans</span>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Inline Create New Playlist */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/40">
          {isCreatingNew ? (
            <form onSubmit={handleCreateAndAddSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={newPlName}
                onChange={(e) => setNewPlName(e.target.value)}
                placeholder="Nom de la nouvelle playlist..."
                autoFocus
                className="flex-1 px-3 py-2 rounded-xl bg-[#141b2d] border border-[#1e293b] text-white text-xs focus:border-indigo-500 outline-none"
              />
              <button
                type="submit"
                disabled={!newPlName.trim()}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold disabled:opacity-40"
              >
                Créer & Ajouter
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="p-2 text-[#64748b] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[#2b3a55] hover:border-indigo-400 text-xs font-bold text-[#8b9ab5] hover:text-white transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Créer une nouvelle playlist</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
