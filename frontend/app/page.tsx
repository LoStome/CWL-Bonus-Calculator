"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [tag, setTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const standardizedTag = tag.replace("#", "").toUpperCase();
    try {
      // Verifies if clan exists
      const response = await fetch(
        `/api/clan/clanData?clanTag=${standardizedTag}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Clan not found");
      }
      //response is ok
      const ClanData = await response.json();
      router.push(`/clan/${standardizedTag}`);
    } catch (err: any) {
      setError(err.message || "Errore nella ricerca del clan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-4xl text-black font-bold mb-8">
        CWL Bonus Calculator
      </h1>

      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-xl p-6 w-full max-w-md"
      >
        <label className=" text-black mb-2 block">Enter Clan Tag</label>

        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          placeholder="#..."
          className="text-[#9d9d9d] font-clashSmall w-full border p-3 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-400"
        />
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {loading ? "Searching..." : "Search Clan"}
        </button>
      </form>
    </div>
  );
}
