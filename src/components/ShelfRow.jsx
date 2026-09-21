import React, { useRef } from 'react';
import VideoCard from './VideoCard.jsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ShelfRow({
  title,
  subtitle,
  icon: Icon,
  badgeText,
  posts = [],
  collection = {},
  activeStatus,
  isFavorite,
  onPlay,
  onOpenDetails,
  onDownload,
  onApply,
  onToggleFavorite,
  onDelete,
  onHoverPost,
}) {
  const scrollRef = useRef(null);

  if (!posts || posts.length === 0) return null;

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -600 : 600;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="mx-8 mb-10 group/shelf">
      {/* Shelf Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-xl bg-[#1a9eff]/15 border border-[#1a9eff]/30 flex items-center justify-center text-[#38bdf8]">
              <Icon className="w-4 h-4" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg font-black text-white tracking-tight font-display">
                {title}
              </h3>
              {badgeText && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/10">
                  {badgeText}
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-[#64748b] font-medium">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5 opacity-0 group-hover/shelf:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => scroll('left')}
            className="p-2 rounded-xl bg-[#151b2a] hover:bg-[#1a9eff] text-[#94a3b8] hover:text-white border border-white/10 transition-colors"
            title="Précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-xl bg-[#151b2a] hover:bg-[#1a9eff] text-[#94a3b8] hover:text-white border border-white/10 transition-colors"
            title="Suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Area */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
      >
        {posts.map((post) => {
          const postId = String(post.id || post.vid_id || '');
          const isInCol = Boolean(collection[postId]);
          const isBootActive = activeStatus?.boot_id === postId || activeStatus?.boot_title === post.title;
          const isSuspendActive = activeStatus?.suspend_id === postId || activeStatus?.suspend_title === post.title;
          const isActive = post.type === 'boot_video' ? isBootActive : isSuspendActive;

          return (
            <div
              key={postId}
              className="w-72 md:w-80 flex-shrink-0"
              onMouseEnter={() => onHoverPost && onHoverPost(post)}
            >
              <VideoCard
                post={post}
                isInCollection={isInCol}
                isActive={isActive}
                isFavorite={isFavorite}
                onPlay={onPlay}
                onOpenDetails={onOpenDetails}
                onDownload={onDownload}
                onApply={onApply}
                onToggleFavorite={onToggleFavorite}
                onDelete={onDelete}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
