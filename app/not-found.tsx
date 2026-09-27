import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0d12] text-white flex flex-col items-center justify-center p-4 text-center">
      <h2 className="text-2xl font-bold mb-2">Halaman Tidak Ditemukan</h2>
      <p className="text-xs text-[#8c92a2] mb-4">Halaman yang Anda cari tidak tersedia.</p>
      <Link
        href="/"
        className="px-6 py-2.5 rounded-[45px] bg-[#1e2230] text-xs font-semibold hover:bg-[#282d3e] transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
