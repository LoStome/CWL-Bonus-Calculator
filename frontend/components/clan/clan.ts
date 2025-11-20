export interface ClanData {
  tag: string;
  name: string;
  type: string;
  description: string;
  warLeague: { id: number; name: string };
  members: number;
  badgeUrls: { small: string; medium: string; large: string };
  location: {
    id: number;
    name: string;
    isCountry: boolean;
    countryCode: string;
  };
  warWins: number;
  warLosses: number;
}
