import { NextResponse } from 'next/server';
import { getTrendingManga, getOngoingManga } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [trending, ongoing] = await Promise.all([
      getTrendingManga(),
      getOngoingManga(),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        trending,
        ongoing,
      },
    });
  } catch (error) {
    console.error('Error in /api/manga/home:', error);
    return NextResponse.json(
      { success: false, error: 'Gagal memuat data komik' },
      { status: 500 }
    );
  }
}
