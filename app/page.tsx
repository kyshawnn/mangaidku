'use client';

import React, { useState, useEffect, useRef } from 'react';
import MangaCard from '@/components/MangaCard';
import MangaDetailView from '@/components/MangaDetailView';
import HorizontalReader from '@/components/HorizontalReader';
import SettingsView from '@/components/SettingsView';
import HistoryView from '@/components/HistoryView';
import {
  MangaItem,
  MangaDetail,
  AppDatabase,
  BookmarkItem,
  ReadingProgress,
  UserProfile,
} from '@/lib/types';
import {
  Search,
  Loader2,
  X,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

const GENRE_LIST = [
  { id: 'action', label: 'Action' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'fantasy', label: 'Fantasy' },
  { id: 'romance', label: 'Romance' },
  { id: 'isekai', label: 'Isekai' },
  { id: 'shounen', label: 'Shounen' },
];

export default function Home() {
  // Navigation View State
  const [currentView, setCurrentView] = useState<'home' | 'settings' | 'history' | 'bookmarks'>('home');
  const [selectedMangaEndpoint, setSelectedMangaEndpoint] = useState<string | null>(null);
  const [activeChapter, setActiveChapter] = useState<{
    chapterEndpoint: string;
    chapterTitle: string;
    mangaEndpoint: string;
    mangaTitle: string;
    mangaThumb: string;
    initialPage: number;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MangaItem[]>([]);
  const [loadingSearch, setLoadingSearch] = useState(false);

  // Manga Data states
  const [trending, setTrending] = useState<MangaItem[]>([]);
  const [ongoing, setOngoing] = useState<MangaItem[]>([]);
  const [genreManga, setGenreManga] = useState<MangaItem[]>([]);
  const [activeGenre, setActiveGenre] = useState<string>('action');
  const [loadingHome, setLoadingHome] = useState(true);
  const [loadingGenre, setLoadingGenre] = useState(false);

  // Section show more toggle
  const [showAllTrending, setShowAllTrending] = useState(false);
  const [showAllOngoing, setShowAllOngoing] = useState(false);

  // User DB & Leveling state
  const [userProfile, setUserProfile] = useState<UserProfile>({
    id: 'user_default',
    username: 'User',
    email: 'reader@mangaid.app',
    avatarSeed: 'manga-reader-avatar',
    avatarUrl: '',
    level: 0,
    readingSeconds: 0,
    joinedDate: '2026-01-01T00:00:00.000Z',
  });
  const [history, setHistory] = useState<ReadingProgress[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);

  // Hidden File input ref for avatar selection from gallery
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Initial Data Fetching
  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        const [homeRes, userRes, genreRes] = await Promise.all([
          fetch('/api/manga/home'),
          fetch('/api/user'),
          fetch('/api/manga/genre?genre=action'),
        ]);

        const [homeJson, userJson, genreJson] = await Promise.all([
          homeRes.json(),
          userRes.json(),
          genreRes.json(),
        ]);

        if (!ignore) {
          if (homeJson.success && homeJson.data) {
            setTrending(homeJson.data.trending || []);
            setOngoing(homeJson.data.ongoing || []);
          }
          if (genreJson.success && genreJson.data) {
            setGenreManga(genreJson.data || []);
          }
          if (userJson.success && userJson.data) {
            const db: AppDatabase = userJson.data;
            setUserProfile(db.user);
            setHistory(db.history || []);
            setBookmarks(db.bookmarks || []);
          }
          setLoadingHome(false);
        }
      } catch (err) {
        console.error('Error initializing home data:', err);
        if (!ignore) setLoadingHome(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch genre manga on active genre change
  const handleGenreChange = async (genreId: string) => {
    setActiveGenre(genreId);
    try {
      setLoadingGenre(true);
      const res = await fetch(`/api/manga/genre?genre=${genreId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setGenreManga(json.data);
      }
    } catch (err) {
      console.error('Error fetching genre manga:', err);
    } finally {
      setLoadingGenre(false);
    }
  };

  // Search input handler
  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setLoadingSearch(true);
      const res = await fetch(`/api/manga/search?q=${encodeURIComponent(query.trim())}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSearchResults(json.data);
      } else {
        setSearchResults([]);
      }
    } catch (err) {
      console.error('Error searching:', err);
      setSearchResults([]);
    } finally {
      setLoadingSearch(false);
    }
  };

  // Avatar Selection from Device Gallery
  const handleAvatarFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async () => {
        if (typeof reader.result === 'string') {
          const dataUrl = reader.result;
          setUserProfile((prev) => ({ ...prev, avatarUrl: dataUrl }));

          try {
            await fetch('/api/user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'update_avatar',
                payload: { avatarUrl: dataUrl },
              }),
            });
          } catch (err) {
            console.error('Error saving avatar:', err);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Update Username
  const handleUpdateUsername = async (newUsername: string) => {
    try {
      const res = await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_profile',
          payload: { username: newUsername },
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUserProfile(json.data);
      }
    } catch (err) {
      console.error('Error updating username:', err);
    }
  };

  // Clear History
  const handleClearHistory = async () => {
    try {
      await fetch('/api/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_history' }),
      });
      setHistory([]);
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  // Live timer & level update from reader
  const handleReaderTimeUpdate = React.useCallback((seconds: number, level: number) => {
    setUserProfile((prev) => {
      if (prev.readingSeconds === seconds && prev.level === level) return prev;
      return {
        ...prev,
        readingSeconds: seconds,
        level,
      };
    });
  }, []);

  // Progress synchronization from reader
  const handleReaderProgressSync = (progress: {
    mangaEndpoint: string;
    mangaTitle: string;
    mangaThumb: string;
    chapterEndpoint: string;
    chapterTitle: string;
    currentPage: number;
    totalPages: number;
  }) => {
    setHistory((prev) => {
      const existingIdx = prev.findIndex((h) => h.mangaEndpoint === progress.mangaEndpoint);
      const item: ReadingProgress = {
        ...progress,
        updatedAt: new Date().toISOString(),
      };
      if (existingIdx >= 0) {
        const copy = [...prev];
        copy[existingIdx] = item;
        return copy.sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }
      return [item, ...prev];
    });
  };

  // Open Chapter in Fullscreen Reader
  const handleOpenChapter = (
    chapterEndpoint: string,
    chapterTitle: string,
    mangaDetail: MangaDetail
  ) => {
    setActiveChapter({
      chapterEndpoint,
      chapterTitle,
      mangaEndpoint: mangaDetail.endpoint,
      mangaTitle: mangaDetail.title,
      mangaThumb: mangaDetail.thumb,
      initialPage: 1,
    });
  };

  // Level progress percentage for 15-minute cycle
  const currentSeconds = userProfile.readingSeconds || 0;
  const levelProgressPercent = Math.min(100, Math.max(0, (currentSeconds / 900) * 100));

  // Determine slices for Trending & Ongoing
  const displayedTrending = showAllTrending ? trending : trending.slice(0, 6);
  const displayedOngoing = showAllOngoing ? ongoing : ongoing.slice(0, 6);

  return (
    <div className="min-h-screen bg-[#0c0d12] text-[#e4e6eb] font-sans pb-16">
      {/* Hidden file input for avatar selection from device gallery */}
      <input
        type="file"
        ref={avatarInputRef}
        onChange={handleAvatarFileSelect}
        accept="image/*"
        className="hidden"
      />

      {/* VIEW: SETTINGS VIEW */}
      {currentView === 'settings' && (
        <SettingsView
          user={userProfile}
          history={history}
          bookmarks={bookmarks}
          onBack={() => setCurrentView('home')}
          onOpenHistory={() => setCurrentView('history')}
          onOpenBookmarks={() => setCurrentView('bookmarks')}
          onOpenManga={(ep) => setSelectedMangaEndpoint(ep)}
          onUpdateUsername={handleUpdateUsername}
          onUpdateAvatar={(url) => {
            setUserProfile((prev) => ({ ...prev, avatarUrl: url }));
          }}
          onClearHistory={handleClearHistory}
        />
      )}

      {/* VIEW: HISTORY VIEW */}
      {currentView === 'history' && (
        <div className="max-w-md mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 border-b border-[#1c202a] pb-4 mb-4">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="w-10 h-10 rounded-full bg-[#161822] border border-[#252938] flex items-center justify-center text-white hover:bg-[#1f2331] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Riwayat Bacaan
            </h1>
          </div>
          <HistoryView
            history={history}
            onResumeReading={(item) => {
              setActiveChapter({
                chapterEndpoint: item.chapterEndpoint,
                chapterTitle: item.chapterTitle,
                mangaEndpoint: item.mangaEndpoint,
                mangaTitle: item.mangaTitle,
                mangaThumb: item.mangaThumb,
                initialPage: item.currentPage,
              });
            }}
            onClearHistory={handleClearHistory}
          />
        </div>
      )}

      {/* VIEW: BOOKMARKS / FAVORIT VIEW */}
      {currentView === 'bookmarks' && (
        <div className="max-w-md mx-auto px-4 pt-6">
          <div className="flex items-center gap-4 border-b border-[#1c202a] pb-4 mb-6">
            <button
              type="button"
              onClick={() => setCurrentView('home')}
              className="w-10 h-10 rounded-full bg-[#161822] border border-[#252938] flex items-center justify-center text-white hover:bg-[#1f2331] transition-colors"
            >
              <ChevronLeft className="w-5 h-5 -ml-0.5" />
            </button>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Favorit / Bookmark
            </h1>
          </div>

          {bookmarks.length === 0 ? (
            <div className="py-20 text-center text-xs text-[#717789] bg-[#12141c] rounded-[36px] border border-[#232733] p-8">
              Belum ada komik yang ditandai sebagai favorit.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {bookmarks.map((bm) => (
                <div
                  key={bm.mangaEndpoint}
                  onClick={() => setSelectedMangaEndpoint(bm.mangaEndpoint)}
                  className="flex flex-col cursor-pointer group"
                >
                  <div className="w-full aspect-[3/4.2] rounded-[24px] overflow-hidden bg-[#24212a] border border-[#2b2734]">
                    <img
                      src={bm.mangaThumb}
                      alt={bm.mangaTitle}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <h4 className="text-xs font-semibold text-white mt-1.5 line-clamp-1">
                    {bm.mangaTitle}
                  </h4>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: HOME VIEW matching Screenshot 2 */}
      {currentView === 'home' && (
        <div className="max-w-md sm:max-w-lg mx-auto px-4 pt-6 flex flex-col gap-6">
          {/* User Profile Card with 45px Radius matching Screenshot 2 */}
          <div className="relative bg-[#12151d] border border-[#232733] rounded-[45px] p-6 sm:p-7 flex flex-col items-center text-center shadow-lg">
            {/* Setting > link on top left */}
            <button
              type="button"
              onClick={() => setCurrentView('settings')}
              className="absolute top-5 left-6 text-xs font-medium text-[#c4cad7] hover:text-white flex items-center gap-0.5 transition-colors"
            >
              <span>Setting</span>
              <span className="text-[#8c92a4]">&gt;</span>
            </button>

            {/* Circular Avatar (Click to select photo from gallery) */}
            <div
              onClick={() => avatarInputRef.current?.click()}
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-[#4a4e5d] border-2 border-[#5a6074] overflow-hidden flex items-center justify-center cursor-pointer transition-transform hover:scale-105 shadow-xl mt-2 mb-3"
              title="Klik untuk memilih foto profil dari galeri"
            >
              {userProfile.avatarUrl ? (
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.username}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#3c4150]" />
              )}
            </div>

            {/* Username */}
            <h2 className="text-base sm:text-lg font-bold text-white tracking-wide mb-3">
              {userProfile.username || 'User'}
            </h2>

            {/* Horizontal Line Divider matching Screenshot 2 */}
            <div className="w-full border-t border-[#232733] my-3" />

            {/* Leveling Bar matching Screenshot 2 (Red & White progress bar) */}
            <div className="w-full max-w-xs flex flex-col items-center gap-1.5 mt-1">
              <div className="w-full h-1.5 bg-white rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-[#ef4444] rounded-full transition-all duration-300"
                  style={{ width: `${levelProgressPercent}%` }}
                />
              </div>

              {/* Lv {level} text below bar matching Screenshot 2 */}
              <div className="text-xs sm:text-sm font-bold text-white tracking-wide">
                Lv {userProfile.level ?? 0}
              </div>
            </div>
          </div>

          {/* Search Box matching Screenshot 2: "Cari manga" pill with search icon on right */}
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Cari manga"
              className="w-full pl-6 pr-12 py-3.5 bg-[#12151d] border border-[#232733] rounded-[45px] text-sm text-[#e4e6eb] placeholder-[#6d7385] focus:outline-none focus:border-[#3d445a] transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-[#6d7385]">
              <Search className="w-4 h-4" />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="absolute inset-y-0 right-10 flex items-center text-[#7e8597] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* If Search query is active: display search results */}
          {searchQuery ? (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between text-xs text-[#8c92a2]">
                <span className="font-semibold text-white">Hasil Pencarian</span>
                <span>{searchResults.length} manga ditemukan</span>
              </div>

              {loadingSearch ? (
                <div className="py-16 flex flex-col items-center justify-center gap-2 text-[#7c8396]">
                  <Loader2 className="w-6 h-6 animate-spin text-[#9ca3af]" />
                  <span className="text-xs">Mencari manga...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#717789] bg-[#12141c] rounded-[32px] border border-[#232733]">
                  Tidak ada komik yang cocok dengan &ldquo;{searchQuery}&rdquo;.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {searchResults.map((manga) => (
                    <MangaCard
                      key={manga.endpoint}
                      manga={manga}
                      onClick={() => setSelectedMangaEndpoint(manga.endpoint)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <>
              {loadingHome ? (
                <div className="py-24 flex flex-col items-center justify-center gap-3 text-[#7c8396]">
                  <Loader2 className="w-7 h-7 animate-spin text-[#9ca3af]" />
                  <span className="text-xs">Memuat manga...</span>
                </div>
              ) : (
                <>
                  {/* SECTION 1: Trending now matching Screenshot 2 */}
                  <section className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Trending now
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAllTrending(!showAllTrending)}
                        className="text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-0.5 transition-colors"
                      >
                        <span>selengkapnya</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 3 Columns Grid for Cards with rank numbers 1-2-3... */}
                    <div className="grid grid-cols-3 gap-3">
                      {displayedTrending.map((manga, idx) => (
                        <MangaCard
                          key={manga.endpoint}
                          manga={manga}
                          rank={idx + 1}
                          onClick={() => setSelectedMangaEndpoint(manga.endpoint)}
                        />
                      ))}
                    </div>
                  </section>

                  {/* SECTION 2: Manga Terbaru matching User Brief */}
                  <section className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Manga Terbaru
                      </h3>
                      <button
                        type="button"
                        onClick={() => setShowAllOngoing(!showAllOngoing)}
                        className="text-xs font-medium text-[#3b82f6] hover:text-[#60a5fa] flex items-center gap-0.5 transition-colors"
                      >
                        <span>selengkapnya</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* 3 Columns Grid for Cards */}
                    <div className="grid grid-cols-3 gap-3">
                      {displayedOngoing.map((manga) => (
                        <MangaCard
                          key={manga.endpoint}
                          manga={manga}
                          onClick={() => setSelectedMangaEndpoint(manga.endpoint)}
                        />
                      ))}
                    </div>
                  </section>

                  {/* SECTION 3: Manga Berdasarkan Genre */}
                  <section className="flex flex-col gap-3 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        Manga Berdasarkan Genre
                      </h3>
                    </div>

                    {/* Genre Selector Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {GENRE_LIST.map((g) => (
                        <button
                          key={g.id}
                          type="button"
                          onClick={() => handleGenreChange(g.id)}
                          className={`px-4 py-1.5 rounded-[45px] text-xs font-semibold whitespace-nowrap transition-all border ${
                            activeGenre === g.id
                              ? 'bg-[#212534] border-[#363e54] text-white'
                              : 'bg-[#12141c] border-[#232733] text-[#818798] hover:text-white'
                          }`}
                        >
                          {g.label}
                        </button>
                      ))}
                    </div>

                    {/* Genre Manga 3-Column Grid */}
                    {loadingGenre ? (
                      <div className="py-12 flex items-center justify-center text-[#7c8396]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#9ca3af]" />
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-3">
                        {genreManga.slice(0, 6).map((manga) => (
                          <MangaCard
                            key={manga.endpoint}
                            manga={manga}
                            onClick={() => setSelectedMangaEndpoint(manga.endpoint)}
                          />
                        ))}
                      </div>
                    )}
                  </section>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* DETAIL VIEW: matching Screenshot 1 */}
      {selectedMangaEndpoint && (
        <div className="fixed inset-0 z-40 bg-[#0c0d12] overflow-y-auto">
          <MangaDetailView
            endpoint={selectedMangaEndpoint}
            onBack={() => setSelectedMangaEndpoint(null)}
            onOpenChapter={handleOpenChapter}
          />
        </div>
      )}

      {/* FULLSCREEN READER: matching Screenshot 3 */}
      {activeChapter && (
        <HorizontalReader
          chapterEndpoint={activeChapter.chapterEndpoint}
          mangaEndpoint={activeChapter.mangaEndpoint}
          mangaTitle={activeChapter.mangaTitle}
          mangaThumb={activeChapter.mangaThumb}
          initialPage={activeChapter.initialPage}
          initialReadingSeconds={userProfile.readingSeconds || 0}
          currentLevel={userProfile.level ?? 0}
          onClose={() => setActiveChapter(null)}
          onChapterChange={(nextEp, nextTitle) => {
            setActiveChapter((prev) =>
              prev
                ? {
                    ...prev,
                    chapterEndpoint: nextEp,
                    chapterTitle: nextTitle,
                    initialPage: 1,
                  }
                : null
            );
          }}
          onTimeUpdate={handleReaderTimeUpdate}
          onProgressSync={handleReaderProgressSync}
        />
      )}
    </div>
  );
}
