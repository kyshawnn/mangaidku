import * as cheerio from 'cheerio';
import {
  MangaItem,
  ChapterItem,
  MangaDetail,
  ChapterDetail,
} from './types';

export type {
  MangaItem,
  ChapterItem,
  MangaDetail,
  ChapterDetail,
};

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function cleanEndpoint(raw: string | undefined): string {
  if (!raw) return '';
  let ep = raw.trim();
  ep = ep.replace(/^https?:\/\/[^/]+/i, '');
  ep = ep.replace(/^\/manga\//i, '');
  ep = ep.replace(/^\//, '');
  ep = ep.replace(/\/$/, '');
  return ep;
}

function cleanImage(url: string | undefined): string {
  if (!url) return '';
  let u = url.trim();
  if (u.startsWith('//')) {
    u = 'https:' + u;
  }
  u = u.replace(/&#038;/g, '&');
  u = u.replace(/\?resize=\d+,\d+/i, '');
  u = u.replace(/&quality=\d+/i, '');
  u = u.replace(/\?quality=\d+/i, '');
  u = u.replace(/\?w=\d+/i, '');
  return u;
}

export async function fetchWithHeaders(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      'Accept':
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
      'Accept-Language': 'id,en-US;q=0.9,en;q=0.8',
    },
    next: { revalidate: 300 }, // Cache for 5 mins
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}, status: ${res.status}`);
  }
  return await res.text();
}

export async function getTrendingManga(): Promise<MangaItem[]> {
  try {
    const html = await fetchWithHeaders('https://komiku.org/p/ranking/');
    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $('.ls4').each((_, el) => {
      const titleLink = $(el).find('.ls4j h4 a');
      const title = titleLink.text().trim();
      const rawHref = titleLink.attr('href');
      const endpoint = cleanEndpoint(rawHref);

      const imgEl = $(el).find('img');
      const rawImg = imgEl.attr('data-src') || imgEl.attr('src');
      const thumb = cleanImage(rawImg);

      const genreOrRating = $(el).find('.ls4s').text().trim();
      const chEl = $(el).find('.ls24');
      const latestChapter = chEl.text().trim() || 'Chapter Terbaru';
      const latestChapterEndpoint = cleanEndpoint(chEl.attr('href'));

      let type = 'Manga';
      if (thumb.toLowerCase().includes('manhwa') || title.toLowerCase().includes('manhwa')) {
        type = 'Manhwa';
      } else if (thumb.toLowerCase().includes('manhua') || title.toLowerCase().includes('manhua')) {
        type = 'Manhua';
      }

      if (title && endpoint) {
        items.push({
          title,
          endpoint,
          thumb,
          type,
          latestChapter,
          latestChapterEndpoint,
          genreOrRating,
        });
      }
    });

    return items;
  } catch (err) {
    console.error('Error fetching trending manga:', err);
    return [];
  }
}

export async function getOngoingManga(): Promise<MangaItem[]> {
  try {
    const html = await fetchWithHeaders('https://api.komiku.org/manga/');
    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $('.bge').each((_, el) => {
      const kan = $(el).find('.kan');
      const bgei = $(el).find('.bgei');

      const title = kan.find('h3').text().trim();
      const rawHref = kan.find('a').attr('href');
      const endpoint = cleanEndpoint(rawHref);

      const imgEl = bgei.find('img');
      const rawImg = imgEl.attr('src') || imgEl.attr('data-src');
      const thumb = cleanImage(rawImg);

      const type = bgei.find('.tpe1_inf b').text().trim() || 'Manga';
      const genre = kan.find('.judul2').text().trim();
      const desc = kan.find('p').text().trim();

      const lastNew1 = kan.find('.new1').last();
      const latestChapter = lastNew1.find('a span').last().text().trim() || 'Chapter Terbaru';
      const latestChapterEndpoint = cleanEndpoint(lastNew1.find('a').attr('href'));

      if (title && endpoint) {
        items.push({
          title,
          endpoint,
          thumb,
          type,
          latestChapter,
          latestChapterEndpoint,
          genreOrRating: genre,
          description: desc,
        });
      }
    });

    return items;
  } catch (err) {
    console.error('Error fetching ongoing manga:', err);
    return [];
  }
}

export async function searchManga(query: string): Promise<MangaItem[]> {
  try {
    const encoded = encodeURIComponent(query.trim());
    const html = await fetchWithHeaders(`https://api.komiku.org/?post_type=manga&s=${encoded}`);
    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $('.bge').each((_, el) => {
      const kan = $(el).find('.kan');
      const bgei = $(el).find('.bgei');

      const title = kan.find('h3').text().trim();
      const rawHref = kan.find('a').attr('href');
      const endpoint = cleanEndpoint(rawHref);

      const imgEl = bgei.find('img');
      const rawImg = imgEl.attr('src') || imgEl.attr('data-src');
      const thumb = cleanImage(rawImg);

      const type = bgei.find('.tpe1_inf b').text().trim() || 'Manga';
      const desc = kan.find('p').text().trim();

      const lastNew1 = kan.find('.new1').last();
      const latestChapter = lastNew1.find('a span').last().text().trim() || 'Chapter Terbaru';
      const latestChapterEndpoint = cleanEndpoint(lastNew1.find('a').attr('href'));

      if (title && endpoint) {
        items.push({
          title,
          endpoint,
          thumb,
          type,
          latestChapter,
          latestChapterEndpoint,
          description: desc,
        });
      }
    });

    return items;
  } catch (err) {
    console.error('Error searching manga:', err);
    return [];
  }
}

