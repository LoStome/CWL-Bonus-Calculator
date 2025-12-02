export interface CWLSeasonData {
  state: string;
  season: string;
  clans: CWLClan[];
}

export interface CWLClan {
  tag: string;
  name: string;
  clanLevel: number;
  badgeUrls: {
    small: string;
    large: string;
    medium: string;
  };
  results: CWLClanResult;
}

export interface CWLClanResult {
  wins: number;
  losses: number;
  draws: number;
  gainedStars: number;
  bonusStars: number;
  totalStars: number;
  totalPercentage: number;
  clanPosition: number;
}
