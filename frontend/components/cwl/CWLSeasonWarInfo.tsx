import { CWLClan } from "./cwl"; // Importa il tipo Clan

interface CWLSeasonWarInfoProps {
  clans: CWLClan[];
}

export const CWLSeasonWarInfo = ({ clans }: CWLSeasonWarInfoProps) => {
  return (
    /*<div className="flex flex-col gap-2">
      {clans.map((clan) => (
        <div key={clan.tag} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-3">
            <span className="font-bold text-gray-500 w-6">#{clan.results.clanPosition}</span>
            <img src={clan.badgeUrls.small} alt={clan.name} className="w-8 h-8" />
            <div>
              <p className="font-bold text-gray-900">{clan.name}</p>
              <p className="text-xs text-gray-500">{clan.tag}</p>
            </div>
          </div>

          <div className="text-right">
            <p className="font-bold text-blue-600">{clan.results.totalStars} ★</p>
            <p className="text-xs text-gray-500">
              {clan.results.wins}W - {clan.results.losses}L
            </p>
          </div>
        </div>
      ))}
    </div>*/

    <div></div>
  );
};
