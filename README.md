# 🎮 Steam Big Picture Manager

<p align="center">
  <a href="https://github.com/Flaimeur/steam-big-picture-manager/actions/workflows/ci.yml">
    <img src="https://github.com/Flaimeur/steam-big-picture-manager/actions/workflows/ci.yml/badge.svg" alt="CI Status" />
  </a>
  <a href="https://github.com/Flaimeur/steam-big-picture-manager/releases">
    <img src="https://img.shields.io/github/v/release/Flaimeur/steam-big-picture-manager?color=1a9eff&label=Version" alt="Latest Release" />
  </a>
  <a href="https://github.com/Flaimeur/steam-big-picture-manager/releases">
    <img src="https://img.shields.io/github/downloads/Flaimeur/steam-big-picture-manager/total?color=10b981&label=Downloads" alt="Downloads" />
  </a>
  <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux%20%7C%20macOS%20%7C%20SteamOS-blueviolet" alt="Platforms" />
  <img src="https://img.shields.io/badge/Steam%20Deck-Compatible%20%E2%9C%85-teal" alt="Steam Deck Verified" />
  <a href="https://github.com/Flaimeur/steam-big-picture-manager/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-orange.svg" alt="License: MIT" />
  </a>
</p>

Une application de bureau ultra-moderne, réactive et fluide pour parcourir, télécharger et appliquer en 1 clic les animations de démarrage (*Boot*) et de mise en veille (*Suspend*) de **Steam Big Picture** et **Steam Deck**, avec intégration directe de **[SteamDeckRepo.com](https://steamdeckrepo.com)**.

---

## ✨ Fonctionnalités Principales

- **🎬 Catalogue Intégré SteamDeckRepo** :
  - Parcourez des centaines d'animations de démarrage et de mise en veille créées par la communauté.
  - Barre de filtres thématiques rapides (*PlayStation, Nintendo, Xbox, Anime, Cyberpunk, OLED, Valve, Retro, etc.*).
  - Filtrage rapide par statut : *Toutes, Installées dans votre collection, Favoris, ≤ 10s*.
  - Pagination dynamique avec saisie directe du numéro de page.
  - Prévisualisation vidéo fluide 60 FPS avec son et fiches détaillées.

- **🎮 Navigation Complète à la Manette (Gamepad Navigation)** :
  - Pilotez toute l'interface depuis votre canapé sans souris ni clavier (Xbox, PlayStation DualShock/DualSense, Switch Pro, Steam Deck).
  - Navigation spatiale 2D fluide avec D-pad et sticks, surbrillance dynamique et auto-scroll intelligent.
  - Raccourcis physiques : `(A)` Sélectionner/Lire, `(B)` Retour/Fermer, `(X)` Favori, `(Y)` Appliquer à Steam, `(LB/RB)` Navigation par onglets.
  - Barre d'aide manette HUD contextuelle en bas de l'écran.

- **🎥 Importateur & Convertisseur Vidéo Local (Custom Video Importer)** :
  - Glissez-déposez n'importe quel fichier personnel (`.mp4`, `.mov`, `.mkv`, `.avi`, `.webm`, `.gif`) directement dans l'onglet **Ma Collection**.
  - Encodage et optimisation automatique en `.webm` (codec VP9 / VP8 + audio Opus) adapté à Steam Big Picture et Steam Deck.
  - Extraction automatique de la miniature et intégration instantanée dans votre collection locale.

- **🌐 Support Multilingue (Français & English)** :
  - Interface entièrement commutable entre Français et Anglais depuis les paramètres.
  - Sauvegarde instantanée de la langue préférée.

- **🎵 Gestionnaire de Playlists & Rotations Thématiques** :
  - Créez des playlists personnalisées (*ex: Cyberpunk, Rétro 90s, Anime, Calme, PlayStation*) pour classer vos animations.
  - Ajoutez n'importe quelle vidéo à une ou plusieurs playlists en 1 clic.
  - Lancez une rotation aléatoire instantanée restreinte à une playlist spécifique.
  - Ciblez une playlist comme source de renouvellement pour l'Auto-Shuffle au démarrage.

- **🎲 Rotation Aléatoire Avancée (Auto-Shuffle)** :
  - Activez la rotation automatique des animations au lancement.
  - **Choix de la source** : tirez aléatoirement parmi **Toute votre collection**, vos **Favoris**, ou une **Playlist thématique dédiée**.
  - **Choix de la cible** : renouvelez le **Démarrage (Boot)**, la **Mise en veille (Suspend)**, ou **Les deux simultanément**.
  - Bouton de tirage instantané en un clic.

- **🗑️ Gestion de Collection & Suppression en 1 Clic** :
  - Téléchargement sécurisé et stockage local dans AppData / XDG.
  - Boutons de suppression directe dans la fiche de détails et le lecteur vidéo pour nettoyer votre collection.

- **⚙️ Gestion & Sécurité Système Steam** :
  - Détection automatique et configuration manuelle du répertoire d'installation Steam (Windows, SteamOS / Steam Deck, macOS, Flatpak).
  - Injection propre dans `steamui/overrides/movies` avec verrouillage anti-écrasement Steam.
  - Sauvegardes automatiques (`.backup`) et bouton de restauration d'usine en 1 clic.
  - Chien de garde (Watchdog) : arrêt automatique du backend à la fermeture de la fenêtre pour déverrouiller immédiatement les fichiers.
  - Boutons d'accès direct aux dossiers locaux Steam et de la Collection (AppData).

---

## 📥 Téléchargements (Releases GitHub)

Les exécutables autonomes et portables (sans installation requise) sont disponibles sur la page **[Releases GitHub](https://github.com/Flaimeur/steam-big-picture-manager/releases)** :

| Plateforme | Format | Téléchargement direct |
| :--- | :--- | :--- |
| **🪟 Windows** | `.exe` | [SteamBigPictureManager-Windows.exe](https://github.com/Flaimeur/steam-big-picture-manager/releases/latest/download/SteamBigPictureManager-Windows.exe) |
| **🐧 Linux / Steam Deck** | `.tar.gz` / Binaire | [SteamBigPictureManager-Linux.tar.gz](https://github.com/Flaimeur/steam-big-picture-manager/releases/latest/download/SteamBigPictureManager-Linux.tar.gz) |
| **🍎 macOS** | `.zip` / Binaire | [SteamBigPictureManager-macOS.zip](https://github.com/Flaimeur/steam-big-picture-manager/releases/latest/download/SteamBigPictureManager-macOS.zip) |

---

## 🛠️ Installation & Démarrage Rapide

### 🐧 Sur Linux & Steam Deck
1. Téléchargez et extrayez l'archive `SteamBigPictureManager-Linux.tar.gz`.
2. Rendez le binaire exécutable et lancez-le :
   ```bash
   chmod +x SteamBigPictureManager-Linux
   ./SteamBigPictureManager-Linux
   ```
*(L'application détecte automatiquement le chemin SteamOS standard `~/.steam/root` et le Flatpak `~/.var/app/com.valvesoftware.Steam`).*

*(Optionnel) Pour ajouter un raccourci dans le menu des applications Steam Deck :*
```bash
cp steam-big-picture-manager.desktop ~/.local/share/applications/
```

### 🍎 Sur macOS
1. Téléchargez et décompressez `SteamBigPictureManager-macOS.zip`.
2. Lancez le binaire :
   ```bash
   chmod +x SteamBigPictureManager-macOS
   ./SteamBigPictureManager-macOS
   ```

### 💻 Exécution depuis les sources (Développement)

#### 1. Prérequis
- **Node.js 18+** et **Python 3.10+**

#### 2. Lancement
```bash
# Installer les dépendances frontend
npm install

# Lancement (Windows)
run.bat

# Lancement (Linux / macOS)
chmod +x run.sh
./run.sh
```

---

## 📂 Architecture du Projet

```text
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx          # Barre latérale avec compteurs et raccourcis
│   │   ├── VideoGrid.jsx        # Grille de vidéos, tags thématiques et pagination
│   │   ├── VideoCard.jsx        # Carte vidéo interactive avec previews
│   │   ├── HeroShowcase.jsx     # Bannière vedette animée avec lecture vidéo
│   │   ├── SettingsView.jsx     # Panneau Options, Auto-Shuffle et Dossiers
│   │   ├── VideoPlayerModal.jsx # Lecteur vidéo immersif
│   │   ├── DetailModal.jsx      # Fiche d'information et métadonnées
│   │   └── Toast.jsx            # Notifications visuelles élégantes
│   ├── api.js                   # Connecteur API REST
│   ├── App.jsx                  # Gestion d'état racine
│   └── index.css                # Design system Steam Deck OLED & animations
├── server.py                    # Serveur backend Python (API REST & injection Steam)
├── run_app.py                   # Lanceur d'application de bureau (PyWebView / Chrome App)
├── build_exe.bat                # Script de compilation PyInstaller .exe
├── run.bat                      # Raccourci de démarrage Windows
├── vite.config.js               # Configuration Vite
├── package.json                 # Dépendances React & scripts
└── README.md                    # Documentation complète
```

---

## 📜 Licence & Crédits

- Catalogue communautaire : **[SteamDeckRepo.com](https://steamdeckrepo.com)**
- Moteur UI : **React 18**, **Vite**, **Lucide Icons**
- Moteur Système : **Python 3**

