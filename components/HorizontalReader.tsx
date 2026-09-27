'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Loader2,
  RotateCcw,
} from 'lucide-react';
import { ChapterDetail } from '@/lib/types';

interface HorizontalReaderProps {
  chapterEndpoint: string;
  mangaEndpoint: string;
  mangaTitle: string;
  mangaThumb: string;
  initialPage?: number;
  initialReadingSeconds: number;
  currentLevel: number;
  onClose: () => void;
  onChapterChange: (nextEndpoint: string, nextTitle: string) => void;
  onTimeUpdate: (currentSeconds: number, currentLevel: number) => void;
  onProgressSync: (progress: {
    mangaEndpoint: string;
    mangaTitle: string;
    mangaThumb: string;
    chapterEndpoint: string;
    chapterTitle: string;
    currentPage: number;
    totalPages: number;
  }) => void;
}

export default function HorizontalReader({
  chapterEndpoint,
  mangaEndpoint,
  mangaTitle,
  mangaThumb,
  initialPage = 1,
  initialReadingSeconds,
  currentLevel,
  onClose,
  onChapterChange,
  onTimeUpdate,
  onProgressSync,
}: HorizontalReaderProps) {
  const [chapter, setChapter] = useState<ChapterDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(initialPage);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [isEndOverlay, setIsEndOverlay] = useState(false);

  // Controls Visibility (Top & Bottom bars only appear on tap)
  const [showControls, setShowControls] = useState(false);

  // Gesture / Slide states
  const [dragOffset, setDragOffset] = useState<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const isPointerDownRef = useRef<boolean>(false);
  const hasMovedRef = useRef<boolean>(false);

  // 15-Minute Leveling System (900 seconds cycle)
  const [cycleSeconds, setCycleSeconds] = useState<number>(initialReadingSeconds % 900);
  const [userLevel, setUserLevel] = useState<number>(currentLevel);

  const accumulatedSecondsRef = useRef<number>(0);
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const secondsRef = useRef<number>(initialReadingSeconds % 900);
  const levelRef = useRef<number>(currentLevel);
  const onTimeUpdateRef = useRef(onTimeUpdate);

  useEffect(() => {
    onTimeUpdateRef.current = onTimeUpdate;
  }, [onTimeUpdate]);

  // 15-minute Timer that ONLY runs while on this reading page!
  useEffect(() => {
    const timer = setInterval(() => {
      accumulatedSecondsRef.current += 1;
      secondsRef.current += 1;

      if (secondsRef.current >= 900) {
        secondsRef.current = 0;
        levelRef.current += 1;
        setCycleSeconds(0);
        setUserLevel(levelRef.current);
        onTimeUpdateRef.current(0, levelRef.current);
      } else {
        setCycleSeconds(secondsRef.current);
        onTimeUpdateRef.current(secondsRef.current, levelRef.current);
      }
    }, 1000);

    // Periodic sync of reading time to database every 10 seconds
    const dbSyncInterval = setInterval(async () => {
      if (accumulatedSecondsRef.current > 0) {
        const toSync = accumulatedSecondsRef.current;
        accumulatedSecondsRef.current = 0;
        try {
          await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'add_reading_time',
              payload: { seconds: toSync },
            }),
          });
        } catch (err) {
          console.error('Error syncing reading time:', err);
        }
      }
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(dbSyncInterval);

      // Sync remaining unsaved seconds on exit
      if (accumulatedSecondsRef.current > 0) {
        const remaining = accumulatedSecondsRef.current;
        accumulatedSecondsRef.current = 0;
        fetch('/api/user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'add_reading_time',
            payload: { seconds: remaining },
          }),
        }).catch(() => {});
      }
    };
  }, []);

  // Load Chapter Data from Scraper
  useEffect(() => {
    let isMounted = true;
    async function loadChapter() {
      try {
        setLoading(true);
        setError(null);
        setIsEndOverlay(false);
        setFailedImages({});

        const res = await fetch(`/api/manga/chapter?endpoint=${encodeURIComponent(chapterEndpoint)}`);
        const json = await res.json();

        if (json.success && json.data) {
          if (isMounted) {
            setChapter(json.data);
            const total = json.data.images.length || 1;
            const validInitial = Math.min(Math.max(1, initialPage), total);
            setCurrentPage(validInitial);
          }
        } else {
          if (isMounted) setError(json.error || 'Gagal memuat chapter');
        }
      } catch (err) {
        console.error('Error loading chapter:', err);
        if (isMounted) setError('Terjadi kesalahan memuat data chapter');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadChapter();
    return () => {
      isMounted = false;
    };
  }, [chapterEndpoint, initialPage]);

  // Synchronize progress to database
  const syncProgress = useCallback(
    (page: number, total: number) => {
      if (!chapter) return;

      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }

      syncTimeoutRef.current = setTimeout(async () => {
        try {
          const payload = {
            mangaEndpoint,
            mangaTitle,
            mangaThumb,
            chapterEndpoint,
            chapterTitle: chapter.chapterTitle || 'Chapter',
            currentPage: page,
            totalPages: total,
          };

          onProgressSync(payload);

          await fetch('/api/user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'sync_progress',
              payload,
            }),
          });
        } catch (err) {
          console.error('Failed to sync progress to database:', err);
        }
      }, 500);
    },
    [chapter, chapterEndpoint, mangaEndpoint, mangaTitle, mangaThumb, onProgressSync]
  );

  // Page Navigation Handlers
  const goToNextPage = useCallback(() => {
    if (!chapter) return;
    const total = chapter.images.length;
    if (currentPage < total) {
      const nextP = currentPage + 1;
      setCurrentPage(nextP);
      syncProgress(nextP, total);
    } else {
      setIsEndOverlay(true);
    }
  }, [chapter, currentPage, syncProgress]);

  const goToPrevPage = useCallback(() => {
    if (!chapter) return;
    if (isEndOverlay) {
      setIsEndOverlay(false);
      return;
    }
    if (currentPage > 1) {
      const prevP = currentPage - 1;
      setCurrentPage(prevP);
      syncProgress(prevP, chapter.images.length);
    }
  }, [chapter, currentPage, isEndOverlay, syncProgress]);

  // Touch & Mouse Horizontal Slide Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isEndOverlay) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    hasMovedRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isEndOverlay) return;
    const touch = e.touches[0];
    const diffX = touch.clientX - touchStartRef.current.x;
    const diffY = touch.clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > 10 || Math.abs(diffY) > 10) {
      hasMovedRef.current = true;
    }

    // Only apply horizontal drag if mostly horizontal motion
    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || isEndOverlay) {
      touchStartRef.current = null;
      setDragOffset(0);
      return;
    }

    const threshold = 45; // Minimum swipe distance in px
    if (dragOffset < -threshold) {
      // Swiped left -> Next page
      goToNextPage();
    } else if (dragOffset > threshold) {
      // Swiped right -> Previous page
      goToPrevPage();
    } else if (!hasMovedRef.current) {
      // It was a clean tap! Toggle top and bottom controls
      setShowControls((prev) => !prev);
    }

    touchStartRef.current = null;
    hasMovedRef.current = false;
    setDragOffset(0);
  };

  // Mouse Drag / Slide Handlers for desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isEndOverlay) return;
    isPointerDownRef.current = true;
    touchStartRef.current = { x: e.clientX, y: e.clientY };
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPointerDownRef.current || !touchStartRef.current || isEndOverlay) return;
    const diffX = e.clientX - touchStartRef.current.x;
    const diffY = e.clientY - touchStartRef.current.y;

    if (Math.abs(diffX) > 8 || Math.abs(diffY) > 8) {
      hasMovedRef.current = true;
    }

    if (Math.abs(diffX) > Math.abs(diffY)) {
      setDragOffset(diffX);
    }
  };

  const handleMouseUp = () => {
    if (!isPointerDownRef.current || isEndOverlay) {
      isPointerDownRef.current = false;
      setDragOffset(0);
      return;
    }

    const threshold = 45;
    if (dragOffset < -threshold) {
      goToNextPage();
    } else if (dragOffset > threshold) {
      goToPrevPage();
    } else if (!hasMovedRef.current) {
      setShowControls((prev) => !prev);
    }

    isPointerDownRef.current = false;
    touchStartRef.current = null;
    hasMovedRef.current = false;
    setDragOffset(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'd' || e.key === 'D') {
        goToNextPage();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        goToPrevPage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNextPage, goToPrevPage, onClose]);

  // Preload next image for instant reading
  useEffect(() => {
    if (!chapter || !chapter.images) return;
    const nextIdx = currentPage;
    if (nextIdx < chapter.images.length) {
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.src = chapter.images[nextIdx];
    }
  }, [chapter, currentPage]);

  // Format MM:SS for 15-minute timer
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Clean chapter number for header like "1194" in Screenshot 3
  const formatChapterHeader = (raw: string | undefined) => {
    if (!raw) return 'Chapter';
    const match = raw.match(/chapter\s*(\d+(\.\d+)?)/i);
    if (match) return match[1];
    const numOnly = raw.match(/(\d+(\.\d+)?)/);
    if (numOnly) return numOnly[1];
    return raw;
  };

  const progressPercent = Math.min(100, Math.max(0, (cycleSeconds / 900) * 100));

  const currentImageUrl = chapter?.images[currentPage - 1] || '';
  const finalImageUrl = failedImages[currentPage]
    ? `/api/proxy-image?url=${encodeURIComponent(currentImageUrl)}`
    : currentImageUrl;

  return (
    <div
      className="fixed inset-0 z-50 bg-[#0c0d12] text-white flex flex-col select-none overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Top Header & 15-Minute Leveling Bar: ONLY visible when tapped (showControls) */}
      <div
        className={`absolute top-0 left-0 right-0 w-full bg-[#10121a]/95 backdrop-blur-md border-b border-[#1c202a] z-40 transition-all duration-300 transform ${
          showControls ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-transparent hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            title="Kembali"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <h2 className="text-lg font-bold text-white tracking-wide">
            {formatChapterHeader(chapter?.chapterTitle || chapterEndpoint)}
          </h2>

          <div className="w-9" />
        </div>

        {/* 15-Minute Leveling Bar matching Screenshot 3 */}
        <div className="w-full pb-2">
          {/* Progress Bar: Red fill & White remaining track */}
          <div className="w-full h-1 bg-white/90 relative overflow-hidden">
            <div
              className="h-full bg-[#ef4444] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Time Tracker Row: e.g. 04:26 on left and 15:00 on right */}
          <div className="max-w-3xl mx-auto px-4 flex items-center justify-between text-xs text-[#8c92a2] font-medium pt-1.5">
            <span>{formatTime(cycleSeconds)}</span>
            <span>15:00</span>
          </div>
        </div>
      </div>

      {/* Main Manga Canvas: Fullscreen with top/bottom breathing room as requested */}
      <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden bg-[#0c0d12] py-8 sm:py-10 px-2 sm:px-4">
        {loading ? (
          <div className="flex flex-col items-center gap-3 text-[#798092]">
            <Loader2 className="w-8 h-8 animate-spin text-[#9ca3af]" />
            <span className="text-xs">Memuat halaman manga...</span>
          </div>
        ) : error ? (
          <div className="text-center p-6 bg-[#13151e] border border-[#232734] rounded-[32px] max-w-sm">
            <p className="text-sm text-[#8f96a8] mb-4">{error}</p>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-[45px] bg-[#202432] text-xs font-medium text-white hover:bg-[#282d3d]"
            >
              Kembali
            </button>
          </div>
        ) : isEndOverlay ? (
          /* Chapter Completed Overlay */
          <div
            className="z-30 max-w-sm w-full mx-4 p-8 bg-[#12151d] border border-[#242836] rounded-[36px] text-center flex flex-col items-center gap-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-white">
              Chapter Selesai
            </h3>
            <p className="text-xs text-[#8a91a3]">
              Anda telah membaca semua {chapter?.totalPages || 0} halaman pada chapter ini.
            </p>

            <div className="flex flex-col w-full gap-2.5 pt-2">
              {chapter?.nextChapterEndpoint ? (
                <button
                  type="button"
                  onClick={() => {
                    if (chapter.nextChapterEndpoint) {
                      onChapterChange(chapter.nextChapterEndpoint, 'Chapter Berikutnya');
                    }
                  }}
                  className="w-full py-3.5 px-6 rounded-[45px] bg-[#232837] hover:bg-[#2b3143] border border-[#3b435a] text-sm font-semibold text-white flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <span>Lanjut ke Chapter Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="py-2.5 text-xs text-[#6e7587]">
                  Ini adalah chapter terbaru yang tersedia saat ini.
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsEndOverlay(false);
                  setCurrentPage(1);
                  syncProgress(1, chapter?.totalPages || 1);
                }}
                className="w-full py-3 px-6 rounded-[45px] bg-[#161822] hover:bg-[#1d202c] border border-[#252938] text-xs font-medium text-[#8e95a7] flex items-center justify-center gap-2 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Baca Ulang Chapter Ini</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 text-xs text-[#6e7587] hover:text-white transition-colors"
              >
                Tutup Reader
              </button>
            </div>
          </div>
        ) : (
          /* Scraped Real Manga Image Canvas with horizontal sliding support */
          <div
            className="relative w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
            style={{
              transform: `translateX(${dragOffset * 0.75}px)`,
            }}
          >
            <img
              key={currentPage}
              src={finalImageUrl}
              alt={`Halaman ${currentPage}`}
              referrerPolicy="no-referrer"
              onError={() => {
                setFailedImages((prev) => ({ ...prev, [currentPage]: true }));
              }}
              className="max-h-full max-w-full object-contain pointer-events-none select-none drop-shadow-xl"
            />
          </div>
        )}
      </div>

      {/* Bottom Page Indicator: ONLY visible when tapped (showControls) */}
      <div
        className={`absolute bottom-0 left-0 right-0 w-full bg-[#10121a]/95 backdrop-blur-md border-t border-[#1c202a] py-3 px-4 z-40 transition-all duration-300 transform ${
          showControls ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-full opacity-0 pointer-events-none'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-md mx-auto flex flex-col items-center gap-1">
          <div className="text-sm font-bold text-white tracking-wider">
            {currentPage}/{chapter?.totalPages || 0}
          </div>

          <div
            onClick={goToNextPage}
            className="text-xs text-[#8c92a4] font-medium tracking-wide cursor-pointer hover:text-white transition-colors flex items-center gap-1"
          >
            <span>Slide Ke Kanan Untuk Membaca</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </div>
  );
}
