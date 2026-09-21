import React, { useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, X, Star, Download, Check } from 'lucide-react';

export default function VideoPlayerModal({
  post,
  isOpen,
  onClose,
  collection = {},
  activeStatus,
  onDownload,
  onApply,
  onToggleFavorite,
  isFavorite,
}) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen || !post) return null;

  const postId = String(post.id || post.vid_id || '');
  const title = post.title || 'Animation';
  const vtype = post.type || 'boot_video';
  const isInCol = Boolean(collection[postId]);
  const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === title;
  const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === title;
  const isActive = vtype === 'boot_video' ? isBootActive : isSuspendActive;
  const fav = isFavorite(postId);

  const localFile = post.local_file || collection[postId]?.local_file;
  const videoSrc = localFile 
    ? `/media/local?path=${encodeURIComponent(localFile)}`
    : (post.video_preview || post.video || post.url || '');

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleReplay = () => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = 0;
    videoRef.current.play();
    setIsPlaying(true);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/85 backdrop-blur-2xl animate-fade-in" onClick={onClose}>
      <div 
        className="w-full max-w-4xl rounded-3xl bg-[#090d16] border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-extrabold uppercase px-3 py-1 rounded-full bg-[#1a9eff]/20 text-[#38bdf8] border border-[#1a9eff]/30 tracking-wider">
              {vtype === 'boot_video' ? '🎬 Boot Animation' : '🌙 Suspend Screen'}
            </span>
            <h3 className="text-base font-extrabold text-white truncate max-w-lg font-display">{title}</h3>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#64748b] hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Container */}
        <div className="relative bg-black aspect-video flex items-center justify-center group">
          <video
            ref={videoRef}
            src={videoSrc}
            autoPlay
            loop
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onClick={togglePlay}
            className="w-full h-full object-contain cursor-pointer"
          />

          {!isPlaying && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[2px] cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-[#1a9eff] text-white flex items-center justify-center shadow-2xl shadow-[#1a9eff]/50 transform scale-90 hover:scale-100 transition-transform">
                <Play className="w-7 h-7 fill-current ml-1" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-5 bg-black/50 border-t border-white/5 space-y-4">
          {/* Seekbar */}
          <div className="flex items-center gap-3 text-xs text-[#94a3b8]">
            <span className="font-mono text-[11px] text-white w-10 font-bold">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#1a9eff]"
            />
            <span className="font-mono text-[11px] text-[#64748b] w-10">{formatTime(duration)}</span>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
              </button>

              <button
                onClick={handleReplay}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
                title="Rejouer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={toggleMute}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => onToggleFavorite(post)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-bold transition-all ${
                  fav
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : 'bg-white/5 border-white/10 text-[#94a3b8] hover:text-amber-400'
                }`}
              >
                <Star className={`w-4 h-4 ${fav ? 'fill-current' : ''}`} />
                <span>{fav ? 'Favori' : 'Favoris'}</span>
              </button>

              {isActive ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-bold shadow-md">
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Actif dans Steam</span>
                </div>
              ) : isInCol ? (
                <button
                  onClick={() => {
                    onApply(collection[postId] || post);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/30 transition-all hover:scale-[1.02]"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Activer dans Steam</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    onDownload(post);
                    onClose();
                  }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#1a9eff] to-[#0077e6] hover:from-[#38adff] hover:to-[#1a9eff] text-white text-xs font-extrabold shadow-lg shadow-[#1a9eff]/30 transition-all hover:scale-[1.02]"
                >
                  <Download className="w-4 h-4" />
                  <span>Installer</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
