'use client';

import React, { useState } from 'react';
import {
  BookmarkCheck,
  Clock,
  Trash2,
  BookOpen,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { ReadingProgress } from '@/lib/types';

interface HistoryViewProps {
  history: ReadingProgress[];
  onResumeReading: (item: ReadingProgress) => void;
  onClearHistory: () => void;
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return 'Baru saja';
  }
}

export default function HistoryView({
  history,
  onResumeReading,
  onClearHistory,
}: HistoryViewProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Page Title & Clear Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1c202a] pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#787f92] mb-1">
            <BookmarkCheck className="w-4 h-4 text-[#8f96a8]" />
            <span>Tersimpan di Database</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-[#f1f3f7] tracking-tight">
            Riwayat Bacaan
          </h1>
          <p className="text-xs text-[#717789] mt-1">
            Progres bacaan Anda disimpan secara otomatis dan dapat dilanjutkan kapan saja.
          </p>
        </div>

        {history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="self-start sm:self-center px-4 py-2 rounded-[45px] bg-[#161822] hover:bg-[#1f2230] border border-[#252938] text-xs font-medium text-[#8c93a5] hover:text-[#d6d8df] flex items-center gap-2 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Semua Riwayat</span>
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="py-24 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-[45px] bg-[#151720] border border-[#232733] flex items-center justify-center text-[#6e7486]">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-medium text-[#d6d8df] mb-1">
              Belum Ada Riwayat Bacaan
            </h3>
            <p className="text-xs text-[#6e7587] max-w-sm">
              Mulai membaca chapter komik dari halaman beranda, dan progres bacaan Anda akan tersimpan otomatis di sini.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {history.map((item) => {
            const percent =
              item.totalPages > 0
                ? Math.round((item.currentPage / item.totalPages) * 100)
                : 0;

            const imgSrc = failedImages[item.mangaEndpoint]
              ? `/api/proxy-image?url=${encodeURIComponent(item.mangaThumb)}`
              : item.mangaThumb;

            return (
              <div
                key={item.mangaEndpoint}
                className="bg-[#13161e] border border-[#212532] hover:border-[#353b4d] rounded-[45px] p-5 flex flex-col justify-between transition-all duration-200 hover:bg-[#161a25]"
              >
                <div>
                  {/* Thumbnail & Badges */}
                  <div className="relative w-full aspect-[16/10] rounded-[35px] overflow-hidden bg-[#1b1f2a] mb-4">
                    <img
                      src={imgSrc}
                      alt={item.mangaTitle}
                      onError={() =>
                        setFailedImages((prev) => ({
                          ...prev,
                          [item.mangaEndpoint]: true,
                        }))
                      }
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute bottom-3 inset-x-3 bg-[#0d0f15]/80 backdrop-blur-sm rounded-[45px] p-2 border border-[#222736]">
                      <div className="flex items-center justify-between text-[11px] text-[#c4c9d5] mb-1 px-1">
                        <span>Halaman {item.currentPage} / {item.totalPages}</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="w-full bg-[#1c202d] rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-[#858d9f] h-full rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Title & Chapter Details */}
                  <h3 className="font-medium text-base text-[#e5e7eb] line-clamp-1 mb-1">
                    {item.mangaTitle}
                  </h3>

                  <div className="flex items-center gap-2 text-xs text-[#82889a] mb-3">
                    <span className="text-[#a4aab9] font-medium">
                      {item.chapterTitle}
                    </span>
                    <span aria-hidden="true">·</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3 text-[#646a7c]" />
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Resume Button */}
                <button
                  type="button"
                  onClick={() => onResumeReading(item)}
                  className="w-full mt-2 py-3 px-5 rounded-[45px] bg-[#1d212d] hover:bg-[#252b3a] border border-[#2b3142] text-xs font-medium text-[#f1f3f7] flex items-center justify-center gap-2 transition-all group"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-[#888fa1] group-hover:rotate-45 transition-transform" />
                  <span>Lanjutkan Bacaan</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-auto text-[#6c7385] group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
