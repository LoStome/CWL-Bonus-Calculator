import { Card, SectionTitle } from "@/components/ui";
import { CWLSeasonData } from "./cwl";

import { CWLSeasonWarInfo } from "./CWLSeasonWarInfo";
import { CWLSeasonHeader } from "./CWLSeasonHeader";

interface CWLCurrentSeasonCardProps {
  data: CWLSeasonData;
}

export const CWLCurrentSeasonCard: React.FC<CWLCurrentSeasonCardProps> = ({
  data,
}: CWLCurrentSeasonCardProps) => {
  // data contains: { state, season, clans: [...] }

  return (
    <Card>
      {" "}
      <div className="mt-4">
        <SectionTitle>Current CWL Season</SectionTitle>

        <CWLSeasonHeader season={data.season} state={data.state} />
        <CWLSeasonWarInfo clans={data.clans} />
      </div>
    </Card>
  );
};

//risistemare il padding
//fra gli elementi
