// Internationalization (i18n) dictionary for Steam Big Picture Manager

export const translations = {
  fr: {
    // App Header & Branding
    appTitle: "Steam Big Picture Manager",
    appSubtitle: "Animations de démarrage & mise en veille",
    
    // Navigation Tabs
    tabBoot: "Démarrage (Boot)",
    tabSuspend: "Mise en veille",
    tabCollection: "Ma Collection",
    tabFavorites: "Mes Favoris",
    tabSettings: "Paramètres",
    
    // Badges & Status
    bootAnimation: "Animation Boot",
    suspendScreen: "Écran de Veille",
    activeInSteam: "Actif dans Steam",
    steamConnected: "Steam Détecté",
    steamNotFound: "Steam Non Détecté",
    
    // Actions & Buttons
    playPreview: "Lire la Vidéo",
    activate: "Activer",
    install: "Installer",
    installed: "Installé",
    delete: "Supprimer",
    deleteConfirm: "Supprimer '{title}' de votre collection ?",
    favorite: "Favori",
    favorites: "Favoris",
    openWebsite: "Ouvrir sur steamdeckrepo.com",
    pickRandom: "Tirage Aléatoire",
    restoreFactory: "Restaurer d'origine",
    restoreFactoryConfirm: "Rétablir les vidéos d'origine de Steam ?",
    openSteamFolder: "Dossier Steam Movies",
    openCollectionFolder: "Dossier Collection",
    openBigPicture: "Lancer Big Picture",
    save: "Enregistrer",
    
    // Search & Filters
    searchPlaceholder: "Rechercher une animation (jeu, console, thème)...",
    sortTrending: "Tendances",
    sortTop: "Mieux notés",
    sortNewest: "Plus récents",
    sortDownloads: "Plus téléchargés",
    filterAll: "Toutes",
    filterShort: "Courtes (≤ 10s)",
    
    // Settings
    settingsTitle: "Paramètres & Configuration",
    settingsAutoShuffle: "Rotation Automatique (Auto-Shuffle)",
    settingsAutoShuffleDesc: "Change aléatoirement les animations au lancement de l'application.",
    settingsShuffleSource: "Source du tirage",
    settingsShuffleSourceAll: "Toute ma collection",
    settingsShuffleSourceFav: "Uniquement mes favoris",
    settingsShuffleTarget: "Cible à renouveler",
    settingsShuffleTargetBoot: "Démarrage (Boot)",
    settingsShuffleTargetSuspend: "Mise en veille (Suspend)",
    settingsShuffleTargetBoth: "Les deux simultanément",
    settingsLanguage: "Langue de l'interface",
    settingsSteamPath: "Chemin d'installation de Steam",
    settingsSteamPathDesc: "Détection automatique ou sélection manuelle de votre répertoire Steam.",
    
    // Modals & Details
    modalDetailsTitle: "Détails de l'animation",
    creator: "Créateur",
    duration: "Durée",
    likes: "Likes",
    downloads: "Téléchargements",
    noPreview: "Aperçu indisponible",
    
    // Messages
    emptyCollection: "🎬 Votre collection locale est vide. Téléchargez des animations depuis le catalogue !",
    emptyFavorites: "⭐ Aucun favori pour le moment. Cliquez sur l'étoile pour en ajouter !",
    emptySearchResults: "Aucune animation trouvée pour cette recherche.",
    toastActivated: "✔ '{title}' activée avec succès !",
    toastDownloaded: "✔ '{title}' téléchargée dans votre collection !",
    toastDeleted: "✔ '{title}' supprimée de votre collection.",
    toastRestored: "✔ Vidéos d'origine de Steam restaurées.",
    toastSettingsSaved: "✔ Paramètres enregistrés avec succès.",

    // Gamepad Navigation
    gamepadSelect: "Sélectionner",
    gamepadPlay: "Lire",
    gamepadBack: "Retour",
    gamepadFavorite: "Favori",
    gamepadApply: "Appliquer",
    gamepadTabs: "Onglets",
    gamepadConnected: "Manette connectée",
    gamepadDisconnected: "Manette déconnectée",

    // Custom Video Importer
    importCustom: "Importer une vidéo",
    importTitle: "Convertisseur & Importateur Vidéo",
    importDesc: "Glissez n'importe quelle vidéo personnelle (.mp4, .mov, .mkv, .webm, .gif) pour la convertir au format optimal Steam Big Picture.",
    importSelectFile: "Parcourir les fichiers",
    importVideoTitle: "Nom de l'animation",
    importType: "Type d'animation",
    importConverting: "Conversion et optimisation en cours...",
    importSuccess: "✔ Animation '{title}' importée avec succès !",
    importError: "Erreur lors de la conversion de la vidéo.",
    dragDropHere: "Glissez une vidéo ici ou cliquez pour parcourir",
    supportsFormat: "Formats supportés : MP4, MOV, MKV, WebM, GIF, AVI (max 150 Mo)",

    // Playlists
    tabPlaylists: "Playlists",
    playlistsTitle: "Mes Playlists d'Animations",
    createPlaylist: "Créer une playlist",
    playlistName: "Nom de la playlist",
    playlistDescription: "Description (optionnelle)",
    playlistEmpty: "Cette playlist ne contient aucune animation pour le moment.",
    addToPlaylist: "Ajouter à une playlist",
    removeFromPlaylist: "Retirer de la playlist",
    shufflePlaylist: "Tirer au sort dans cette Playlist",
    deletePlaylistConfirm: "Supprimer la playlist '{name}' ?",
    playlistCreated: "✔ Playlist '{name}' créée avec succès !",
    playlistUpdated: "✔ Playlist mise à jour !",
    playlistDeleted: "✔ Playlist supprimée.",
  },

  en: {
    // App Header & Branding
    appTitle: "Steam Big Picture Manager",
    appSubtitle: "Boot & Suspend Animations Manager",
    
    // Navigation Tabs
    tabBoot: "Startup (Boot)",
    tabSuspend: "Suspend Screen",
    tabCollection: "My Collection",
    tabFavorites: "My Favorites",
    tabSettings: "Settings",
    
    // Badges & Status
    bootAnimation: "Boot Animation",
    suspendScreen: "Suspend Screen",
    activeInSteam: "Active in Steam",
    steamConnected: "Steam Connected",
    steamNotFound: "Steam Not Found",
    
    // Actions & Buttons
    playPreview: "Play Video",
    activate: "Apply",
    install: "Install",
    installed: "Installed",
    delete: "Delete",
    deleteConfirm: "Delete '{title}' from your collection?",
    favorite: "Favorite",
    favorites: "Favorites",
    openWebsite: "Open on steamdeckrepo.com",
    pickRandom: "Random Shuffle",
    restoreFactory: "Restore Defaults",
    restoreFactoryConfirm: "Restore original factory Steam videos?",
    openSteamFolder: "Steam Movies Folder",
    openCollectionFolder: "Collection Folder",
    openBigPicture: "Launch Big Picture",
    save: "Save",
    
    // Search & Filters
    searchPlaceholder: "Search animations (game, console, theme)...",
    sortTrending: "Trending",
    sortTop: "Top Rated",
    sortNewest: "Newest",
    sortDownloads: "Most Downloaded",
    filterAll: "All",
    filterShort: "Short (≤ 10s)",
    
    // Settings
    settingsTitle: "Settings & Configuration",
    settingsAutoShuffle: "Auto-Shuffle (Random Rotation)",
    settingsAutoShuffleDesc: "Automatically rotates animations upon app startup.",
    settingsShuffleSource: "Rotation Source Pool",
    settingsShuffleSourceAll: "Entire Collection",
    settingsShuffleSourceFav: "Favorites Only",
    settingsShuffleTarget: "Target to Rotate",
    settingsShuffleTargetBoot: "Startup (Boot)",
    settingsShuffleTargetSuspend: "Suspend Screen",
    settingsShuffleTargetBoth: "Both Simultaneously",
    settingsLanguage: "Interface Language",
    settingsSteamPath: "Steam Installation Path",
    settingsSteamPathDesc: "Automatic detection or manual folder selection for Steam.",
    
    // Modals & Details
    modalDetailsTitle: "Animation Details",
    creator: "Creator",
    duration: "Duration",
    likes: "Likes",
    downloads: "Downloads",
    noPreview: "Preview unavailable",
    
    // Messages
    emptyCollection: "🎬 Your local collection is empty. Download animations from the catalog!",
    emptyFavorites: "⭐ No favorites yet. Click the star icon to add some!",
    emptySearchResults: "No animations found matching your criteria.",
    toastActivated: "✔ '{title}' applied successfully!",
    toastDownloaded: "✔ '{title}' downloaded to collection!",
    toastDeleted: "✔ '{title}' removed from collection.",
    toastRestored: "✔ Default Steam videos restored.",
    toastSettingsSaved: "✔ Settings saved successfully.",

    // Gamepad Navigation
    gamepadSelect: "Select",
    gamepadPlay: "Play",
    gamepadBack: "Back",
    gamepadFavorite: "Favorite",
    gamepadApply: "Apply",
    gamepadTabs: "Tabs",
    gamepadConnected: "Gamepad connected",
    gamepadDisconnected: "Gamepad disconnected",

    // Custom Video Importer
    importCustom: "Import Video",
    importTitle: "Custom Video Converter & Importer",
    importDesc: "Drag and drop any personal video (.mp4, .mov, .mkv, .webm, .gif) to convert to optimal Steam Big Picture format.",
    importSelectFile: "Browse Files",
    importVideoTitle: "Animation Title",
    importType: "Animation Target",
    importConverting: "Converting and optimizing video...",
    importSuccess: "✔ Animation '{title}' imported successfully!",
    importError: "Error converting and importing video.",
    dragDropHere: "Drop your video here or click to browse",
    supportsFormat: "Supported formats: MP4, MOV, MKV, WebM, GIF, AVI (max 150 MB)",

    // Playlists
    tabPlaylists: "Playlists",
    playlistsTitle: "My Animation Playlists",
    createPlaylist: "Create Playlist",
    playlistName: "Playlist Name",
    playlistDescription: "Description (optional)",
    playlistEmpty: "This playlist does not contain any animations yet.",
    addToPlaylist: "Add to Playlist",
    removeFromPlaylist: "Remove from Playlist",
    shufflePlaylist: "Shuffle from this Playlist",
    deletePlaylistConfirm: "Delete playlist '{name}'?",
    playlistCreated: "✔ Playlist '{name}' created successfully!",
    playlistUpdated: "✔ Playlist updated!",
    playlistDeleted: "✔ Playlist deleted.",
  }
};

export function getTranslation(lang = 'fr') {
  return translations[lang] || translations.fr;
}
