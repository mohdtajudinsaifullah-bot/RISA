"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function TetapanPortal() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [settings, setSettings] = useState({
    Header_Title: "",
    Top_Scroller: "",
    Hero_Title: "",
    Hero_Description: ""
  });

  useEffect(() => {
    const session = localStorage.getItem("adminUser");
    if (!session) {
      router.push("/admin");
    } else {
      const user = JSON.parse(session);
      // Tendang ke dashboard jika peranan BUKAN Master
      if (user.role !== 'Master') {
        router.push("/admin/dashboard");
      } else {
        setAdmin(user);
        fetchSettings();
      }
    }
  }, [router]);

  const fetchSettings = async () => {
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(`${gasUrl}?action=getSettings`);
      const data = await res.json();
      
      let tempSettings: any = {};
      data.forEach((item: any) => {
        tempSettings[item.Key] = item.Value;
      });
      
      setSettings(tempSettings);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: "updateSettings",
          settings: settings
        })
      });
      const result = await res.json();
      if (result.status === "success") {
        alert("Tetapan berjaya dikemas kini! Pergi ke laman utama untuk lihat perubahan.");
      }
    } catch (err) {
      alert("Gagal mengemas kini tetapan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/admin");
  };

  if (!admin) return <div className="min-h-screen flex items-center justify-center">Memuatkan...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10 hidden md:flex">
        <div className="p-6 text-center border-b border-slate-700">
          <h2 className="text-2xl font-bold tracking-wider text-blue-400">RISA</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Kajian E-Syariah</p>
        </div>
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <Link href="/admin/dashboard" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 transition">📊 Utama</Link>
          <Link href="/admin/pengurusan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 transition">📝 Pengurusan Kajian</Link>
          <Link href="/admin/laporan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 transition">📈 Laporan & Analisis</Link>
          <Link href="/admin/tetapan" className="block w-full text-left py-3 px-4 bg-blue-600 rounded-lg font-semibold shadow transition text-white">⚙️ Tetapan Portal</Link>
        </nav>
      </aside>

      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Tetapan Portal</h1>
          <p className="text-gray-600 mt-2 text-lg">Kemas kini teks, pengumuman dan maklumat di laman utama awam.</p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-3xl">
          {isLoading ? (
            <p className="text-gray-500">Memuatkan tetapan...</p>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Teks Scroller Pengumuman (Atas)</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  value={settings.Top_Scroller || ""} onChange={(e) => setSettings({...settings, Top_Scroller: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Nama Sistem (Penjuru Kiri Atas)</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  value={settings.Header_Title || ""} onChange={(e) => setSettings({...settings, Header_Title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Tajuk Utama (Hero Title)</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                  value={settings.Hero_Title || ""} onChange={(e) => setSettings({...settings, Hero_Title: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Penerangan Utama (Hero Description)</label>
                <textarea rows={4} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500"
                  value={settings.Hero_Description || ""} onChange={(e) => setSettings({...settings, Hero_Description: e.target.value})} />
              </div>

              <div className="pt-4 border-t border-gray-200 text-right">
                <button type="submit" disabled={isSaving} className={`px-8 py-3 text-white rounded-lg font-bold shadow-lg transition ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {isSaving ? "Menyimpan..." : "Kemaskini Tetapan"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}