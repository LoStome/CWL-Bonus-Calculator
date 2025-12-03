"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { ClanData } from "@/components/clan/clan";
import { ClanHeader } from "@/components/clan/";
import { CWLCurrentSeasonCard } from "@/components/cwl/";

// Funzione per ottenere YYYY-MM
function getCurrentSeasonId(): string {
  const date = new Date();
  const year = date.getFullYear();
  // getMonth() parte da 0 (Gennaio = 0), quindi aggiungiamo 1.
  // padStart(2, '0') assicura che "5" diventi "05"
  const month = String(date.getMonth() + 1).padStart(2, "0");
  //console.log(`${year}-${month}`);
  return `${year}-11`;
  //return `${year}-${month}`;
}

export default function ClanPage() {
  const params = useParams();
  const tag = params.tag as string;

  const [clanData, setClanData] = useState<ClanData | null>(null);
  const [cwlData, setCwlData] = useState<any | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchClanData = async () => {
      try {
        const currentSeason = getCurrentSeasonId();

        const clanResponse = await fetch(`/api/clan/getClanData?clanTag=${tag}`);
        const cwlResponse = await fetch(
          `/api/cwl/getCWLSeasonData?clanTag=${tag}&season=${currentSeason}`
        );

        if (!clanResponse.ok) {
          throw new Error("clan not found :(");
        }
        const clanJson = await clanResponse.json();
        //data.data because the backend returns: { ok: true, data: {...} }
        setClanData(clanJson.data);

        if (cwlResponse.ok) {
          const cwlJson = await cwlResponse.json();
          setCwlData(cwlJson.data);
        } else {
          console.warn("CWL data not found or API error");
          setCwlData(null); // Il clan non è in lega o non ci sono dati
        }
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

        <CWLCurrentSeasonCard data={cwlData} clanTag={tag} />
      </div>
    </div>
  );
}
