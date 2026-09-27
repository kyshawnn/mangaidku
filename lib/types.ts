export interface ReadingProgress {
  mangaEndpoint: string;
  mangaTitle: string;
  mangaThumb: string;
  chapterEndpoint: string;
  chapterTitle: string;
  currentPage: number;
  totalPages: number;
  updatedAt: string;
}

export interface BookmarkItem {
  mangaEndpoint: string;
  mangaTitle: string;
  mangaThumb: string;
  type?: string;
  addedAt: string;
}

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  avatarSeed: string;
  avatarUrl?: string;
  level: number;
  readingSeconds: number;
  joinedDate: string;
}

export interface AppDatabase {
  user: UserProfile;
  history: ReadingProgress[];
  bookmarks: BookmarkItem[];
}

export interface MangaItem {
  title: string;
  endpoint: string;
  thumb: string;
  type: 'Manga' | 'Manhwa' | 'Manhua' | string;
  latestChapter: string;
  latestChapterEndpoint: string;
  genreOrRating?: string;
  description?: string;
}

export interface ChapterItem {
  title: string;
  endpoint: string;
  releaseDate?: string;
}

export interface MangaDetail {
  title: string;
  endpoint: string;
  thumb: string;
  synopsis: string;
  type: string;
  status: string;
  author: string;
  genres: string[];
  totalChapters: number;
  chapters: ChapterItem[];
}

export interface ChapterDetail {
  title: string;
  chapterTitle: string;
  chapterEndpoint: string;
  mangaEndpoint: string;
  mangaTitle: string;
  prevChapterEndpoint: string | null;
  nextChapterEndpoint: string | null;
  images: string[];
  totalPages: number;
}
