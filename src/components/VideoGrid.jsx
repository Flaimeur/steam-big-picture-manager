import React, { useState } from 'react';
import VideoCard from './VideoCard.jsx';
import HeroShowcase from './HeroShowcase.jsx';
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Flame,
  Heart,
  Download,
  Clock,
  Search,
  X,
  Gamepad2,
  PauseCircle,
  Layers,
  Dices,
  Check,
  Star,
  Filter,
  Tag,
  Sparkles,
} from 'lucide-react';

export default function VideoGrid({
  posts = [],
  loading = false,
  collection = {},
  activeStatus,
  isFavorite,
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  onDelete,
  onPickRandom,
  page = 1,
  onPrevPage,
  onNextPage,
  onPageChange,
  hasMore = true,
  isCollectionView = false,
  showPagination = true,
  emptyMessage = "Aucune animation trouvée.",
  activeTab,
  onTabChange,
  sortOption,
  setSortOption,
  searchQuery,
  setSearchQuery,
  lang = 'fr',
  t,
  focusedIndex = null,
  isGamepadMode = false,
}) {
  const [personalCategoryFilter, setPersonalCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [inputPage, setInputPage] = useState(String(page));

  const siteTags = [
    { id: '', label: 'Tout', icon: '✨' },
    { id: 'PlayStation', label: 'PlayStation', icon: '🎮' },
    { id: 'Nintendo', label: 'Nintendo', icon: '🍄' },
    { id: 'Xbox', label: 'Xbox', icon: '🟢' },
    { id: 'Anime', label: 'Anime', icon: '🏮' },
    { id: 'Cyberpunk', label: 'Cyberpunk', icon: '⚡' },
    { id: 'Valve', label: 'Valve / Portal', icon: '🌌' },
    { id: 'Windows', label: 'Windows', icon: '🪟' },
    { id: 'Retro', label: 'Rétro & Arcade', icon: '🕹️' },
    { id: 'OLED', label: 'OLED Live', icon: '📺' },
    { id: 'Elden Ring', label: 'Elden Ring', icon: '⚔️' },
    { id: 'Spider-Man', label: 'Spider-Man', icon: '🕷️' },
    { id: 'Hollow Knight', label: 'Hollow Knight', icon: '🗡️' },
    { id: 'Persona', label: 'Persona', icon: '🃏' },
    { id: 'Meme', label: 'Memes & Drôle', icon: '🐸' },
  ];

  React.useEffect(() => {
    setInputPage(String(page));
  }, [page]);

  React.useEffect(() => {
    if (isGamepadMode && focusedIndex !== null && filteredPosts[focusedIndex]) {
      const postId = String(filteredPosts[focusedIndex].id || filteredPosts[focusedIndex].vid_id);
      const el = document.getElementById(`video-card-${postId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }
    }
  }, [focusedIndex, isGamepadMode, filteredPosts]);

  const handlePageSubmit = (e) => {
    if (e) e.preventDefault();
    const parsed = parseInt(inputPage, 10);
    if (!isNaN(parsed) && parsed >= 1) {
      if (onPageChange) onPageChange(parsed);
    } else {
      setInputPage(String(page));
    }
  };

  const isCatalog = activeTab === 'boot_video' || activeTab === 'suspend_video';
  const isPersonal = activeTab === 'collection' || activeTab === 'favorites';

  const pageTitle = activeTab === 'boot_video' ? (t?.tabBoot || 'Boot Animations')
    : activeTab === 'suspend_video' ? (t?.tabSuspend || 'Suspend Screens')
    : activeTab === 'favorites' ? (t?.tabFavorites || 'Mes Favoris')
    : activeTab === 'collection' ? (t?.tabCollection || 'Ma Collection')
    : 'Animations';

  const filterChips = [
    { id: 'trending', label: t?.sortTrending || (lang === 'en' ? 'Trending' : 'Tendances'), icon: Flame },
    { id: 'likes-desc', label: t?.sortTop || (lang === 'en' ? 'Top Rated' : 'Plus Aimés'), icon: Heart },
    { id: 'downloads-desc', label: t?.sortDownloads || (lang === 'en' ? 'Popular' : 'Populaires'), icon: Download },
    { id: 'created_at-desc', label: t?.sortNewest || (lang === 'en' ? 'Newest' : 'Récents'), icon: Clock },
  ];

  const bootTitle = activeStatus?.boot_title && activeStatus.boot_title !== 'Par défaut Steam' ? activeStatus.boot_title : null;
  const suspendTitle = activeStatus?.suspend_title && activeStatus.suspend_title !== 'Par défaut Steam' ? activeStatus.suspend_title : null;

  // Filter personal items if in collection or favorites
  let filteredPosts = isPersonal
    ? posts.filter((item) => {
        if (personalCategoryFilter === 'all') return true;
        const itemType = item.type || 'boot_video';
        return itemType === personalCategoryFilter;
      })
    : posts;

  if (statusFilter !== 'all') {
    filteredPosts = filteredPosts.filter((item) => {
      const postId = String(item.id || item.vid_id || '');
      if (statusFilter === 'favorites') return isFavorite ? isFavorite(postId) : false;
      if (statusFilter === 'installed') return Boolean(collection[postId]);
      if (statusFilter === 'short') {
        const dur = item.video_duration || item.duration || 0;
        return dur > 0 && dur <= 10;
      }
      return true;
    });
  }

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden bg-[#0e131f] h-full">
      <div className="p-6 md:p-8 max-w-[1580px] mx-auto">
        {/* Top Header & Category Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h1
                className="text-2xl sm:text-3xl font-black text-white uppercase tracking-wider font-display"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                {pageTitle}
              </h1>

              {/* Badges for counts in collection/favorites */}
              {isPersonal && (
                <span className="px-3 py-1 rounded-xl bg-[#1a9fff]/15 text-[#38bdf8] border border-[#1a9fff]/30 text-xs font-black">
                  {filteredPosts.length} animation{filteredPosts.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-[#546380] font-medium mt-1">
              {activeTab === 'boot_video' && "Animations jouées au démarrage du Steam Deck ou du mode Big Picture."}
              {activeTab === 'suspend_video' && "Écrans et animations lors de la mise en veille de votre console / Steam."}
              {activeTab === 'collection' && "Toutes vos animations téléchargées prêtes à être appliquées."}
              {activeTab === 'favorites' && "Vos animations coups de cœur sauvegardées pour un accès rapide."}
            </p>
          </div>

          {/* Quick Category Toggle Pills */}
          {isCatalog && onTabChange && (
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#141a2c] border border-[#1e293b] self-start sm:self-auto shadow-inner shadow-black/20">
              <button
                onClick={() => onTabChange('boot_video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'boot_video'
                    ? 'bg-gradient-to-r from-[#1a9fff] to-[#0070e0] text-white shadow-md shadow-[#1a9fff]/30'
                    : 'text-[#64748b] hover:text-white hover:bg-[#1a233a]'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5" />
                <span>Boot Videos</span>
              </button>
              <button
                onClick={() => onTabChange('suspend_video')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                  activeTab === 'suspend_video'
                    ? 'bg-gradient-to-r from-[#1a9fff] to-[#0070e0] text-white shadow-md shadow-[#1a9fff]/30'
                    : 'text-[#64748b] hover:text-white hover:bg-[#1a233a]'
                }`}
              >
                <PauseCircle className="w-3.5 h-3.5" />
                <span>Suspend Videos</span>
              </button>
            </div>
          )}

          {/* Category Filter & Actions for Collection & Favorites */}
          {isPersonal && (
            <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#141a2c] border border-[#1e293b] shadow-inner shadow-black/20">
                <button
                  onClick={() => setPersonalCategoryFilter('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    personalCategoryFilter === 'all'
                      ? 'bg-[#1a9fff] text-white shadow-md shadow-[#1a9fff]/20'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tous</span>
                </button>
                <button
                  onClick={() => setPersonalCategoryFilter('boot_video')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    personalCategoryFilter === 'boot_video'
                      ? 'bg-[#1a9fff] text-white shadow-md shadow-[#1a9fff]/20'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  <Gamepad2 className="w-3.5 h-3.5" />
                  <span>Boot</span>
                </button>
                <button
                  onClick={() => setPersonalCategoryFilter('suspend_video')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    personalCategoryFilter === 'suspend_video'
                      ? 'bg-[#1a9fff] text-white shadow-md shadow-[#1a9fff]/20'
                      : 'text-[#64748b] hover:text-white'
                  }`}
                >
                  <PauseCircle className="w-3.5 h-3.5" />
                  <span>Suspend</span>
                </button>
              </div>

              {/* Tirage Aléatoire button (uniquement dans Ma Collection) */}
              {activeTab === 'collection' && onPickRandom && (
                <button
                  onClick={onPickRandom}
                  disabled={posts.length === 0}
                  title="Tirer au sort une vidéo de votre collection et l'activer dans Steam"
                  className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-black transition-all shadow-lg active:scale-95 ${
                    posts.length === 0
                      ? 'opacity-40 cursor-not-allowed bg-[#141a2c] text-[#64748b] border border-[#1e293b]'
                      : 'bg-gradient-to-r from-[#0090ff] to-[#0055c4] hover:from-[#33a8ff] hover:to-[#0070e8] text-white shadow-[#1a9fff]/25 hover:shadow-[#1a9fff]/45 hover:scale-[1.02]'
                  }`}
                >
                  <Dices className="w-4 h-4 text-cyan-300" />
                  <span>Tirage Aléatoire</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Hero Video Showcase Banner */}
        {isCatalog && posts.length > 0 && !loading && page === 1 && (
          <HeroShowcase
            posts={posts}
            onPlay={onPlay}
            onOpenDetails={onOpenDetails}
            onDownload={onDownload}
            onApply={onApply}
            onToggleFavorite={onToggleFavorite}
            isFavorite={isFavorite}
            collection={collection}
            activeStatus={activeStatus}
          />
        )}

        {/* Toolbar: Search, Sort chips, Status */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 bg-[#131929]/70 p-3 rounded-2xl border border-[#1e293b]/70 backdrop-blur-md">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#475569] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une animation..."
                className="w-full bg-[#161d2e] border border-[#1e293b] focus:border-[#1a9fff]/60 focus:bg-[#1a243c] text-white text-[12px] rounded-xl pl-10 pr-8 py-2.5 outline-none transition-all placeholder-[#475569] shadow-inner shadow-black/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Filters (Catalog only) */}
            {isCatalog && setSortOption && (
              <div className="flex items-center gap-1 bg-[#161d2e] p-1 rounded-xl border border-[#1e293b]">
                {filterChips.map((chip) => {
                  const Icon = chip.icon;
                  const active = sortOption === chip.id;
                  return (
                    <button
                      key={chip.id}
                      onClick={() => setSortOption(chip.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                        active
                          ? 'bg-[#1a9fff] text-white shadow-md shadow-[#1a9fff]/25'
                          : 'text-[#546380] hover:text-white hover:bg-[#1e293b]'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {chip.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Filter Pills (replacing old status badges) */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 bg-[#161d2e] p-1 rounded-xl border border-[#1e293b]">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#1a9fff] text-white shadow-md shadow-[#1a9fff]/25'
                    : 'text-[#546380] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                Tous
              </button>

              <button
                onClick={() => setStatusFilter('installed')}
                title="Afficher uniquement les vidéos installées dans votre collection"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === 'installed'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                    : 'text-[#546380] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Installées</span>
              </button>

              <button
                onClick={() => setStatusFilter('favorites')}
                title="Afficher uniquement vos animations favorites"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === 'favorites'
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'text-[#546380] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                <Star className="w-3 h-3" />
                <span>Favoris</span>
              </button>

              <button
                onClick={() => setStatusFilter('short')}
                title="Animations courtes (durée ≤ 10s)"
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
                  statusFilter === 'short'
                    ? 'bg-purple-500 text-white shadow-md shadow-purple-500/25'
                    : 'text-[#546380] hover:text-white hover:bg-[#1e293b]'
                }`}
              >
                <Clock className="w-3 h-3" />
                <span>≤ 10s</span>
              </button>
            </div>
          </div>
        </div>

        {/* Thematic Tags Bar (SteamDeckRepo Tags) */}
        {isCatalog && (
          <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-[#1e293b] scrollbar-track-transparent">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748b] flex items-center gap-1.5 flex-shrink-0 pl-1 pr-2 select-none">
              <Tag className="w-3.5 h-3.5 text-[#38bdf8]" />
              Tags :
            </span>
            {siteTags.map((tag) => {
              const isSelected = (!searchQuery && tag.id === '') || (searchQuery.toLowerCase() === tag.id.toLowerCase());
              return (
                <button
                  key={tag.id}
                  onClick={() => setSearchQuery(isSelected && tag.id !== '' ? '' : tag.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#1a9fff] to-[#0070e0] text-white shadow-md shadow-[#1a9fff]/30 border border-[#38bdf8]/40 scale-[1.02]'
                      : 'bg-[#141a2c] hover:bg-[#1a233a] text-[#8b9ab5] hover:text-white border border-[#1e293b]'
                  }`}
                >
                  <span>{tag.icon}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Video Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-2xl overflow-hidden bg-[#161d2e] border border-[#1e293b]">
                <div className="w-full aspect-video skeleton-shimmer" />
                <div className="p-4 space-y-3">
                  <div className="h-4 skeleton-shimmer rounded-lg w-3/4" />
                  <div className="flex justify-between">
                    <div className="h-3 skeleton-shimmer rounded-lg w-1/3" />
                    <div className="h-3 skeleton-shimmer rounded-lg w-1/4" />
                  </div>
                  <div className="h-10 skeleton-shimmer rounded-xl mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24 bg-[#131929]/30 rounded-3xl border border-white/5">
            <div className="w-20 h-20 rounded-3xl bg-[#161d2e] flex items-center justify-center text-[#1a9fff] mb-5 border border-[#1e293b] shadow-xl shadow-black/30">
              <Inbox className="w-9 h-9" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {emptyMessage}
            </h3>
            <p className="text-[13px] text-[#546380] max-w-sm mb-6 font-medium leading-relaxed">
              {isCollectionView
                ? "Téléchargez des animations depuis Boot Videos ou Suspend Videos pour les retrouver ici."
                : "Essayez avec d'autres mots-clés ou modifiez les filtres de tri."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredPosts.map((post, idx) => {
              const postId = String(post.id || post.vid_id);
              const isInCol = Boolean(collection[postId]);
              const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === post.title;
              const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === post.title;
              const isActive = (post.type || 'boot_video') === 'boot_video' ? isBootActive : isSuspendActive;

              return (
                <VideoCard
                  key={postId}
                  post={post}
                  isInCollection={isInCol}
                  isActive={isActive}
                  isFavorite={isFavorite}
                  onPlay={onPlay}
                  onOpenDetails={onOpenDetails}
                  onDownload={onDownload}
                  onApply={onApply}
                  onToggleFavorite={onToggleFavorite}
                  onDelete={onDelete}
                  isCollectionView={isCollectionView}
                  isFocused={isGamepadMode && focusedIndex === idx}
                />
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {showPagination && filteredPosts.length > 0 && !loading && (
          <div className="mt-10 pb-6 flex items-center justify-center gap-3">
            <button
              onClick={onPrevPage}
              disabled={page <= 1}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                page <= 1
                  ? 'opacity-20 cursor-not-allowed bg-[#161d2e] border-[#1e293b] text-[#334155]'
                  : 'bg-[#161d2e] hover:bg-[#1e2d50] text-white border-[#1e293b] hover:border-[#1a9fff]/30 shadow-md shadow-black/20'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Précédent
            </button>

            <form
              onSubmit={handlePageSubmit}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#1a9fff]/15 border border-[#1a9fff]/30 text-[12px] shadow-md shadow-[#1a9fff]/10 focus-within:border-[#1a9fff] focus-within:bg-[#1a9fff]/20 transition-all"
            >
              <span
                className="font-black text-white uppercase text-[12px] tracking-wider select-none"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Page
              </span>
              <input
                type="number"
                min="1"
                value={inputPage}
                onChange={(e) => setInputPage(e.target.value)}
                onBlur={handlePageSubmit}
                className="w-11 bg-[#162038] hover:bg-[#1a2644] focus:bg-[#1f2e54] border border-[#1a9fff]/30 focus:border-[#1a9fff] text-white text-center font-black text-[13px] rounded-lg py-1 px-1 outline-none transition-all shadow-inner [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                style={{ fontFamily: "'Outfit', sans-serif" }}
                title="Tapez un numéro de page et appuyez sur Entrée"
              />
            </form>

            <button
              onClick={onNextPage}
              disabled={!hasMore}
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl border text-[12px] font-bold transition-all ${
                !hasMore
                  ? 'opacity-20 cursor-not-allowed bg-[#161d2e] border-[#1e293b] text-[#334155]'
                  : 'bg-[#161d2e] hover:bg-[#1e2d50] text-white border-[#1e293b] hover:border-[#1a9fff]/30 shadow-md shadow-black/20'
              }`}
            >
              Suivant
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
