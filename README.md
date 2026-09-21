# 🎮 Steam Big Picture Manager (Édition React + Python)

Une application de bureau ultra-moderne, réactive et fluide pour parcourir, télécharger et appliquer en 1 clic les animations de démarrage (*Boot*) et de mise en veille (*Suspend*) de **Steam Big Picture** et **Steam Deck**, avec intégration directe de **[SteamDeckRepo.com](https://steamdeckrepo.com)**.

---

## ✨ Fonctionnalités Principales

- **🎬 Catalogue Intégré SteamDeckRepo** :
  - Parcourez des centaines d'animations de démarrage et de mise en veille créées par la communauté.
  - Barre de filtres thématiques rapides (*PlayStation, Nintendo, Xbox, Anime, Cyberpunk, OLED, Valve, Retro, etc.*).
  - Filtrage rapide par statut : *Toutes, Installées dans votre collection, Favoris, ≤ 10s*.
  - Pagination dynamique avec saisie directe du numéro de page.
  - Prévisualisation vidéo fluide 60 FPS avec son et fiches détaillées.

- **🎲 Rotation Aléatoire Avancée (Auto-Shuffle)** :
  - Activez la rotation automatique des animations au lancement.
  - **Choix de la source** : tirez aléatoirement parmi **Toute votre collection** ou uniquement vos **Favoris**.
  - **Choix de la cible** : renouvelez le **Démarrage (Boot)**, la **Mise en veille (Suspend)**, ou **Les deux simultanément**.
  - Bouton de tirage instantané en un clic.

- **⚙️ Gestion & Sécurité Système Steam** :
  - Détection automatique et configuration manuelle du répertoire d'installation Steam.
  - Injection propre dans `steamui/overrides/movies` avec verrouillage anti-écrasement Steam.
  - Sauvegardes automatiques (`.backup`) et bouton de restauration d'usine en 1 clic.
  - Boutons d'accès direct aux dossiers locaux Steam et de la Collection (AppData).

---

## 🛠️ Installation & Démarrage Rapide

### 1. Prérequis
- **Node.js 18+** et **Python 3.10+**

### 2. Installation des dépendances

```bash
# Installer les dépendances frontend
npm install
```

### 3. Lancer l'application en mode bureau

```bash
# Lancement tout-en-un (Frontend React + Serveur Python + Fenêtre Bureau)
python run_app.py

# Ou sous Windows via le script rapide
run.bat
```

### 4. Compiler l'exécutable autonome (.exe)

Pour générer un fichier `.exe` portable et autonome distribuable à tout le monde sans avoir besoin d'installer Node.js :

```bash
# Exécuter le script de packaging
build_exe.bat
```
Le binaire autonome sera généré dans `dist/SteamBigPictureManager.exe`.

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

