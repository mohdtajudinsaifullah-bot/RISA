import Link from "next/link";

// Definisikan bentuk data yang akan diterima dari Sheet 'Surveys'
interface SurveyData {
  Survey_ID: string;
  Title: string;
  Description: string;
  Start_Time: string;
  End_Time: string;
  Is_Active: boolean;
}

// Fungsi async untuk tarik data dari GAS di server-side
async function fetchSurveys() {
  const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
  
  if (!gasUrl) {
    throw new Error("Pautan API (GAS URL) kosong. Pastikan fail .env.local betul dan server dah di-restart.");
  }

  const fullUrl = `${gasUrl.trim()}?action=getSurveys`;
  
  try {
    // Tambah redirect: 'follow' kerana Google GAS akan buat 302 Redirect
    const res = await fetch(fullUrl, { 
      cache: 'no-store',
      redirect: 'follow' 
    });
    
    if (!res.ok) {
      throw new Error(`HTTP Error: ${res.status}`);
    }

    const data = await res.json();
    
    if (data.error) {
       throw new Error(`Ralat API: ${data.error}`);
    }

    return data as SurveyData[];
  } catch (err: any) {
    // Paparkan ralat penuh bersama pautan untuk mudah kita semak
    throw new Error(`${err.message} (Pautan: ${fullUrl})`);
  }
}

// Ini adalah Server Component (boleh guna async terus)
export default async function SenaraiKajian() {
  let surveys: SurveyData[] = [];
  let errorMsg = "";

  try {
    surveys = await fetchSurveys();
  } catch (err: any) {
    errorMsg = err.message || "Terdapat ralat semasa memuatkan data.";
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-slate-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">Research Intelligence & Survey Analytics (RISA)</h1>
          <Link href="/" className="text-sm text-gray-300 hover:text-white transition">
            &larr; Kembali ke Laman Utama
          </Link>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto p-6 mt-6 w-full">
        <h2 className="text-3xl font-bold text-slate-800 mb-8 border-b-2 border-blue-500 pb-2 inline-block">
          Senarai Kajian
        </h2>
        
        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Ralat: </strong>
            <span className="block sm:inline">{errorMsg}</span>
          </div>
        )}

        {!errorMsg && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {surveys.length === 0 ? (
                <div className="col-span-full text-center text-gray-500 py-10">Tiada kajian yang ditemui pada masa ini.</div>
            ) : (
                surveys.map((survey) => {
                  // Urus format status & tarikh
                  const isActive = String(survey.Is_Active).toUpperCase() === 'TRUE';
                  const rawDate = new Date(survey.End_Time);
                  const formattedDate = !isNaN(rawDate.getTime()) 
                        ? rawDate.toLocaleDateString('ms-MY', { day: 'numeric', month: 'short', year: 'numeric' })
                        : survey.End_Time;

                  return (
                    <div key={survey.Survey_ID} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-300">
                      <div className={`h-2 w-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      
                      <div className="p-6 flex-grow flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {isActive ? 'AKTIF' : 'TAMAT'}
                          </span>
                          <span className="text-xs text-gray-500 font-medium mt-1">Tutup: {formattedDate}</span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-gray-900 mb-2 leading-snug">{survey.Title}</h3>
                        <p className="text-gray-600 text-sm mb-6 flex-grow line-clamp-3">{survey.Description}</p>
                        
                        {isActive ? (
                          <Link href={`/jawab/${survey.Survey_ID}`} className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded transition">
                            Mula Jawab
                          </Link>
                        ) : (
                          <button disabled className="block w-full text-center bg-gray-200 text-gray-500 font-bold py-2.5 px-4 rounded cursor-not-allowed">
                            Telah Ditutup
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-gray-400 text-center py-4 mt-auto">
        <p className="text-sm">© 2026 JKSN/MSN. Hak Cipta Terpelihara.</p>
      </footer>
    </div>
  );
}