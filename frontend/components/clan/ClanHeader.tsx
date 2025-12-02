import { ClanDescription } from "./ClanDescription";
import { ClanBadge } from "./ClanBadge";
import { ClanInfoSection } from "./ClanInfoSection";
import { ClanWarStatsSection } from "./ClanWarStatsSection";
import { ClanData } from "./clan";

import { Card, SectionTitle } from "@/components/ui";
import { useResponsiveBadgeSize } from "@/hooks/useBreakpoint";

interface ClanHeaderProps {
  clanData: ClanData;
  title?: string;
}

export const ClanHeader: React.FC<ClanHeaderProps> = ({ clanData, title = "Clan Info" }) => {
  const badgeSize = useResponsiveBadgeSize();

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="clash-style-text text-amber-200 text-4xl font-bold ">{clanData.name}</h1>
          <p className="text-gray-300 clash-style-text-small mt-1">{clanData.tag}</p>
        </div>
        <ClanBadge size={badgeSize} badgeUrls={clanData.badgeUrls} />
      </div>
      <ClanDescription description={clanData.description} />

      <SectionTitle className="text-center">{title}</SectionTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ClanInfoSection clanData={clanData} />
        <ClanWarStatsSection clanData={clanData} />
      </div>
    </Card>
  );
};
