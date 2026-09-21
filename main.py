"""
Steam Boot Video Manager — Édition Steam Deck Épurée & Ultra-Fluide
Expérience utilisateur & UI optimisées :
- ⚡ Fluidité maximale : Pool de threads d'arrière-plan (ThreadPoolExecutor), cache mémoire CTkImage et recherche fluide avec debounce.
- 🎯 Interface épurée et sans encombrement : Uniquement l'essentiel, pensé comme l'interface officielle Steam OS 3.0.
- 🟢 3 États distincts et clairs sur chaque animation :
    1. 🟢 ACTIF (En cours d'utilisation dans Steam)
    2. 💾 EN STOCK (Enregistré localement, activation instantanée)
    3. 🌐 CATALOGUE (Prêt à être installé)
- 🎮 HUD Actif discret : Affiche les vidéos de Boot et Veille en cours avec bouton ✕ pour réinitialiser en 1 clic.
- 🎬 Ma Collection fluide : Filtres par onglets, recherche rapide et indicateur d'espace.
- 🎲 Tirage Aléatoire & Rotation au démarrage de Windows (--shuffle).
"""

import os
import sys
import json
import shutil
import stat
import random
import ctypes
import hashlib
import threading
import subprocess
from concurrent.futures import ThreadPoolExecutor
import urllib.request
import urllib.parse
import urllib.error
import webbrowser
import datetime
from io import BytesIO
from pathlib import Path
import ssl

def get_ssl_context():
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
    try:
        ctx = get_ssl_context()
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)
    except Exception:
        ctx = ssl._create_unverified_context()
        return urllib.request.urlopen(req, timeout=timeout, context=ctx)


# Registre Windows (optionnel si sous Linux/macOS)
try:
    import winreg
except ImportError:
    winreg = None

import tkinter as tk
import customtkinter as ctk
from tkinter import filedialog, messagebox
from PIL import Image, ImageTk

# Support Drag & Drop
DND_AVAILABLE = False
try:
    from tkinterdnd2 import TkinterDnD, DND_FILES
    DND_AVAILABLE = True
except ImportError:
    pass

# ==============================================================================
# PALETTE DE COULEURS STEAM DECK OLED & STEAM OS 3.0 (MODERNE & IMMERSIF)
# ==============================================================================
STEAM_BG_BASE = "#0a0c10"
STEAM_SIDEBAR_BG = "#10131b"
STEAM_HEADER_BG = "#10131b"
STEAM_HUD_BG = "#141824"

STEAM_CARD_BG = "#151924"
STEAM_CARD_HOVER = "#1c2232"
STEAM_CARD_BORDER = "#21283b"
STEAM_CARD_BORDER_SAVED = "#1a9eff"
STEAM_CARD_BORDER_ACTIVE = "#10b981"

STEAM_INPUT_BG = "#0c0e15"
STEAM_INPUT_BORDER = "#21283b"

STEAM_BLUE_PRIMARY = "#1a9eff"
STEAM_BLUE_HOVER = "#0084f0"

STEAM_GREEN_BTN = "#10b981"
STEAM_GREEN_HOVER = "#059669"
STEAM_GREEN_BADGE = "#092e1e"
STEAM_GREEN_TEXT = "#34d399"

STEAM_BTN_SIDEBAR = "#151924"
STEAM_BTN_SIDEBAR_HOVER = "#1e2434"
STEAM_BTN_SECONDARY = "#1c2232"
STEAM_BTN_SEC_HOVER = "#273046"

STEAM_TEXT_WHITE = "#f8fafc"
STEAM_TEXT_MUTED = "#94a3b8"
STEAM_TEXT_SUBTLE = "#64748b"
STEAM_BADGE_BG = "#1a2133"

# Typographie multiplateforme
if sys.platform == "darwin":
    FONT_NAME = "Helvetica Neue"
elif sys.platform == "win32":
    FONT_NAME = "Segoe UI"
else:
    FONT_NAME = "DejaVu Sans"


def get_font(size=11, weight="normal"):
    return ctk.CTkFont(family=FONT_NAME, size=size, weight=weight)


def open_file_or_url(target: str | Path):
    """Ouvre un fichier ou dossier avec l'application par défaut de l'OS (Windows, macOS, Linux)."""
    if not target:
        return
    target_str = str(target)
    try:
        if sys.platform == "win32":
            os.startfile(target_str)
        elif sys.platform == "darwin":
            subprocess.Popen(["open", target_str])
        else:
            subprocess.Popen(["xdg-open", target_str])
    except Exception:
        try:
            webbrowser.open(target_str)
        except Exception:
            pass


def get_app_storage_dir() -> Path:
    """Retourne le dossier de données de l'application selon l'OS standard (AppData, XDG, Library)."""
    if sys.platform == "win32":
        base = Path(os.environ.get("APPDATA", Path.home() / "AppData" / "Roaming"))
    elif sys.platform == "darwin":
        base = Path.home() / "Library" / "Application Support"
    else:
        # Linux / SteamOS / Steam Deck / Unix
        xdg = os.environ.get("XDG_DATA_HOME") or os.environ.get("XDG_CONFIG_HOME")
        base = Path(xdg) if xdg else (Path.home() / ".config")
    
    app_dir = base / "SteamBootVideoForge"
    app_dir.mkdir(parents=True, exist_ok=True)
    return app_dir


def set_file_read_only(file_path: Path, read_only: bool = True):
    """Empêche Steam d'écraser les vidéos personnalisées de manière multiplateforme."""
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
            # macOS & Linux / SteamOS
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


# ==============================================================================
# GESTION STEAM MULTIPLATEFORME (WINDOWS / MACOS / LINUX / STEAM DECK)
# ==============================================================================
class SteamManager:
    @staticmethod
    def detect_steam_path() -> str:
        # 1. Windows Detection (Registre + dossiers courants)
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

            defaults = [r"C:\Program Files (x86)\Steam", r"C:\Program Files\Steam", r"D:\Steam", r"E:\Steam"]
            for p in defaults:
                if os.path.isdir(p):
                    return os.path.normpath(p)

        # 2. macOS Detection
        elif sys.platform == "darwin":
            mac_paths = [
                Path.home() / "Library" / "Application Support" / "Steam",
                Path("/Applications/Steam.app/Contents/MacOS")
            ]
            for p in mac_paths:
                if p.is_dir():
                    return str(p.resolve())

        # 3. Linux / Steam Deck / SteamOS Detection
        else:
            linux_paths = [
                Path.home() / ".steam" / "root",
                Path.home() / ".steam" / "steam",
                Path.home() / ".local" / "share" / "Steam",
                Path.home() / ".var" / "app" / "com.valvesoftware.Steam" / ".local" / "share" / "Steam",
                Path.home() / ".var" / "app" / "com.valvesoftware.Steam" / ".steam" / "steam",
                Path.home() / "snap" / "steam" / "common" / ".local" / "share" / "Steam",
            ]
            for p in linux_paths:
                if p.is_dir():
                    return str(p.resolve())

        # Variable d'environnement de secours
        env_p = os.environ.get("STEAM_PATH")
        if env_p and os.path.isdir(env_p):
            return os.path.normpath(env_p)

        return ""

    @staticmethod
    def get_target_directories(steam_path: str) -> dict:
        if not steam_path or not os.path.isdir(steam_path):
            return {}
        base = Path(steam_path)
        return {
            "overrides": base / "steamui" / "overrides" / "movies",
            "uioverrides": base / "config" / "uioverrides" / "movies",
            "direct": base / "steamui" / "movies"
        }


# ==============================================================================
# API STEAMDECKREPO
# ==============================================================================
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


# ==============================================================================
# ROTATION SILENCIEUSE WINDOWS (--shuffle)
# ==============================================================================
def run_silent_shuffle():
    steam_path = SteamManager.detect_steam_path()
    if not steam_path:
        return

    appdata_dir = get_app_storage_dir()
    meta_file = appdata_dir / "collection.json"
    settings_file = appdata_dir / "settings.json"
    if not meta_file.exists():
        return

    try:
        with open(meta_file, "r", encoding="utf-8") as f:
            data = json.load(f)
        boot_items = [
            (k, v) for k, v in data.items()
            if v.get("type", "boot_video") == "boot_video" and os.path.isfile(v.get("local_file", ""))
        ]
        if not boot_items:
            boot_items = [(k, v) for k, v in data.items() if os.path.isfile(v.get("local_file", ""))]

        if boot_items:
            chosen_id, chosen = random.choice(boot_items)
            video_path = Path(chosen.get("local_file", ""))
            target_map = SteamManager.get_target_directories(steam_path)
            for _, t_dir in target_map.items():
                t_dir.mkdir(parents=True, exist_ok=True)
                for fname in TARGET_BOOT_FILES:
                    dest = t_dir / fname
                    if dest.exists():
                        set_file_read_only(dest, read_only=False)
                    shutil.copy2(video_path, dest)
                    set_file_read_only(dest, read_only=True)

            settings = {}
            if settings_file.exists():
                try:
                    with open(settings_file, "r", encoding="utf-8") as sf:
                        settings = json.load(sf)
                except Exception:
                    pass
            settings["active_boot_id"] = chosen_id
            settings["active_boot_title"] = chosen.get("title", "")
            with open(settings_file, "w", encoding="utf-8") as sf:
                json.dump(settings, sf, indent=2)
    except Exception:
        pass


# ==============================================================================
# CLASSE DE BASE AVEC DND
# ==============================================================================
if DND_AVAILABLE:
    class BaseWindow(ctk.CTk, TkinterDnD.DnDWrapper):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)
            self.TkdndVersion = TkinterDnD._require(self)
else:
    class BaseWindow(ctk.CTk):
        pass


