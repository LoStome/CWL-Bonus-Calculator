import { CWLClan } from "./cwl"; // Importa il tipo Clan

interface CWLSeasonWarInfoProps {
  clanData: CWLClan;
}



export const CWLSeasonWarInfo = ({ clanData }: CWLSeasonWarInfoProps) => {
  return (

    <div><p>Position: {clanData.results.clanPosition}</p>
    <p>Total stars{clanData.results.totalStars}</p>
    <p>Total percentage: {clanData.results.totalPercentage.toFixed(2)}%</p>
    </div>
    
  );
};
