//interface of the data structure of a cwl season related to a certain clan
//created in the backend
export interface CwlSeason {
  ok: boolean;
  clanTag: string;
  data: CwlPlayer[];
}

export interface CwlPlayer {
  tag: string;
  name: string;
  townhallLevel: number;
  mapPosition: number;
  attacks: CwlAttack[];
}

export interface CwlAttack {
  attackerTag: string;
  defenderTag: string;
  stars: number;
  destructionPercentage: number;
  order: number;
  duration: number;
  warTag: string;
  warNumber: number;

  //in the future defences could be added
  //remember to modify in case
}
