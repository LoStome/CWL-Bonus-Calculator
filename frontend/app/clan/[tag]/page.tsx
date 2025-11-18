"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ClanData {
  tag: string;
  name: string;
  description: string;
  type: string;
  location: {
    name: string;
  };
  badgeUrls: {
    small: string;
    large: string;
    medium: string;
  };
  clanLevel: number;
  clanPoints: number;
  clanVersusPoints: number;
  members: number;
  // Aggiungi altri campi che ti servono
}

export default function ClanPage() {
  const params = useParams();
  const tag = params.tag as string;
  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClanData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/clan?tag=${tag}`);

        if (!response.ok) {
          throw new Error("Clan not found");
        }

        const data = await response.json();
        setClanData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (tag) {
      fetchClanData();
    }
  }, [tag]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clan data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            ← Back to search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/"
          className="text-blue-600 hover:underline mb-6 inline-block"
        >
          ← Back to search
        </Link>

        {clanData && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center gap-4 mb-6">
              <img
                src={clanData.badgeUrls.large}
                alt={`${clanData.name} badge`}
                className="w-20 h-20"
              />
              <div>
                <h1 className="text-3xl font-bold">{clanData.name}</h1>
                <p className="text-gray-600">{clanData.tag}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Description</h3>
                  <p className="text-gray-600">
                    {clanData.description || "No description"}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Type</h3>
                  <p className="text-gray-600 capitalize">{clanData.type}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Location</h3>
                  <p className="text-gray-600">{clanData.location.name}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-700">Clan Level</h3>
                  <p className="text-gray-600">{clanData.clanLevel}</p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Clan Points</h3>
                  <p className="text-gray-600">
                    {clanData.clanPoints.toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-700">Members</h3>
                  <p className="text-gray-600">{clanData.members}/50</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
