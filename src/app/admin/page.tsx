"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    try {
      const gasUrl = process.env.NEXT_PUBLIC_GAS_URL;
      const res = await fetch(gasUrl!, {
        method: "POST",
        body: JSON.stringify({
          action: "login",
          username: username,
          password: password,
        }),
      });

      const data = await res.json();

      if (data.status === "success") {
        // Simpan sesi login ke dalam local storage pelayar web
        localStorage.setItem("adminUser", JSON.stringify(data.user));
        // Bawa admin masuk ke dashboard
        router.push("/admin/dashboard");
      } else {
        setErrorMsg(data.message || "Gagal log masuk.");
      }
    } catch (err: any) {
      setErrorMsg("Terdapat ralat semasa menyambung ke pelayan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center font-sans">
      <div className="bg-white p-8 md:p-12 rounded-xl shadow-xl w-full max-w-md border-t-4 border-slate-900">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Log Masuk Admin</h1>
          <p className="text-sm text-gray-500 mt-2">Sistem Kajian E-Syariah (ESV3)</p>
        </div>

        {errorMsg && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4 text-sm text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">ID Pengguna</label>
            <input
              type="text"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="Contoh: admin_master"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">Katalaluan</label>
            <input
              type="password"
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-slate-900"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full text-white font-bold py-3 px-4 rounded-lg shadow transition ${
              isLoading ? "bg-slate-400 cursor-not-allowed" : "bg-slate-900 hover:bg-slate-800"
            }`}
          >
            {isLoading ? "Menyemak..." : "Log Masuk"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-blue-600 hover:underline">
            &larr; Kembali ke Laman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}