"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

export default function PengurusanSoalan() {
  const router = useRouter();
  const params = useParams();
  const surveyId = params.id as string;

  const [admin, setAdmin] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState<any>({
    Question_ID: "",
    Survey_ID: surveyId,
    Section_Name: "Bahagian A",
    Order_No: "1",
    Question_Type: "radio",
    Question_Text: "",
    Options: "",
    Has_Other_Option: "FALSE",
  });

  useEffect(() => {
    const session = localStorage.getItem("adminUser");
    if (!session) {
      router.push("/admin");
    } else {
      setAdmin(JSON.parse(session));
      fetchQuestions();
    }
  }, [router, surveyId]);

  const fetchQuestions = async () => {
    try {
      setIsLoading(true);
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({ action: "getQuestionsAdmin", Survey_ID: surveyId })
      });
      const data = await res.json();
      
      // Susun soalan mengikut Order_No
      const sorted = data.sort((a: any, b: any) => Number(a.Order_No) - Number(b.Order_No));
      setQuestions(sorted);
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

  const openCreateModal = () => {
    setFormData({
      Question_ID: `Q${Date.now().toString().slice(-6)}`,
      Survey_ID: surveyId,
      Section_Name: "Bahagian A",
      Order_No: String(questions.length + 1), // Automatik nombor seterusnya
      Question_Type: "radio",
      Question_Text: "",
      Options: "",
      Has_Other_Option: "FALSE",
    });
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openEditModal = (q: any) => {
    setFormData({
      Question_ID: q.Question_ID,
      Survey_ID: surveyId,
      Section_Name: q.Section_Name,
      Order_No: q.Order_No,
      Question_Type: q.Question_Type,
      Question_Text: q.Question_Text,
      Options: q.Options,
      Has_Other_Option: String(q.Has_Other_Option).toUpperCase(),
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: isEditing ? "updateQuestion" : "createQuestion",
          ...formData
        }),
      });
      const result = await res.json();
      if (result.status === "success") {
        setIsModalOpen(false);
        fetchQuestions();
      }
    } catch (err) {
      alert("Ralat menyimpan data soalan.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (questionId: string) => {
    const confirmDelete = window.confirm("Adakah anda pasti mahu memadam soalan ini?");
    if (!confirmDelete) return;

    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: "deleteQuestion",
          Question_ID: questionId
        }),
      });
      const result = await res.json();
      if (result.status === "success") fetchQuestions();
    } catch (err) {
      alert("Gagal memadam soalan.");
    }
  };

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
          <Link href="/admin/pengurusan" className="block w-full text-left py-3 px-4 bg-blue-600 rounded-lg font-semibold shadow transition text-white">📝 Pengurusan Kajian</Link>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-grow p-6 md:p-10 overflow-y-auto relative">
        <div className="mb-4">
          <Link href="/admin/pengurusan" className="text-blue-600 hover:underline text-sm font-semibold">
            &larr; Kembali ke Senarai Kajian
          </Link>
        </div>
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Senarai Soalan</h1>
            <p className="text-gray-600 mt-1 text-sm font-bold bg-yellow-100 inline-block px-3 py-1 rounded">ID Kajian: {surveyId}</p>
          </div>
          <button onClick={openCreateModal} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-6 rounded-lg shadow transition">
            + Tambah Soalan
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold text-center w-16">No.</th>
                  <th className="p-4 font-bold">Bahagian</th>
                  <th className="p-4 font-bold">Soalan</th>
                  <th className="p-4 font-bold">Jenis</th>
                  <th className="p-4 font-bold text-right">Tindakan</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Memuatkan soalan...</td></tr>
                ) : questions.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-gray-500">Tiada soalan dicipta. Klik 'Tambah Soalan' untuk bermula.</td></tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q.Question_ID} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4 text-center font-bold text-slate-700">{q.Order_No}</td>
                      <td className="p-4 text-sm text-slate-600 font-semibold">{q.Section_Name}</td>
                      <td className="p-4 text-sm text-slate-800 font-medium">{q.Question_Text}</td>
                      <td className="p-4 text-xs font-bold text-slate-500 uppercase">{q.Question_Type}</td>
                      <td className="p-4 text-right space-x-2">
                        <button onClick={() => openEditModal(q)} className="text-amber-600 hover:bg-amber-50 px-3 py-1 rounded font-semibold text-xs border border-amber-200 transition">Edit</button>
                        <button onClick={() => handleDelete(q.Question_ID)} className="text-red-600 hover:bg-red-50 px-3 py-1 rounded font-semibold text-xs border border-red-200 transition">Padam</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL (Pop-up Form Soalan) */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-slate-800">{isEditing ? "Edit Soalan" : "Tambah Soalan"}</h2>
              <form onSubmit={handleSubmitForm} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Bahagian (Section)</label>
                    <input type="text" required placeholder="Contoh: Bahagian A: Demografi" className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.Section_Name} onChange={(e) => setFormData({...formData, Section_Name: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">No. Susunan (Order)</label>
                    <input type="number" required className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.Order_No} onChange={(e) => setFormData({...formData, Order_No: e.target.value})} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Soalan (Teks)</label>
                  <textarea required rows={2} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                    value={formData.Question_Text} onChange={(e) => setFormData({...formData, Question_Text: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Jenis Jawapan</label>
                    <select className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.Question_Type} onChange={(e) => setFormData({...formData, Question_Type: e.target.value})}>
                      <option value="text">Teks Pendek (Text)</option>
                      <option value="radio">Pilihan Tunggal (Radio)</option>
                      <option value="checkbox">Pelbagai Pilihan (Checkbox)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Ada Pilihan 'Lain-lain'?</label>
                    <select className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500" disabled={formData.Question_Type === 'text'}
                      value={formData.Has_Other_Option} onChange={(e) => setFormData({...formData, Has_Other_Option: e.target.value})}>
                      <option value="FALSE">Tiada</option>
                      <option value="TRUE">Ya, Ada</option>
                    </select>
                  </div>
                </div>

                {(formData.Question_Type === "radio" || formData.Question_Type === "checkbox") && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <label className="block text-sm font-bold text-gray-700 mb-1">Pilihan Jawapan</label>
                    <p className="text-xs text-gray-500 mb-2">Pisahkan setiap pilihan dengan koma ( , ). Contoh: Lelaki, Perempuan, Tidak Pasti</p>
                    <textarea required={formData.Question_Type !== 'text'} rows={3} className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-blue-500"
                      value={formData.Options} onChange={(e) => setFormData({...formData, Options: e.target.value})} />
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-semibold transition">Batal</button>
                  <button type="submit" disabled={isSaving} className={`px-4 py-2 text-white rounded font-semibold transition ${isSaving ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                    {isSaving ? "Menyimpan..." : "Simpan Soalan"}
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