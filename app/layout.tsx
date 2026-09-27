import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'MangaID - Baca Manga Sub Indo',
  description: 'Platform baca manga, manhwa, dan manhua bahasa Indonesia dengan tampilan bersih dan nyaman.',
  openGraph: {
    title: 'MangaID - Baca Manga Sub Indo',
    description: 'Platform baca manga, manhwa, dan manhua bahasa Indonesia dengan tampilan bersih dan nyaman.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MangaID - Baca Manga Sub Indo',
    description: 'Platform baca manga, manhwa, dan manhua bahasa Indonesia dengan tampilan bersih dan nyaman.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="id" className="dark">
      <body className="bg-[#0f1115] text-[#d6d8df] antialiased selection:bg-[#2e3440] selection:text-[#eceff4]" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
