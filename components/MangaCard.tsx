'use client';

import React, { useState } from 'react';
import { MangaItem } from '@/lib/types';

interface MangaCardProps {
  manga: MangaItem;
  rank?: number;
  onClick: () => void;
}

export default function MangaCard({
  manga,
  rank,
  onClick,
}: MangaCardProps) {
  const [imgSrc, setImgSrc] = useState<string>(manga.thumb);
  const [hasError, setHasError] = useState(false);

  const handleImageError = () => {
    if (!hasError && manga.thumb) {
      setHasError(true);
      setImgSrc(`/api/proxy-image?url=${encodeURIComponent(manga.thumb)}`);
    }
  };

  // Clean chapter title for display like "ch 1000" or "ch 1194"
  const formatChapter = (chText: string) => {
    if (!chText) return 'ch 1';
    const match = chText.match(/(\d+(\.\d+)?)/);
    if (match) {
      return `ch ${match[1]}`;
    }
    return chText.toLowerCase().replace('chapter', 'ch').trim();
  };

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
      className="group flex flex-col cursor-pointer select-none text-left"
    >
      {/* Cover Card with High Radius matching Screenshot 2 */}
      <div className="relative w-full aspect-[3/4.2] rounded-[24px] sm:rounded-[28px] overflow-hidden bg-[#24212a] border border-[#2b2734] transition-transform duration-200 group-hover:scale-[1.02]">
        <img
          src={imgSrc}
          alt={manga.title}
          onError={handleImageError}
          referrerPolicy="no-referrer"
          loading="lazy"
          className="w-full h-full object-cover"
        />

        {/* Rank Tag if provided (e.g. 1, 2, 3...) */}
        {typeof rank === 'number' && (
          <div className="absolute top-2.5 left-2.5 w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/75 backdrop-blur-sm border border-white/20 flex items-center justify-center text-[11px] sm:text-xs font-bold text-white shadow-md">
            {rank}
          </div>
        )}
      </div>

      {/* Manga Title below card */}
      <h3 className="font-semibold text-xs sm:text-sm text-[#f1f3f7] mt-2 line-clamp-1 group-hover:text-white transition-colors">
        {manga.title}
      </h3>

      {/* Chapter Text below title */}
      <span className="text-[11px] text-[#818798] line-clamp-1 font-normal">
        {formatChapter(manga.latestChapter)}
      </span>
    </div>
  );
}
