"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [tag, setTag] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const standardizedTag = tag.replace("#", "").toUpperCase();

    router.push(`/clan/${standardizedTag}`);

    // Later you will use this:
    // const response = await fetch(`/api/clan?tag=${tag}`);

    // For now, just log it.
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

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          Search Clan...
        </button>
      </form>
    </div>
  );
}
