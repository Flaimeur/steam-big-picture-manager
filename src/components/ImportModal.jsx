import React, { useState, useRef } from 'react';
import { X, UploadCloud, Film, Gamepad2, PauseCircle, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ImportModal({ isOpen, onClose, onImportSuccess, showToast, t, lang = 'fr' }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [title, setTitle] = useState('');
  const [videoType, setVideoType] = useState('boot_video');
  const [isConverting, setIsConverting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (selectedFile) => {
    if (!selectedFile) return;

    // Vérifier type de fichier
    const ext = selectedFile.name.split('.').pop().toLowerCase();
    const validExts = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'gif'];
    if (!validExts.includes(ext)) {
      showToast(lang === 'en' ? 'Unsupported video format' : 'Format vidéo non supporté', 'error');
      return;
    }

    // Vérifier taille (< 150 Mo)
    if (selectedFile.size > 150 * 1024 * 1024) {
      showToast(lang === 'en' ? 'File is too large (max 150 MB)' : 'Fichier trop lourd (max 150 Mo)', 'error');
      return;
    }

    setFile(selectedFile);
    const rawName = selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(rawName);

    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleConvertAndImport = async () => {
    if (!file) return;
    setIsConverting(true);

    try {
      // Convertir fichier en Base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Data = e.target.result;
        try {
          const res = await onImportSuccess({
            title: title.trim() || file.name,
            type: videoType,
            filename: file.name,
            dataBase64: base64Data,
          });
          setIsConverting(false);
          handleClose();
        } catch (err) {
          setIsConverting(false);
          showToast(err.message || (t?.importError || 'Erreur lors de la conversion'), 'error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsConverting(false);
      showToast(err.message || (t?.importError || 'Erreur lors de la conversion'), 'error');
    }
  };

  const handleClose = () => {
    if (isConverting) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null);
    setPreviewUrl('');
    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-200" onClick={handleClose}>
      <div
        className="w-full max-w-xl rounded-3xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#1a9fff]/15 border border-[#1a9fff]/30 flex items-center justify-center">
              <UploadCloud className="w-4 h-4 text-[#1a9fff]" />
            </div>
            <h3 className="text-base font-extrabold text-white font-display">
              {t?.importTitle || 'Convertisseur & Importateur Vidéo'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isConverting}
            className="p-1.5 rounded-full text-[#64748b] hover:text-white bg-white/5 hover:bg-white/10 transition-colors disabled:opacity-30"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {!file ? (
            /* Dropzone */
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                isDragOver
                  ? 'border-[#1a9fff] bg-[#1a9fff]/10 scale-[1.01]'
                  : 'border-[#1e293b] hover:border-[#1a9fff]/50 hover:bg-[#131b2e]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".mp4,.webm,.mov,.mkv,.avi,.gif"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              <div className="w-16 h-16 rounded-2xl bg-[#162035] flex items-center justify-center mb-4 text-[#1a9fff] shadow-lg shadow-black/40">
                <Film className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-white mb-1">
                {t?.dragDropHere || 'Glissez une vidéo ici ou cliquez pour parcourir'}
              </h4>
              <p className="text-xs text-[#64748b] max-w-xs">
                {t?.supportsFormat || 'Formats supportés : MP4, MOV, MKV, WebM, GIF, AVI (max 150 Mo)'}
              </p>
            </div>
          ) : (
            /* Video Selected & Preview */
            <div className="space-y-4">
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#1e293b]">
                <video
                  src={previewUrl}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                  muted
                  loop
                />
              </div>

              {/* Title input */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                  {t?.importVideoTitle || "Nom de l'animation"}
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  disabled={isConverting}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#141b2d] border border-[#1e293b] text-white text-sm focus:border-[#1a9fff] focus:ring-1 focus:ring-[#1a9fff] outline-none transition-all"
                  placeholder="Mon animation personnalisée"
                />
              </div>

              {/* Target Type Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#64748b] mb-1.5">
                  {t?.importType || "Type d'animation"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVideoType('boot_video')}
                    disabled={isConverting}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      videoType === 'boot_video'
                        ? 'bg-[#1a9fff] text-white border-[#1a9fff] shadow-lg shadow-[#1a9fff]/20'
                        : 'bg-[#141b2d] text-[#8b9ab5] border-[#1e293b] hover:text-white'
                    }`}
                  >
                    <Gamepad2 className="w-4 h-4" />
                    <span>Boot Animation</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoType('suspend_video')}
                    disabled={isConverting}
                    className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold transition-all border ${
                      videoType === 'suspend_video'
                        ? 'bg-[#1a9fff] text-white border-[#1a9fff] shadow-lg shadow-[#1a9fff]/20'
                        : 'bg-[#141b2d] text-[#8b9ab5] border-[#1e293b] hover:text-white'
                    }`}
                  >
                    <PauseCircle className="w-4 h-4" />
                    <span>Suspend Screen</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
          {file ? (
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreviewUrl('');
              }}
              disabled={isConverting}
              className="text-xs text-[#64748b] hover:text-white font-semibold transition-colors disabled:opacity-40"
            >
              Changer de fichier
            </button>
          ) : <div />}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isConverting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#8b9ab5] hover:text-white transition-colors disabled:opacity-40"
            >
              Annuler
            </button>
            {file && (
              <button
                type="button"
                onClick={handleConvertAndImport}
                disabled={isConverting || !title.trim()}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1a9fff] to-[#0060cc] hover:from-[#38adff] hover:to-[#1a9fff] text-white text-xs font-bold shadow-lg shadow-[#1a9fff]/25 transition-all active:scale-[0.97] disabled:opacity-50"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{t?.importConverting || 'Conversion en cours...'}</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Convertir & Ajouter</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
