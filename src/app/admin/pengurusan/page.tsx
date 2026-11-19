"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function PengurusanKajian() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    Survey_ID: "",
    Title: "",
    Description: "",
    Start_Time: "",
    End_Time: "",
    Is_Active: "TRUE",
  });

  useEffect(() => {
    const session = localStorage.getItem("adminUser");
    if (!session) {
      router.push("/admin");
    } else {
      const user = JSON.parse(session);
      setAdmin(user);
      fetchSurveys(user); // Hantar data user (peranan & id survey)
    }
  }, [router]);

  const fetchSurveys = async (user: any) => {
    try {
      setIsLoading(true);
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(`${gasUrl}?action=getSurveys`, { cache: "no-store" });
      let data = await res.json();
      
      // FILTER: Jika dia bukan Master, tunjuk survey yang dia kena urus saja
      if (user.role !== 'Master') {
        data = data.filter((s: any) => s.Survey_ID === user.assignedSurveyId);
      }
      
      setSurveys(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("adminUser");
    router.push("/admin");
  };

  // Buka Modal Cipta
  const openCreateModal = () => {
    setFormData({
      Survey_ID: `SV${Date.now().toString().slice(-6)}`, // Auto-jana ID unik
      Title: "",
      Description: "",
      Start_Time: new Date().toISOString().split("T")[0],
      End_Time: "",
      Is_Active: "TRUE",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  // Buka Modal Edit
  const openEditModal = (survey: any) => {
    setFormData({
      Survey_ID: survey.Survey_ID,
      Title: survey.Title,
      Description: survey.Description,
      Start_Time: survey.Start_Time.split("T")[0] || survey.Start_Time, 
      End_Time: survey.End_Time.split("T")[0] || survey.End_Time,
      Is_Active: String(survey.Is_Active).toUpperCase(),
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  // Hantar Data (Create / Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const actionType = isEditing ? "updateSurvey" : "createSurvey";
      
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: actionType,
          ...formData
        }),
      });

      const result = await res.json();
      if (result.status === "success") {
        setIsModalOpen(false);
        fetchSurveys(admin); // Muat semula jadual data
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (err) {
      alert("Ralat sistem. Sila cuba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  // Format Tarikh dengan Selamat (Elak Invalid Date)
  const formatSafeDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("ms-MY", { day: "numeric", month: "short", year: "numeric" });
  };

  if (!admin) return <div className="min-h-screen flex items-center justify-center">Memuatkan...</div>;

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row font-sans">
      
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-slate-900 text-white flex flex-col shadow-xl z-10">
        <div className="p-6 text-center border-b border-slate-700">
          <h2 className="text-2xl font-bold tracking-wider text-blue-400">RISA</h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest">Kajian E-Syariah</p>
        </div>
        <nav className="flex-grow p-4 space-y-2 mt-4">
          <Link href="/admin/dashboard" className="block w-full text-left py-3 px-4 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition">
            📊 Utama (Dashboard)
          </Link>
          <Link href="/admin/pengurusan" className="block w-full text-left py-3 px-4 bg-blue-600 rounded-lg font-semibold shadow transition text-white">
            📝 Pengurusan Kajian
          </Link>
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
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Pengurusan Kajian</h1>
            <p className="text-gray-600 mt-2 text-lg">Urus senarai kaji selidik, soalan, dan status paparan.</p>
          </div>
          {admin?.role === 'Master' && (
            <button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition flex items-center">
              <span className="mr-2 text-xl">+</span> Cipta Kajian Baru
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm uppercase tracking-wider">
                  <th className="p-4 font-bold">ID</th>
                  <th className="p-4 font-bold">Tajuk Kajian</th>
                  <th className="p-4 font-bold">Tarikh Tutup</th>
                  <th className="p-4 font-bold">Status</th>
                  <th className="p-4 font-bold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Memuatkan data...</td></tr>
                ) : surveys.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Tiada kajian direkodkan.</td></tr>
                ) : (
                  surveys.map((s, index) => (
                    <tr key={index} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="p-4 text-slate-500 font-medium">{s.Survey_ID}</td>
                      <td className="p-4 font-bold text-slate-800">{s.Title}</td>
                      <td className="p-4 text-slate-600">{formatSafeDate(s.End_Time)}</td>
                      <td className="p-4">
                        <span className={`px-3 py-1 text-xs font-bold rounded-full ${String(s.Is_Active).toUpperCase() === 'TRUE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {String(s.Is_Active).toUpperCase() === 'TRUE' ? 'AKTIF' : 'TAMAT'}
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        {/* Pautan ini akan digunakan di langkah seterusnya (Bina Soalan) */}
                        <Link href={`/admin/pengurusan/${s.Survey_ID}/soalan`} className="inline-block text-blue-600 hover:bg-blue-50 px-3 py-1 rounded font-semibold text-sm transition border border-blue-200">
                          Soalan
                        </Link>
                        <button onClick={() => openEditModal(s)} className="text-amber-600 hover:bg-amber-50 px-3 py-1 rounded font-semibold text-sm transition border border-amber-200">
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL (Pop-up Form) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-lg">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">
                {isEditing ? "Edit Kajian" : "Cipta Kajian Baru"}
              </h2>
              <form onSubmit={handleSubmitForm} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tajuk Kajian</label>
                  <input type="text" required className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.Title} onChange={(e) => setFormData({...formData, Title: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Penerangan</label>
                  <textarea required rows={3} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.Description} onChange={(e) => setFormData({...formData, Description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tarikh Mula</label>
                    <input type="date" required className="w-full border border-gray-300 rounded p-2"
                      value={formData.Start_Time} onChange={(e) => setFormData({...formData, Start_Time: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Tarikh Tutup</label>
                    <input type="date" required className="w-full border border-gray-300 rounded p-2"
                      value={formData.End_Time} onChange={(e) => setFormData({...formData, End_Time: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Status</label>
                  <select className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.Is_Active} onChange={(e) => setFormData({...formData, Is_Active: e.target.value})}>
                    <option value="TRUE">Aktif (Dibuka)</option>
                    <option value="FALSE">Tamat (Ditutup)</option>
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition">
                    Batal
                  </button>
                  <button type="submit" disabled={isSaving} className={`px-4 py-2 text-white rounded font-semibold transition ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSaving ? "Menyimpan..." : "Simpan Kajian"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}