const API_BASE = '/api';

export async function fetchApi(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message || `Erreur HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error(`Erreur API (${endpoint}):`, error);
    throw error;
  }
}

export const api = {
  // Statut système & Steam
  getStatus: () => fetchApi('/status'),
  changeSteamFolder: (customPath) => fetchApi('/steam/select', { method: 'POST', body: JSON.stringify({ path: customPath || '' }) }),
  openMoviesFolder: () => fetchApi('/steam/open-folder', { method: 'POST' }),
  openCollectionFolder: () => fetchApi('/steam/open-collection-folder', { method: 'POST' }),
  launchBigPicture: () => fetchApi('/steam/launch-bigpicture', { method: 'POST' }),
  toggleAutoShuffle: ({ enabled, source, target }) =>
    fetchApi('/steam/auto-shuffle', {
      method: 'POST',
      body: JSON.stringify({ enabled, source, target }),
    }),

  // Catalogue SteamDeckRepo
  getPosts: ({ page = 1, sort = 'trending', search = '', videoType = 'boot_video' }) => {
    const params = new URLSearchParams({
      page: String(page),
      sort,
      type: videoType,
    });
    if (search.trim()) {
      params.append('search', search.trim());
    }
    return fetchApi(`/posts?${params.toString()}`);
  },

  // Collection locale
  getCollection: () => fetchApi('/collection'),
  downloadToCollection: (post) => fetchApi('/collection/download', { method: 'POST', body: JSON.stringify(post) }),
  importCustomVideo: ({ title, type, filename, dataBase64, filePath }) =>
    fetchApi('/collection/import-custom', {
      method: 'POST',
      body: JSON.stringify({
        title,
        type,
        filename,
        data_base64: dataBase64,
        file_path: filePath,
      }),
    }),
  removeFromCollection: (id) => fetchApi(`/collection/${id}`, { method: 'DELETE' }),

  // Favoris
  getFavorites: () => fetchApi('/favorites'),
  toggleFavorite: (post) => fetchApi('/favorites/toggle', { method: 'POST', body: JSON.stringify(post) }),

  // Playlists
  getPlaylists: () => fetchApi('/playlists'),
  createPlaylist: ({ name, description }) => fetchApi('/playlists/create', { method: 'POST', body: JSON.stringify({ name, description }) }),
  addVideoToPlaylist: (playlistId, video) => fetchApi('/playlists/add-video', { method: 'POST', body: JSON.stringify({ playlist_id: playlistId, video }) }),
  removeVideoFromPlaylist: (playlistId, videoId) => fetchApi('/playlists/remove-video', { method: 'POST', body: JSON.stringify({ playlist_id: playlistId, video_id: videoId }) }),
  deletePlaylist: (playlistId) => fetchApi('/playlists/delete', { method: 'POST', body: JSON.stringify({ playlist_id: playlistId }) }),
  shufflePlaylist: (playlistId, target = 'boot') => fetchApi('/playlists/shuffle', { method: 'POST', body: JSON.stringify({ playlist_id: playlistId, target }) }),

  // Application dans Steam
  applyVideo: ({ localFile, title, type, postId }) =>
    fetchApi('/steam/apply', {
      method: 'POST',
      body: JSON.stringify({
        local_file: localFile,
        title,
        type,
        post_id: postId,
      }),
    }),
  
  restoreDefault: (type = 'all') => fetchApi('/steam/restore', { method: 'POST', body: JSON.stringify({ type }) }),
  pickRandom: ({ source, target } = {}) =>
    fetchApi('/steam/random', {
      method: 'POST',
      body: JSON.stringify({ source, target }),
    }),
};
