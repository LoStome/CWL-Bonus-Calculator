"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ClanData } from "@/components/clan/clan";
import { ClanHeader } from "@/components/clan/";
import { CwlCurrentSeasonCard } from "@/components/cwl/";

export default function ClanPage() {
  const params = useParams();
  const tag = params.tag as string;
  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClanData = async () => {
      try {
        const response = await fetch(`/api/clan/clanData?clanTag=${tag}`);

        if (!response.ok) {
          throw new Error("Clan non trovato");
        }

        const data = await response.json();
        setClanData(data.data);
        //data.data because the backend returns: { ok: true, data: {...} }
      } catch (err: any) {
        setError(err.message);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Finding your clan...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-500 p-6">
      <div className="space-y-3">
        <ClanHeader clanData={clanData!} />
        {/*Type Assertion: Uses to tell js that the data is never null | if not done an error is shown in VScode*/}

        <div></div>

        <CwlCurrentSeasonCard></CwlCurrentSeasonCard>
      </div>
    </div>
  );
}
