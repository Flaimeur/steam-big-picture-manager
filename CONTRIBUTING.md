# 🤝 Guide de Contribution (Contributing Guide)

Merci de votre intérêt pour contribuer à **Steam Big Picture Manager** !

---

## 🛠️ Configuration de l'Environnement de Développement

### 1. Prérequis
- **Git**
- **Node.js 18+** & **npm**
- **Python 3.10+**

### 2. Cloner et Lancer le Projet

```bash
# 1. Cloner votre fork ou le dépôt
git clone https://github.com/Flaimeur/steam-big-picture-manager.git
cd steam-big-picture-manager

# 2. Installer les dépendances
npm install

# 3. Lancer en mode bureau
python run_app.py
# (Ou sous Linux/macOS : ./run.sh | sous Windows : run.bat)
```

---

## 🌿 Workflow Git & Branches

1. Créez une branche dédiée selon le format :
   - `feature/nom-de-la-feature`
   - `fix/nom-du-bug`
   - `docs/nom-du-sujet`
2. Effectuez des commits structurés selon **Conventional Commits** :
   - `feat(ui): ajout du mode sombre étendu`
   - `fix(steam): correction du chemin flatpak sur SteamOS`
   - `docs: mise à jour du guide d'installation`
3. Validez le build avant toute Pull Request :
   ```bash
   npm run build
   ```
4. Ouvrez votre Pull Request vers la branche `main`.

---

## 🎨 Standards de Code
- **React & JSX** : Composants modulaires et épurés, sans dépendances superflues.
- **Python** : Python 3 standard, respect des chemins multiplateformes (`pathlib.Path`), zéro crash en mode headless/noconsole.
- **Sécurité** : Ne jamais versionner de secrets, jetons ou chemins absolus codés en dur.
