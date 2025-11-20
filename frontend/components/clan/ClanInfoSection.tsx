import { ClanData } from "./clan";
import { InfoRow } from "./InfoRow";

interface ClanInfoSectionProps {
  clanData: ClanData;
}

export const ClanInfoSection: React.FC<ClanInfoSectionProps> = ({
  clanData,
}) => {
  const formatJoinType = (type: string) =>
    type === "inviteOnly" ? "Invite Only" : type;

  return (
    <div>
      <div className="space-y-2">
        <InfoRow label="Join type:" value={formatJoinType(clanData.type)} />
        <InfoRow label="Total members:" value={`${clanData.members}/50`} />
        <InfoRow label="Clan location:" value={clanData.location.name} />
      </div>
    </div>
  );
};
