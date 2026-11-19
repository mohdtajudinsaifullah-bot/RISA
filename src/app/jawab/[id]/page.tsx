"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function JawabKajian() {
  const params = useParams();
  const router = useRouter();
  const surveyId = params.id as string; // Ambil ID dari URL

  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState(false);

  // State untuk simpan jawapan pengguna
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherInputs, setOtherInputs] = useState<Record<string, string>>({});

  // 1. Tarik soalan dari Google Sheets bila laman dibuka
  useEffect(() => {
    async function fetchData() {
      try {
        const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
        if (!gasUrl) throw new Error("Tiada URL API.");

        const res = await fetch(`${gasUrl}?action=getAllData`);
        if (!res.ok) throw new Error("Gagal menyambung ke pelayan.");

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const currentSurvey = data.surveys.find((s: any) => s.Survey_ID === surveyId);
        if (!currentSurvey) throw new Error("Kajian tidak wujud.");

        const surveyQuestions = data.questions
          .filter((q: any) => q.Survey_ID === surveyId)
          .sort((a: any, b: any) => a.Order_No - b.Order_No);

        setSurvey(currentSurvey);
        setQuestions(surveyQuestions);
      } catch (err: any) {
        setErrorMsg(err.message || "Ralat memuatkan data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [surveyId]);

  // 2. Fungsi kemas kini jawapan masa pengguna menaip/memilih
  const handleOptionChange = (questionId: string, value: string, isCheckbox: boolean = false) => {
    if (isCheckbox) {
      const currentAns = answers[questionId] || [];
      if (currentAns.includes(value)) {
        setAnswers({ ...answers, [questionId]: currentAns.filter((v: string) => v !== value) });
      } else {
        setAnswers({ ...answers, [questionId]: [...currentAns, value] });
      }
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  // 3. Fungsi hantar (Submit) ke Google Sheets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const responseId = `RES-${Date.now()}`; 

      // Format jawapan dalam satu objek untuk satu baris (horizontal)
      let formattedAnswers: Record<string, string> = {};

      questions.forEach((q) => {
        let finalAnswer = answers[q.Question_ID] || "";
        
        // Urus jika ada jawapan "Lain-lain"
        if (Array.isArray(finalAnswer)) {
          if (finalAnswer.includes("Lain-lain") && otherInputs[q.Question_ID]) {
            finalAnswer = finalAnswer.filter((v) => v !== "Lain-lain").join(", ") + ", Lain-lain: " + otherInputs[q.Question_ID];
          } else {
            finalAnswer = finalAnswer.join(", ");
          }
        } else if (finalAnswer === "Lain-lain" && otherInputs[q.Question_ID]) {
          finalAnswer = "Lain-lain: " + otherInputs[q.Question_ID];
        }

        formattedAnswers[q.Question_ID] = finalAnswer;
      });

      // Tembak bungkusan data POST ke GAS
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: "submitResponse",
          Response_ID: responseId,
          Survey_ID: surveyId,
          answers: formattedAnswers // Hantar sebagai satu set jawapan
        }),
      });

      const result = await res.json();
      if (result.status === "success") {
        setSuccessMsg(true);
      } else {
        throw new Error(result.message || "Gagal menghantar jawapan.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terdapat ralat semasa menghantar borang.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <div className="text-center py-20 text-gray-600 font-bold">Memuatkan borang soalan...</div>;
  if (errorMsg && !survey) return <div className="text-center py-20 text-red-600 font-bold">Ralat: {errorMsg}</div>;
  
  // Asingkan soalan mengikut Bahagian (Section_Name)
  const sections = Array.from(new Set(questions.map((q) => q.Section_Name)));

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">Research Intelligence & Survey Analytics (RISA)</h1>
          <Link href="/senarai-kajian" className="text-sm text-gray-300 hover:text-white transition">
            &larr; Batal & Kembali
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto p-4 md:p-8 w-full">
        {successMsg ? (
          <div className="bg-white p-10 rounded-xl shadow-md text-center border-t-4 border-green-500">
            <h2 className="text-3xl font-bold text-green-600 mb-4">Terima Kasih!</h2>
            <p className="text-gray-700 text-lg mb-8">Maklum balas anda telah berjaya direkodkan dalam pangkalan data kami.</p>
            <Link href="/senarai-kajian" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg transition">
              Selesai
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-8 border-t-4 border-blue-600">
              <h2 className="text-3xl font-bold text-slate-800 mb-2">{survey.Title}</h2>
              <p className="text-gray-600">{survey.Description}</p>
            </div>

            {errorMsg && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                <strong>Ralat: </strong> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
              {sections.map((sectionName, idx) => (
                <div key={idx} className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-xl font-extrabold text-slate-800 mb-6 border-b-2 border-slate-100 pb-2">
                    {sectionName}
                  </h3>
                  
                  <div className="space-y-6">
                    {questions.filter((q) => q.Section_Name === sectionName).map((q) => {
                      // Semak jika soalan ada pilihan 'Lain-lain'
                      const optionsArray = q.Options ? String(q.Options).split(",").map((o) => o.trim()) : [];
                      if (String(q.Has_Other_Option).toUpperCase() === "TRUE" && !optionsArray.includes("Lain-lain")) {
                        optionsArray.push("Lain-lain");
                      }
                      
                      const isOtherSelected = q.Question_Type === "checkbox" 
                        ? (answers[q.Question_ID] || []).includes("Lain-lain")
                        : answers[q.Question_ID] === "Lain-lain";

                      return (
                        <div key={q.Question_ID} className="p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <label className="block text-gray-800 font-semibold mb-3">
                            {q.Order_No}. {q.Question_Text}
                          </label>

                          {/* 1. TEXT INPUT */}
                          {q.Question_Type.toLowerCase() === "text" && (
                            <input
                              type="text"
                              required
                              className="w-full border border-gray-300 rounded p-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              onChange={(e) => handleOptionChange(q.Question_ID, e.target.value)}
                            />
                          )}

                          {/* 2. RADIO BUTTON (Pilihan Tunggal) */}
                          {q.Question_Type.toLowerCase() === "radio" && (
                            <div className="space-y-2 mt-2">
                              {optionsArray.map((opt, i) => (
                                <label key={i} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="radio"
                                    name={q.Question_ID}
                                    value={opt}
                                    required
                                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                                    onChange={(e) => handleOptionChange(q.Question_ID, e.target.value)}
                                  />
                                  <span className="text-gray-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* 3. CHECKBOX (Pelbagai Pilihan) */}
                          {q.Question_Type.toLowerCase() === "checkbox" && (
                            <div className="space-y-2 mt-2">
                              {optionsArray.map((opt, i) => (
                                <label key={i} className="flex items-center space-x-3 cursor-pointer">
                                  <input
                                    type="checkbox"
                                    value={opt}
                                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                    onChange={(e) => handleOptionChange(q.Question_ID, e.target.value, true)}
                                  />
                                  <span className="text-gray-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          )}

                          {/* KOTAK TEKS LAIN-LAIN (Muncul jika Lain-lain dipilih) */}
                          {isOtherSelected && (
                            <div className="mt-3 ml-7">
                              <input
                                type="text"
                                placeholder="Sila nyatakan..."
                                required
                                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                onChange={(e) => setOtherInputs({ ...otherInputs, [q.Question_ID]: e.target.value })}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`py-3 px-10 rounded-lg text-white font-bold text-lg shadow-lg transition ${
                    isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? "Menghantar..." : "Hantar Jawapan"}
                </button>
              </div>
            </form>
          </>
        )}
      </main>
    </div>
  );
}