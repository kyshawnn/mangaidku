'use client';

import React, { useState } from 'react';
import {
  User,
  Bookmark,
  BookOpen,
  CheckCircle2,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { BookmarkItem, ReadingProgress, UserProfile } from '@/lib/types';

interface AccountViewProps {
  user: UserProfile;
  history: ReadingProgress[];
  bookmarks: BookmarkItem[];
  onOpenManga: (endpoint: string) => void;
  onUpdateUsername: (newUsername: string) => void;
}

export default function AccountView({
  user,
  history,
  bookmarks,
  onOpenManga,
  onUpdateUsername,
}: AccountViewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [nameInput, setNameInput] = useState(user.username);
  const [failedThumb, setFailedThumb] = useState<Record<string, boolean>>({});

  const totalChaptersRead = history.length;
  const totalPagesRead = history.reduce((acc, curr) => acc + curr.currentPage, 0);

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      onUpdateUsername(nameInput.trim());
      setIsEditing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Profile Header Card with 45px Radius */}
      <div className="bg-[#13161e] border border-[#212532] rounded-[45px] p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar SVG */}
          <div className="w-20 h-20 rounded-[45px] bg-[#1d212d] border border-[#2d3345] flex items-center justify-center text-[#9ca3af] shrink-0">
            <User className="w-10 h-10" />
          </div>

          <div>
            {isEditing ? (
              <form onSubmit={handleSaveName} className="flex items-center gap-2 mb-1">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="px-4 py-1.5 bg-[#1a1e29] border border-[#2c3244] rounded-[45px] text-sm text-[#e5e7eb] focus:outline-none"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[45px] bg-[#272d3e] text-xs font-medium text-white hover:bg-[#32394e]"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 text-xs text-[#7f8698]"
                >
                  Batal
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2.5 justify-center sm:justify-start">
                <h2 className="text-xl sm:text-2xl font-semibold text-[#f1f3f7]">
                  {user.username}
                </h2>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="text-xs text-[#7e8597] hover:text-[#d6d8df] underline"
                >
                  Ubah
                </button>
              </div>
            )}
            <p className="text-xs text-[#757b8c] mt-0.5">{user.email}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#636a7b] mt-2 justify-center sm:justify-start">
              <Database className="w-3.5 h-3.5 text-[#5e6678]" />
              <span>Data & Riwayat Tersinkronisasi Otomatis</span>
            </div>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="flex items-center gap-2 px-5 py-2.5 rounded-[45px] bg-[#171a24] border border-[#262b3a] text-xs text-[#8c93a5]">
          <CheckCircle2 className="w-4 h-4 text-[#798194]" />
          <span>Status Database: Aktif</span>
        </div>
      </div>

      {/* Reading Statistics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[#13161e] border border-[#212532] rounded-[45px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[45px] bg-[#1a1e29] border border-[#282d3e] flex items-center justify-center text-[#9da3b4]">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#f1f3f7]">
              {history.length}
            </div>
            <div className="text-xs text-[#787f91]">Manga Dibaca</div>
          </div>
        </div>

        <div className="bg-[#13161e] border border-[#212532] rounded-[45px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[45px] bg-[#1a1e29] border border-[#282d3e] flex items-center justify-center text-[#9da3b4]">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#f1f3f7]">
              {bookmarks.length}
            </div>
            <div className="text-xs text-[#787f91]">Bookmark Tersimpan</div>
          </div>
        </div>

        <div className="bg-[#13161e] border border-[#212532] rounded-[45px] p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-[45px] bg-[#1a1e29] border border-[#282d3e] flex items-center justify-center text-[#9da3b4]">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-semibold text-[#f1f3f7]">
              {totalPagesRead}
            </div>
            <div className="text-xs text-[#787f91]">Halaman Diselesaikan</div>
          </div>
        </div>
      </div>

      {/* Bookmarks Section */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-[#1c202a] pb-4">
          <div>
            <h3 className="text-lg font-semibold text-[#f1f3f7]">
              Daftar Bookmark
            </h3>
            <p className="text-xs text-[#747a8b]">
              Koleksi komik favorit yang Anda tandai.
            </p>
          </div>
          <span className="text-xs text-[#7d8496] font-medium">
            {bookmarks.length} Komik
          </span>
        </div>

        {bookmarks.length === 0 ? (
          <div className="py-16 text-center text-xs text-[#747a8b]">
            Belum ada komik yang ditandai sebagai bookmark. Klik ikon bookmark pada kartu komik untuk menyimpannya di sini.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {bookmarks.map((bm) => {
              const imgSrc = failedThumb[bm.mangaEndpoint]
                ? `/api/proxy-image?url=${encodeURIComponent(bm.mangaThumb)}`
                : bm.mangaThumb;

              return (
                <div
                  key={bm.mangaEndpoint}
                  onClick={() => onOpenManga(bm.mangaEndpoint)}
                  className="group bg-[#13161e] border border-[#212532] hover:border-[#353b4d] rounded-[45px] p-3.5 flex items-center gap-3.5 cursor-pointer transition-all hover:bg-[#161a25]"
                >
                  <div className="w-14 h-14 rounded-[30px] overflow-hidden bg-[#1b1f2a] shrink-0 border border-[#272c3a]">
                    <img
                      src={imgSrc}
                      alt={bm.mangaTitle}
                      onError={() =>
                        setFailedThumb((prev) => ({
                          ...prev,
                          [bm.mangaEndpoint]: true,
                        }))
                      }
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-xs sm:text-sm text-[#e5e7eb] truncate group-hover:text-white transition-colors">
                      {bm.mangaTitle}
                    </h4>
                    <span className="text-[11px] text-[#717789]">
                      {bm.type || 'Manga'}
                    </span>
                  </div>

                  <div className="w-8 h-8 rounded-[45px] bg-[#1a1e29] border border-[#252a38] flex items-center justify-center text-[#6e7587] group-hover:text-[#d6d8df] shrink-0">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
