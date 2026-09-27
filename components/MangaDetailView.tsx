'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  Search,
  Loader2,
  X,
} from 'lucide-react';
import { MangaDetail } from '@/lib/types';

interface MangaDetailViewProps {
  endpoint: string;
  onBack: () => void;
  onOpenChapter: (
    chapterEndpoint: string,
    chapterTitle: string,
    mangaDetail: MangaDetail
  ) => void;
}

export default function MangaDetailView({
  endpoint,
  onBack,
  onOpenChapter,
}: MangaDetailViewProps) {
  const [detail, setDetail] = useState<MangaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchChapter, setSearchChapter] = useState('');
  const [expandedSynopsis, setExpandedSynopsis] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | '1-100' | '100-1'>('all');
  const [imgSrc, setImgSrc] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    async function fetchDetail() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/manga/detail?endpoint=${encodeURIComponent(endpoint)}`);
        const data = await res.json();
        if (data.success && data.data) {
          if (isMounted) {
            setDetail(data.data);
            setImgSrc(data.data.thumb);
          }
        } else {
          if (isMounted) setError(data.error || 'Gagal memuat detail komik');
        }
      } catch (err) {
        console.error('Error fetching manga detail:', err);
        if (isMounted) setError('Terjadi kesalahan saat memuat data');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  const handleImageError = () => {
    if (detail?.thumb && !imgSrc.includes('/api/proxy-image')) {
      setImgSrc(`/api/proxy-image?url=${encodeURIComponent(detail.thumb)}`);
    }
  };

  // Filter chapters based on search keyword and selected tab
  const getProcessedChapters = () => {
    if (!detail?.chapters) return [];

    let list = detail.chapters;

    // Filter by search keyword
    if (searchChapter.trim()) {
      const q = searchChapter.trim().toLowerCase();
      list = list.filter((ch) => ch.title.toLowerCase().includes(q));
    }

    // Filter by tab
    if (activeTab === '1-100') {
      list = [...list].reverse().slice(0, 100);
    } else if (activeTab === '100-1') {
      list = list.slice(0, 100);
    }

    return list;
  };

  // Format chapter name to clean number like Screenshot 1 ("1194")
  const formatChapterTitle = (raw: string) => {
    const trimmed = raw.trim();
    const match = trimmed.match(/chapter\s*(\d+(\.\d+)?)/i);
    if (match) {
      return match[1];
    }
    return trimmed;
  };

  const processedChapters = getProcessedChapters();

  return (
    <div className="relative min-h-screen bg-[#0c0d12] text-[#e4e6eb] pb-16 overflow-x-hidden">
      {/* Blurred Backdrop Image matching Screenshot 1 */}
      {imgSrc && (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <img
            src={imgSrc}
            alt=""
            aria-hidden="true"
            onError={handleImageError}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover filter blur-2xl scale-125 opacity-25"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0c0d12]/40 via-[#0c0d12]/80 to-[#0c0d12]" />
        </div>
      )}

      {/* Main Container */}
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
        {/* Top Header with Back button */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-black/80 transition-colors shadow-lg"
            title="Kembali"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
        </div>

        {loading ? (
          <div className="py-32 flex flex-col items-center justify-center gap-3 text-[#818798]">
            <Loader2 className="w-8 h-8 animate-spin text-[#9ca3af]" />
            <span className="text-xs">Memuat data komik...</span>
          </div>
        ) : error || !detail ? (
          <div className="py-24 text-center bg-[#13151e]/80 border border-[#232733] rounded-[32px] p-8">
            <p className="text-sm text-[#8e95a7] mb-4">{error || 'Komik tidak ditemukan'}</p>
            <button
              type="button"
              onClick={onBack}
              className="px-6 py-2.5 rounded-[45px] bg-[#202432] text-xs font-medium text-white hover:bg-[#282d3d]"
            >
              Kembali ke Beranda
            </button>
          </div>
        ) : (
          <>
            {/* Center Cover */}
            <div className="flex flex-col items-center text-center">
              <div className="w-40 sm:w-44 aspect-[3/4.2] rounded-[20px] overflow-hidden bg-[#1f1c26] border border-white/15 shadow-2xl mb-4">
                <img
                  src={imgSrc}
                  alt={detail.title}
                  onError={handleImageError}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight leading-tight">
                {detail.title}
              </h1>

              {/* Metadata Row: Type | Author | Rating */}
              <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-[#c4cad7] mt-3">
                <span>
                  Type : <span className="text-white">{detail.type || 'Manga'}</span>
                </span>
                <span>
                  Author : <span className="text-white">{detail.author || 'Eichiro oda'}</span>
                </span>
                <span>
                  Rating : <span className="text-white">10+</span>
                </span>
              </div>

              {/* Genre Pills */}
              {detail.genres && detail.genres.length > 0 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                  {detail.genres.slice(0, 5).map((genre, idx) => (
                    <span
                      key={idx}
                      className="px-5 py-1.5 rounded-[45px] bg-[#141620]/90 backdrop-blur-md border border-[#272b3a] text-xs text-[#d6d8df] font-medium"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Synopsis Card matching Screenshot 1 */}
            <div className="bg-[#12141c]/90 backdrop-blur-md border border-[#232733] rounded-[32px] p-5 text-xs text-[#a0a5b5] leading-relaxed">
              <p>
                {expandedSynopsis ? (
                  detail.synopsis
                ) : (
                  <>
                    {detail.synopsis.slice(0, 160)}
                    {detail.synopsis.length > 160 && '... '}
                  </>
                )}
                {detail.synopsis.length > 160 && (
                  <button
                    type="button"
                    onClick={() => setExpandedSynopsis(!expandedSynopsis)}
                    className="font-semibold text-white ml-1 hover:underline inline-block"
                  >
                    {expandedSynopsis ? 'tutup' : 'baca selengkapnya'}
                  </button>
                )}
              </p>
            </div>

            {/* Filter Tabs: Semua | 1-100 | 100-1 matching Screenshot 1 */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className={`flex-1 py-2.5 rounded-[45px] text-xs font-semibold transition-all border ${
                  activeTab === 'all'
                    ? 'bg-[#212534] border-[#363e54] text-white'
                    : 'bg-[#141620]/80 border-[#232733] text-[#828899] hover:text-[#d6d8df]'
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('1-100')}
                className={`flex-1 py-2.5 rounded-[45px] text-xs font-semibold transition-all border ${
                  activeTab === '1-100'
                    ? 'bg-[#212534] border-[#363e54] text-white'
                    : 'bg-[#141620]/80 border-[#232733] text-[#828899] hover:text-[#d6d8df]'
                }`}
              >
                1-100
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('100-1')}
                className={`flex-1 py-2.5 rounded-[45px] text-xs font-semibold transition-all border ${
                  activeTab === '100-1'
                    ? 'bg-[#212534] border-[#363e54] text-white'
                    : 'bg-[#141620]/80 border-[#232733] text-[#828899] hover:text-[#d6d8df]'
                }`}
              >
                100-1
              </button>
            </div>

            {/* Chapter Search Bar matching Screenshot 1 */}
            <div className="relative w-full">
              <input
                type="text"
                value={searchChapter}
                onChange={(e) => setSearchChapter(e.target.value)}
                placeholder="Cari chapter"
                className="w-full pl-5 pr-11 py-3 bg-[#13161e]/90 border border-[#252a38] rounded-[45px] text-xs text-[#e4e6eb] placeholder-[#6d7385] focus:outline-none focus:border-[#3d445a]"
              />
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#6d7385]">
                <Search className="w-4 h-4" />
              </div>
              {searchChapter && (
                <button
                  type="button"
                  onClick={() => setSearchChapter('')}
                  className="absolute inset-y-0 right-10 flex items-center text-[#7e8597] hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Chapter Pills List matching Screenshot 1 */}
            <div className="flex flex-col gap-2.5">
              {processedChapters.map((ch) => (
                <button
                  key={ch.endpoint}
                  type="button"
                  onClick={() => onOpenChapter(ch.endpoint, ch.title, detail)}
                  className="w-full py-3.5 px-6 rounded-[45px] bg-[#13151e]/90 hover:bg-[#1c202d] border border-[#252a38] hover:border-[#383f54] text-sm font-semibold text-[#f1f3f7] text-center transition-all shadow-sm active:scale-[0.99]"
                >
                  {formatChapterTitle(ch.title)}
                </button>
              ))}

              {processedChapters.length === 0 && (
                <div className="py-12 text-center text-xs text-[#717789] bg-[#12141c]/60 rounded-[32px] border border-[#232733]">
                  Tidak ada chapter yang ditemukan
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
