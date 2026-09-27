import { NextRequest, NextResponse } from 'next/server';
import { getMangaByGenre } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const genre = searchParams.get('genre') || 'action';

    const items = await getMangaByGenre(genre);
    return NextResponse.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error in /api/manga/genre:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal mengambil komik berdasarkan genre' },
      { status: 500 }
    );
  }
}