# ==============================================================================
# LECTEUR VIDÉO HAUTE PERFORMANCE 100% INTÉGRÉ À L'APPLICATION
# ==============================================================================
class InAppVideoPlayerModal(ctk.CTkToplevel):
    def __init__(self, parent_app, video_source: str, title: str, post_data: dict = None, local_path: str = None, vtype: str = "boot_video", vid_id: str = None):
        super().__init__(parent_app)
        self.app = parent_app
        self.video_source = video_source
        self.video_title = title
        self.post_data = post_data or {}
        self.local_path = local_path
        self.vtype = vtype
        self.vid_id = vid_id or str(self.post_data.get("id", ""))
        self.duration_est = self.post_data.get("video_duration") or self.post_data.get("duration") or 0

        self.title(f"🎬 Lecteur Intégré — {title}")
        self.geometry("700x610")
        self.minsize(660, 560)
        self.configure(fg_color=STEAM_SIDEBAR_BG)
        self.transient(parent_app)
        self.grab_set()

        # Canvas Dimensions
        self.canvas_w = 640
        self.canvas_h = 360
        self.frame_size = self.canvas_w * self.canvas_h * 3

        # Playback state
        self.is_running = True
        self.is_paused = False
        self.ffmpeg_proc = None
        self.audio_proc = None
        self.playback_thread = None
        self.current_photo = None
        self.elapsed_frames = 0
        self.fps = 25

        self.protocol("WM_DELETE_WINDOW", self._on_close)

        self._build_ui()
        self._start_playback()

    def _build_ui(self):
        # Header avec Titre et badge type
        header_box = ctk.CTkFrame(self, fg_color="transparent")
        header_box.pack(fill="x", padx=20, pady=(12, 6))

        type_lbl = "🎮 Boot Video" if self.vtype == "boot_video" else "⏸ Suspend Video"
        ctk.CTkLabel(
            header_box,
            text=f"🎬 {self.video_title}",
            font=get_font(13, "bold"),
            text_color=STEAM_TEXT_WHITE,
            anchor="w"
        ).pack(side="left")

        ctk.CTkLabel(
            header_box,
            text=type_lbl,
            font=get_font(9, "bold"),
            text_color=STEAM_BLUE_PRIMARY,
            fg_color=STEAM_BADGE_BG,
            corner_radius=4,
            padx=7,
            pady=2
        ).pack(side="right")

        # Zone Canvas Vidéo
        video_wrap = ctk.CTkFrame(self, fg_color="#0e141b", border_color=STEAM_CARD_BORDER, border_width=1, corner_radius=8)
        video_wrap.pack(padx=20, pady=(0, 6))

        self.canvas = tk.Canvas(
            video_wrap,
            width=self.canvas_w,
            height=self.canvas_h,
            bg="#0e141b",
            highlightthickness=0
        )
        self.canvas.pack(padx=3, pady=3)

        # Affichage d'attente / Chargement
        self.canvas.create_text(
            self.canvas_w // 2,
            self.canvas_h // 2,
            text="⏳ Chargement du flux vidéo...",
            fill=STEAM_TEXT_MUTED,
            font=(FONT_NAME, 13, "bold"),
            tags="loader_text"
        )

        # Barre de progression
        self.progress_bar = ctk.CTkProgressBar(
            self,
            fg_color=STEAM_INPUT_BG,
            progress_color=STEAM_BLUE_PRIMARY,
            height=4,
            corner_radius=2
        )
        self.progress_bar.pack(fill="x", padx=24, pady=(2, 6))
        self.progress_bar.set(0)

        # Barre de contrôle de lecture
        ctrl_bar = ctk.CTkFrame(self, fg_color="transparent")
        ctrl_bar.pack(fill="x", padx=20, pady=(0, 10))

        self.btn_pause = ctk.CTkButton(
            ctrl_bar,
            text="⏸ Pause",
            command=self._toggle_pause,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(10, "bold"),
            width=80,
            height=28,
            corner_radius=4
        )
        self.btn_pause.pack(side="left", padx=(0, 6))

        self.btn_replay = ctk.CTkButton(
            ctrl_bar,
            text="🔄 Rejouer",
            command=self._start_playback,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(10, "bold"),
            width=80,
            height=28,
            corner_radius=4
        )
        self.btn_replay.pack(side="left", padx=(0, 10))

        self.lbl_time = ctk.CTkLabel(
            ctrl_bar,
            text="⏱️ 00:00 / 00:00",
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED
        )
        self.lbl_time.pack(side="left")

        # Statut de lecture
        self.lbl_player_status = ctk.CTkLabel(
            ctrl_bar,
            text="Lecture directe en cours...",
            font=get_font(9),
            text_color=STEAM_GREEN_TEXT
        )
        self.lbl_player_status.pack(side="right")

        # Séparateur
        ctk.CTkFrame(self, fg_color=STEAM_CARD_BORDER, height=1).pack(fill="x", padx=20, pady=(0, 10))

        # Barre d'actions en bas de modale
        action_bar = ctk.CTkFrame(self, fg_color="transparent")
        action_bar.pack(fill="x", padx=20, pady=(0, 14))

        is_active, is_in_col, local_info = self.app.get_item_state(self.vid_id, self.video_title, self.vtype)

        if is_in_col:
            local_fp = self.local_path or (local_info.get("local_file", "") if local_info else "")
            if self.vtype == "boot_video":
                btn_act_text = "🟢 Actif au démarrage" if is_active else "▶ Activer au démarrage"
            else:
                btn_act_text = "🟢 Actif en veille" if is_active else "▶ Activer en veille"

            ctk.CTkButton(
                action_bar,
                text=btn_act_text,
                command=lambda: [self._on_close(), self.app._apply_local_path(local_fp, self.video_title, self.vtype, self.vid_id)],
                fg_color=STEAM_GREEN_BTN if is_active else STEAM_BLUE_PRIMARY,
                hover_color=STEAM_GREEN_HOVER if is_active else STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(11, "bold"),
                height=32,
                corner_radius=6
            ).pack(side="left", fill="x", expand=True, padx=(0, 8))
        else:
            ctk.CTkButton(
                action_bar,
                text="📥 Installer sur ce PC",
                command=lambda: [self._on_close(), self.app._download_to_collection_only(self.post_data)],
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(11, "bold"),
                height=32,
                corner_radius=6
            ).pack(side="left", fill="x", expand=True, padx=(0, 8))

            direct_txt = "▶ Installer & Activer au démarrage" if self.vtype == "boot_video" else "▶ Installer & Activer en veille"
            ctk.CTkButton(
                action_bar,
                text=direct_txt,
                command=lambda: [self._on_close(), self.app._install_video_from_web(self.post_data, True)],
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10),
                width=190,
                height=32,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))

        is_fav = self.app._is_favorite(self.vid_id)
        self.btn_fav_player = ctk.CTkButton(
            action_bar,
            text="⭐ Favori" if is_fav else "🤍 Favori",
            command=self._toggle_fav_player,
            fg_color="#372c08" if is_fav else STEAM_BTN_SECONDARY,
            hover_color="#52400a" if is_fav else STEAM_BTN_SEC_HOVER,
            text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED,
            font=get_font(10, "bold"),
            width=85,
            height=32,
            corner_radius=6
        )
        self.btn_fav_player.pack(side="left", padx=(0, 8))

        ctk.CTkButton(
            action_bar,
            text="✕ Fermer",
            command=self._on_close,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(10),
            width=80,
            height=32,
            corner_radius=6
        ).pack(side="right")

    def _toggle_fav_player(self):
        self.app._toggle_favorite(self.post_data)
        is_fav = self.app._is_favorite(self.vid_id)
        self.btn_fav_player.configure(
            text="⭐ Favori" if is_fav else "🤍 Favori",
            fg_color="#372c08" if is_fav else STEAM_BTN_SECONDARY,
            hover_color="#52400a" if is_fav else STEAM_BTN_SEC_HOVER,
            text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED
        )

    def _start_playback(self):
        self._stop_processes()
        self.is_running = True
        self.is_paused = False
        self.elapsed_frames = 0
        self.btn_pause.configure(text="⏸ Pause")
        self.lbl_player_status.configure(text="Lecture directe en cours...", text_color=STEAM_GREEN_TEXT)
        self.progress_bar.set(0)
        self.playback_thread = threading.Thread(target=self._playback_worker, daemon=True)
        self.playback_thread.start()

    def _toggle_pause(self):
        self.is_paused = not self.is_paused
        if self.is_paused:
            self.btn_pause.configure(text="▶ Reprendre")
            self.lbl_player_status.configure(text="En pause", text_color=STEAM_TEXT_MUTED)
        else:
            self.btn_pause.configure(text="⏸ Pause")
            self.lbl_player_status.configure(text="Lecture directe en cours...", text_color=STEAM_GREEN_TEXT)

    def _playback_worker(self):
        ffmpeg_bin = shutil.which("ffmpeg")
        if not ffmpeg_bin:
            self.after(0, lambda: self._show_fallback_message("FFmpeg introuvable pour la lecture intégrée."))
            return

        ffplay_bin = shutil.which("ffplay")
        if ffplay_bin:
            try:
                self.audio_proc = subprocess.Popen(
                    [ffplay_bin, "-nodisp", "-autoexit", "-loglevel", "quiet", self.video_source],
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )
            except Exception:
                pass

        cmd = [
            ffmpeg_bin,
            "-re",
            "-i", self.video_source,
            "-vf", f"scale={self.canvas_w}:{self.canvas_h}:force_original_aspect_ratio=decrease,pad={self.canvas_w}:{self.canvas_h}:(ow-iw)/2:(oh-ih)/2",
            "-r", str(self.fps),
            "-f", "rawvideo",
            "-pix_fmt", "rgb24",
            "-loglevel", "quiet",
            "-"
        ]

        try:
            self.ffmpeg_proc = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=self.frame_size * 2
            )
        except Exception as e:
            self.after(0, lambda: self._show_fallback_message(f"Erreur vidéo : {e}"))
            return

        while self.is_running and self.ffmpeg_proc and self.ffmpeg_proc.poll() is None:
            if self.is_paused:
                import time
                time.sleep(0.04)
                continue

            raw_frame = self.ffmpeg_proc.stdout.read(self.frame_size)
            if len(raw_frame) < self.frame_size:
                break

            self.elapsed_frames += 1
            try:
                img = Image.frombytes("RGB", (self.canvas_w, self.canvas_h), raw_frame)
                photo = ImageTk.PhotoImage(img)
                if not self.is_running:
                    break
                self.after(0, lambda p=photo, f=self.elapsed_frames: self._update_frame(p, f))
            except Exception:
                break

        if self.is_running:
            self.after(0, self._on_playback_ended)

    def _update_frame(self, photo, frame_count):
        if not self.is_running:
            return
        self.current_photo = photo
        self.canvas.delete("all")
        self.canvas.create_image(self.canvas_w // 2, self.canvas_h // 2, image=self.current_photo)

        elapsed_sec = int(frame_count / self.fps)
        total_sec = int(self.duration_est) if self.duration_est else (elapsed_sec if elapsed_sec > 0 else 1)
        
        if total_sec > 0:
            prog = min(1.0, elapsed_sec / max(total_sec, 1))
            self.progress_bar.set(prog)
            self.lbl_time.configure(text=f"⏱️ {elapsed_sec:02d}s / {total_sec:02d}s")

    def _on_playback_ended(self):
        self.btn_pause.configure(text="▶ Rejouer")
        self.lbl_player_status.configure(text="Fin de lecture", text_color=STEAM_BLUE_PRIMARY)
        self.progress_bar.set(1.0)

    def _show_fallback_message(self, message: str):
        self.canvas.delete("all")
        self.canvas.create_text(
            self.canvas_w // 2,
            self.canvas_h // 2,
            text=f"⚠️ {message}",
            fill="#ff5c5c",
            font=(FONT_NAME, 11, "bold")
        )
        self.lbl_player_status.configure(text="Erreur", text_color="#ff5c5c")

    def _stop_processes(self):
        if self.ffmpeg_proc:
            try:
                self.ffmpeg_proc.kill()
                self.ffmpeg_proc.wait(timeout=0.2)
            except Exception:
                pass
            self.ffmpeg_proc = None

        if self.audio_proc:
            try:
                self.audio_proc.kill()
                self.audio_proc.wait(timeout=0.2)
            except Exception:
                pass
            self.audio_proc = None

    def _on_close(self):
        self.is_running = False
        self._stop_processes()
        self.destroy()


# ==============================================================================
# INTERFACE PRINCIPALE HAUTE PERFORMANCE
# ==============================================================================
class SteamBootVideoForgeApp(BaseWindow):
    def __init__(self):
        super().__init__()

        self.title("Steam Deck Repo — Boot & Suspend Video Manager")
        self.geometry("1200x820")
        self.minsize(1020, 700)
        self.configure(fg_color=STEAM_BG_BASE)

        ctk.set_appearance_mode("Dark")

        # Dossiers & Cache multiplateforme
        self.appdata_dir = get_app_storage_dir()
        self.collection_dir = self.appdata_dir / "collection"
        self.cache_dir = self.appdata_dir / "cache"
        self.collection_dir.mkdir(parents=True, exist_ok=True)
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        self.collection_meta_file = self.appdata_dir / "collection.json"
        self.collection_data = self._load_collection_metadata()
        self.favorites_file = self.appdata_dir / "favorites.json"
        self.favorites_data = self._load_favorites_metadata()
        self.settings_file = self.appdata_dir / "settings.json"
        self.settings = self._load_settings()

        # ThreadPool dédié pour les images et requêtes (Évite les saccades)
        self.executor = ThreadPoolExecutor(max_workers=4)

        # État
        self.steam_path = SteamManager.detect_steam_path()
        self.current_page = 1
        self.current_sort = "trending"
        self.current_search = ""
        self.current_video_type = "boot_video"
        self.collection_filter = "all"
        self.collection_search = ""
        self.favorites_filter = "all"
        self.favorites_search = ""
        self.is_loading = False
        self.thumbnail_memory_cache = {}
        self.current_posts = []
        self.hero_index = 0
        self._search_debounce_timer = None
        self.online_card_widgets = {}
        self.collection_card_widgets = {}

        # Suivi temps réel des animations actives
        self.active_status = {
            "boot_title": "Par défaut Steam",
            "boot_id": None,
            "suspend_title": "Par défaut Steam",
            "suspend_id": None
        }
        self._refresh_active_animations_status()

        # Construction UI
        self._create_layout()

        # Drag & Drop
        if DND_AVAILABLE:
            try:
                self.drop_target_register(DND_FILES)
                self.dnd_bind("<<Drop>>", self._on_drag_and_drop)
            except Exception:
                pass

        # Chargement initial
        self._load_gallery_async()

    # --------------------------------------------------------------------------
    # DÉTECTION ACTIVE
    # --------------------------------------------------------------------------
    def _refresh_active_animations_status(self):
        boot_title = "Par défaut Steam"
        boot_id = self.settings.get("active_boot_id")
        suspend_title = "Par défaut Steam"
        suspend_id = self.settings.get("active_suspend_id")

        if self.steam_path:
            target_map = SteamManager.get_target_directories(self.steam_path)

            # Boot
            boot_dest = (target_map.get("overrides") or Path(".")) / "deck_startup.webm"
            if boot_dest.exists() and boot_dest.stat().st_size > 0:
                s_size = boot_dest.stat().st_size
                matched_id = None
                for cid, info in self.collection_data.items():
                    loc = Path(info.get("local_file", ""))
                    if loc.is_file() and loc.stat().st_size == s_size:
                        matched_id = cid
                        boot_title = info.get("title", "Animation Boot")
                        break
                if matched_id:
                    boot_id = matched_id
                elif boot_id and boot_id in self.collection_data:
                    boot_title = self.collection_data[boot_id].get("title", "Animation Boot")
                elif self.settings.get("active_boot_title"):
                    boot_title = self.settings.get("active_boot_title")
            else:
                boot_id = None

            # Suspend
            susp_dest = (target_map.get("overrides") or Path(".")) / "deck_suspend.webm"
            if susp_dest.exists() and susp_dest.stat().st_size > 0:
                s_size = susp_dest.stat().st_size
                matched_id = None
                for cid, info in self.collection_data.items():
                    loc = Path(info.get("local_file", ""))
                    if loc.is_file() and loc.stat().st_size == s_size:
                        matched_id = cid
                        suspend_title = info.get("title", "Animation Veille")
                        break
                if matched_id:
                    suspend_id = matched_id
                elif suspend_id and suspend_id in self.collection_data:
                    suspend_title = self.collection_data[suspend_id].get("title", "Animation Veille")
                elif self.settings.get("active_suspend_title"):
                    suspend_title = self.settings.get("active_suspend_title")
            else:
                suspend_id = None

        self.active_status["boot_title"] = boot_title
        self.active_status["boot_id"] = boot_id
        self.active_status["suspend_title"] = suspend_title
        self.active_status["suspend_id"] = suspend_id

    def get_item_state(self, item_id: str, title: str, vtype: str) -> tuple[bool, bool, dict | None]:
        in_col_info = None
        if str(item_id) in self.collection_data:
            in_col_info = self.collection_data[str(item_id)]
        else:
            for cid, info in self.collection_data.items():
                if info.get("title", "").strip().lower() == title.strip().lower():
                    in_col_info = info
                    break

        is_in_collection = in_col_info is not None and os.path.isfile(in_col_info.get("local_file", ""))

        is_active = False
        if vtype == "suspend_video":
            if self.active_status["suspend_id"] and (str(item_id) == str(self.active_status["suspend_id"]) or (in_col_info and str(self.active_status["suspend_id"]) in self.collection_data and self.collection_data[str(self.active_status["suspend_id"])].get("title") == title)):
                is_active = True
            elif self.active_status["suspend_title"] and self.active_status["suspend_title"] == title and title != "Par défaut Steam":
                is_active = True
        else:
            if self.active_status["boot_id"] and (str(item_id) == str(self.active_status["boot_id"]) or (in_col_info and str(self.active_status["boot_id"]) in self.collection_data and self.collection_data[str(self.active_status["boot_id"])].get("title") == title)):
                is_active = True
            elif self.active_status["boot_title"] and self.active_status["boot_title"] == title and title != "Par défaut Steam":
                is_active = True

        return is_active, is_in_collection, in_col_info

    # --------------------------------------------------------------------------
    # STRUCTURE PRINCIPALE (LAYOUT)
    # --------------------------------------------------------------------------
    def _create_layout(self):
        # 1. Barre latérale gauche épurée
        self.sidebar = ctk.CTkFrame(self, fg_color=STEAM_SIDEBAR_BG, width=225, corner_radius=0)
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # 2. Zone principale
        self.main_container = ctk.CTkFrame(self, fg_color=STEAM_BG_BASE, corner_radius=0)
        self.main_container.pack(side="right", fill="both", expand=True)

        self._build_sidebar()
        self._build_main_header()
        self._build_active_hud_banner()
        self._build_grid_area()
        self._build_footer()

    # --------------------------------------------------------------------------
    # 1. SIDEBAR ÉPURÉE
    # --------------------------------------------------------------------------
    def _build_sidebar(self):
        # Logo
        logo_box = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        logo_box.pack(fill="x", padx=14, pady=(18, 12))

        ctk.CTkLabel(
            logo_box,
            text="🎮",
            font=get_font(24),
            text_color=STEAM_BLUE_PRIMARY
        ).pack()

        ctk.CTkLabel(
            logo_box,
            text="STEAM DECK",
            font=get_font(12, "bold"),
            text_color=STEAM_TEXT_WHITE
        ).pack(pady=(2, 0))

        ctk.CTkLabel(
            logo_box,
            text="REPO MANAGER",
            font=get_font(10, "bold"),
            text_color=STEAM_BLUE_PRIMARY
        ).pack()

        sep1 = ctk.CTkFrame(self.sidebar, fg_color=STEAM_CARD_BORDER, height=1)
        sep1.pack(fill="x", padx=16, pady=(8, 10))

        # 1. SECTION LIBRARY
        lbl_lib = ctk.CTkLabel(self.sidebar, text="LIBRARY", font=get_font(9, "bold"), text_color=STEAM_TEXT_MUTED, anchor="w")
        lbl_lib.pack(fill="x", padx=16, pady=(0, 4))

        self.btn_nav_boot = ctk.CTkButton(
            self.sidebar,
            text="🎮  Boot Videos",
            command=lambda: self._switch_category("boot_video"),
            fg_color=STEAM_BLUE_PRIMARY,
            hover_color=STEAM_BLUE_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        self.btn_nav_boot.pack(fill="x", padx=12, pady=2)

        self.btn_nav_suspend = ctk.CTkButton(
            self.sidebar,
            text="⏸  Suspend Videos",
            command=lambda: self._switch_category("suspend_video"),
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        self.btn_nav_suspend.pack(fill="x", padx=12, pady=2)

        btn_import_side = ctk.CTkButton(
            self.sidebar,
            text="☁  Upload / Importer",
            command=self._browse_local_video,
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        btn_import_side.pack(fill="x", padx=12, pady=2)

        sep2 = ctk.CTkFrame(self.sidebar, fg_color=STEAM_CARD_BORDER, height=1)
        sep2.pack(fill="x", padx=16, pady=(10, 10))

        # 2. SECTION SYSTEM & COLLECTION
        lbl_col = ctk.CTkLabel(self.sidebar, text="SYSTEM", font=get_font(9, "bold"), text_color=STEAM_TEXT_MUTED, anchor="w")
        lbl_col.pack(fill="x", padx=16, pady=(0, 4))

        fav_count = len(self.favorites_data)
        self.btn_nav_favorites = ctk.CTkButton(
            self.sidebar,
            text=f"⭐  Mes Favoris ({fav_count})",
            command=lambda: self._switch_category("favorites"),
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        self.btn_nav_favorites.pack(fill="x", padx=12, pady=2)

        count = len(self.collection_data)
        self.btn_nav_collection = ctk.CTkButton(
            self.sidebar,
            text=f"🎬  Ma Collection ({count})",
            command=lambda: self._switch_category("collection"),
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        self.btn_nav_collection.pack(fill="x", padx=12, pady=2)

        self.btn_nav_random = ctk.CTkButton(
            self.sidebar,
            text="🎲  Tirage Aléatoire",
            command=self._pick_random_from_collection,
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_BLUE_PRIMARY,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6,
            anchor="w"
        )
        self.btn_nav_random.pack(fill="x", padx=12, pady=2)

        self.auto_shuffle_var = ctk.BooleanVar(value=self.settings.get("auto_shuffle_startup", False))
        self.chk_auto_shuffle = ctk.CTkCheckBox(
            self.sidebar,
            text="🔄 Aléatoire au boot PC",
            variable=self.auto_shuffle_var,
            command=self._toggle_auto_shuffle,
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED,
            fg_color=STEAM_BLUE_PRIMARY,
            checkmark_color=STEAM_BG_BASE
        )
        self.chk_auto_shuffle.pack(anchor="w", padx=16, pady=(6, 6))

        # BAS DE LA SIDEBAR
        bottom_box = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        bottom_box.pack(side="bottom", fill="x", padx=12, pady=16)

        btn_restore = ctk.CTkButton(
            bottom_box,
            text="🛡️ Rétablir défauts Steam",
            command=self._restore_default_video,
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(10),
            height=26,
            corner_radius=4
        )
        btn_restore.pack(fill="x", pady=(0, 4))

        is_ok = bool(self.steam_path)
        self.steam_badge = ctk.CTkButton(
            bottom_box,
            text="🟢 Steam Détecté" if is_ok else "🔴 Choisir Steam...",
            command=self._change_steam_folder,
            fg_color=STEAM_BADGE_BG,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color="#5cd65c" if is_ok else "#ff5c5c",
            font=get_font(10, "bold"),
            height=28,
            corner_radius=6
        )
        self.steam_badge.pack(fill="x", pady=(0, 4))

        btn_folder = ctk.CTkButton(
            bottom_box,
            text="📂 Dossier des vidéos",
            command=self._open_movies_folder,
            fg_color=STEAM_BTN_SIDEBAR,
            hover_color=STEAM_BTN_SIDEBAR_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(10),
            height=26,
            corner_radius=4
        )
        btn_folder.pack(fill="x")

    # --------------------------------------------------------------------------
    # 2. EN-TÊTE PRINCIPAL
    # --------------------------------------------------------------------------
    def _build_main_header(self):
        header = ctk.CTkFrame(self.main_container, fg_color=STEAM_HEADER_BG, height=56, corner_radius=0)
        header.pack(fill="x")

        inner = ctk.CTkFrame(header, fg_color="transparent")
        inner.pack(fill="x", padx=18, pady=10)

        self.lbl_category_title = ctk.CTkLabel(
            inner,
            text="🎮  BOOT VIDEOS (DÉMARRAGE)",
            font=get_font(13, "bold"),
            text_color=STEAM_TEXT_WHITE
        )
        self.lbl_category_title.pack(side="left", padx=(0, 14))

        # Recherche avec debounce fluide
        self.search_box = ctk.CTkFrame(inner, fg_color="transparent")
        self.search_box.pack(side="left", fill="x", expand=True, padx=(0, 10))

        self.search_entry = ctk.CTkEntry(
            self.search_box,
            placeholder_text="🔍 Rechercher (Anime, Cyberpunk, Retro, PS2...)",
            fg_color=STEAM_INPUT_BG,
            border_color=STEAM_INPUT_BORDER,
            border_width=1,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11),
            height=32,
            corner_radius=6
        )
        self.search_entry.pack(side="left", fill="x", expand=True)
        self.search_entry.bind("<Return>", lambda e: self._on_search_immediate())
        self.search_entry.bind("<KeyRelease>", lambda e: self._on_search_debounced())

        self.btn_clear_search = ctk.CTkButton(
            self.search_box,
            text="✖",
            command=self._clear_search,
            fg_color=STEAM_INPUT_BG,
            hover_color=STEAM_BTN_SECONDARY,
            text_color=STEAM_TEXT_MUTED,
            width=28,
            height=32,
            corner_radius=6
        )
        self.btn_clear_search.pack(side="left", padx=(4, 0))

        # Tri
        self.sort_options = {
            "🔥 Tendances": "trending",
            "📥 Téléchargements": "downloads-desc",
            "⭐ Likes": "likes-desc",
            "✨ Récents": "created_at-desc"
        }
        self.sort_var = ctk.StringVar(value="🔥 Tendances")

        self.sort_menu = ctk.CTkOptionMenu(
            inner,
            values=list(self.sort_options.keys()),
            variable=self.sort_var,
            command=self._on_sort_changed,
            fg_color=STEAM_INPUT_BG,
            button_color=STEAM_BTN_SECONDARY,
            button_hover_color=STEAM_BTN_SEC_HOVER,
            dropdown_fg_color=STEAM_SIDEBAR_BG,
            dropdown_text_color=STEAM_TEXT_WHITE,
            dropdown_hover_color=STEAM_CARD_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11),
            width=135,
            height=32,
            corner_radius=6
        )
        self.sort_menu.pack(side="left", padx=(0, 10))

        # Importer
        btn_import = ctk.CTkButton(
            inner,
            text="📁 Importer .webm",
            command=self._browse_local_video,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11),
            width=115,
            height=32,
            corner_radius=6
        )
        btn_import.pack(side="left", padx=(0, 10))

        # Lancer Big Picture
        btn_launch = ctk.CTkButton(
            inner,
            text="▶ Lancer Big Picture",
            command=self._launch_bigpicture,
            fg_color=STEAM_GREEN_BTN,
            hover_color=STEAM_GREEN_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11, "bold"),
            height=32,
            corner_radius=6
        )
        btn_launch.pack(side="right")

    # --------------------------------------------------------------------------
    # 2.5 BANDEAU HUD ACTIF CLAIR & ÉPURÉ
    # --------------------------------------------------------------------------
    def _build_active_hud_banner(self):
        self.hud_frame = ctk.CTkFrame(
            self.main_container,
            fg_color=STEAM_HUD_BG,
            border_color=STEAM_CARD_BORDER,
            border_width=1,
            corner_radius=6
        )
        self.hud_frame.pack(fill="x", padx=18, pady=(8, 4))

        hud_inner = ctk.CTkFrame(self.hud_frame, fg_color="transparent")
        hud_inner.pack(fill="x", padx=12, pady=6)

        ctk.CTkLabel(
            hud_inner,
            text="🟢 ACTIF DANS STEAM :",
            font=get_font(10, "bold"),
            text_color=STEAM_BLUE_PRIMARY
        ).pack(side="left", padx=(0, 10))

        # Badge Boot Actif
        self.pill_boot = ctk.CTkFrame(hud_inner, fg_color=STEAM_BADGE_BG, border_color=STEAM_CARD_BORDER, border_width=1, corner_radius=5)
        self.pill_boot.pack(side="left", padx=(0, 8))

        self.lbl_hud_boot = ctk.CTkLabel(
            self.pill_boot,
            text=f"🎮 Boot: {self.active_status['boot_title']}",
            font=get_font(10, "bold"),
            text_color=STEAM_GREEN_TEXT if self.active_status["boot_title"] != "Par défaut Steam" else STEAM_TEXT_MUTED,
            padx=8,
            pady=3
        )
        self.lbl_hud_boot.pack(side="left")

        self.btn_clear_boot = ctk.CTkButton(
            self.pill_boot,
            text="✕",
            command=lambda: self._restore_specific_type("boot_video"),
            fg_color="transparent",
            hover_color="#5a1818",
            text_color=STEAM_TEXT_MUTED,
            width=18,
            height=18,
            font=get_font(9, "bold")
        )

        # Badge Suspend Actif
        self.pill_suspend = ctk.CTkFrame(hud_inner, fg_color=STEAM_BADGE_BG, border_color=STEAM_CARD_BORDER, border_width=1, corner_radius=5)
        self.pill_suspend.pack(side="left", padx=(0, 8))

        self.lbl_hud_suspend = ctk.CTkLabel(
            self.pill_suspend,
            text=f"⏸ Veille: {self.active_status['suspend_title']}",
            font=get_font(10, "bold"),
            text_color=STEAM_GREEN_TEXT if self.active_status["suspend_title"] != "Par défaut Steam" else STEAM_TEXT_MUTED,
            padx=8,
            pady=3
        )
        self.lbl_hud_suspend.pack(side="left")

        self.btn_clear_suspend = ctk.CTkButton(
            self.pill_suspend,
            text="✕",
            command=lambda: self._restore_specific_type("suspend_video"),
            fg_color="transparent",
            hover_color="#5a1818",
            text_color=STEAM_TEXT_MUTED,
            width=18,
            height=18,
            font=get_font(9, "bold")
        )

        # Bouton Actualiser
        btn_refresh = ctk.CTkButton(
            hud_inner,
            text="🔄 Actualiser",
            command=self._on_manual_refresh,
            fg_color="transparent",
            hover_color=STEAM_CARD_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(9),
            height=22,
            width=65,
            corner_radius=4
        )
        btn_refresh.pack(side="right")

    def _update_hud_display(self):
        boot_name = self.active_status["boot_title"]
        susp_name = self.active_status["suspend_title"]

        boot_disp = (boot_name[:22] + "...") if len(boot_name) > 22 else boot_name
        susp_disp = (susp_name[:22] + "...") if len(susp_name) > 22 else susp_name

        self.lbl_hud_boot.configure(
            text=f"🎮 Boot: {boot_disp}",
            text_color=STEAM_GREEN_TEXT if boot_name != "Par défaut Steam" else STEAM_TEXT_MUTED
        )
        self.pill_boot.configure(
            border_color=STEAM_GREEN_BTN if boot_name != "Par défaut Steam" else STEAM_CARD_BORDER
        )
        if boot_name != "Par défaut Steam":
            self.btn_clear_boot.pack(side="left", padx=(0, 6))
        else:
            self.btn_clear_boot.pack_forget()

        self.lbl_hud_suspend.configure(
            text=f"⏸ Veille: {susp_disp}",
            text_color=STEAM_GREEN_TEXT if susp_name != "Par défaut Steam" else STEAM_TEXT_MUTED
        )
        self.pill_suspend.configure(
            border_color=STEAM_GREEN_BTN if susp_name != "Par défaut Steam" else STEAM_CARD_BORDER
        )
        if susp_name != "Par défaut Steam":
            self.btn_clear_suspend.pack(side="left", padx=(0, 6))
        else:
            self.btn_clear_suspend.pack_forget()

    def _restore_specific_type(self, vtype: str):
        if not self.steam_path:
            return
        target_map = SteamManager.get_target_directories(self.steam_path)
        filenames = TARGET_BOOT_FILES if vtype == "boot_video" else TARGET_SUSPEND_FILES
        for key, target_dir in target_map.items():
            if not target_dir.exists():
                continue
            for fname in filenames:
                dest = target_dir / fname
                backup = target_dir / f"{fname}.backup"
                if dest.exists():
                    set_file_read_only(dest, read_only=False)
                if backup.exists():
                    set_file_read_only(backup, read_only=False)
                    shutil.copy2(backup, dest)
                    backup.unlink(missing_ok=True)
                elif key in ["overrides", "uioverrides"] and dest.exists():
                    dest.unlink(missing_ok=True)

        if vtype == "boot_video":
            self.settings["active_boot_id"] = None
            self.settings["active_boot_title"] = "Par défaut Steam"
        else:
            self.settings["active_suspend_id"] = None
            self.settings["active_suspend_title"] = "Par défaut Steam"
        self._save_settings()

        self._refresh_active_animations_status()
        self._update_hud_display()
        if self.current_video_type == "collection":
            self._refresh_collection_cards_ui()
        else:
            self._refresh_online_cards_ui()
        self._show_toast("✔ Animation remise par défaut.")

    def _on_manual_refresh(self):
        self._refresh_active_animations_status()
        self._update_hud_display()
        if self.current_video_type == "collection":
            self._render_collection()
        else:
            self._load_gallery_async()
        self._show_toast("Statut synchronisé.")

    # --------------------------------------------------------------------------
    # 3. GRILLE DE VIDÉOS
    # --------------------------------------------------------------------------
    def _build_grid_area(self):
        self.grid_scroll = ctk.CTkScrollableFrame(
            self.main_container,
            fg_color="transparent",
            corner_radius=0
        )
        self.grid_scroll.pack(fill="both", expand=True, padx=18, pady=6)

    # --------------------------------------------------------------------------
    # 4. PIED DE PAGE
    # --------------------------------------------------------------------------
    def _build_footer(self):
        footer = ctk.CTkFrame(self.main_container, fg_color=STEAM_HEADER_BG, height=42, corner_radius=0)
        footer.pack(fill="x", side="bottom")

        self.lbl_status = ctk.CTkLabel(
            footer,
            text="Prêt — 1. Installez une animation 📥  ➜  2. Activez-la au démarrage 🎮 ou en veille ⏸",
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED
        )
        self.lbl_status.pack(side="left", padx=18, pady=8)

        self.pag_box = ctk.CTkFrame(footer, fg_color="transparent")
        self.pag_box.pack(side="right", padx=18, pady=6)

        self.btn_prev = ctk.CTkButton(
            self.pag_box,
            text="◀ Précédent",
            command=self._prev_page,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(10, "bold"),
            width=90,
            height=26,
            corner_radius=4
        )
        self.btn_prev.pack(side="left", padx=(0, 6))

        self.lbl_page = ctk.CTkLabel(
            self.pag_box,
            text="Page 1",
            font=get_font(11, "bold"),
            text_color=STEAM_TEXT_WHITE
        )
        self.lbl_page.pack(side="left", padx=(0, 6))

        self.btn_next = ctk.CTkButton(
            self.pag_box,
            text="Suivant ▶",
            command=self._next_page,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(10, "bold"),
            width=90,
            height=26,
            corner_radius=4
        )
        self.btn_next.pack(side="left")

    # --------------------------------------------------------------------------
    # NAVIGATION ENTRE CATÉGORIES
    # --------------------------------------------------------------------------
    def _switch_category(self, category_key: str):
        self.current_video_type = category_key
        self.current_page = 1

        self.btn_nav_boot.configure(
            fg_color=STEAM_BLUE_PRIMARY if category_key == "boot_video" else STEAM_BTN_SIDEBAR,
            text_color=STEAM_TEXT_WHITE if category_key == "boot_video" else STEAM_TEXT_MUTED
        )
        self.btn_nav_suspend.configure(
            fg_color=STEAM_BLUE_PRIMARY if category_key == "suspend_video" else STEAM_BTN_SIDEBAR,
            text_color=STEAM_TEXT_WHITE if category_key == "suspend_video" else STEAM_TEXT_MUTED
        )
        self.btn_nav_favorites.configure(
            fg_color=STEAM_BLUE_PRIMARY if category_key == "favorites" else STEAM_BTN_SIDEBAR,
            text_color=STEAM_TEXT_WHITE if category_key == "favorites" else STEAM_TEXT_MUTED
        )
        self.btn_nav_collection.configure(
            fg_color=STEAM_BLUE_PRIMARY if category_key == "collection" else STEAM_BTN_SIDEBAR,
            text_color=STEAM_TEXT_WHITE if category_key == "collection" else STEAM_TEXT_MUTED
        )

        if category_key == "boot_video":
            self.lbl_category_title.configure(text="BOOT VIDEOS")
            self.search_entry.configure(placeholder_text="🔍 Rechercher (Anime, Cyberpunk, Retro, PS2...)")
            self.sort_menu.pack(side="left", padx=(0, 10))
            self.pag_box.pack(side="right", padx=18, pady=6)
            self._load_gallery_async()

        elif category_key == "suspend_video":
            self.lbl_category_title.configure(text="SUSPEND VIDEOS")
            self.search_entry.configure(placeholder_text="🔍 Rechercher (Anime, Cyberpunk, Retro, PS2...)")
            self.sort_menu.pack(side="left", padx=(0, 10))
            self.pag_box.pack(side="right", padx=18, pady=6)
            self._load_gallery_async()

        elif category_key == "favorites":
            self.lbl_category_title.configure(text="⭐ MES FAVORIS")
            self.search_entry.configure(placeholder_text="🔍 Filtrer mes favoris...")
            self.sort_menu.pack_forget()
            self.pag_box.pack_forget()
            self._render_favorites()

        elif category_key == "collection":
            self.lbl_category_title.configure(text="MA COLLECTION")
            self.search_entry.configure(placeholder_text="🔍 Filtrer ma collection locale...")
            self.sort_menu.pack_forget()
            self.pag_box.pack_forget()
            self._render_collection()

    def _update_sidebar_counts(self):
        count = len(self.collection_data)
        self.btn_nav_collection.configure(text=f"🎬  Ma Collection ({count})")
        fav_count = len(self.favorites_data)
        self.btn_nav_favorites.configure(text=f"⭐  Mes Favoris ({fav_count})")

    # --------------------------------------------------------------------------
    # RECHERCHE & PAGINATION AVEC DEBOUNCE
    # --------------------------------------------------------------------------
    def _on_search_debounced(self):
        if self._search_debounce_timer is not None:
            self.after_cancel(self._search_debounce_timer)
        self._search_debounce_timer = self.after(300, self._on_search_immediate)

    def _on_search_immediate(self):
        if self.current_video_type == "collection":
            self.collection_search = self.search_entry.get().strip()
            self._render_collection()
        elif self.current_video_type == "favorites":
            self.favorites_search = self.search_entry.get().strip()
            self._render_favorites()
        else:
            self.current_search = self.search_entry.get().strip()
            self.current_page = 1
            self._load_gallery_async()

    def _clear_search(self):
        self.search_entry.delete(0, "end")
        self.collection_search = ""
        self.favorites_search = ""
        self.current_search = ""
        self.current_page = 1
        if self.current_video_type == "collection":
            self._render_collection()
        elif self.current_video_type == "favorites":
            self._render_favorites()
        else:
            self._load_gallery_async()

    def _on_sort_changed(self, choice):
        self.current_sort = self.sort_options.get(choice, "trending")
        self.current_page = 1
        self._load_gallery_async()

    def _prev_page(self):
        if self.current_page > 1:
            self.current_page -= 1
            self._load_gallery_async()

    def _next_page(self):
        if len(self.current_posts) < 12:
            return
        self.current_page += 1
        self._load_gallery_async()

    def _load_gallery_async(self):
        if self.is_loading:
            return
        self.is_loading = True

        for w in self.grid_scroll.winfo_children():
            w.destroy()

        self.lbl_page.configure(text=f"Page {self.current_page}")
        self.btn_prev.configure(state="disabled")
        self.btn_next.configure(state="disabled")
        self.lbl_status.configure(text="Connexion à SteamDeckRepo...", text_color=STEAM_BLUE_PRIMARY)

        loader = ctk.CTkLabel(
            self.grid_scroll,
            text="⏳ Chargement des animations...",
            font=get_font(13),
            text_color=STEAM_TEXT_MUTED
        )
        loader.pack(pady=80)

        self.executor.submit(self._fetch_posts_worker)

    def _fetch_posts_worker(self):
        try:
            data = SteamDeckRepoAPI.fetch_posts(
                page=self.current_page,
                sort=self.current_sort,
                search=self.current_search,
                video_type=self.current_video_type
            )
            posts = data.get("posts", [])
            self.after(0, lambda: self._render_online_grid(posts))
        except Exception as e:
            self.after(0, lambda: self._render_error(str(e)))

    def _render_error(self, err_msg: str):
        self.is_loading = False
        self.lbl_status.configure(text="Erreur de connexion.", text_color="#ff5c5c")
        self.btn_prev.configure(state="disabled" if self.current_page <= 1 else "normal")
        self.btn_next.configure(state="disabled")
        for w in self.grid_scroll.winfo_children():
            w.destroy()

        err_box = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        err_box.pack(pady=80)

        ctk.CTkLabel(
            err_box,
            text=f"Impossible de joindre SteamDeckRepo ({err_msg})",
            font=get_font(13, "bold"),
            text_color=STEAM_TEXT_WHITE
        ).pack(pady=(0, 6))

        ctk.CTkButton(
            err_box,
            text="Réessayer",
            command=self._load_gallery_async,
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            width=110,
            corner_radius=4
        ).pack(pady=10)

    def _cycle_hero(self, delta: int):
        if not self.current_posts:
            return
        hero_count = min(5, len(self.current_posts))
        self.hero_index = (self.hero_index + delta) % hero_count
        self._build_hero_banner(self.current_posts)

    def _build_hero_banner(self, posts: list):
        if not posts or not getattr(self, "hero_container", None):
            return

        for w in self.hero_container.winfo_children():
            w.destroy()

        hero_count = min(5, len(posts))
        self.hero_index = self.hero_index % hero_count
        post = posts[self.hero_index]

        post_id = str(post.get("id", ""))
        title_text = post.get("title", "Sans titre")
        vtype = post.get("type", "boot_video")
        author = (post.get("user") or {}).get("steam_name", "Anonyme")
        downloads = post.get("downloads", 0)
        likes = post.get("likes", 0)
        duration = post.get("video_duration", 0)
        thumb_url = post.get("thumbnail", "")

        is_active, is_in_col, local_info = self.get_item_state(post_id, title_text, vtype)

        hero_card = ctk.CTkFrame(
            self.hero_container,
            fg_color=STEAM_CARD_BG,
            border_color=STEAM_CARD_BORDER,
            border_width=1,
            corner_radius=12
        )
        hero_card.pack(fill="x", padx=7, pady=(0, 10))

        hero_inner = ctk.CTkFrame(hero_card, fg_color="transparent")
        hero_inner.pack(fill="x", padx=16, pady=16)

        # Colonne Gauche : Badges, Titre, Auteur, Boutons
        left_col = ctk.CTkFrame(hero_inner, fg_color="transparent")
        left_col.pack(side="left", fill="both", expand=True, padx=(0, 16))

        badge_row = ctk.CTkFrame(left_col, fg_color="transparent")
        badge_row.pack(anchor="w", pady=(0, 8))

        ctk.CTkLabel(
            badge_row,
            text="🔥 TENDANCE",
            font=get_font(9, "bold"),
            text_color=STEAM_TEXT_WHITE,
            fg_color=STEAM_BLUE_PRIMARY,
            corner_radius=4,
            padx=8,
            pady=3
        ).pack(side="left", padx=(0, 6))

        type_badge_str = "DÉMARRAGE STEAM" if vtype == "boot_video" else "MISE EN VEILLE"
        ctk.CTkLabel(
            badge_row,
            text=type_badge_str,
            font=get_font(9, "bold"),
            text_color=STEAM_BLUE_PRIMARY,
            fg_color=STEAM_BADGE_BG,
            corner_radius=4,
            padx=8,
            pady=3
        ).pack(side="left")

        ctk.CTkLabel(
            left_col,
            text=title_text,
            font=get_font(18, "bold"),
            text_color=STEAM_TEXT_WHITE,
            wraplength=460,
            justify="left",
            anchor="w"
        ).pack(anchor="w", pady=(0, 6))

        meta_row = ctk.CTkFrame(left_col, fg_color="transparent")
        meta_row.pack(anchor="w", pady=(0, 14))

        ctk.CTkLabel(
            meta_row,
            text=f"👤 {author}   📥 {downloads}   ❤️ {likes}   ⏱️ {duration}s",
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED
        ).pack(side="left")

        btn_row = ctk.CTkFrame(left_col, fg_color="transparent")
        btn_row.pack(anchor="w", pady=(0, 4))

        ctk.CTkButton(
            btn_row,
            text="▶ Lire l'Aperçu",
            command=lambda p=post: self._play_preview_video(p),
            fg_color=STEAM_BLUE_PRIMARY,
            hover_color=STEAM_BLUE_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6
        ).pack(side="left", padx=(0, 8))

        ctk.CTkButton(
            btn_row,
            text="🔍 Détails",
            command=lambda p=post: self._open_detail_modal(p),
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11, "bold"),
            height=34,
            corner_radius=6
        ).pack(side="left", padx=(0, 8))

        if is_active:
            act_txt = "🟢 Actif au démarrage" if vtype == "boot_video" else "🟢 Actif en veille"
            ctk.CTkButton(
                btn_row,
                text=act_txt,
                command=lambda p=post: self._play_preview_video(p),
                fg_color=STEAM_GREEN_BTN,
                hover_color=STEAM_GREEN_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=34,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))
        elif is_in_col:
            local_fp = local_info.get("local_file", "") if local_info else ""
            set_txt = "▶ Activer au démarrage" if vtype == "boot_video" else "▶ Activer en veille"
            ctk.CTkButton(
                btn_row,
                text=set_txt,
                command=lambda fp=local_fp, t=title_text, vt=vtype, pid=post_id: self._apply_local_path(fp, t, vt, pid),
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=34,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))
        else:
            ctk.CTkButton(
                btn_row,
                text="📥 Installer",
                command=lambda p=post: self._download_to_collection_only(p),
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=34,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))

        is_fav = self._is_favorite(post_id)
        ctk.CTkButton(
            btn_row,
            text="⭐ Favori" if is_fav else "🤍 Favori",
            command=lambda p=post: [self._toggle_favorite(p), self._build_hero_banner(posts)],
            fg_color="#372c08" if is_fav else STEAM_BTN_SECONDARY,
            hover_color="#52400a" if is_fav else STEAM_BTN_SEC_HOVER,
            text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED,
            font=get_font(10, "bold"),
            height=34,
            corner_radius=6
        ).pack(side="left")

        # Colonne Droite : Miniature héroïque + navigation carrousel
        right_col = ctk.CTkFrame(hero_inner, fg_color="transparent")
        right_col.pack(side="right")

        thumb_box = ctk.CTkFrame(right_col, fg_color="#0e141b", corner_radius=8)
        thumb_box.pack()

        hero_img_label = ctk.CTkLabel(
            thumb_box,
            text="",
            fg_color="#0e141b",
            width=320,
            height=180,
            corner_radius=8,
            cursor="hand2"
        )
        hero_img_label.pack(padx=2, pady=2)
        hero_img_label.bind("<Button-1>", lambda e, p=post: self._play_preview_video(p))

        if thumb_url:
            self._load_thumbnail_async(thumb_url, hero_img_label)

        nav_row = ctk.CTkFrame(right_col, fg_color="transparent")
        nav_row.pack(fill="x", pady=(6, 0))

        ctk.CTkButton(
            nav_row,
            text="◀",
            command=lambda: self._cycle_hero(-1),
            fg_color="transparent",
            hover_color=STEAM_CARD_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            width=28,
            height=22
        ).pack(side="left")

        dots_str = " ".join("●" if i == self.hero_index else "○" for i in range(hero_count))
        ctk.CTkLabel(
            nav_row,
            text=dots_str,
            font=get_font(10),
            text_color=STEAM_BLUE_PRIMARY
        ).pack(side="left", expand=True)

        ctk.CTkButton(
            nav_row,
            text="▶",
            command=lambda: self._cycle_hero(1),
            fg_color="transparent",
            hover_color=STEAM_CARD_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11, "bold"),
            width=28,
            height=22
        ).pack(side="right")

    def _render_online_grid(self, posts: list = None):
        self.is_loading = False
        self._refresh_active_animations_status()
        self._update_hud_display()
        self.online_card_widgets.clear()

        if posts is not None:
            self.current_posts = list(posts)
        else:
            posts = self.current_posts

        cat_name = "Boot Videos" if self.current_video_type == "boot_video" else "Suspend Videos"

        # Gestion des boutons de pagination
        self.lbl_page.configure(text=f"Page {self.current_page}")
        self.btn_prev.configure(state="disabled" if self.current_page <= 1 else "normal")
        self.btn_next.configure(state="normal" if len(posts) >= 12 else "disabled")

        for w in self.grid_scroll.winfo_children():
            w.destroy()

        if not posts:
            self.hero_container = None
            if self.current_page > 1:
                self.lbl_status.configure(
                    text=f"Fin des {cat_name} — Vous êtes à la dernière page.",
                    text_color=STEAM_TEXT_MUTED
                )
                end_box = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
                end_box.pack(pady=80)

                ctk.CTkLabel(
                    end_box,
                    text=f"🏁 Fin du catalogue — Aucune animation sur la page {self.current_page}.",
                    font=get_font(14, "bold"),
                    text_color=STEAM_TEXT_WHITE
                ).pack(pady=(0, 10))

                ctk.CTkButton(
                    end_box,
                    text=f"◀ Revenir à la page {self.current_page - 1}",
                    command=self._prev_page,
                    fg_color=STEAM_BLUE_PRIMARY,
                    hover_color=STEAM_BLUE_HOVER,
                    text_color=STEAM_TEXT_WHITE,
                    font=get_font(11, "bold"),
                    height=32,
                    corner_radius=6
                ).pack()
            else:
                self.lbl_status.configure(
                    text=f"0 {cat_name} trouvée.",
                    text_color=STEAM_TEXT_MUTED
                )
                ctk.CTkLabel(
                    self.grid_scroll,
                    text="Aucune animation trouvée pour cette recherche.",
                    font=get_font(13),
                    text_color=STEAM_TEXT_MUTED
                ).pack(pady=80)
            return

        self.lbl_status.configure(
            text=f"{len(posts)} {cat_name} disponibles sur la page {self.current_page}.",
            text_color=STEAM_TEXT_MUTED
        )

        # Affichage de la Bannière Hero Trending sur la page 1 sans recherche
        if self.current_page == 1 and not self.current_search:
            self.hero_container = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
            self.hero_container.pack(fill="x", pady=(0, 4))
            self._build_hero_banner(posts)
        else:
            self.hero_container = None

        grid_cards = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        grid_cards.pack(fill="both", expand=True)

        grid_cards.grid_columnconfigure(0, weight=1)
        grid_cards.grid_columnconfigure(1, weight=1)
        grid_cards.grid_columnconfigure(2, weight=1)

        for idx, item in enumerate(posts):
            row = idx // 3
            col = idx % 3
            self._create_online_card(grid_cards, item, row, col)

    # --------------------------------------------------------------------------
    # CARTE DU CATALOGUE (3 ÉTATS DISTINCTS & MISE À JOUR SANS RECHARGEMENT)
    # --------------------------------------------------------------------------
    def _create_online_card(self, parent_frame: ctk.CTkFrame, post: dict, row: int, col: int):
        post_id = str(post.get("id", ""))
        title_text = post.get("title", "Sans titre")
        vtype = post.get("type", "boot_video")

        card = ctk.CTkFrame(
            parent_frame,
            fg_color=STEAM_CARD_BG,
            border_color=STEAM_CARD_BORDER,
            border_width=1,
            corner_radius=8
        )
        card.grid(row=row, column=col, padx=7, pady=7, sticky="nsew")

        # Miniature
        thumb_url = post.get("thumbnail", "")
        img_label = ctk.CTkLabel(
            card,
            text="",
            fg_color="#0e141b",
            height=135,
            corner_radius=6,
            cursor="hand2"
        )
        img_label.pack(fill="x", padx=7, pady=(7, 4))
        img_label.bind("<Button-1>", lambda e, p=post: self._open_detail_modal(p))

        if thumb_url:
            self._load_thumbnail_async(thumb_url, img_label)

        # Conteneur de badge dynamique (affiché uniquement si actif ou en collection)
        badge_box = ctk.CTkFrame(card, fg_color="transparent")
        badge_lbl = ctk.CTkLabel(
            badge_box,
            text="",
            font=get_font(9, "bold"),
            corner_radius=4,
            padx=8,
            pady=2
        )
        badge_lbl.pack(side="left")

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="x", padx=9, pady=(0, 9))

        title_lbl = ctk.CTkLabel(
            body,
            text=title_text[:28] + ("..." if len(title_text) > 28 else ""),
            font=get_font(11, "bold"),
            text_color=STEAM_TEXT_WHITE,
            anchor="w",
            cursor="hand2"
        )
        title_lbl.pack(fill="x", pady=(2, 2))
        title_lbl.bind("<Button-1>", lambda e, p=post: self._open_detail_modal(p))

        meta_sub = ctk.CTkFrame(body, fg_color="transparent")
        meta_sub.pack(fill="x", pady=(0, 2))

        author = (post.get("user") or {}).get("steam_name", "Anonyme")
        duration = post.get("video_duration", 0)
        downloads = post.get("downloads", 0)
        likes = post.get("likes", 0)
        type_tag = "🎮 Boot" if vtype == "boot_video" else "⏸ Veille"

        ctk.CTkLabel(
            meta_sub,
            text=f"👤 {author[:18]}",
            font=get_font(9),
            text_color=STEAM_TEXT_MUTED,
            anchor="w"
        ).pack(side="left")

        dur_badge = ctk.CTkLabel(
            meta_sub,
            text=f"{type_tag} • {duration}s",
            font=get_font(9, "bold"),
            text_color=STEAM_BLUE_PRIMARY,
            fg_color=STEAM_BADGE_BG,
            corner_radius=4,
            padx=5,
            pady=0
        )
        dur_badge.pack(side="right")

        meta_row = ctk.CTkFrame(body, fg_color="transparent")
        meta_row.pack(fill="x", pady=(2, 6))

        ctk.CTkLabel(
            meta_row,
            text=f"❤️ {likes}  •  📥 {downloads}",
            font=get_font(9),
            text_color=STEAM_TEXT_MUTED
        ).pack(side="left")

        is_fav = self._is_favorite(post_id)
        btn_fav = ctk.CTkButton(
            meta_row,
            text="⭐" if is_fav else "🤍",
            command=lambda p=post: self._toggle_favorite(p),
            fg_color="transparent",
            hover_color=STEAM_BTN_SECONDARY,
            text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED,
            font=get_font(12),
            height=20,
            width=26
        )
        btn_fav.pack(side="right")

        # Boutons d'action
        btn_box = ctk.CTkFrame(body, fg_color="transparent")
        btn_box.pack(fill="x")

        self.online_card_widgets[post_id] = {
            "card": card,
            "post": post,
            "badge_box": badge_box,
            "badge_lbl": badge_lbl,
            "title_lbl": title_lbl,
            "btn_fav": btn_fav,
            "btn_box": btn_box
        }

        self._update_single_online_card_ui(post_id)

    def _update_single_online_card_ui(self, post_id: str):
        widgets = self.online_card_widgets.get(post_id)
        if not widgets:
            return

        card = widgets["card"]
        post = widgets["post"]
        badge_box = widgets.get("badge_box")
        badge_lbl = widgets["badge_lbl"]
        title_lbl = widgets["title_lbl"]
        btn_fav = widgets.get("btn_fav")
        btn_box = widgets["btn_box"]

        title_text = post.get("title", "Sans titre")
        vtype = post.get("type", "boot_video")

        is_active, is_in_collection, local_info = self.get_item_state(post_id, title_text, vtype)

        card_border = STEAM_GREEN_TEXT if is_active else (STEAM_CARD_BORDER_SAVED if is_in_collection else STEAM_CARD_BORDER)
        border_w = 2 if is_active else 1
        card.configure(border_color=card_border, border_width=border_w)

        title_color = STEAM_GREEN_TEXT if is_active else (STEAM_BLUE_PRIMARY if is_in_collection else STEAM_TEXT_WHITE)
        title_lbl.configure(text_color=title_color)

        if btn_fav is not None:
            is_fav = self._is_favorite(post_id)
            btn_fav.configure(
                text="⭐" if is_fav else "🤍",
                text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED
            )

        if is_active:
            badge_lbl.configure(
                text="🟢 ACTIF DANS STEAM",
                text_color=STEAM_GREEN_TEXT,
                fg_color=STEAM_GREEN_BADGE
            )
            if badge_box is not None:
                badge_box.pack(fill="x", padx=9, pady=(2, 2), before=widgets["title_lbl"].master)
        elif is_in_collection:
            badge_lbl.configure(
                text="💾 DANS MA COLLECTION",
                text_color=STEAM_BLUE_PRIMARY,
                fg_color=STEAM_BADGE_BG
            )
            if badge_box is not None:
                badge_box.pack(fill="x", padx=9, pady=(2, 2), before=widgets["title_lbl"].master)
        else:
            if badge_box is not None:
                badge_box.pack_forget()

        for w in btn_box.winfo_children():
            w.destroy()

        if is_active:
            active_txt = "🟢 Actif au démarrage" if vtype == "boot_video" else "🟢 Actif en veille"
            ctk.CTkButton(
                btn_box,
                text=active_txt,
                command=lambda p=post: self._play_preview_video(p),
                fg_color=STEAM_GREEN_BTN,
                hover_color=STEAM_GREEN_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=28,
                corner_radius=5
            ).pack(side="left", fill="x", expand=True, padx=(0, 4))

            ctk.CTkButton(
                btn_box,
                text="▶ Lire",
                command=lambda p=post: self._play_preview_video(p),
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(9, "bold"),
                width=55,
                height=28,
                corner_radius=5
            ).pack(side="right")

        elif is_in_collection:
            local_fp = local_info.get("local_file", "") if local_info else ""
            set_txt = "▶ Activer au démarrage" if vtype == "boot_video" else "▶ Activer en veille"
            ctk.CTkButton(
                btn_box,
                text=set_txt,
                command=lambda fp=local_fp, t=title_text, vt=vtype, pid=post_id: self._apply_local_path(fp, t, vt, pid),
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=28,
                corner_radius=5
            ).pack(side="left", fill="x", expand=True, padx=(0, 4))

            ctk.CTkButton(
                btn_box,
                text="▶ Lire",
                command=lambda p=post: self._play_preview_video(p),
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(9, "bold"),
                width=55,
                height=28,
                corner_radius=5
            ).pack(side="right")

        else:
            ctk.CTkButton(
                btn_box,
                text="📥 Installer",
                command=lambda p=post: self._download_to_collection_only(p),
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=28,
                corner_radius=5
            ).pack(side="left", fill="x", expand=True, padx=(0, 4))

            ctk.CTkButton(
                btn_box,
                text="▶ Aperçu",
                command=lambda p=post: self._play_preview_video(p),
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(9, "bold"),
                width=65,
                height=28,
                corner_radius=5
            ).pack(side="right")

    def _refresh_online_cards_ui(self):
        self._refresh_active_animations_status()
        self._update_hud_display()
        self._update_sidebar_counts()
        for pid in list(self.online_card_widgets.keys()):
            self._update_single_online_card_ui(pid)

    # --------------------------------------------------------------------------
    # 5. VUE MA COLLECTION LOCALE
    # --------------------------------------------------------------------------
    def _render_collection(self):
        for w in self.grid_scroll.winfo_children():
            w.destroy()

        self._refresh_active_animations_status()
        self._update_hud_display()
        self.collection_card_widgets.clear()

        all_items = list(self.collection_data.items())

        total_size_bytes = sum(Path(v.get("local_file", "")).stat().st_size for _, v in all_items if Path(v.get("local_file", "")).is_file())
        total_size_mb = total_size_bytes / (1024 * 1024)

        top_bar = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        top_bar.pack(fill="x", pady=(0, 10))

        filter_box = ctk.CTkFrame(top_bar, fg_color="transparent")
        filter_box.pack(side="left")

        boot_count = sum(1 for _, v in all_items if v.get("type", "boot_video") == "boot_video")
        susp_count = sum(1 for _, v in all_items if v.get("type", "boot_video") == "suspend_video")
        active_count = sum(1 for k, v in all_items if self.get_item_state(k, v.get("title", ""), v.get("type", "boot_video"))[0])

        filters = [
            ("all", f"Tous ({len(all_items)})"),
            ("boot_video", f"🎮 Boot ({boot_count})"),
            ("suspend_video", f"⏸ Suspend ({susp_count})"),
            ("active", f"🟢 Utilisés ({active_count})")
        ]

        for f_key, f_label in filters:
            is_f_active = self.collection_filter == f_key
            ctk.CTkButton(
                filter_box,
                text=f_label,
                command=lambda k=f_key: self._set_collection_filter(k),
                fg_color=STEAM_BLUE_PRIMARY if is_f_active else STEAM_BTN_SECONDARY,
                hover_color=STEAM_BLUE_HOVER if is_f_active else STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE if is_f_active else STEAM_TEXT_MUTED,
                font=get_font(10, "bold"),
                height=26,
                corner_radius=4
            ).pack(side="left", padx=(0, 6))

        ctk.CTkLabel(
            top_bar,
            text=f"💾 Espace : {total_size_mb:.1f} Mo",
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED
        ).pack(side="right")

        filtered_items = []
        for vid_id, info in all_items:
            vtype = info.get("type", "boot_video")
            title = info.get("title", "")
            is_active, _, _ = self.get_item_state(vid_id, title, vtype)

            if self.collection_filter == "boot_video" and vtype != "boot_video":
                continue
            if self.collection_filter == "suspend_video" and vtype != "suspend_video":
                continue
            if self.collection_filter == "active" and not is_active:
                continue

            if self.collection_search and self.collection_search.lower() not in title.lower():
                continue

            filtered_items.append((vid_id, info))

        count = len(filtered_items)
        self.lbl_status.configure(
            text=f"Ma Collection : {count} animation{'s' if count > 1 else ''} enregistrée{'s' if count > 1 else ''}.",
            text_color=STEAM_TEXT_MUTED
        )

        if not filtered_items:
            empty_box = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
            empty_box.pack(pady=80)
            ctk.CTkLabel(
                empty_box,
                text="🎬 Aucun élément ne correspond.",
                font=get_font(14, "bold"),
                text_color=STEAM_TEXT_WHITE
            ).pack(pady=(0, 6))
            return

        grid_cards = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        grid_cards.pack(fill="both", expand=True)

        grid_cards.grid_columnconfigure(0, weight=1)
        grid_cards.grid_columnconfigure(1, weight=1)
        grid_cards.grid_columnconfigure(2, weight=1)

        for idx, (vid_id, info) in enumerate(filtered_items):
            row = idx // 3
            col = idx % 3
            self._create_collection_card(grid_cards, vid_id, info, row, col)

    def _set_collection_filter(self, filter_key: str):
        self.collection_filter = filter_key
        self._render_collection()

    def _create_collection_card(self, parent_frame: ctk.CTkFrame, vid_id: str, info: dict, row: int, col: int):
        title_text = info.get("title", "Sans titre")
        file_path = info.get("local_file", "")
        vtype = info.get("type", "boot_video")

        card = ctk.CTkFrame(
            parent_frame,
            fg_color=STEAM_CARD_BG,
            border_color=STEAM_CARD_BORDER,
            border_width=1,
            corner_radius=8
        )
        card.grid(row=row, column=col, padx=7, pady=7, sticky="nsew")

        thumb_url = info.get("thumbnail", "")
        img_label = ctk.CTkLabel(
            card,
            text="",
            fg_color="#0e141b",
            height=135,
            corner_radius=6,
            cursor="hand2"
        )
        img_label.pack(fill="x", padx=7, pady=(7, 4))
        img_label.bind("<Button-1>", lambda e, item=info: self._play_preview_video(item))

        if thumb_url:
            self._load_thumbnail_async(thumb_url, img_label)
        else:
            img_label.configure(text="🎬 Animation Locale", font=get_font(10), text_color=STEAM_TEXT_MUTED)

        badge_box = ctk.CTkFrame(card, fg_color="transparent")
        badge_lbl = ctk.CTkLabel(
            badge_box,
            text="",
            font=get_font(9, "bold"),
            corner_radius=3,
            padx=8,
            pady=2
        )
        badge_lbl.pack(side="left")

        body = ctk.CTkFrame(card, fg_color="transparent")
        body.pack(fill="x", padx=9, pady=(0, 9))

        title_lbl = ctk.CTkLabel(
            body,
            text=title_text[:28] + ("..." if len(title_text) > 28 else ""),
            font=get_font(11, "bold"),
            text_color=STEAM_TEXT_WHITE,
            anchor="w",
            cursor="hand2"
        )
        title_lbl.pack(fill="x", pady=(2, 4))
        title_lbl.bind("<Button-1>", lambda e, item=info: self._play_preview_video(item))

        meta_row = ctk.CTkFrame(body, fg_color="transparent")
        meta_row.pack(fill="x", pady=(0, 6))

        dur = info.get("duration", 0)
        dur_str = f" • {dur}s" if dur else ""
        type_str = "🎮 Boot" if vtype == "boot_video" else "⏸ Veille"

        ctk.CTkLabel(
            meta_row,
            text=f"{type_str}{dur_str}",
            font=get_font(9, "bold"),
            text_color=STEAM_BLUE_PRIMARY,
            fg_color=STEAM_BADGE_BG,
            corner_radius=4,
            padx=6,
            pady=1
        ).pack(side="left")

        btn_box = ctk.CTkFrame(body, fg_color="transparent")
        btn_box.pack(fill="x")

        self.collection_card_widgets[vid_id] = {
            "card": card,
            "info": info,
            "badge_box": badge_box,
            "badge_lbl": badge_lbl,
            "title_lbl": title_lbl,
            "btn_box": btn_box,
            "vid_id": vid_id
        }

        self._update_single_collection_card_ui(vid_id)

    def _update_single_collection_card_ui(self, vid_id: str):
        widgets = self.collection_card_widgets.get(vid_id)
        if not widgets:
            return

        card = widgets["card"]
        info = widgets["info"]
        badge_box = widgets.get("badge_box")
        badge_lbl = widgets["badge_lbl"]
        title_lbl = widgets["title_lbl"]
        btn_box = widgets["btn_box"]

        title_text = info.get("title", "Sans titre")
        file_path = info.get("local_file", "")
        vtype = info.get("type", "boot_video")
        is_active, _, _ = self.get_item_state(vid_id, title_text, vtype)

        card.configure(
            border_color=STEAM_GREEN_TEXT if is_active else STEAM_CARD_BORDER,
            border_width=2 if is_active else 1
        )

        title_lbl.configure(text_color=STEAM_GREEN_TEXT if is_active else STEAM_TEXT_WHITE)

        if is_active:
            type_label = "BOOT" if vtype == "boot_video" else "VEILLE"
            badge_lbl.configure(
                text=f"🟢 UTILISÉ ({type_label}) • ACTIF",
                text_color=STEAM_GREEN_TEXT,
                fg_color=STEAM_GREEN_BADGE
            )
            if badge_box is not None:
                badge_box.pack(fill="x", padx=9, pady=(2, 2), before=widgets["title_lbl"].master)
        else:
            if badge_box is not None:
                badge_box.pack_forget()

        for w in btn_box.winfo_children():
            w.destroy()

        if is_active:
            active_btn_text = "🟢 Actif au démarrage" if vtype == "boot_video" else "🟢 Actif en veille"
            ctk.CTkButton(
                btn_box,
                text=active_btn_text,
                command=lambda item=info: self._play_preview_video(item),
                fg_color=STEAM_GREEN_BTN,
                hover_color=STEAM_GREEN_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=28,
                corner_radius=5
            ).pack(side="left", fill="x", expand=True, padx=(0, 4))
        else:
            activate_btn_text = "▶ Activer au démarrage" if vtype == "boot_video" else "▶ Activer en veille"
            ctk.CTkButton(
                btn_box,
                text=activate_btn_text,
                command=lambda fp=file_path, t=title_text, vt=vtype, cid=vid_id: self._apply_local_path(fp, t, vt, cid),
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10, "bold"),
                height=28,
                corner_radius=5
            ).pack(side="left", fill="x", expand=True, padx=(0, 4))

        ctk.CTkButton(
            btn_box,
            text="▶ Aperçu",
            command=lambda item=info: self._play_preview_video(item),
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(9, "bold"),
            width=60,
            height=28,
            corner_radius=5
        ).pack(side="left", padx=(0, 4))

        ctk.CTkButton(
            btn_box,
            text="🗑",
            command=lambda i=vid_id, t=title_text: self._confirm_remove_from_collection(i, t),
            fg_color=STEAM_BTN_SECONDARY,
            hover_color="#7f1d1d",
            text_color=STEAM_TEXT_MUTED,
            font=get_font(11),
            width=30,
            height=28,
            corner_radius=5
        ).pack(side="right")

    def _refresh_collection_cards_ui(self):
        self._refresh_active_animations_status()
        self._update_hud_display()
        self._update_sidebar_counts()
        for vid_id in list(self.collection_card_widgets.keys()):
            self._update_single_collection_card_ui(vid_id)

    def _confirm_remove_from_collection(self, vid_id: str, title: str):
        if messagebox.askyesno("Supprimer", f"Supprimer '{title}' de votre collection locale ?"):
            self._remove_from_collection(vid_id)

    # --------------------------------------------------------------------------
    # 6. LECTEUR D'APERÇU VIDÉO 100% INTÉGRÉ DANS L'APPLICATION
    # --------------------------------------------------------------------------
    def _play_preview_video(self, post: dict):
        post_id = str(post.get("id", ""))
        title = post.get("title", "Animation")
        vtype = post.get("type", "boot_video")
        _, is_in_col, local_info = self.get_item_state(post_id, title, vtype)

        local_fp = post.get("local_file", "")
        if not (local_fp and os.path.isfile(local_fp)):
            if is_in_col and local_info and os.path.isfile(local_info.get("local_file", "")):
                local_fp = local_info.get("local_file", "")

        video_source = local_fp if (local_fp and os.path.isfile(local_fp)) else (post.get("video_preview") or post.get("video") or post.get("url", ""))

        if not video_source:
            messagebox.showwarning("Aperçu", "Source vidéo introuvable pour cette animation.")
            return

        InAppVideoPlayerModal(
            parent_app=self,
            video_source=video_source,
            title=title,
            post_data=post,
            local_path=local_fp,
            vtype=vtype,
            vid_id=post_id
        )

    # --------------------------------------------------------------------------
    # 6. MODALE D'APERÇU DÉTAILLÉ
    # --------------------------------------------------------------------------
    def _open_detail_modal(self, post: dict):
        post_id = str(post.get("id", ""))
        title_text = post.get("title", "Sans titre")
        vtype = post.get("type", "boot_video")
        is_active, is_in_collection, local_info = self.get_item_state(post_id, title_text, vtype)

        modal = ctk.CTkToplevel(self)
        modal.title(f"Aperçu — {title_text}")
        modal.geometry("560x530")
        modal.configure(fg_color=STEAM_SIDEBAR_BG)
        modal.transient(self)
        modal.grab_set()

        # Conteneur Thumbnail interactif avec bouton Play
        thumb_container = ctk.CTkFrame(modal, fg_color="#0e141b", corner_radius=8)
        thumb_container.pack(fill="x", padx=20, pady=(16, 8))

        thumb_url = post.get("thumbnail", "")
        img_label = ctk.CTkLabel(
            thumb_container,
            text="",
            fg_color="#0e141b",
            height=200,
            corner_radius=8,
            cursor="hand2"
        )
        img_label.pack(fill="x", padx=4, pady=4)
        img_label.bind("<Button-1>", lambda e, p=post: self._play_preview_video(p))

        if thumb_url:
            self._load_large_thumbnail_async(thumb_url, img_label)

        # Bouton Lecture d'Aperçu Vidéo Immédiat
        btn_play_video = ctk.CTkButton(
            thumb_container,
            text="▶  LIRE L'APERÇU VIDÉO",
            command=lambda p=post: self._play_preview_video(p),
            fg_color=STEAM_BLUE_PRIMARY,
            hover_color=STEAM_BLUE_HOVER,
            text_color=STEAM_TEXT_WHITE,
            font=get_font(11, "bold"),
            height=30,
            corner_radius=6
        )
        btn_play_video.pack(fill="x", padx=12, pady=(0, 8))

        ctk.CTkLabel(
            modal,
            text=title_text,
            font=get_font(14, "bold"),
            text_color=STEAM_TEXT_WHITE,
            wraplength=500,
            anchor="w"
        ).pack(fill="x", padx=20, pady=(2, 2))

        if is_active:
            ctk.CTkLabel(
                modal,
                text="🟢 CETTE ANIMATION EST ACTUELLEMENT ACTIVE DANS STEAM",
                font=get_font(9, "bold"),
                text_color=STEAM_GREEN_TEXT,
                fg_color=STEAM_GREEN_BADGE,
                corner_radius=3,
                padx=8,
                pady=2
            ).pack(anchor="w", padx=20, pady=(0, 6))

        author = (post.get("user", {}) or {}).get("steam_name", "Inconnu")
        duration = post.get("video_duration", 0)
        downloads = post.get("downloads", 0)
        likes = post.get("likes", 0)
        type_str = "Animation de Boot" if vtype == "boot_video" else "Animation de Veille"

        info_text = f"Type : {type_str}  •  Créateur : {author}  •  Durée : {duration}s  •  Téléchargements : {downloads}  •  Likes : {likes}"
        ctk.CTkLabel(
            modal,
            text=info_text,
            font=get_font(10),
            text_color=STEAM_TEXT_MUTED,
            justify="left",
            anchor="w"
        ).pack(fill="x", padx=20, pady=(0, 12))

        btn_box = ctk.CTkFrame(modal, fg_color="transparent")
        btn_box.pack(fill="x", padx=20, pady=(4, 16))

        if is_in_collection:
            local_fp = local_info.get("local_file", "") if local_info else ""
            if vtype == "boot_video":
                act_text = "🟢 Actif au démarrage" if is_active else "▶ Activer au démarrage"
            else:
                act_text = "🟢 Actif en veille" if is_active else "▶ Activer en veille"

            ctk.CTkButton(
                btn_box,
                text=act_text,
                command=lambda: [self._apply_local_path(local_fp, title_text, vtype, post_id), modal.destroy()],
                fg_color=STEAM_GREEN_BTN if is_active else STEAM_BLUE_PRIMARY,
                hover_color=STEAM_GREEN_HOVER if is_active else STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(11, "bold"),
                height=34,
                corner_radius=6
            ).pack(side="left", fill="x", expand=True, padx=(0, 8))

            ctk.CTkButton(
                btn_box,
                text="▶ Lire la Vidéo",
                command=lambda: [modal.destroy(), self._play_preview_video(post)],
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(11, "bold"),
                width=120,
                height=34,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))
        else:
            ctk.CTkButton(
                btn_box,
                text="📥 Installer sur ce PC",
                command=lambda: [self._download_to_collection_only(post), modal.destroy()],
                fg_color=STEAM_BLUE_PRIMARY,
                hover_color=STEAM_BLUE_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(11, "bold"),
                height=34,
                corner_radius=6
            ).pack(side="left", fill="x", expand=True, padx=(0, 8))

            direct_text = "▶ Installer & Activer au démarrage" if vtype == "boot_video" else "▶ Installer & Activer en veille"
            ctk.CTkButton(
                btn_box,
                text=direct_text,
                command=lambda: [self._install_video_from_web(post, True), modal.destroy()],
                fg_color=STEAM_BTN_SECONDARY,
                hover_color=STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE,
                font=get_font(10),
                width=190,
                height=34,
                corner_radius=6
            ).pack(side="left", padx=(0, 8))

        is_fav = self._is_favorite(post_id)
        def _toggle_modal_fav():
            self._toggle_favorite(post)
            now_fav = self._is_favorite(post_id)
            btn_fav_modal.configure(
                text="⭐ Dans vos favoris" if now_fav else "🤍 Ajouter aux favoris",
                fg_color="#372c08" if now_fav else STEAM_BTN_SECONDARY,
                hover_color="#52400a" if now_fav else STEAM_BTN_SEC_HOVER,
                text_color="#f59e0b" if now_fav else STEAM_TEXT_MUTED
            )

        btn_fav_modal = ctk.CTkButton(
            btn_box,
            text="⭐ Dans vos favoris" if is_fav else "🤍 Ajouter aux favoris",
            command=_toggle_modal_fav,
            fg_color="#372c08" if is_fav else STEAM_BTN_SECONDARY,
            hover_color="#52400a" if is_fav else STEAM_BTN_SEC_HOVER,
            text_color="#f59e0b" if is_fav else STEAM_TEXT_MUTED,
            font=get_font(10, "bold"),
            height=34,
            corner_radius=6
        )
        btn_fav_modal.pack(side="left", padx=(0, 8))

        ctk.CTkButton(
            btn_box,
            text="🌐 Page Web",
            command=lambda: webbrowser.open(post.get("url", "https://steamdeckrepo.com/")),
            fg_color=STEAM_BTN_SECONDARY,
            hover_color=STEAM_BTN_SEC_HOVER,
            text_color=STEAM_TEXT_MUTED,
            font=get_font(10),
            width=85,
            height=34,
            corner_radius=6
        ).pack(side="right")

    # --------------------------------------------------------------------------
    # MODE ALÉATOIRE & ROTATION WINDOWS
    # --------------------------------------------------------------------------
    def _pick_random_from_collection(self):
        items = [
            (cid, info) for cid, info in self.collection_data.items()
            if os.path.isfile(info.get("local_file", ""))
        ]
        if not items:
            messagebox.showwarning("Collection vide", "Ajoutez des animations depuis le catalogue en ligne pour activer le mode aléatoire !")
            return

        chosen_id, chosen = random.choice(items)
        title = chosen.get("title", "Animation")
        file_path = chosen.get("local_file", "")
        vtype = chosen.get("type", "boot_video")

        try:
            self._apply_file_to_steam(Path(file_path), vtype)
            self._record_active_video(chosen_id, title, vtype)
            self._refresh_active_animations_status()
            self._update_hud_display()
            if self.current_video_type == "collection":
                self._refresh_collection_cards_ui()
            else:
                self._refresh_online_cards_ui()
            self._show_toast(f"🎲 Tirage Aléatoire : '{title}' activée !")
        except Exception as e:
            self._on_install_error(str(e))

    def _toggle_auto_shuffle(self):
        enabled = self.auto_shuffle_var.get()
        self.settings["auto_shuffle_startup"] = enabled
        self._save_settings()

        python_exe = sys.executable
        main_script = str(Path(__file__).resolve())

        try:
            if sys.platform == "win32":
                startup_dir = Path(os.environ.get("APPDATA", "")) / r"Microsoft\Windows\Start Menu\Programs\Startup"
                vbs_file = startup_dir / "SteamBootVideo_Shuffle.vbs"
                if enabled:
                    vbs_content = f'CreateObject("Wscript.Shell").Run """{python_exe}"" ""{main_script}"" --shuffle", 0, False\n'
                    with open(vbs_file, "w", encoding="utf-8") as f:
                        f.write(vbs_content)
                    self._show_toast("🔄 Rotation automatique au démarrage activée (Windows) !")
                else:
                    if vbs_file.exists():
                        vbs_file.unlink(missing_ok=True)
                    self._show_toast("Rotation automatique au démarrage désactivée.")

            elif sys.platform == "darwin":
                launch_dir = Path.home() / "Library" / "LaunchAgents"
                launch_dir.mkdir(parents=True, exist_ok=True)
                plist_file = launch_dir / "com.steambootvideomanager.shuffle.plist"
                if enabled:
                    plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.steambootvideomanager.shuffle</string>
    <key>ProgramArguments</key>
    <array>
        <string>{python_exe}</string>
        <string>{main_script}</string>
        <string>--shuffle</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
