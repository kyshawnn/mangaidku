import { NextRequest, NextResponse } from 'next/server';
import {
  getDatabase,
  saveDatabase,
  syncReadingProgress,
  toggleBookmark,
  addReadingTime,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDatabase();
    return NextResponse.json({
      success: true,
      data: db,
    });
  } catch (error) {
    console.error('Error in GET /api/user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil data pengguna' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'add_reading_time') {
      const seconds = Number(payload?.seconds) || 0;
      if (seconds <= 0) {
        return NextResponse.json(
          { success: false, error: 'Detik harus lebih dari 0' },
          { status: 400 }
        );
      }
      const result = addReadingTime(seconds);
      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === 'sync_progress') {
      const {
        mangaEndpoint,
        mangaTitle,
        mangaThumb,
        chapterEndpoint,
        chapterTitle,
        currentPage,
        totalPages,
      } = payload;

      if (!mangaEndpoint || !chapterEndpoint) {
        return NextResponse.json(
          { success: false, error: 'Data progress tidak lengkap' },
          { status: 400 }
        );
      }

      const updatedHistory = syncReadingProgress({
        mangaEndpoint,
        mangaTitle: mangaTitle || 'Manga',
        mangaThumb: mangaThumb || '',
        chapterEndpoint,
        chapterTitle: chapterTitle || 'Chapter',
        currentPage: Number(currentPage) || 1,
        totalPages: Number(totalPages) || 1,
        updatedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: updatedHistory,
      });
    }

    if (action === 'toggle_bookmark') {
      const { mangaEndpoint, mangaTitle, mangaThumb, type } = payload;
      if (!mangaEndpoint) {
        return NextResponse.json(
          { success: false, error: 'Endpoint diperlukan' },
          { status: 400 }
        );
      }

      const result = toggleBookmark({
        mangaEndpoint,
        mangaTitle,
        mangaThumb,
        type,
        addedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        data: result,
      });
    }

    if (action === 'clear_history') {
      const db = getDatabase();
      db.history = [];
      saveDatabase(db);
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    if (action === 'update_profile') {
      const db = getDatabase();
      db.user = {
        ...db.user,
        ...payload,
      };
      saveDatabase(db);
      return NextResponse.json({
        success: true,
        data: db.user,
      });
    }

    if (action === 'update_avatar') {
      const db = getDatabase();
      db.user.avatarUrl = payload?.avatarUrl || '';
      saveDatabase(db);
      return NextResponse.json({
        success: true,
        data: db.user,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Action tidak dikenali' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in POST /api/user:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memperbarui data pengguna' },
      { status: 500 }
    );
  }
}
