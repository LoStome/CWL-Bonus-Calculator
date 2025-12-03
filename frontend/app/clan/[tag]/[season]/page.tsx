"use client";


//PAGINA PLACEHOLDER GENERATA DA IA
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, SectionTitle } from "@/components/ui"; // Assumo tu abbia questi componenti
//import { CWLSeasonData } from "@/components/cwl"; // Assumo tu abbia i tipi
import { ClanHeader } from "@/components/clan/"; // Se vuoi mostrare l'header del clan anche qui
import { CWLSeasonHeader } from "@/components/cwl/CWLSeasonHeader"; // Importa i tuoi componenti
import { CWLSeasonWarInfo } from "@/components/cwl/CWLSeasonWarInfo"; // Importa i tuoi componenti

// --- ATTENZIONE A QUESTA RIGA: export default ---
export default function SeasonDetailsPage() {
  const params = useParams();
  
  // Estraiamo i parametri dall'URL
  // Nota: params restituisce stringhe o array, forziamo a stringa
  const tag = params.tag as string;
  const season = params.season as string;

  const [cwlData, setCwlData] = useState<CWLSeasonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSeasonData = async () => {
      if (!tag || !season) return;
      
      setLoading(true);
      try {
        // Chiamata all'API specifica per quella stagione
        const response = await fetch(`/api/cwl/getCWLSeasonData?clanTag=${tag}&season=${season}`);
        
        if (!response.ok) {
          throw new Error("Season data not found");
        }

        const json = await response.json();
        setCwlData(json.data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonData();
  }, [tag, season]);

  // --- STATI DI CARICAMENTO E ERRORE ---
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-500 text-white">
        Loading Season {season}...
      </div>
    );
  }

  if (error || !cwlData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-500 text-red-300">
        Error: {error || "No data available"}
      </div>
    );
  }

  // Prepariamo i dati specifici del clan per il componente Info
  const formattedTag = tag.startsWith("#") ? tag : `#${tag}`;
  const myClanData = cwlData.clans.find(c => c.tag === formattedTag);

  return (
    <div className="min-h-screen bg-gray-500 p-6">
      <div className="space-y-6 max-w-4xl mx-auto">
        
        {/* Titolo e Navigazione */}
        <div>
           <h1 className="text-3xl text-white font-bold mb-2">Season Details</h1>
           <p className="text-gray-300">Clan: {tag} | Season: {season}</p>
        </div>

        {/* Card Principale */}
        <Card>
          <div className="p-6 flex flex-col gap-6">
             <SectionTitle>Season Summary</SectionTitle>
             
             {/* Header Stagione (Stato, Mese) */}
             <CWLSeasonHeader season={cwlData.season} state={cwlData.state} />

             {/* Info Dettagliate del Clan (Se trovato) */}
             {myClanData ? (
                <CWLSeasonWarInfo clanData={myClanData} />
             ) : (
                <div className="text-gray-500">Clan data not found in this league group.</div>
             )}
          </div>
        </Card>

        {/* Qui potrai aggiungere altri componenti, es. la lista di tutte le guerre */}
      
      </div>
    </div>
  );
}