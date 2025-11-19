import { ClanData } from "./clan";
import { InfoRow } from "./InfoRow";

interface ClanInfoSectionProps {
  clanData: ClanData;
  title?: string;
}

export const ClanWarStatsSection: React.FC<ClanInfoSectionProps> = ({
  clanData,
}) => {
  return (
    <div>
      <div className="space-y-2">
        <InfoRow label="War wins:" value={clanData.warWins} />
        <InfoRow label="War losses:" value={clanData.warLosses} />
        <InfoRow
          label="War League:"
          value={clanData.warLeague.name}
          highlight
        />
      </div>
    </div>
  );
};
