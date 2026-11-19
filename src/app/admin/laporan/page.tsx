"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LaporanAnalisis() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Semak sesi login
  useEffect(() => {
    const session = localStorage.getItem("adminUser");
    if (!session) {
      router.push("/admin");
    } else {
      const user = JSON.parse(session);
      setAdmin(user);
      fetchSurveys(user); // Hantar data user ke fungsi bawah
    }
  }, [router]);

  // Tarik senarai kajian untuk dropdown filter
  const fetchSurveys = async (user: any) => {
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(`${gasUrl}?action=getSurveys`, { cache: "no-store" });
      let data = await res.json();
      
      // FILTER: Jika bukan Master, tunjuk survey yang dia urus sahaja
      if (user.role !== 'Master') {
        data = data.filter((s: any) => s.Survey_ID === user.assignedSurveyId);
      }
      
      setSurveys(data);
      
      // Pilih kajian pertama secara default dalam dropdown
      if (data.length > 0) {
        setSelectedSurvey(data[0].Survey_ID);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error("Gagal tarik senarai kajian", err);
      setIsLoading(false);
    }
  };

  // Tarik jawapan berdasarkan Survey_ID yang dipilih
  useEffect(() => {
    if (!selectedSurvey) return;
    const fetchResponses = async () => {
      try {
        setIsLoading(true);
        const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
        const res = await fetch(gasUrl!, {
          method: "POST",
          body: JSON.stringify({ action: "getResponsesAdmin", Survey_ID: selectedSurvey })
        });
        const data = await res.json();
        setResponses(data);
      } catch (err) {
        console.error("Gagal tarik jawapan", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchResponses();
  }, [selectedSurvey]);

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/admin");
  };

  // Ambil tajuk lajur (ID soalan) berdasarkan jawapan pertama
  const questionHeaders = responses.length > 0 
    ? Object.keys(responses[0]).filter(key => key.startsWith("Q")) // Hanya ambil lajur yang mula dengan 'Q'
    : [];

  if (!admin) return <div className="min-h-screen flex items-center justify-center">Memuatkan...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10 hidden md:flex">
        <div className="p-6 text-center border-b border-slate-700">
          <h2 className="text-2xl font-bold tracking-wider text-blue-400">RISA</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Kajian E-Syariah</p>
        </div>
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <Link href="/admin/dashboard" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 transition">📊 Utama</Link>
          <Link href="/admin/pengurusan" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 transition">📝 Pengurusan Kajian</Link>
          <Link href="/admin/laporan" className="block w-full text-left py-3 px-4 bg-blue-600 rounded-lg font-semibold shadow transition text-white">📈 Laporan & Analisis</Link>
        </nav>
        <div className="p-6 border-t border-slate-700 bg-slate-950">
          <div className="mb-4 text-sm text-slate-400">
            Log masuk sebagai:<br/>
            <span className="font-bold text-white uppercase text-base tracking-wide">{admin.username}</span> 
          </div>
          <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-lg transition shadow-lg">
            Log Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto relative">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Laporan & Analisis</h1>
            <p className="text-gray-600 mt-2 text-lg">Semak dan pantau maklum balas responden.</p>
          </div>
          
          {/* Dropdown Filter Kajian */}
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-full md:w-auto">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1">Pilih Kajian:</label>
            <select 
              className="w-full md:w-72 bg-transparent font-semibold text-slate-800 focus:outline-none"
              value={selectedSurvey}
              onChange={(e) => setSelectedSurvey(e.target.value)}
            >
              {surveys.map(s => (
                <option key={s.Survey_ID} value={s.Survey_ID}>{s.Survey_ID} - {s.Title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Tarikh/Masa</th>
                  <th className="p-4 font-bold">ID Respon</th>
                  {questionHeaders.map(qh => (
                     <th key={qh} className="p-4 font-bold text-blue-600">{qh}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500">Menarik data jawapan...</td></tr>
                ) : responses.length === 0 ? (
                  <tr><td colSpan={10} className="p-8 text-center text-gray-500">Tiada responden direkodkan untuk kajian ini.</td></tr>
                ) : (
                  responses.map((r, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-sm text-slate-600 font-medium">{r.Timestamp}</td>
                      <td className="p-4 text-xs font-bold text-slate-400">{r.Response_ID}</td>
                      {questionHeaders.map(qh => (
                         <td key={qh} className="p-4 text-sm text-slate-800">{r[qh] || "-"}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

    </div>
  );
}