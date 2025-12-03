import { Card, SectionTitle } from "@/components/ui";
import { CWLSeasonData } from "./cwl";

import { CWLSeasonWarInfo } from "./CWLSeasonWarInfo";
import { CWLSeasonHeader } from "./CWLSeasonHeader";

interface CWLCurrentSeasonCardProps {
  data: CWLSeasonData;
  clanTag: string;
}



export const CWLCurrentSeasonCard: React.FC<CWLCurrentSeasonCardProps> = ({
  data, clanTag
}: CWLCurrentSeasonCardProps) => {

  
  const formattedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

  const clanData = data.clans.find((clan) => clan.tag === formattedClanTag);

  console.log(clanData)


  
  // data contains: { state, season, clans: [...] }

  return (
    <Card>
      {" "}
      <div className="mt-4">
        <SectionTitle>Current CWL Season</SectionTitle>

        <CWLSeasonHeader season={data.season} state={data.state} />
        <CWLSeasonWarInfo clanData={clanData!} />
      </div>
    </Card>
  );
};

//risistemare il padding
//fra gli elementi
