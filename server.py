"""
Steam Deck Repo — Python Backend API Server
Sert les API REST pour la gestion Steam & le frontend React moderne.
"""

import os
import sys
import time
import json
import shutil
import stat
import random
import ctypes
import datetime
import urllib.request
import urllib.parse
import urllib.error
import webbrowser
import subprocess
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
import socketserver
import threading
import ssl
import base64

def find_ffmpeg_bin() -> str:
    """Trouve l'exécutable ffmpeg disponible sur le système."""
    candidates = [
        shutil.which("ffmpeg"),
        "/opt/homebrew/bin/ffmpeg",
        "/usr/local/bin/ffmpeg",
        "/usr/bin/ffmpeg",
        r"C:\ffmpeg\bin\ffmpeg.exe",
    ]
    for c in candidates:
        if c and os.path.isfile(c) and os.access(c, os.X_OK):
            return str(c)
    return "ffmpeg"


def convert_video_to_steam_webm(input_file: Path, output_file: Path, thumb_file: Path) -> dict:
    """Convertit n'importe quel fichier vidéo en .webm optimal pour Steam Big Picture / Steam Deck."""
    ffmpeg_bin = find_ffmpeg_bin()

    # 1. Conversion vidéo WebM (VP9 + Opus avec fallback VP8)
    cmd = [
        ffmpeg_bin,
        "-y",
        "-i", str(input_file),
        "-c:v", "libvpx-vp9",
        "-b:v", "3M",
        "-crf", "28",
        "-c:a", "libopus",
        "-b:a", "128k",
        "-threads", "4",
        str(output_file)
    ]
    try:
        res = subprocess.run(cmd, capture_output=True, timeout=120)
        if res.returncode != 0:
            cmd_fallback = [
                ffmpeg_bin,
                "-y",
                "-i", str(input_file),
                "-c:v", "libvpx",
                "-b:v", "2M",
                "-c:a", "libvorbis",
                str(output_file)
            ]
            subprocess.run(cmd_fallback, capture_output=True, timeout=120)
    except Exception as e:
        if input_file.suffix.lower() == ".webm":
            shutil.copy2(input_file, output_file)
        else:
            raise RuntimeError(f"Erreur ffmpeg: {e}")

    # 2. Extraction miniature
    try:
        thumb_cmd = [
            ffmpeg_bin,
            "-y",
            "-ss", "00:00:01",
            "-i", str(output_file if output_file.exists() else input_file),
            "-vframes", "1",
            "-q:v", "2",
            str(thumb_file)
        ]
        subprocess.run(thumb_cmd, capture_output=True, timeout=15)
    except Exception:
        pass

    # 3. Récupération de la durée
    duration = 5
    try:
        ffprobe_bin = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe" or "/usr/local/bin/ffprobe"
        if ffprobe_bin and os.path.isfile(ffprobe_bin):
            probe_cmd = [
                ffprobe_bin,
                "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(output_file)
            ]
            p_res = subprocess.run(probe_cmd, capture_output=True, text=True, timeout=10)
            if p_res.returncode == 0 and p_res.stdout.strip():
                duration = round(float(p_res.stdout.strip()))
    except Exception:
        pass

    return {"duration": duration}


def get_ssl_context():
    """Crée un contexte SSL sécurisé avec fallback automatique sur macOS/Linux."""
    try:
        import certifi
        return ssl.create_default_context(cafile=certifi.where())
    except Exception:
        pass
    try:
        return ssl.create_default_context()
    except Exception:
        pass
    return ssl._create_unverified_context()

def safe_urlopen(req, timeout=15):
    """Effectue une requête HTTP/HTTPS avec fallback automatique si les certificats locaux échouent."""
    try:
        ctx = get_ssl_context()
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)
    except Exception:
        ctx = ssl._create_unverified_context()
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)


# Registre Windows
if sys.platform == "win32":
    try:
        import winreg
    except ImportError:
        winreg = None
else:
    winreg = None

# Heartbeat & Auto-Shutdown Watchdog (Arrêt automatique du process quand la fenêtre se ferme)
LAST_HEARTBEAT_TIME = time.time()
HAS_RECEIVED_HEARTBEAT = False


def get_bundle_dir() -> Path:
    """Retourne le dossier contenant les assets (supporte PyInstaller _MEIPASS et dev)."""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).parent.resolve()


