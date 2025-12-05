import Link from "next/link";

import { Card, SectionTitle } from "@/components/ui";
import { CWLSeasonData } from "./cwl";

import { CWLSeasonWarInfo } from "./CWLSeasonWarInfo";
import { CWLSeasonHeader } from "./CWLSeasonHeader";

interface CWLCurrentSeasonCardProps {
  data: CWLSeasonData;
  clanTag: string;
}

export const CWLCurrentSeasonCard: React.FC<CWLCurrentSeasonCardProps> = ({
  data,
  clanTag,
}: CWLCurrentSeasonCardProps) => {
  const formattedClanTag = clanTag.startsWith("#") ? clanTag : `#${clanTag}`;

  if (!data) {
    return (
      <Card>
        <div className="mt-4">
          <SectionTitle>Current CWL Season</SectionTitle>

          <p className="text-red-500">No data found for this season</p>
        </div>
      </Card>
    );
  }
  //console.log(data)
  // data contains: { state, season, clans: [...] }

  const clanData = data.clans.find((clan) => clan.tag === formattedClanTag);
  //console.log(clanData)
  //IF DATA IS FOUND
  return (
    <div className="block w-full transition-transform hover:scale-[1.01]">
      <Link href={`/clan/${clanTag}/${data.season}`}>
        <Card>
          <div className="grid grid-cols-2 items-center">
            <SectionTitle>Current CWL Season</SectionTitle>
            <CWLSeasonHeader season={data.season} state={data.state} />
          </div>
          <CWLSeasonWarInfo clanData={clanData!} />
        </Card>
      </Link>
    </div>
  );
};