export async function getMangaDetail(endpoint: string): Promise<MangaDetail | null> {
  try {
    const cleanEp = cleanEndpoint(endpoint);
    const url = `https://komiku.org/manga/${cleanEp}/`;
    const html = await fetchWithHeaders(url);
    const $ = cheerio.load(html);

    const title =
      $('header h1 [itemprop="name"]').text().trim() ||
      $('header h1').text().replace(/^Komik\s*/i, '').trim();

    const imgEl = $('.ims img');
    const rawImg = imgEl.attr('src') || imgEl.attr('data-src');
    const thumb = cleanImage(rawImg);

    let synopsis = $('#Sinopsis p').text().trim();
    if (!synopsis) {
      synopsis = $('.desc').text().trim() || $('.sin').text().trim();
    }

    let type = 'Manga';
    let status = 'Berjalan';
    let author = '-';

    $('table.inftable tr').each((_, el) => {
      const rowText = $(el).text();
      if (rowText.includes('Jenis') || rowText.includes('Tipe')) {
        type = $(el).find('td').last().text().trim();
      }
      if (rowText.includes('Status')) {
        status = $(el).find('td').last().text().trim();
      }
      if (rowText.includes('Pengarang') || rowText.includes('Author')) {
        author = $(el).find('td').last().text().trim();
      }
    });

    const genres: string[] = [];
    $('.genre li a').each((_, el) => {
      const g = $(el).text().trim();
      if (g && !genres.includes(g)) {
        genres.push(g);
      }
    });

    const chapters: ChapterItem[] = [];
    $('#Daftar_Chapter tr').each((_, el) => {
      const a = $(el).find('a');
      if (a.length > 0) {
        const chTitle = a.text().trim();
        const chHref = cleanEndpoint(a.attr('href'));
        const releaseDate = $(el).find('.tanggalseries').text().trim();
        if (chTitle && chHref) {
          chapters.push({
            title: chTitle,
            endpoint: chHref,
            releaseDate,
          });
        }
      }
    });

    return {
      title,
      endpoint: cleanEp,
      thumb,
      synopsis: synopsis || 'Belum ada sinopsis untuk komik ini.',
      type,
      status,
      author,
      genres,
      totalChapters: chapters.length,
      chapters,
    };
  } catch (err) {
    console.error(`Error getting manga detail for ${endpoint}:`, err);
    return null;
  }
}

export async function getChapterDetail(endpoint: string): Promise<ChapterDetail | null> {
  try {
    const cleanEp = cleanEndpoint(endpoint);
    const url = `https://komiku.org/${cleanEp}/`;
    const html = await fetchWithHeaders(url);
    const $ = cheerio.load(html);

    const fullTitle = $('h1.title').text().trim() || $('header h1').text().trim();
    const chapterTitle =
      $('h1 span.title-chapter').text().trim() ||
      fullTitle ||
      cleanEp.split('-').join(' ');

    const mangaLink = $('.nxpr a[href*="/manga/"]').attr('href') || $('a.btn[aria-label="List"]').attr('href');
    const mangaEndpoint = cleanEndpoint(mangaLink);
    const mangaTitle = $('.nxpr a[href*="/manga/"]').attr('title') || $('a.btn[aria-label="List"]').attr('title') || 'Manga';

    const images: string[] = [];
    $('#Baca_Komik img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (
        src &&
        !src.includes('promosi') &&
        !src.includes('iklan') &&
        !src.includes('komiku-promosi')
      ) {
        const clean = cleanImage(src);
        if (clean && !images.includes(clean)) {
          images.push(clean);
        }
      }
    });

    const prevHref = $('.nxpr a.rl').attr('href') || $('a.btn[aria-label="Prev"]').attr('href');
    const nextHref = $('.nxpr a.rr').attr('href') || $('a.btn[aria-label="Next"]').attr('href');

    return {
      title: fullTitle,
      chapterTitle,
      chapterEndpoint: cleanEp,
      mangaEndpoint,
      mangaTitle,
      prevChapterEndpoint: prevHref ? cleanEndpoint(prevHref) : null,
      nextChapterEndpoint: nextHref ? cleanEndpoint(nextHref) : null,
      images,
      totalPages: images.length,
    };
  } catch (err) {
    console.error(`Error getting chapter detail for ${endpoint}:`, err);
    return null;
  }
}

export async function getMangaByGenre(genre: string): Promise<MangaItem[]> {
  try {
    const encoded = encodeURIComponent(genre.toLowerCase().trim());
    const html = await fetchWithHeaders(`https://api.komiku.org/manga/?genre=${encoded}`);
    const $ = cheerio.load(html);
    const items: MangaItem[] = [];

    $('.bge').each((_, el) => {
      const kan = $(el).find('.kan');
      const bgei = $(el).find('.bgei');

      const title = kan.find('h3').text().trim();
      const rawHref = kan.find('a').attr('href');
      const endpoint = cleanEndpoint(rawHref);

      const imgEl = bgei.find('img');
      const rawImg = imgEl.attr('src') || imgEl.attr('data-src');
      const thumb = cleanImage(rawImg);

      const type = bgei.find('.tpe1_inf b').text().trim() || 'Manga';
      const desc = kan.find('p').text().trim();

      const lastNew1 = kan.find('.new1').last();
      const latestChapter = lastNew1.find('a span').last().text().trim() || 'Chapter Terbaru';
      const latestChapterEndpoint = cleanEndpoint(lastNew1.find('a').attr('href'));

      if (title && endpoint) {
        items.push({
          title,
          endpoint,
          thumb,
          type,
          latestChapter,
          latestChapterEndpoint,
          description: desc,
        });
      }
    });

    return items;
  } catch (err) {
    console.error(`Error fetching manga by genre ${genre}:`, err);
    return [];
  }
}
