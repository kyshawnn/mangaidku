import fs from 'fs';
import path from 'path';
import {
  ReadingProgress,
  BookmarkItem,
  UserProfile,
  AppDatabase,
} from './types';

export type {
  ReadingProgress,
  BookmarkItem,
  UserProfile,
  AppDatabase,
};

function getDbPath(): string {
  const root = fs.existsSync('/app/applet') ? '/app/applet' : process.cwd();
  const dir = path.join(root, 'data');
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // ignore
    }
  }
  return path.join(dir, 'user_manga_db.json');
}

const DEFAULT_DB: AppDatabase = {
  user: {
    id: 'user_default',
    username: 'User',
    email: 'reader@mangaid.app',
    avatarSeed: 'manga-reader-avatar',
    avatarUrl: '',
    level: 0,
    readingSeconds: 0,
    joinedDate: '2026-01-01T00:00:00.000Z',
  },
  history: [],
  bookmarks: [],
};

function ensureDbExists(): string {
  const dbPath = getDbPath();
  try {
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, JSON.stringify(DEFAULT_DB, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Error ensuring DB directory/file:', err);
  }
  return dbPath;
}

export function getDatabase(): AppDatabase {
  const dbPath = ensureDbExists();
  try {
    const raw = fs.readFileSync(dbPath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file, returning default:', err);
    return DEFAULT_DB;
  }
}

export function saveDatabase(data: AppDatabase): void {
  const dbPath = ensureDbExists();
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

export function syncReadingProgress(progress: ReadingProgress): ReadingProgress[] {
  const db = getDatabase();
  const existingIdx = db.history.findIndex(
    (h) => h.mangaEndpoint === progress.mangaEndpoint
  );

  const updatedItem: ReadingProgress = {
    ...progress,
    updatedAt: new Date().toISOString(),
  };

  if (existingIdx >= 0) {
    db.history[existingIdx] = updatedItem;
  } else {
    db.history.unshift(updatedItem);
  }

  // Sort by updatedAt descending
  db.history.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  saveDatabase(db);
  return db.history;
}

export function addReadingTime(seconds: number): { user: UserProfile; levelUp: boolean } {
  const db = getDatabase();
  // Ensure defaults exist
  if (typeof db.user.level !== 'number') db.user.level = 0;
  if (typeof db.user.readingSeconds !== 'number') db.user.readingSeconds = 0;

  db.user.readingSeconds += seconds;
  let levelUp = false;

  const CYCLE_SECONDS = 900; // 15 minutes = 15 * 60 = 900s
  if (db.user.readingSeconds >= CYCLE_SECONDS) {
    const gained = Math.floor(db.user.readingSeconds / CYCLE_SECONDS);
    db.user.level += gained;
    db.user.readingSeconds %= CYCLE_SECONDS;
    levelUp = true;
  }

  saveDatabase(db);
  return { user: db.user, levelUp };
}

export function toggleBookmark(item: BookmarkItem): { bookmarks: BookmarkItem[]; isBookmarked: boolean } {
  const db = getDatabase();
  const idx = db.bookmarks.findIndex((b) => b.mangaEndpoint === item.mangaEndpoint);
  let isBookmarked = false;

  if (idx >= 0) {
    db.bookmarks.splice(idx, 1);
    isBookmarked = false;
  } else {
    db.bookmarks.unshift({
      ...item,
      addedAt: new Date().toISOString(),
    });
    isBookmarked = true;
  }

  saveDatabase(db);
  return { bookmarks: db.bookmarks, isBookmarked };
}
