"""
Steam Deck Repo Manager — Desktop Application Launcher
Lance le backend Python et ouvre l'interface React dans une fenêtre moderne.
"""

import os
import sys
import time
import threading
import urllib.request
import webbrowser
import subprocess
from pathlib import Path
from server import start_server

DEFAULT_PORT = 5055
app_port = DEFAULT_PORT
server_ready_event = threading.Event()


def is_server_alive(port):
    try:
        url = f"http://127.0.0.1:{port}/api/status"
        req = urllib.request.Request(url, headers={"User-Agent": "SteamDeckRepoManager"})
        with urllib.request.urlopen(req, timeout=1.0) as resp:
            return resp.status == 200
    except Exception:
        return False


def on_server_ready(bound_port):
    global app_port
    app_port = bound_port
    server_ready_event.set()


def launch_desktop_window(port):
    app_url = f"http://127.0.0.1:{port}"
    print(f"[APP] Ouverture de l'interface sur {app_url}...")

    # 1. Tenter d'ouvrir avec PyWebView si installé
    try:
        import webview
        webview.create_window(
            title="Steam Big Picture Manager — Boot & Suspend Animations",
            url=app_url,
            width=1280,
            height=840,
            min_size=(1020, 700),
            background_color="#06080d"
        )
        webview.start()
        sys.exit(0)
    except ImportError:
        pass

    # 2. Tenter d'ouvrir en mode Fenêtre Application Chrome / Chromium / Edge
    if sys.platform == "win32":
        browser_execs = [
            Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files\Microsoft\Edge\Application\msedge.exe"),
            Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
            Path(r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"),
        ]
        for p in browser_execs:
            if p.is_file():
                try:
                    subprocess.Popen([str(p), f"--app={app_url}", "--window-size=1280,840"])
                    return
                except Exception:
                    pass
    elif sys.platform == "darwin":
        mac_browsers = [
            "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
            "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
            "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
        ]
        for b in mac_browsers:
            if os.path.isfile(b):
                try:
                    subprocess.Popen([b, f"--app={app_url}", "--window-size=1280,840"])
                    return
                except Exception:
                    pass
    else:
        # Linux / SteamOS
        linux_browsers = ["google-chrome", "chromium", "chromium-browser", "brave-browser", "flatpak run com.google.Chrome"]
        for cmd in linux_browsers:
            try:
                subprocess.Popen(f"{cmd} --app={app_url} --window-size=1280,840", shell=True)
                return
            except Exception:
                pass

    # 3. Fallback navigateur par défaut
    webbrowser.open(app_url)


if __name__ == "__main__":
    # Vérifier si une instance tourne déjà sur le port par défaut
    if is_server_alive(DEFAULT_PORT):
        print(f"[APP] Instance existante détectée sur http://127.0.0.1:{DEFAULT_PORT}")
        launch_desktop_window(DEFAULT_PORT)
    else:
        # Démarrer le serveur dans un thread en arrière-plan
        server_thread = threading.Thread(
            target=start_server,
            args=(DEFAULT_PORT, on_server_ready),
            daemon=True
        )
        server_thread.start()

        # Attendre que le serveur soit lié et prêt (max 5s)
        server_ready_event.wait(timeout=5.0)
        time.sleep(0.3)
        launch_desktop_window(app_port)

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nArrêt de l'application.")
