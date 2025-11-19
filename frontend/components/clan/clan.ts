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

/*export interface WarLeague {
  id: number;
  name: string;
}

export interface badgeUrls {
  small: string;
  medium: string;
  large: string;
}
*/
