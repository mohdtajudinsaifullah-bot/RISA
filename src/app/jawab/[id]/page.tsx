"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function JawabKajian() {
  const params = useParams();
  const surveyId = params.id as string;

  const [survey, setSurvey] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [otherTexts, setOtherTexts] = useState<Record<string, string>>({});

  // State untuk Multi-step & Amaran
  const [currentStep, setCurrentStep] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;

        // 1. Tarik maklumat kajian
        const resSurvey = await fetch(`${gasUrl}?action=getSurveys`, { cache: "no-store" });
        const surveysData = await resSurvey.json();
        const currentSurvey = surveysData.find((s: any) => s.Survey_ID === surveyId);
        setSurvey(currentSurvey);

        // 2. Tarik senarai soalan
        const resQ = await fetch(gasUrl!, {
          method: "POST",
          body: JSON.stringify({ action: "getQuestionsAdmin", Survey_ID: surveyId }),
        });
        const qData = await resQ.json();
        const sortedQ = qData.sort((a: any, b: any) => Number(a.Order_No) - Number(b.Order_No));
        setQuestions(sortedQ);
      } catch (err) {
        console.error("Gagal memuatkan kajian:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [surveyId]);

  // Kumpulkan soalan mengikut Section_Name
  const groupedSections: Record<string, any[]> = questions.reduce((acc, q) => {
    const sec = q.Section_Name || "Bahagian Umum";
    if (!acc[sec]) acc[sec] = [];
    acc[sec].push(q);
    return acc;
  }, {} as Record<string, any[]>);

  const sectionNames = Object.keys(groupedSections);
  const totalSteps = sectionNames.length;
  const currentSectionName = sectionNames[currentStep];
  const currentQuestions = groupedSections[currentSectionName] || [];

  // Semak sama ada satu-satu soalan sudah dijawab
  const isQuestionAnswered = (q: any) => {
    const val = answers[q.Question_ID];
    if (q.Question_Type === "checkbox") {
      if (!Array.isArray(val) || val.length === 0) return false;
      if (val.includes("Lain-lain") && !(otherTexts[q.Question_ID] || "").trim()) return false;
      return true;
    } else {
      if (!val || String(val).trim() === "") return false;
      if (val === "Lain-lain" && !(otherTexts[q.Question_ID] || "").trim()) return false;
      return true;
    }
  };

  // Kira Progress Bar ikut JUMLAH SOALAN DIJAWAB (Mula dari 0%)
  const answeredCount = questions.filter((q) => isQuestionAnswered(q)).length;
  const progressPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  // Handle jawapan Radio & Text
  const handleInputChange = (qId: string, value: string) => {
    setErrorMsg("");
    setAnswers((prev) => ({ ...prev, [qId]: value }));
  };

  // Handle jawapan Checkbox
  const handleCheckboxChange = (qId: string, option: string, checked: boolean) => {
    setErrorMsg("");
    setAnswers((prev) => {
      const currentArr = Array.isArray(prev[qId]) ? prev[qId] : [];
      if (checked) {
        return { ...prev, [qId]: [...currentArr, option] };
      } else {
        return { ...prev, [qId]: currentArr.filter((item: string) => item !== option) };
      }
    });
  };

  // Semak semua soalan dalam bahagian semasa sebelum ke bahagian seterusnya
  const validateCurrentSection = () => {
    for (const q of currentQuestions) {
      if (!isQuestionAnswered(q)) {
        setErrorMsg(`Sila lengkapkan Soalan ${q.Order_No} sebelum meneruskan.`);
        return false;
      }
    }
    setErrorMsg("");
    return true;
  };

  // Butang Seterusnya (Next)
  const handleNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault(); // Elak daripada ter-submit borang secara tidak sengaja
    if (!validateCurrentSection()) return;

    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Butang Kembali (Previous)
  const handlePrev = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setErrorMsg("");
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Hantar semua jawapan ke Google Sheets
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateCurrentSection()) return;

    setIsSubmitting(true);

    try {
      // Gabungkan jawapan "Lain-lain" jika ada
      const finalAnswers: Record<string, string> = {};
      questions.forEach((q) => {
        const val = answers[q.Question_ID];
        const otherVal = otherTexts[q.Question_ID];
        const colKey = `Q${q.Order_No}`;

        if (Array.isArray(val)) {
          const mapped = val.map((v) => (v === "Lain-lain" && otherVal ? `Lain-lain: ${otherVal}` : v));
          finalAnswers[colKey] = mapped.join(", ");
        } else if (val === "Lain-lain" && otherVal) {
          finalAnswers[colKey] = `Lain-lain: ${otherVal}`;
        } else {
          finalAnswers[colKey] = val || "";
        }
      });

      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: "submitResponse",
          Response_ID: `R${Date.now().toString().slice(-6)}`,
          Survey_ID: surveyId,
          answers: finalAnswers,
        }),
      });

      const result = await res.json();
      if (result.status === "success") {
        setIsSubmitted(true);
      } else {
        alert("Gagal menghantar jawapan. Sila cuba lagi.");
      }
    } catch (err) {
      alert("Ralat sistem semasa menghantar jawapan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-500">
        Memuatkan borang kaji selidik...
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="bg-white p-10 rounded-2xl shadow-md border border-slate-200 max-w-lg w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Terima Kasih!</h2>
          <p className="text-slate-600 mb-8">Maklum balas anda telah berjaya direkodkan.</p>
          <Link href="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition">
            Kembali ke Laman Utama
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Kad Tajuk Kajian */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 border-t-4 border-t-blue-600">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 uppercase">
            {survey?.Title || "Borang Kaji Selidik"}
          </h1>
          <p className="text-slate-600 mt-2 text-sm md:text-base whitespace-pre-line leading-relaxed">
            {survey?.Description}
          </p>

          {/* PROGRESS BAR IKUT JUMLAH SOALAN DIJAWAB */}
          {questions.length > 0 && (
            <div className="mt-6 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs md:text-sm font-bold text-slate-600 mb-2">
                <span>
                  Bahagian {currentStep + 1} daripada {totalSteps} ({answeredCount}/{questions.length} soalan dijawab)
                </span>
                <span className="text-blue-600">{progressPercent}% Siap</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Borang Soalan (Hanya Papar Bahagian Semasa) */}
        <form onSubmit={handleSubmit}>
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
            <h2 className="text-xl font-bold text-slate-800 pb-3 border-b border-slate-200">
              {currentSectionName}
            </h2>

            {currentQuestions.map((q) => {
              const optionsList = q.Options ? q.Options.split(",").map((opt: string) => opt.trim()).filter(Boolean) : [];
              const hasOther = String(q.Has_Other_Option).toUpperCase() === "TRUE";
              const isOtherSelected =
                q.Question_Type === "radio"
                  ? answers[q.Question_ID] === "Lain-lain"
                  : Array.isArray(answers[q.Question_ID]) && answers[q.Question_ID].includes("Lain-lain");

              return (
                <div key={q.Question_ID} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                  <label className="block font-bold text-slate-800 mb-3 text-sm md:text-base">
                    {q.Order_No}. {q.Question_Text} <span className="text-red-500">*</span>
                  </label>

                  {/* Jenis: TEXT */}
                  {q.Question_Type === "text" && (
                    <input
                      type="text"
                      className="w-full border border-slate-300 rounded-lg p-3 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Taip jawapan anda di sini..."
                      value={answers[q.Question_ID] || ""}
                      onChange={(e) => handleInputChange(q.Question_ID, e.target.value)}
                    />
                  )}

                  {/* Jenis: RADIO */}
                  {q.Question_Type === "radio" && (
                    <div className="space-y-2.5">
                      {optionsList.map((opt: string, idx: number) => (
                        <label key={idx} className="flex items-center space-x-3 cursor-pointer text-slate-700 hover:text-slate-900">
                          <input
                            type="radio"
                            name={q.Question_ID}
                            value={opt}
                            checked={answers[q.Question_ID] === opt}
                            onChange={(e) => handleInputChange(q.Question_ID, e.target.value)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm md:text-base">{opt}</span>
                        </label>
                      ))}
                      {hasOther && (
                        <label className="flex items-center space-x-3 cursor-pointer text-slate-700">
                          <input
                            type="radio"
                            name={q.Question_ID}
                            value="Lain-lain"
                            checked={answers[q.Question_ID] === "Lain-lain"}
                            onChange={(e) => handleInputChange(q.Question_ID, e.target.value)}
                            className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm md:text-base">Lain-lain</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Jenis: CHECKBOX */}
                  {q.Question_Type === "checkbox" && (
                    <div className="space-y-2.5">
                      {optionsList.map((opt: string, idx: number) => (
                        <label key={idx} className="flex items-center space-x-3 cursor-pointer text-slate-700 hover:text-slate-900">
                          <input
                            type="checkbox"
                            value={opt}
                            checked={Array.isArray(answers[q.Question_ID]) && answers[q.Question_ID].includes(opt)}
                            onChange={(e) => handleCheckboxChange(q.Question_ID, opt, e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm md:text-base">{opt}</span>
                        </label>
                      ))}
                      {hasOther && (
                        <label className="flex items-center space-x-3 cursor-pointer text-slate-700">
                          <input
                            type="checkbox"
                            value="Lain-lain"
                            checked={Array.isArray(answers[q.Question_ID]) && answers[q.Question_ID].includes("Lain-lain")}
                            onChange={(e) => handleCheckboxChange(q.Question_ID, "Lain-lain", e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm md:text-base">Lain-lain</span>
                        </label>
                      )}
                    </div>
                  )}

                  {/* Kotak Teks Automatik jika pilih 'Lain-lain' */}
                  {isOtherSelected && (
                    <input
                      type="text"
                      className="mt-3 w-full border border-blue-300 rounded-lg p-2.5 bg-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      placeholder="Sila nyatakan..."
                      value={otherTexts[q.Question_ID] || ""}
                      onChange={(e) => {
                        setErrorMsg("");
                        setOtherTexts((prev) => ({ ...prev, [q.Question_ID]: e.target.value }));
                      }}
                    />
                  )}
                </div>
              );
            })}

            {/* Mesej Amaran jika ada soalan belum dijawab */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Butang Navigasi (Kembali / Seterusnya / Hantar) */}
            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
              {currentStep > 0 ? (
                <button
                  key="btn-prev"
                  type="button"
                  onClick={handlePrev}
                  className="px-6 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg transition"
                >
                  &larr; Kembali
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < totalSteps - 1 ? (
                <button
                  key="btn-next"
                  type="button"
                  onClick={handleNext}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow transition"
                >
                  Seterusnya &rarr;
                </button>
              ) : (
                <button
                  key="btn-submit"
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-2.5 text-white font-bold rounded-lg shadow-md transition ${
                    isSubmitting ? "bg-green-400" : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {isSubmitting ? "Menghantar..." : "Hantar Jawapan ✓"}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}