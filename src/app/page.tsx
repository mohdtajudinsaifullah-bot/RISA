import Link from "next/link";

export const revalidate = 0; // Pastikan sentiasa ambil data terkini (no-cache)

async function getSiteSettings() {
  try {
    const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
    if (!gasUrl) throw new Error("Pautan API tidak ditemui.");

    const res = await fetch(`${gasUrl}?action=getSettings`, { cache: 'no-store' });
    if (!res.ok) throw new Error("Gagal menyambung.");

    const data = await res.json();
    if (data.error) throw new Error(data.error);

    // Formatkan array ke dalam objek
    const settings: Record<string, string> = {};
    data.forEach((item: any) => {
      settings[item.Key] = item.Value;
    });

    return settings;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export default async function Home() {
  const settings = await getSiteSettings();

  // Tetapan lalai jika gagal ditarik dari Sheet
  const topScroller = settings?.Top_Scroller || "Kajian Penggunaan Modul Bailif kini dibuka. Sertai sekarang!";
  const heroTitle = settings?.Hero_Title || "Kajian Kepuasan Pengguna";
  const heroDescription = settings?.Hero_Description || "Maklum balas anda amat penting bagi membantu kami mempertingkatkan sistem dan infrastruktur E-Syariah (ESV3) ke tahap yang lebih cemerlang.";
  const headerTitle = settings?.Header_Title || "E-Syariah Kajian";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wider">{headerTitle}</h1>
          <Link href="/admin" className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-sm font-semibold transition">
            Log Masuk Admin
          </Link>
        </div>
      </header>

      {/* Bahagian Scroller (Pengumuman) */}
      {/* Bahagian Scroller (Pengumuman) */}
      <div className="bg-blue-100 text-blue-800 border-b border-blue-200 flex items-center w-full overflow-hidden">
        {/* Ikon Speaker Tetap di Kiri dengan Animasi Berbunyi */}
        <div className="bg-blue-200 px-4 py-2 flex items-center justify-center z-10 shadow-sm shrink-0">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-blue-400 opacity-75"></span>
            <span className="relative text-lg animate-pulse">📢</span>
          </div>
        </div>

        {/* Teks Pengumuman Sahaja yang Bergerak */}
        <div
          className="w-full py-2 overflow-hidden"
          dangerouslySetInnerHTML={{
            __html: `<marquee scrollamount="10" class="font-medium text-sm md:text-base w-full block">${topScroller}</marquee>`,
          }}
        />
      </div>

      <main className="flex-grow flex flex-col items-center justify-center text-center p-6 mt-10">
        <h2 className="text-4xl md:text-5xl font-extrabold text-slate-800 mb-6 drop-shadow-sm">
          {heroTitle}
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mb-10 leading-relaxed">
          {heroDescription}
        </p>

        <Link 
          href="/senarai-kajian" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-lg shadow-lg text-lg transition transform hover:scale-105"
        >
          SERTAI KAJIAN
        </Link>
      </main>

      <footer className="bg-slate-900 text-gray-400 text-center py-4 mt-auto">
        <p className="text-sm">© {new Date().getFullYear()} UTES. Hak Cipta Terpelihara.</p>
      </footer>
    </div>
  );
}