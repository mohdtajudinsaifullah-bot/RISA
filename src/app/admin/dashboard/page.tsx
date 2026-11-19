"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  
  // State untuk nombor statistik (Live)
  const [totalSurveys, setTotalSurveys] = useState(0);
  const [totalResponses, setTotalResponses] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const session = localStorage.getItem("adminUser");
    if (!session) {
      router.push("/admin");
    } else {
      const user = JSON.parse(session);
      setAdmin(user);
      fetchDashboardStats(user);
    }
  }, [router]);

  const fetchDashboardStats = async (user: any) => {
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      
      // 1. Dapatkan Jumlah Kajian
      const resSurvey = await fetch(`${gasUrl}?action=getSurveys`, { cache: "no-store" });
      let surveys = await resSurvey.json();
      if (user.role !== 'Master') {
        surveys = surveys.filter((s: any) => s.Survey_ID === user.assignedSurveyId);
      }
      setTotalSurveys(surveys.length);

      // 2. Dapatkan Jumlah Responden
      const resResp = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({ 
          action: "getResponsesAdmin", 
          Survey_ID: user.role !== 'Master' ? user.assignedSurveyId : "" 
        })
      });
      const responses = await resResp.json();
      setTotalResponses(responses.length);

    } catch (err) {
      console.error("Gagal menarik data statistik", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/admin");
  };

  if (!admin) return <div className="min-h-screen flex items-center justify-center font-sans text-gray-500">Memuatkan...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Menu Tepi (Sidebar) */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-center border-b border-slate-700">
          <h2 className="text-2xl font-bold tracking-wider text-blue-400">RISA</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Kajian E-Syariah</p>
        </div>
        
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <Link href="/admin/dashboard" className="block py-3 px-4 bg-blue-600 rounded-lg font-semibold shadow transition">
            📊 Utama (Dashboard)
          </Link>
          <Link href="/admin/pengurusan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition">
            📝 Pengurusan Kajian
          </Link>
          <Link href="/admin/laporan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition">
            📈 Laporan & Analisis
          </Link>
          {admin.role === 'Master' && (
            <Link href="/admin/tetapan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition">
              ⚙️ Tetapan Portal
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-slate-700 bg-slate-950">
          <div className="mb-4 text-sm text-slate-400">
            Log masuk sebagai:<br/>
            <span className="font-bold text-white uppercase text-base tracking-wide">{admin.username}</span> 
            <span className="ml-2 inline-block px-2 py-1 bg-slate-800 text-xs rounded-full">{admin.role}</span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-lg"
          >
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Ruangan Kandungan Utama (Main Content) */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-extrabold text-slate-800">Selamat Datang, {admin.username}!</h1>
          <p className="text-gray-600 mt-2 text-lg">Pusat kawalan utama Research Intelligence & Survey Analytics (RISA).</p>
        </header>

        {/* Kad Statistik Live */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-blue-500">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Jumlah Kajian</h3>
            <p className="text-4xl font-extrabold text-slate-800">
              {isLoading ? "..." : totalSurveys}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-green-500">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Jumlah Responden</h3>
            <p className="text-4xl font-extrabold text-slate-800">
              {isLoading ? "..." : totalResponses}
            </p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 border-l-4 border-l-purple-500 flex flex-col justify-center">
            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Status Sistem</h3>
            <div className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-green-500 mr-2 animate-pulse"></span>
              <p className="text-2xl font-bold text-green-600">Beroperasi</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xl font-bold text-slate-800">Sedia Untuk Digunakan</h2>
          </div>
          <div className="text-gray-500 text-sm py-16 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            Sistem RISA ESV3 kini sedia beroperasi sepenuhnya. Segala maklum balas responden akan dipaparkan secara langsung di sini.
          </div>
        </div>
      </main>

    </div>
  );
}