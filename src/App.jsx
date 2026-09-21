import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar.jsx';
import VideoGrid from './components/VideoGrid.jsx';
import SettingsView from './components/SettingsView.jsx';
import VideoPlayerModal from './components/VideoPlayerModal.jsx';
import DetailModal from './components/DetailModal.jsx';
import Toast from './components/Toast.jsx';
import { api } from './api.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('boot_video');
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [sortOption, setSortOption] = useState('trending');
  
  const [collection, setCollection] = useState({});
  const [favorites, setFavorites] = useState({});
  const [steamStatus, setSteamStatus] = useState(null);
  const [autoShuffle, setAutoShuffle] = useState(false);

  const [activePlayerPost, setActivePlayerPost] = useState(null);
  const [activeDetailPost, setActiveDetailPost] = useState(null);
  const [toast, setToast] = useState(null);

  const debounceTimerRef = useRef(null);

  // Debounce search
  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(debounceTimerRef.current);
  }, [searchQuery]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.message === message ? null : curr));
    }, 4000);
  };

  const refreshStatus = useCallback(async () => {
    try {
      const data = await api.getStatus();
      setSteamStatus(data);
      setAutoShuffle(Boolean(data.auto_shuffle));
    } catch (e) {
      console.error('Erreur statut:', e);
    }
  }, []);

  const refreshCollection = useCallback(async () => {
    try {
      const data = await api.getCollection();
      const colMap = {};
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => {
          if (v && typeof v === 'object') {
            colMap[k] = { ...v, id: v.id || k };
          }
        });
      }
      setCollection(colMap);
    } catch (e) {
      console.error('Erreur collection:', e);
    }
  }, []);

  const refreshFavorites = useCallback(async () => {
    try {
      const data = await api.getFavorites();
      const favMap = {};
      if (data && typeof data === 'object') {
        Object.entries(data).forEach(([k, v]) => {
          if (v && typeof v === 'object') {
            favMap[k] = { ...v, id: v.id || k };
          }
        });
      }
      setFavorites(favMap);
    } catch (e) {
      console.error('Erreur favoris:', e);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
    refreshCollection();
    refreshFavorites();
  }, [refreshStatus, refreshCollection, refreshFavorites]);

  const fetchCatalogPosts = useCallback(async () => {
    if (activeTab !== 'boot_video' && activeTab !== 'suspend_video') return;
    setLoading(true);
    try {
      const data = await api.getPosts({
        page,
        sort: sortOption,
        search: debouncedSearch,
        videoType: activeTab,
      });
      const items = data.posts || [];
      setPosts(items);
      setHasMore(items.length >= 12);
    } catch (err) {
      showToast('Impossible de contacter SteamDeckRepo.', 'error');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, sortOption, debouncedSearch]);

  useEffect(() => {
    if (activeTab === 'boot_video' || activeTab === 'suspend_video') {
      fetchCatalogPosts();
    }
  }, [activeTab, page, sortOption, debouncedSearch, fetchCatalogPosts]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setPage(1);
    setSearchQuery('');
  };

  const handleToggleFavorite = async (post) => {
    const postId = String(post?.id || post?.vid_id || '');
    if (!postId || postId === 'undefined') {
      showToast('Impossible d’identifier cette animation.', 'error');
      return;
    }
    try {
      const payload = {
        ...post,
        id: postId,
        title: post.title || 'Sans titre',
      };
      const res = await api.toggleFavorite(payload);
      await refreshFavorites();
      showToast(res.is_fav ? `⭐ '${payload.title}' ajouté aux favoris !` : `'${payload.title}' retiré des favoris.`);
    } catch (err) {
      showToast(err.message || 'Erreur favoris', 'error');
    }
  };

  const isFavorite = (postId) => {
    if (!postId || postId === 'undefined') return false;
    return Boolean(favorites[String(postId)]);
  };

  const handleDownload = async (post) => {
    showToast(`Téléchargement de '${post.title}'...`, 'info');
    try {
      await api.downloadToCollection(post);
      await refreshCollection();
      showToast(`✔ '${post.title}' ajouté à votre collection !`);
    } catch (err) {
      showToast(err.message || 'Erreur de téléchargement', 'error');
    }
  };

  const handleApply = async (post) => {
    const postId = String(post.id || post.vid_id || '');
    const title = post.title || 'Animation';
    const vtype = post.type || 'boot_video';
    const localFile = post.local_file || collection[postId]?.local_file;

    try {
      showToast(`Activation de '${title}'...`, 'info');
      await api.applyVideo({ localFile, title, type: vtype, postId });
      await refreshStatus();
      showToast(`✔ '${title}' active dans Steam !`);
    } catch (err) {
      showToast(err.message || "Erreur d'application", 'error');
    }
  };

  const handleDeleteFromCollection = async (id, title) => {
    if (!window.confirm(`Supprimer '${title}' de votre collection ?`)) return;
    try {
      await api.removeFromCollection(id);
      await refreshCollection();
      await refreshStatus();
      showToast(`✔ '${title}' supprimé.`);
    } catch (err) {
      showToast(err.message || 'Erreur de suppression', 'error');
    }
  };

  const handlePickRandom = async (params = {}) => {
    try {
      const res = await api.pickRandom(params);
      await refreshStatus();
      showToast(`🎲 '${res.title}' activée !`);
    } catch (err) {
      showToast(err.message || 'Collection ou favoris vides', 'error');
    }
  };

  const handleRestoreDefault = async (type = 'all') => {
    if (!window.confirm("Rétablir les vidéos d'origine de Steam ?")) return;
    try {
      await api.restoreDefault(type);
      await refreshStatus();
      showToast("✔ Vidéos d'origine rétablies.");
    } catch (err) {
      showToast(err.message || 'Erreur de restauration', 'error');
    }
  };

  const handleLaunchBigPicture = async () => {
    try { await api.launchBigPicture(); showToast('Lancement de Steam Big Picture...'); }
    catch (err) { showToast(err.message || 'Erreur lancement', 'error'); }
  };

  const handleOpenFolder = async () => {
    try { await api.openMoviesFolder(); }
    catch (err) { showToast(err.message || 'Erreur ouverture dossier', 'error'); }
  };

  const handleOpenCollectionFolder = async () => {
    try {
      await api.openCollectionFolder();
      showToast('Ouverture du dossier de collection...');
    } catch (err) {
      showToast(err.message || 'Erreur ouverture dossier collection', 'error');
    }
  };

  const handleSelectSteam = async (customPath) => {
    try {
      const res = await api.changeSteamFolder(customPath);
      await refreshStatus();
      if (res.path) {
        showToast(`✔ Dossier Steam lié : ${res.path}`);
      } else if (!res.cancelled) {
        showToast('Dossier Steam mis à jour.');
      }
    } catch (err) {
      showToast(err.message || 'Erreur sélection Steam', 'error');
    }
  };

  const handleToggleShuffle = async (options = {}) => {
    if (typeof options === 'boolean') {
      options = { enabled: options };
    }
    if (options.triggerNow) {
      await handlePickRandom({
        source: steamStatus?.shuffle_source || 'all',
        target: steamStatus?.shuffle_target || 'boot',
      });
      return;
    }
    try {
      const res = await api.toggleAutoShuffle({
        enabled: options.enabled !== undefined ? options.enabled : autoShuffle,
        source: options.source || steamStatus?.shuffle_source || 'all',
        target: options.target || steamStatus?.shuffle_target || 'boot',
      });
      await refreshStatus();
      if (options.enabled !== undefined) {
        setAutoShuffle(Boolean(res.enabled));
        showToast(res.enabled ? '🔄 Rotation aléatoire activée !' : 'Rotation désactivée.');
      } else if (options.source) {
        showToast(`✔ Source : ${options.source === 'favorites' ? 'Favoris uniquement' : 'Toute la collection'}`);
      } else if (options.target) {
        showToast(`✔ Cible : ${options.target === 'both' ? 'Boot & Veille' : options.target === 'suspend' ? 'Veille' : 'Démarrage'}`);
      }
    } catch (err) {
      showToast(err.message || 'Erreur de configuration', 'error');
    }
  };

  const getDisplayedItems = () => {
    if (activeTab === 'favorites') {
      const items = Object.values(favorites);
      if (!debouncedSearch) return items;
      return items.filter((i) => i.title?.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    if (activeTab === 'collection') {
      const items = Object.values(collection);
      if (!debouncedSearch) return items;
      return items.filter((i) => i.title?.toLowerCase().includes(debouncedSearch.toLowerCase()));
    }
    return posts;
  };

  const displayedItems = getDisplayedItems();

  return (
    <div className="flex h-screen w-screen bg-[#0d1117] text-[#f1f5f9] overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={handleTabChange}
        stats={{
          favCount: Object.keys(favorites).length,
          colCount: Object.keys(collection).length,
        }}
        onLaunchBigPicture={handleLaunchBigPicture}
        onPickRandom={handlePickRandom}
        steamStatus={steamStatus}
        onSelectSteam={() => handleSelectSteam()}
        onOpenFolder={handleOpenFolder}
        onRestoreDefault={handleRestoreDefault}
        onToggleShuffle={handleToggleShuffle}
        autoShuffle={autoShuffle}
      />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden bg-[#111622] flex flex-col">
        {activeTab === 'settings' ? (
          <SettingsView
            steamStatus={steamStatus}
            onSelectSteam={handleSelectSteam}
            onOpenFolder={handleOpenFolder}
            onOpenCollectionFolder={handleOpenCollectionFolder}
            onRestoreDefault={handleRestoreDefault}
            onToggleShuffle={handleToggleShuffle}
            autoShuffle={autoShuffle}
            onLaunchBigPicture={handleLaunchBigPicture}
            stats={{
              favCount: Object.keys(favorites).length,
              colCount: Object.keys(collection).length,
            }}
          />
        ) : (
          <VideoGrid
            posts={displayedItems}
            loading={loading}
            collection={collection}
            activeStatus={steamStatus}
            isFavorite={isFavorite}
            onPlay={setActivePlayerPost}
            onOpenDetails={setActiveDetailPost}
            onDownload={handleDownload}
            onApply={handleApply}
            onToggleFavorite={handleToggleFavorite}
            onDelete={handleDeleteFromCollection}
            onPickRandom={handlePickRandom}
            page={page}
            onPrevPage={() => setPage((p) => Math.max(1, p - 1))}
            onNextPage={() => setPage((p) => p + 1)}
            onPageChange={(p) => setPage(Math.max(1, Number(p) || 1))}
            hasMore={hasMore}
            isCollectionView={activeTab === 'collection'}
            showPagination={activeTab === 'boot_video' || activeTab === 'suspend_video'}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            sortOption={sortOption}
            setSortOption={setSortOption}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            emptyMessage={
              activeTab === 'favorites'
                ? '⭐ Aucun favori pour le moment.'
                : activeTab === 'collection'
                ? '🎬 Votre collection est vide.'
                : 'Aucune animation trouvée.'
            }
          />
        )}
      </main>

      {/* Modals */}
      <VideoPlayerModal
        post={activePlayerPost}
        isOpen={Boolean(activePlayerPost)}
        onClose={() => setActivePlayerPost(null)}
        collection={collection}
        activeStatus={steamStatus}
        onDownload={handleDownload}
        onApply={handleApply}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteFromCollection}
        isFavorite={isFavorite}
      />

      <DetailModal
        post={activeDetailPost}
        isOpen={Boolean(activeDetailPost)}
        onClose={() => setActiveDetailPost(null)}
        collection={collection}
        activeStatus={steamStatus}
        onPlay={setActivePlayerPost}
        onDownload={handleDownload}
        onApply={handleApply}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDeleteFromCollection}
        isFavorite={isFavorite}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}