</dict>
</plist>"""
                    with open(plist_file, "w", encoding="utf-8") as f:
                        f.write(plist_content)
                    self._show_toast("🔄 Rotation automatique au démarrage activée (macOS LaunchAgent) !")
                else:
                    if plist_file.exists():
                        plist_file.unlink(missing_ok=True)
                    self._show_toast("Rotation automatique au démarrage désactivée.")

            else:
                # Linux / SteamOS / Steam Deck
                autostart_dir = Path.home() / ".config" / "autostart"
                autostart_dir.mkdir(parents=True, exist_ok=True)
                desktop_file = autostart_dir / "steam-boot-video-shuffle.desktop"
                if enabled:
                    desktop_content = f"""[Desktop Entry]
Type=Application
Exec="{python_exe}" "{main_script}" --shuffle
Hidden=false
NoDisplay=false
X-GNOME-Autostart-enabled=true
Name=Steam Boot Video Shuffle
Comment=Rotate Steam Big Picture boot video on startup
"""
                    with open(desktop_file, "w", encoding="utf-8") as f:
                        f.write(desktop_content)
                    self._show_toast("🔄 Rotation automatique au démarrage activée (Linux / SteamOS Autostart) !")
                else:
                    if desktop_file.exists():
                        desktop_file.unlink(missing_ok=True)
                    self._show_toast("Rotation automatique au démarrage désactivée.")
        except Exception as e:
            self._on_install_error(f"Erreur lanceur automatique : {e}")

    # --------------------------------------------------------------------------
    # INSTALLATION ET DÉPLOIEMENT STEAM (SANS PERTE DE POSITION DU SCROLL)
    # --------------------------------------------------------------------------
    def _install_video_from_web(self, post: dict, add_to_collection: bool = True):
        video_url = post.get("video", "")
        title = post.get("title", "Vidéo")
        if not video_url:
            messagebox.showerror("Erreur", "Lien vidéo introuvable.")
            return

        post_id = str(post.get("id", ""))
        if post_id in self.online_card_widgets:
            btn_box = self.online_card_widgets[post_id]["btn_box"]
            for b in btn_box.winfo_children():
                if isinstance(b, ctk.CTkButton):
                    b.configure(state="disabled")

        self.lbl_status.configure(text=f"Mise en place de '{title}' dans Steam...", text_color=STEAM_BLUE_PRIMARY)
        self.executor.submit(self._download_and_deploy_worker, post, add_to_collection, True)

    def _download_to_collection_only(self, post: dict):
        title = post.get("title", "Vidéo")
        post_id = str(post.get("id", ""))
        if post_id in self.online_card_widgets:
            btn_box = self.online_card_widgets[post_id]["btn_box"]
            for b in btn_box.winfo_children():
                if isinstance(b, ctk.CTkButton):
                    b.configure(state="disabled")

        self.lbl_status.configure(text=f"Téléchargement de '{title}' dans la collection...", text_color=STEAM_BLUE_PRIMARY)
        self.executor.submit(self._download_and_deploy_worker, post, True, False)

    def _download_and_deploy_worker(self, post: dict, add_to_collection: bool = True, apply_now: bool = True):
        try:
            video_url = post.get("video", "")
            title = post.get("title", "Vidéo")
            vtype = post.get("type", "boot_video")
            post_id = str(post.get("id", int(datetime.datetime.now().timestamp())))

            local_file = self.collection_dir / f"vid_{post_id}.webm"

            if not local_file.exists():
                req = urllib.request.Request(video_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=20) as resp, open(local_file, "wb") as f:
                    shutil.copyfileobj(resp, f)

            if add_to_collection:
                self.collection_data[post_id] = {
                    "title": title,
                    "thumbnail": post.get("thumbnail", ""),
                    "local_file": str(local_file),
                    "duration": post.get("video_duration", 0),
                    "type": vtype
                }
                self._save_collection_metadata()

            if apply_now:
                self._apply_file_to_steam(local_file, vtype)
                self._record_active_video(post_id, title, vtype)
                self.after(0, lambda: self._on_install_success(title, vtype))
            else:
                self.after(0, lambda: self._on_add_to_collection_success(title))

        except Exception as e:
            self.after(0, lambda: self._on_install_error(str(e)))

    def _on_add_to_collection_success(self, title: str):
        self._refresh_active_animations_status()
        self._update_hud_display()
        self._update_sidebar_counts()
        if self.current_video_type in ["boot_video", "suspend_video"]:
            self._refresh_online_cards_ui()
        elif self.current_video_type == "collection":
            self._refresh_collection_cards_ui()
        self._show_toast(f"✔ '{title}' installée ! Vous pouvez maintenant l'activer au démarrage ou en veille.")

    def _browse_local_video(self):
        file_path = filedialog.askopenfilename(
            title="Choisir un fichier vidéo .webm",
            filetypes=[("Vidéo WebM (*.webm)", "*.webm"), ("Tous les fichiers", "*.*")]
        )
        if file_path:
            self._import_local_video_file(file_path)

    def _on_drag_and_drop(self, event):
        data = event.data
        if not data:
            return
        files = self.tk.splitlist(data)
        for f in files:
            if f.lower().endswith(".webm"):
                self._import_local_video_file(f)
                break

    def _import_local_video_file(self, file_path: str):
        p = Path(file_path)
        if p.suffix.lower() != ".webm":
            messagebox.showwarning("Format invalide", "Veuillez sélectionner un fichier .webm.")
            return
        try:
            dest = self.collection_dir / p.name
            shutil.copy2(p, dest)
            post_id = str(int(datetime.datetime.now().timestamp()))
            vtype = self.current_video_type if self.current_video_type in ["boot_video", "suspend_video"] else "boot_video"
            self.collection_data[post_id] = {
                "title": p.stem,
                "thumbnail": "",
                "local_file": str(dest),
                "duration": 0,
                "type": vtype
            }
            self._save_collection_metadata()
            self._update_sidebar_counts()

            self._apply_file_to_steam(dest, vtype)
            self._record_active_video(post_id, p.stem, vtype)
            self._on_install_success(p.stem, vtype)
        except Exception as e:
            self._on_install_error(str(e))

    def _apply_file_to_steam(self, video_path: Path, video_type: str = "boot_video"):
        if not self.steam_path or not os.path.isdir(self.steam_path):
            raise Exception("Dossier Steam introuvable. Cliquez sur 'Choisir Steam' dans la barre latérale.")

        target_map = SteamManager.get_target_directories(self.steam_path)
        target_filenames = TARGET_BOOT_FILES if video_type == "boot_video" else TARGET_SUSPEND_FILES

        for _, target_dir in target_map.items():
            target_dir.mkdir(parents=True, exist_ok=True)

            for fname in target_filenames:
                dest = target_dir / fname
                backup = target_dir / f"{fname}.backup"

                if dest.exists():
                    set_file_read_only(dest, read_only=False)

                if dest.exists() and not backup.exists():
                    shutil.copy2(dest, backup)

                shutil.copy2(video_path, dest)
                set_file_read_only(dest, read_only=True)

    def _record_active_video(self, vid_id: str, title: str, vtype: str):
        if vtype == "suspend_video":
            self.settings["active_suspend_id"] = str(vid_id)
            self.settings["active_suspend_title"] = title
        else:
            self.settings["active_boot_id"] = str(vid_id)
            self.settings["active_boot_title"] = title
        self._save_settings()

    def _show_toast(self, message: str):
        self.lbl_status.configure(text=message, text_color=STEAM_GREEN_TEXT)

    def _on_install_success(self, title: str, vtype: str = "boot_video"):
        self._refresh_active_animations_status()
        self._update_hud_display()
        self._update_sidebar_counts()
        if self.current_video_type in ["boot_video", "suspend_video"]:
            self._refresh_online_cards_ui()
        elif self.current_video_type == "collection":
            self._refresh_collection_cards_ui()
        dest_str = "au démarrage" if vtype == "boot_video" else "en veille"
        self._show_toast(f"✔ '{title}' activée {dest_str} dans Steam ! Cliquez sur 'Lancer Big Picture' pour voir.")

    def _on_install_error(self, err_msg: str):
        self.lbl_status.configure(text=f"Erreur : {err_msg}", text_color="#ff5c5c")
        if self.current_video_type in ["boot_video", "suspend_video"]:
            self._refresh_online_cards_ui()
        elif self.current_video_type == "collection":
            self._refresh_collection_cards_ui()
        messagebox.showerror("Erreur", err_msg)

    def _restore_default_video(self):
        if not self.steam_path or not os.path.isdir(self.steam_path):
            messagebox.showerror("Erreur", "Dossier Steam introuvable.")
            return

        if not messagebox.askyesno("Restaurer", "Voulez-vous remettre les vidéos d'origine de Steam (Boot et Suspend) ?"):
            return

        target_map = SteamManager.get_target_directories(self.steam_path)
        all_targets = TARGET_BOOT_FILES + TARGET_SUSPEND_FILES
        try:
            for key, target_dir in target_map.items():
                if not target_dir.exists():
                    continue

                for fname in all_targets:
                    dest = target_dir / fname
                    backup = target_dir / f"{fname}.backup"

                    if dest.exists():
                        set_file_read_only(dest, read_only=False)

                    if backup.exists():
                        set_file_read_only(backup, read_only=False)
                        shutil.copy2(backup, dest)
                        backup.unlink(missing_ok=True)
                    elif key in ["overrides", "uioverrides"] and dest.exists():
                        dest.unlink(missing_ok=True)

            self.settings["active_boot_id"] = None
            self.settings["active_boot_title"] = "Par défaut Steam"
            self.settings["active_suspend_id"] = None
            self.settings["active_suspend_title"] = "Par défaut Steam"
            self._save_settings()

            self._refresh_active_animations_status()
            self._update_hud_display()
            if self.current_video_type == "collection":
                self._refresh_collection_cards_ui()
            else:
                self._refresh_online_cards_ui()

            self._show_toast("✔ Vidéos d'origine de Steam rétablies.")
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    def _change_steam_folder(self):
        f = filedialog.askdirectory(title="Sélectionner le dossier d'installation de Steam")
        if f:
            self.steam_path = os.path.normpath(f)
            self.steam_badge.configure(text="🟢 Steam Détecté", text_color="#5cd65c")
            self._refresh_active_animations_status()
            self._update_hud_display()

    def _open_movies_folder(self):
        if self.steam_path:
            target_map = SteamManager.get_target_directories(self.steam_path)
            d = target_map.get("overrides") or Path(self.steam_path)
            d.mkdir(parents=True, exist_ok=True)
            open_file_or_url(str(d))

    def _launch_bigpicture(self):
        try:
            webbrowser.open("steam://open/bigpicture")
        except Exception as e:
            messagebox.showerror("Erreur", str(e))

    # --------------------------------------------------------------------------
    # CHARGEMENT ASYNCHRONE ET ULTRA-RAPIDE DES MINIATURES
    # --------------------------------------------------------------------------
    def _load_thumbnail_async(self, url: str, label: ctk.CTkLabel):
        if not url:
            return
        if url in self.thumbnail_memory_cache:
            label.configure(image=self.thumbnail_memory_cache[url], text="")
            return

        def task():
            try:
                url_hash = str(abs(hash(url))) + ".png"
                cache_file = self.cache_dir / url_hash

                if cache_file.exists():
                    pil_img = Image.open(cache_file).convert("RGBA")
                else:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=8) as resp:
                        raw = resp.read()
                    with open(cache_file, "wb") as f:
                        f.write(raw)
                    pil_img = Image.open(BytesIO(raw)).convert("RGBA")

                pil_img = pil_img.resize((300, 168), Image.Resampling.LANCZOS)
                ctk_img = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(300, 168))
                self.thumbnail_memory_cache[url] = ctk_img
                self.after(0, lambda: label.configure(image=ctk_img, text=""))
            except Exception:
                pass

        self.executor.submit(task)

    def _load_large_thumbnail_async(self, url: str, label: ctk.CTkLabel):
        if not url:
            return

        def task():
            try:
                url_hash = str(abs(hash(url))) + ".png"
                cache_file = self.cache_dir / url_hash

                if cache_file.exists():
                    pil_img = Image.open(cache_file).convert("RGBA")
                else:
                    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                    with urllib.request.urlopen(req, timeout=8) as resp:
                        raw = resp.read()
                    pil_img = Image.open(BytesIO(raw)).convert("RGBA")

                pil_img = pil_img.resize((480, 270), Image.Resampling.LANCZOS)
                ctk_img = ctk.CTkImage(light_image=pil_img, dark_image=pil_img, size=(480, 270))
                self.after(0, lambda: label.configure(image=ctk_img, text=""))
            except Exception:
                pass

        self.executor.submit(task)

    def _remove_from_collection(self, vid_id: str):
        if vid_id in self.collection_data:
            del self.collection_data[vid_id]
            self._save_collection_metadata()
            self._update_sidebar_counts()
            self._render_collection()

    def _apply_local_path(self, path_str: str, title: str, vtype: str = "boot_video", vid_id: str = None):
        if not path_str or not os.path.isfile(path_str):
            messagebox.showerror("Erreur", "Le fichier local est introuvable.")
            return
        try:
            self._apply_file_to_steam(Path(path_str), vtype)
            if vid_id:
                self._record_active_video(vid_id, title, vtype)
            self._refresh_active_animations_status()
            self._update_hud_display()
            self._on_install_success(title, vtype)
        except Exception as e:
            self._on_install_error(str(e))

    # --------------------------------------------------------------------------
    # 5.5 VUE MES FAVORIS
    # --------------------------------------------------------------------------
    def _is_favorite(self, post_id: str) -> bool:
        if not post_id:
            return False
        return str(post_id) in self.favorites_data

    def _toggle_favorite(self, post: dict):
        post_id = str(post.get("id", ""))
        if not post_id:
            return

        title = post.get("title", "Sans titre")

        if post_id in self.favorites_data:
            del self.favorites_data[post_id]
            self._save_favorites_metadata()
            self._update_sidebar_counts()
            self._show_toast(f"🤍 '{title}' retirée de vos favoris.")
        else:
            self.favorites_data[post_id] = {
                "id": post.get("id"),
                "title": title,
                "thumbnail": post.get("thumbnail", ""),
                "video": post.get("video", ""),
                "video_preview": post.get("video_preview", ""),
                "video_duration": post.get("video_duration") or post.get("duration", 0),
                "type": post.get("type", "boot_video"),
                "user": post.get("user") or {"steam_name": "Inconnu"},
                "downloads": post.get("downloads", 0),
                "likes": post.get("likes", 0),
                "url": post.get("url", f"https://steamdeckrepo.com/post/{post_id}")
            }
            self._save_favorites_metadata()
            self._update_sidebar_counts()
            self._show_toast(f"⭐ '{title}' ajoutée à vos favoris !")

        if self.current_video_type == "favorites":
            self._render_favorites()
        elif post_id in self.online_card_widgets:
            self._update_single_online_card_ui(post_id)

    def _render_favorites(self):
        for w in self.grid_scroll.winfo_children():
            w.destroy()

        self._refresh_active_animations_status()
        self._update_hud_display()
        self.online_card_widgets.clear()

        all_items = list(self.favorites_data.items())

        top_bar = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        top_bar.pack(fill="x", pady=(0, 10))

        filter_box = ctk.CTkFrame(top_bar, fg_color="transparent")
        filter_box.pack(side="left")

        boot_count = sum(1 for _, v in all_items if v.get("type", "boot_video") == "boot_video")
        susp_count = sum(1 for _, v in all_items if v.get("type", "boot_video") == "suspend_video")

        filters = [
            ("all", f"Tous ({len(all_items)})"),
            ("boot_video", f"🎮 Boot ({boot_count})"),
            ("suspend_video", f"⏸ Suspend ({susp_count})"),
        ]

        for f_key, f_label in filters:
            is_f_active = self.favorites_filter == f_key
            ctk.CTkButton(
                filter_box,
                text=f_label,
                command=lambda k=f_key: self._set_favorites_filter(k),
                fg_color=STEAM_BLUE_PRIMARY if is_f_active else STEAM_BTN_SECONDARY,
                hover_color=STEAM_BLUE_HOVER if is_f_active else STEAM_BTN_SEC_HOVER,
                text_color=STEAM_TEXT_WHITE if is_f_active else STEAM_TEXT_MUTED,
                font=get_font(10, "bold"),
                height=26,
                corner_radius=4
            ).pack(side="left", padx=(0, 6))

        ctk.CTkLabel(
            top_bar,
            text=f"⭐ Total : {len(all_items)} favori{'s' if len(all_items) > 1 else ''}",
            font=get_font(10, "bold"),
            text_color="#f59e0b"
        ).pack(side="right")

        filtered_items = []
        for vid_id, info in all_items:
            vtype = info.get("type", "boot_video")
            title = info.get("title", "")
            author = (info.get("user") or {}).get("steam_name", "")

            if self.favorites_filter == "boot_video" and vtype != "boot_video":
                continue
            if self.favorites_filter == "suspend_video" and vtype != "suspend_video":
                continue

            if self.favorites_search:
                q = self.favorites_search.lower()
                if q not in title.lower() and q not in author.lower():
                    continue

            filtered_items.append((vid_id, info))

        count = len(filtered_items)
        self.lbl_status.configure(
            text=f"Mes Favoris : {count} animation{'s' if count > 1 else ''} enregistrée{'s' if count > 1 else ''}.",
            text_color=STEAM_TEXT_MUTED
        )

        if not filtered_items:
            empty_box = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
            empty_box.pack(pady=80)
            ctk.CTkLabel(
                empty_box,
                text="⭐ Aucun favori trouvé.",
                font=get_font(14, "bold"),
                text_color=STEAM_TEXT_WHITE
            ).pack(pady=(0, 6))
            ctk.CTkLabel(
                empty_box,
                text="Cliquez sur l'étoile ⭐ sur n'importe quelle animation pour la retrouver ici en un clic !",
                font=get_font(11),
                text_color=STEAM_TEXT_MUTED
            ).pack()
            return

        grid_cards = ctk.CTkFrame(self.grid_scroll, fg_color="transparent")
        grid_cards.pack(fill="both", expand=True)

        grid_cards.grid_columnconfigure(0, weight=1)
        grid_cards.grid_columnconfigure(1, weight=1)
        grid_cards.grid_columnconfigure(2, weight=1)

        for idx, (vid_id, info) in enumerate(filtered_items):
            row = idx // 3
            col = idx % 3
            self._create_online_card(grid_cards, info, row, col)

    def _set_favorites_filter(self, filter_key: str):
        self.favorites_filter = filter_key
        self._render_favorites()

    def _load_favorites_metadata(self) -> dict:
        if self.favorites_file.exists():
            try:
                with open(self.favorites_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_favorites_metadata(self):
        try:
            with open(self.favorites_file, "w", encoding="utf-8") as f:
                json.dump(self.favorites_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _load_collection_metadata(self) -> dict:
        if self.collection_meta_file.exists():
            try:
                with open(self.collection_meta_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_collection_metadata(self):
        try:
            with open(self.collection_meta_file, "w", encoding="utf-8") as f:
                json.dump(self.collection_data, f, ensure_ascii=False, indent=2)
        except Exception:
            pass

    def _load_settings(self) -> dict:
        if self.settings_file.exists():
            try:
                with open(self.settings_file, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return {}

    def _save_settings(self):
        try:
            with open(self.settings_file, "w", encoding="utf-8") as f:
                json.dump(self.settings, f, ensure_ascii=False, indent=2)
        except Exception:
            pass


# ==============================================================================
# POINT D'ENTRÉE PRINCIPAL
# ==============================================================================
if __name__ == "__main__":
    if "--shuffle" in sys.argv:
        run_silent_shuffle()
    else:
        app = SteamBootVideoForgeApp()
        app.mainloop()