def get_dist_dir() -> Path:
    """Résout de manière fiable le dossier contenant index.html (PyInstaller, portable, dev)."""
    bundle = get_bundle_dir()
    candidates = [
        bundle / "dist",
        bundle,
        Path(__file__).parent / "dist",
        Path.cwd() / "dist",
        Path(sys.executable).parent / "dist" if getattr(sys, "frozen", False) else Path.cwd(),
    ]
    for c in candidates:
        if (c / "index.html").is_file():
            return c.resolve()
    return (bundle / "dist").resolve()


def get_app_storage_dir() -> Path:
    """Retourne le dossier de données de l'application selon l'OS (AppData, XDG, Library)."""
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        xdg = os.environ.get("XDG_DATA_HOME") or os.environ.get("XDG_CONFIG_HOME")
        base = Path(xdg) if xdg else (Path.home() / ".config")
    
    app_dir = base / "SteamBootVideoForge"
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir


def set_file_read_only(file_path: Path, read_only: bool = True):
    """Empêche Steam d'écraser les vidéos personnalisées."""
    if not file_path.exists():
        return
    try:
        if sys.platform == "win32":
            if read_only:
                os.chmod(file_path, stat.S_IREAD)
                FILE_ATTRIBUTE_READONLY = 0x01
                ctypes.windll.kernel32.SetFileAttributesW(str(file_path), FILE_ATTRIBUTE_READONLY)
            else:
                os.chmod(file_path, stat.S_IWRITE)
                FILE_ATTRIBUTE_NORMAL = 0x80
                ctypes.windll.kernel32.SetFileAttributesW(str(file_path), FILE_ATTRIBUTE_NORMAL)
        else:
            mode = 0o444 if read_only else 0o644
            os.chmod(file_path, mode)
    except Exception:
        pass


TARGET_BOOT_FILES = [
    "bigpicture_startup.webm",
    "deck_startup.webm",
    "startup_machine.webm"
]

TARGET_SUSPEND_FILES = [
    "deck-suspend-animation.webm",
    "deck-suspend-animation-from-throbber.webm",
    "deck_suspend.webm",
    "steam_os_suspend.webm",
    "steam_os_suspend_from_throbber.webm",
    "oled-suspend-animation.webm"
]


class SteamManager:
    @staticmethod
    def detect_steam_path() -> str:
        # Windows
        if sys.platform == "win32":
            if winreg:
                try:
                    with winreg.OpenKey(winreg.HKEY_CURRENT_USER, r"Software\Valve\Steam") as key:
                        val, _ = winreg.QueryValueEx(key, "SteamPath")
                        if val and os.path.isdir(val):
                            return os.path.normpath(val)
                except Exception:
                    pass

                try:
                    with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\WOW6432Node\Valve\Steam") as key:
                        val, _ = winreg.QueryValueEx(key, "InstallPath")
                        if val and os.path.isdir(val):
                            return os.path.normpath(val)
                except Exception:
                    pass

            for p in [r"C:\Program Files (x86)\Steam", r"C:\Program Files\Steam", r"D:\Steam", r"E:\Steam"]:
                if os.path.isdir(p):
                    return os.path.normpath(p)

        # macOS
        elif sys.platform == "darwin":
            for p in [Path.home() / "Library" / "Application Support" / "Steam", Path("/Applications/Steam.app/Contents/MacOS")]:
                if p.is_dir():
                    return str(p.resolve())

        # Linux / Steam Deck
        else:
            for p in [
                Path.home() / ".steam" / "root",
                Path.home() / ".steam" / "steam",
                Path.home() / ".local" / "share" / "Steam",
                Path.home() / ".var" / "app" / "com.valvesoftware.Steam" / ".local" / "share" / "Steam",
            ]:
                if p.is_dir():
                    return str(p.resolve())

        env_p = os.environ.get("STEAM_PATH")
        if env_p and os.path.isdir(env_p):
            return os.path.normpath(env_p)

        return ""

    @staticmethod
    def get_target_directories(steam_path: str) -> dict:
        if not steam_path or not os.path.isdir(steam_path):
            return {}
        base = Path(steam_path)
        dirs = {
            "overrides": base / "steamui" / "overrides" / "movies",
            "uioverrides": base / "config" / "uioverrides" / "movies",
            "direct": base / "steamui" / "movies"
        }
        if sys.platform != "win32":
            home = Path.home()
            linux_paths = [
                home / ".steam" / "root" / "config" / "uioverrides" / "movies",
                home / ".steam" / "root" / "steamui" / "overrides" / "movies",
                home / ".local" / "share" / "Steam" / "config" / "uioverrides" / "movies",
                home / ".local" / "share" / "Steam" / "steamui" / "overrides" / "movies",
                home / ".var" / "app" / "com.valvesoftware.Steam" / ".local" / "share" / "Steam" / "config" / "uioverrides" / "movies",
                home / ".var" / "app" / "com.valvesoftware.Steam" / ".local" / "share" / "Steam" / "steamui" / "overrides" / "movies",
            ]
            for i, p in enumerate(linux_paths):
                if p.parent.parent.exists():
                    dirs[f"linux_target_{i}"] = p
        return dirs


