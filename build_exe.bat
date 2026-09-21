@echo off
title Compilation Steam Big Picture Manager - Executable .exe
echo =======================================================
echo  COMPILATION PYINSTALLER - STEAM BIG PICTURE MANAGER
echo =======================================================
echo.

echo [1/3] Construction du bundle React (Vite)...
call npm run build

echo.
echo [2/3] Verification des dependances Python...
python -m pip install --upgrade pip pyinstaller

echo.
echo [3/3] Compilation en fichier unique (.exe) autonome avec interface integree...
python -m PyInstaller --noconsole --onefile --clean --name="SteamBigPictureManager" --add-data "dist;dist" run_app.py

echo.
echo =======================================================
if exist "dist\SteamBigPictureManager.exe" (
    echo [SUCCES] L'executable a ete genere avec succes !
    echo Retrouvez votre fichier autonome dans : dist\SteamBigPictureManager.exe
) else (
    echo [ERREUR] La generation a echoue. Verifiez les logs ci-dessus.
)
echo =======================================================
pause