class SteamDeckRepoAPI:
    BASE_URL = "https://steamdeckrepo.com/api/posts"

    @staticmethod
    def fetch_posts(page: int = 1, sort: str = "trending", search: str = "", video_type: str = "boot_video") -> dict:
        query_parts = [f"page={page}"]
        if video_type:
            query_parts.append(f"type={video_type}")
        if sort:
            query_parts.append(f"sort={sort}")
        if search.strip():
            query_parts.append(f"search={urllib.parse.quote(search.strip())}")

        url = f"{SteamDeckRepoAPI.BASE_URL}?{'&'.join(query_parts)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
        with safe_urlopen(req, timeout=10) as resp:
            if resp.status == 200:
                return json.loads(resp.read().decode("utf-8"))
        return {}


class AppBackendHandler(BaseHTTPRequestHandler):
    appdata_dir = get_app_storage_dir()
    collection_dir = appdata_dir / "collection"
    cache_dir = appdata_dir / "cache"
    collection_file = appdata_dir / "collection.json"
    favorites_file = appdata_dir / "favorites.json"
    settings_file = appdata_dir / "settings.json"

    def log_message(self, format, *args):
        """Silencie les logs stderr pour eviter les crashs en mode --noconsole sous Windows."""
        pass

    @classmethod
    def get_active_dist_dir(cls) -> Path:
        return get_dist_dir()

    @classmethod
    def initialize_backend(cls):
        cls.collection_dir.mkdir(parents=True, exist_ok=True)
        cls.cache_dir.mkdir(parents=True, exist_ok=True)
        if not cls.collection_file.exists():
            cls._write_json(cls.collection_file, {})
        if not cls.favorites_file.exists():
            cls._write_json(cls.favorites_file, {})
        if not cls.settings_file.exists():
            cls._write_json(cls.settings_file, {
                "steam_path": SteamManager.detect_steam_path(),
                "auto_shuffle_startup": False,
                "shuffle_source": "all",
                "shuffle_target": "boot"
            })

    @classmethod
    def _read_json(cls, path: Path) -> dict:
        if path.exists():
            try:
                with open(path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    @classmethod
    def _write_json(cls, path: Path, data: dict):
        try:
            with open(path, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    @classmethod
    def apply_single_video_to_steam(cls, local_fp: str, title: str, vtype: str, post_id: str, steam_p: str = None) -> bool:
        """Copie et sécurise un fichier vidéo dans les dossiers Steam UI Overrides."""
        if not steam_p:
            settings = cls._read_json(cls.settings_file)
            steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()

        if not steam_p or not os.path.isdir(steam_p) or not local_fp or not os.path.isfile(local_fp):
            return False

        target_map = SteamManager.get_target_directories(steam_p)
        filenames = TARGET_BOOT_FILES if vtype == "boot_video" else TARGET_SUSPEND_FILES

        for _, t_dir in target_map.items():
            t_dir.mkdir(parents=True, exist_ok=True)
            for fname in filenames:
                dest = t_dir / fname
                backup = t_dir / f"{fname}.backup"
                if dest.exists():
                    set_file_read_only(dest, False)
                if dest.exists() and not backup.exists():
                    try:
                        shutil.copy2(dest, backup)
                    except Exception:
                        pass
                shutil.copy2(local_fp, dest)
                set_file_read_only(dest, True)

        settings = cls._read_json(cls.settings_file)
        if vtype == "boot_video":
            settings["active_boot_id"] = str(post_id or "")
            settings["active_boot_title"] = title
        else:
            settings["active_suspend_id"] = str(post_id or "")
            settings["active_suspend_title"] = title

        cls._write_json(cls.settings_file, settings)
        return True

    @classmethod
    def resolve_video_file(cls, item: dict) -> str:
        """Garantit qu'un fichier vidéo existe localement pour l'item donné."""
        dest_fp = item.get("local_file")
        if dest_fp and os.path.isfile(dest_fp):
            return dest_fp

        post_id = str(item.get("id") or item.get("vid_id") or "")
        col = cls._read_json(cls.collection_file)
        if post_id and post_id in col and col[post_id].get("local_file") and os.path.isfile(col[post_id]["local_file"]):
            return col[post_id]["local_file"]

        # Télécharger si URL disponible
        video_url = item.get("video") or item.get("video_preview", "")
        if video_url and post_id:
            dest_file = cls.collection_dir / f"vid_{post_id}.webm"
            try:
                req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=30) as resp, open(dest_file, "wb") as f:
                    shutil.copyfileobj(resp, f)
                return str(dest_file)
            except Exception:
                pass
        return ""

    @classmethod
    def perform_random_shuffle(cls, source: str = "all", target: str = "boot") -> dict:
        """Tire et applique une vidéo aléatoire selon la source (all | favorites) et la cible (boot | suspend | both)."""
        settings = cls._read_json(cls.settings_file)
        steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()
        if not steam_p or not os.path.isdir(steam_p):
            return {"success": False, "error": "Dossier Steam introuvable"}

        if source == "favorites":
            favs = cls._read_json(cls.favorites_file)
            candidates = list(favs.values())
            if not candidates:
                # Fallback sur collection si aucun favori
                col = cls._read_json(cls.collection_file)
                candidates = list(col.values())
        else:
            col = cls._read_json(cls.collection_file)
            candidates = list(col.values())

        if not candidates:
            return {"success": False, "error": "Aucune vidéo disponible (collection ou favoris vides)"}

        applied = []

        # Cible Boot
        if target in ["boot", "both"]:
            boot_candidates = [c for c in candidates if c.get("type", "boot_video") == "boot_video"]
            chosen_boot = random.choice(boot_candidates if boot_candidates else candidates)
            local_fp = cls.resolve_video_file(chosen_boot)
            if local_fp:
                title = chosen_boot.get("title", "Animation Démarrage")
                pid = str(chosen_boot.get("id") or "")
                if cls.apply_single_video_to_steam(local_fp, title, "boot_video", pid, steam_p):
                    applied.append({"title": title, "type": "boot_video", "id": pid})

        # Cible Veille / Suspend
        if target in ["suspend", "both"]:
            suspend_candidates = [c for c in candidates if c.get("type") == "suspend_video"]
            chosen_suspend = random.choice(suspend_candidates if suspend_candidates else candidates)
            local_fp = cls.resolve_video_file(chosen_suspend)
            if local_fp:
                title = chosen_suspend.get("title", "Animation Veille")
                pid = str(chosen_suspend.get("id") or "")
                if cls.apply_single_video_to_steam(local_fp, title, "suspend_video", pid, steam_p):
                    applied.append({"title": title, "type": "suspend_video", "id": pid})

        if not applied:
            return {"success": False, "error": "Impossible de charger les fichiers vidéo sélectionnés"}

        return {
            "success": True,
            "applied": applied,
            "title": applied[0]["title"] if len(applied) == 1 else "Boot & Veille appliqués"
        }

    def _send_json(self, data: dict, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path
            query = urllib.parse.parse_qs(parsed.query)

            # API: Heartbeat & Shutdown
            if path == "/api/heartbeat":
                global LAST_HEARTBEAT_TIME, HAS_RECEIVED_HEARTBEAT
                LAST_HEARTBEAT_TIME = time.time()
                HAS_RECEIVED_HEARTBEAT = True
                self._send_json({"ok": True})
                return

            elif path == "/api/shutdown":
                self._send_json({"shutting_down": True})
                def _exit_bg():
                    time.sleep(0.15)
                    os._exit(0)
                threading.Thread(target=_exit_bg, daemon=True).start()
                return

            # API: Status
            elif path == "/api/status":
                settings = self._read_json(self.settings_file)
                steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()
                self._send_json({
                    "detected": bool(steam_p and os.path.isdir(steam_p)),
                    "path": steam_p,
                    "boot_title": settings.get("active_boot_title", "Par défaut Steam"),
                    "boot_id": settings.get("active_boot_id"),
                    "suspend_title": settings.get("active_suspend_title", "Par défaut Steam"),
                    "suspend_id": settings.get("active_suspend_id"),
                    "auto_shuffle": settings.get("auto_shuffle_startup", False),
                    "shuffle_source": settings.get("shuffle_source", "all"),
                    "shuffle_target": settings.get("shuffle_target", "boot"),
                })
                return

            # API: Posts Catalogue
            elif path == "/api/posts":
                page = int(query.get("page", [1])[0])
                sort = query.get("sort", ["trending"])[0]
                search = query.get("search", [""])[0]
                vtype = query.get("type", ["boot_video"])[0]
                try:
                    data = SteamDeckRepoAPI.fetch_posts(page=page, sort=sort, search=search, video_type=vtype)
                    self._send_json(data)
                except Exception as e:
                    self._send_json({"error": str(e), "posts": []}, 500)
                return

            # API: Collection
            elif path == "/api/collection":
                col = self._read_json(self.collection_file)
                for k, v in col.items():
                    if isinstance(v, dict):
                        v["id"] = v.get("id") or k
                self._send_json(col)
                return

            # API: Favorites
            elif path == "/api/favorites":
                favs = self._read_json(self.favorites_file)
                for k, v in favs.items():
                    if isinstance(v, dict):
                        v["id"] = v.get("id") or k
                self._send_json(favs)
                return

            # Media local stream
            elif path == "/media/local":
                fp = query.get("path", [""])[0]
                if fp and os.path.isfile(fp):
                    try:
                        fsize = os.path.getsize(fp)
                        self.send_response(200)
                        self.send_header("Content-Type", "video/webm")
                        self.send_header("Content-Length", str(fsize))
                        self.send_header("Accept-Ranges", "bytes")
                        self.end_headers()
                        with open(fp, "rb") as f:
                            shutil.copyfileobj(f, self.wfile)
                        return
                    except Exception:
                        pass
                self.send_error(404, "Fichier introuvable")
                return

            # Servir les fichiers statiques de React (dist)
            dist = self.get_active_dist_dir()
            clean_path = path.lstrip("/").split("?")[0]
            target_file = dist / clean_path
            if clean_path and target_file.is_file():
                ext = target_file.suffix.lower()
                mime_types = {
                    ".html": "text/html; charset=utf-8",
                    ".js": "application/javascript; charset=utf-8",
                    ".mjs": "application/javascript; charset=utf-8",
                    ".css": "text/css; charset=utf-8",
                    ".svg": "image/svg+xml",
                    ".png": "image/png",
                    ".jpg": "image/jpeg",
                    ".jpeg": "image/jpeg",
                    ".webp": "image/webp",
                    ".gif": "image/gif",
                    ".webm": "video/webm",
                    ".json": "application/json; charset=utf-8",
                    ".ico": "image/x-icon",
                    ".woff": "font/woff",
                    ".woff2": "font/woff2",
                    ".ttf": "font/ttf",
                }
                content_type = mime_types.get(ext, "application/octet-stream")
                try:
                    with open(target_file, "rb") as f:
                        content = f.read()
                    self.send_response(200)
                    self.send_header("Content-Type", content_type)
                    self.send_header("Content-Length", str(len(content)))
                    self.send_header("Cache-Control", "public, max-age=31536000" if "/assets/" in path else "no-cache")
                    self.end_headers()
                    self.wfile.write(content)
                    return
                except Exception:
                    pass

            # Fallback SPA pour React Router / index.html
            index_file = dist / "index.html"
            if index_file.is_file():
                with open(index_file, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.send_header("Cache-Control", "no-cache")
                self.end_headers()
                self.wfile.write(content)
                return

            self.send_error(404, "Page introuvable")
        except Exception as e:
            print(f"[SERVER ERROR] Exception do_GET: {e}")
            try:
                self.send_response(500)
                self.send_header("Content-Type", "text/plain; charset=utf-8")
                self.end_headers()
                self.wfile.write(f"Erreur interne: {e}".encode("utf-8"))
            except Exception:
                pass

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        length = int(self.headers.get("Content-Length", 0))
        body = {}
        if length > 0:
            try:
                body = json.loads(self.rfile.read(length).decode("utf-8"))
            except Exception:
                pass

        # API: Heartbeat & Shutdown
        if path == "/api/heartbeat":
            global LAST_HEARTBEAT_TIME, HAS_RECEIVED_HEARTBEAT
            LAST_HEARTBEAT_TIME = time.time()
            HAS_RECEIVED_HEARTBEAT = True
            self._send_json({"ok": True})
            return

        elif path == "/api/shutdown":
            self._send_json({"shutting_down": True})
            def _exit_bg():
                time.sleep(0.15)
                os._exit(0)
            threading.Thread(target=_exit_bg, daemon=True).start()
            return

        # API: Download to collection
        elif path == "/api/collection/download":
            post_id = str(body.get("id") or int(datetime.datetime.now().timestamp()))
            title = body.get("title", "Animation")
            video_url = body.get("video") or body.get("video_preview", "")
            vtype = body.get("type", "boot_video")
            dest_file = self.collection_dir / f"vid_{post_id}.webm"

            try:
                if not dest_file.exists() and video_url:
                    req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
                    with safe_urlopen(req, timeout=30) as resp, open(dest_file, "wb") as f:
                        shutil.copyfileobj(resp, f)

                col = self._read_json(self.collection_file)
                col[post_id] = {
                    "id": post_id,
                    "title": title,
                    "thumbnail": body.get("thumbnail", ""),
                    "local_file": str(dest_file),
                    "duration": body.get("video_duration") or body.get("duration", 0),
                    "type": vtype,
                    "user": body.get("user") or {"steam_name": "Inconnu"},
                    "downloads": body.get("downloads", 0),
                    "likes": body.get("likes", 0),
                }
                self._write_json(self.collection_file, col)
                self._send_json({"success": True, "item": col[post_id]})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Import Custom Video with conversion
        elif path == "/api/collection/import-custom":
            title = body.get("title") or "Animation Personnalisée"
            vtype = body.get("type", "boot_video")
            data_base64 = body.get("data_base64", "")
            local_input_path = body.get("file_path", "")
            orig_filename = body.get("filename", "video.mp4")

            post_id = f"custom_{int(datetime.datetime.now().timestamp())}"
            dest_file = self.collection_dir / f"vid_{post_id}.webm"
            thumb_file = self.cache_dir / f"thumb_{post_id}.jpg"

            try:
                # 1. Sauvegarde du fichier source
                if local_input_path and os.path.isfile(local_input_path):
                    temp_input = Path(local_input_path)
                elif data_base64:
                    if "," in data_base64:
                        data_base64 = data_base64.split(",", 1)[1]
                    raw_bytes = base64.b64decode(data_base64)
                    temp_input = self.cache_dir / f"temp_{post_id}_{orig_filename}"
                    with open(temp_input, "wb") as f:
                        f.write(raw_bytes)
                else:
                    self._send_json({"error": "Aucun fichier vidéo fourni"}, 400)
                    return

                # 2. Conversion ffmpeg vers format WebM optimal
                meta = convert_video_to_steam_webm(temp_input, dest_file, thumb_file)

                # 3. Miniature générée
                thumb_url = f"/media/local?path={urllib.parse.quote(str(thumb_file))}" if thumb_file.exists() else ""

                # 4. Enregistrement dans collection.json
                col = self._read_json(self.collection_file)
                col[post_id] = {
                    "id": post_id,
                    "title": title,
                    "thumbnail": thumb_url,
                    "local_file": str(dest_file),
                    "duration": meta.get("duration", 5),
                    "type": vtype,
                    "user": {"steam_name": "Import Personnalisé"},
                    "downloads": 1,
                    "likes": 1,
                    "is_custom": True,
                }
                self._write_json(self.collection_file, col)

                # Nettoyer fichier temporaire
                if temp_input.exists() and temp_input != dest_file and "temp_" in temp_input.name:
                    try:
                        temp_input.unlink()
                    except Exception:
                        pass

                self._send_json({"success": True, "item": col[post_id]})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Toggle Favorite
        elif path == "/api/favorites/toggle":
            post_id = str(body.get("id") or body.get("vid_id") or "").strip()
            if not post_id or post_id == "undefined":
                self._send_json({"error": "ID d'animation manquant"}, 400)
                return

            title = body.get("title", "Sans titre")
            favs = self._read_json(self.favorites_file)

            if post_id in favs:
                del favs[post_id]
                self._write_json(self.favorites_file, favs)
                self._send_json({"success": True, "is_fav": False, "id": post_id})
            else:
                favs[post_id] = {
                    "id": post_id,
                    "title": title,
                    "thumbnail": body.get("thumbnail", ""),
                    "video": body.get("video", ""),
                    "video_preview": body.get("video_preview", ""),
                    "video_duration": body.get("video_duration") or body.get("duration", 0),
                    "type": body.get("type", "boot_video"),
                    "user": body.get("user") or {"steam_name": "Inconnu"},
                    "downloads": body.get("downloads", 0),
                    "likes": body.get("likes", 0),
                }
                self._write_json(self.favorites_file, favs)
                self._send_json({"success": True, "is_fav": True, "id": post_id})
            return

        # API: Apply Video to Steam
        elif path == "/api/steam/apply":
            local_fp = body.get("local_file")
            title = body.get("title", "Animation")
            vtype = body.get("type", "boot_video")
            post_id = str(body.get("post_id") or "")

            settings = self._read_json(self.settings_file)
            steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()

            if not steam_p or not os.path.isdir(steam_p):
                self._send_json({"error": "Dossier Steam introuvable"}, 400)
                return

            if not local_fp or not os.path.isfile(local_fp):
                self._send_json({"error": "Fichier vidéo introuvable sur le disque"}, 400)
                return

            try:
                target_map = SteamManager.get_target_directories(steam_p)
                filenames = TARGET_BOOT_FILES if vtype == "boot_video" else TARGET_SUSPEND_FILES

                for _, t_dir in target_map.items():
                    t_dir.mkdir(parents=True, exist_ok=True)
                    for fname in filenames:
                        dest = t_dir / fname
                        backup = t_dir / f"{fname}.backup"
                        if dest.exists():
                            set_file_read_only(dest, False)
                        if dest.exists() and not backup.exists():
                            shutil.copy2(dest, backup)
                        shutil.copy2(local_fp, dest)
                        set_file_read_only(dest, True)

                if vtype == "boot_video":
                    settings["active_boot_id"] = post_id
                    settings["active_boot_title"] = title
                else:
                    settings["active_suspend_id"] = post_id
                    settings["active_suspend_title"] = title

                self._write_json(self.settings_file, settings)
                self._send_json({"success": True, "title": title, "type": vtype})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Restore default videos
        elif path == "/api/steam/restore":
            rtype = body.get("type", "all")
            settings = self._read_json(self.settings_file)
            steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()

            if not steam_p or not os.path.isdir(steam_p):
                self._send_json({"error": "Dossier Steam introuvable"}, 400)
                return

            try:
                target_map = SteamManager.get_target_directories(steam_p)
                targets = []
                if rtype in ["boot_video", "all"]:
                    targets.extend(TARGET_BOOT_FILES)
                    settings["active_boot_id"] = None
                    settings["active_boot_title"] = "Par défaut Steam"
                if rtype in ["suspend_video", "all"]:
                    targets.extend(TARGET_SUSPEND_FILES)
                    settings["active_suspend_id"] = None
                    settings["active_suspend_title"] = "Par défaut Steam"

                for key, t_dir in target_map.items():
                    if not t_dir.exists():
                        continue
                    for fname in targets:
                        dest = t_dir / fname
                        backup = t_dir / f"{fname}.backup"
                        if dest.exists():
                            set_file_read_only(dest, False)
                        if backup.exists():
                            set_file_read_only(backup, False)
                            shutil.copy2(backup, dest)
                            backup.unlink(missing_ok=True)
                        elif key in ["overrides", "uioverrides"] and dest.exists():
                            dest.unlink(missing_ok=True)

                self._write_json(self.settings_file, settings)
                self._send_json({"success": True})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Random Pick
        elif path == "/api/steam/random":
            settings = self._read_json(self.settings_file)
            source = body.get("source") or settings.get("shuffle_source", "all")
            target = body.get("target") or settings.get("shuffle_target", "boot")

            result = self.perform_random_shuffle(source=source, target=target)
            if result.get("success"):
                self._send_json(result)
            else:
                self._send_json({"error": result.get("error", "Erreur lors du tirage")}, 400)
            return

        # API: Launch Big Picture
        elif path == "/api/steam/launch-bigpicture":
            try:
                webbrowser.open("steam://open/bigpicture")
                self._send_json({"success": True})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Open Movies folder
        elif path == "/api/steam/open-folder":
            settings = self._read_json(self.settings_file)
            steam_p = settings.get("steam_path") or SteamManager.detect_steam_path()
            if steam_p:
                target_map = SteamManager.get_target_directories(steam_p)
                d = target_map.get("overrides") or Path(steam_p)
                d.mkdir(parents=True, exist_ok=True)
                if sys.platform == "win32":
                    os.startfile(str(d))
                elif sys.platform == "darwin":
                    subprocess.Popen(["open", str(d)])
                else:
                    subprocess.Popen(["xdg-open", str(d)])
                self._send_json({"success": True})
            else:
                self._send_json({"error": "Steam introuvable"}, 400)
            return

        # API: Auto Shuffle Toggle & Config
        elif path == "/api/steam/auto-shuffle":
            settings = self._read_json(self.settings_file)
            if "enabled" in body:
                settings["auto_shuffle_startup"] = bool(body["enabled"])
            if "source" in body and body["source"] in ["all", "favorites"]:
                settings["shuffle_source"] = body["source"]
            if "target" in body and body["target"] in ["boot", "suspend", "both"]:
                settings["shuffle_target"] = body["target"]

            self._write_json(self.settings_file, settings)
            self._send_json({
                "success": True,
                "enabled": settings.get("auto_shuffle_startup", False),
                "source": settings.get("shuffle_source", "all"),
                "target": settings.get("shuffle_target", "boot")
            })
            return

        # API: Open Collection storage folder
        elif path == "/api/steam/open-collection-folder":
            d = self.collection_dir
            d.mkdir(parents=True, exist_ok=True)
            try:
                if sys.platform == "win32":
                    os.startfile(str(d))
                elif sys.platform == "darwin":
                    subprocess.Popen(["open", str(d)])
                else:
                    subprocess.Popen(["xdg-open", str(d)])
                self._send_json({"success": True, "path": str(d)})
            except Exception as e:
                self._send_json({"error": str(e)}, 500)
            return

        # API: Select Steam Folder
        elif path == "/api/steam/select":
            custom_path = body.get("path", "").strip() if isinstance(body, dict) else ""
            if not custom_path:
                try:
                    import tkinter as tk
                    from tkinter import filedialog
                    root = tk.Tk()
                    root.withdraw()
                    root.attributes("-topmost", True)
                    selected = filedialog.askdirectory(title="Sélectionner le dossier d'installation de Steam")
                    root.destroy()
                    if selected:
                        custom_path = os.path.normpath(selected)
                except Exception:
                    pass

            if custom_path and os.path.isdir(custom_path):
                settings = self._read_json(self.settings_file)
                settings["steam_path"] = custom_path
                self._write_json(self.settings_file, settings)
                self._send_json({"success": True, "path": custom_path})
            else:
                self._send_json({"cancelled": True, "error": "Aucun dossier valide sélectionné"}, 200)
            return

        self.send_error(404, "Endpoint introuvable")

    def do_DELETE(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path.startswith("/api/collection/"):
            item_id = path.split("/")[-1]
            col = self._read_json(self.collection_file)
            if item_id in col:
                del col[item_id]
                self._write_json(self.collection_file, col)
                self._send_json({"success": True})
                return
            self._send_json({"error": "Élément introuvable"}, 404)
            return

        self.send_error(404, "Endpoint introuvable")


class ReusableTCPServer(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


def start_server(port=5055, on_ready_callback=None):
    AppBackendHandler.initialize_backend()

    bound_port = port
    httpd = None

    for p in range(port, port + 20):
        try:
            httpd = ReusableTCPServer(("127.0.0.1", p), AppBackendHandler)
            bound_port = p
            break
        except OSError:
            continue

    if httpd is None:
        print(f"[SERVER] Erreur critique: Impossible de trouver un port libre entre {port} et {port + 20}")
        return

    print(f"[SERVER] Steam Big Picture Manager running on http://127.0.0.1:{bound_port}")
    
    if on_ready_callback:
        try:
            on_ready_callback(bound_port)
        except Exception as e:
            print(f"[SERVER] Callback error: {e}")

    # Lancer la rotation automatique en tâche de fond pour que le serveur HTTP réponde instantanément
    def _run_bg_shuffle():
        try:
            time.sleep(0.5)
            settings = AppBackendHandler._read_json(AppBackendHandler.settings_file)
            if settings.get("auto_shuffle_startup"):
                source = settings.get("shuffle_source", "all")
                target = settings.get("shuffle_target", "boot")
                print(f"[SHUFFLE] Rotation automatique au démarrage (Source: {source}, Cible: {target})...")
                AppBackendHandler.perform_random_shuffle(source=source, target=target)
        except Exception as e:
            print(f"[SHUFFLE] Erreur rotation au démarrage: {e}")

    # Surveillance de présence : arrêt automatique du backend quand l'interface est fermée
    def _run_heartbeat_watchdog():
        time.sleep(2.0)
        start_time = time.time()
        while True:
            time.sleep(1.0)
            now = time.time()
            if HAS_RECEIVED_HEARTBEAT:
                # Si le client connecté ne répond plus depuis plus de 4.5 secondes
                if now - LAST_HEARTBEAT_TIME > 4.5:
                    print("[WATCHDOG] Interface fermée. Arrêt propre du serveur.")
                    os._exit(0)
            else:
                # Période de grâce au démarrage (30 secondes)
                if now - start_time > 30.0:
                    print("[WATCHDOG] Aucun client connecté après 30s. Arrêt du serveur.")
                    os._exit(0)

    threading.Thread(target=_run_heartbeat_watchdog, daemon=True).start()

    with httpd:
        httpd.serve_forever()


if __name__ == "__main__":
    port = 5055
    if len(sys.argv) > 1 and sys.argv[1].isdigit():
        port = int(sys.argv[1])
    start_server(port)

