//TODO:
// controllare tutti gli import e exports, ottimizzarli e creare index.js

const cocApiClient = require("./../cocApiClient");
const { transformTag, standardizeTag } = require("../../utils/tagUtils");
const {
  warFilter,
  getWarsResults,
  calculateClansPosition,
  tweakPlayerAttacks,
  getClanFromCorrectSide,
  getMembersFromCorrectSide,
} = require("./cwlHelpers");

class cwlProcessor {
  constructor() {
    // Cache Struttura: { "2024-01": { ...fullJsonData... } }
    this.cwlDataCache = {};
  }

  //checks if the league group data is already cached, otherwise fetches it from the API
  //returns and caches the full CWL season data for the league group (if gotten from the API)
  async _ensureLeagueGroupData(clanTag, season) {
    const stdTag = standardizeTag(clanTag);
    // 1. checks cache
    if (this.cwlDataCache[season]) {
      const cachedData = this.cwlDataCache[season];
      // checks if the clan is part of the cached league group
      const isClanInCache =
        cachedData.clans && cachedData.clans.some((c) => standardizeTag(c.tag) === stdTag);

      //if data is found, already returns it
      if (isClanInCache) {
        return cachedData;
      }
    }

    //only if data is not found
    try {
      //2. fetches from API
      const response = await cocApiClient.getCWLSeasonData(stdTag, season);

      if (!response) {
        console.warn(`CWL Data not found for ${stdTag} in season ${season}.`);
        return { state: "noSeasonData" };
      }

      // 3. saves to cache
      this.cwlDataCache[season] = response;
      return response;
    } catch (error) {
      console.error(`Error fetching CWL data for ${stdTag}:`, error.message);
      return { state: "error", message: error.message };
    }
  }

  //refactors the data obtained from the api
  async getCWLSeasonMainData(clanTag, season) {
    try {
      const cwlData = await this._ensureLeagueGroupData(clanTag, season);

      if (cwlData.state === "noSeasonData" || cwlData.state === "error") {
        throw new Error(cwlData.message || "No season data available");
      }

      let cwlMainData = {
        state: cwlData.state,
        season: cwlData.season,
        clans: [],
      };

      // initializes the main data for each clan in the group
      for (let clan of cwlData.clans) {
        let clanData = {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
          results: null, //filled later
        };

        //getWarsResults receives the tag of the current clan, (not the main one)
        //in this way we obtain the data of each clan's wars from their "perspective"
        const warResults = await getWarsResults(cwlData, clanData.tag);
        clanData.results = warResults;
        cwlMainData.clans.push(clanData);
      }

      //assigns the final position of each clan in results.clanPosition
      return calculateClansPosition(cwlMainData);
    } catch (error) {
      console.error(error);
      throw new Error(`CWL season main data error: ${error.message}`);
    }
  }

  async saveMembersData(clanTag, season) {
    //get the CWL data for the league group
    const cwlData = this._ensureLeagueGroupData(clanTag, season);
    if (cwlData.state === "noSeasonData" || cwlData.state === "error") return [];

    const correctClanWars = warFilter(cwlData, clanTag);
    const clanMembers = [];
    try {
      // iterates on each war/round/day
      correctClanWars.forEach((warData, index) => {
        const membersInWar = getMembersFromCorrectSide(warData.war, clanTag);
        const warCounter = index + 1;

        membersInWar.forEach((member) => {
          // searches if player is already added to the player array
          let existingMember = clanMembers.find((m) => m.tag === member.tag);

          if (!existingMember) {
            // if is the first time the player is found,
            // the specific player object is created
            existingMember = {
              tag: member.tag,
              name: member.name,
              townhallLevel: member.townhallLevel,
              mapPosition: member.mapPosition,
              totalPlayerStars: 0,
              totalPlayerPercentage: 0,
              attacks: [],
              /*
              not planning to implemente defences for now
              this is what is needed to implement them
              //opponentAttacks: member.opponentAttacks || 0,
              //bestOpponentAttack: member.bestOpponentAttack || null
              */
            };
            clanMembers.push(existingMember);
          }

          // tweaks attacks data for this war
          const formattedAttacks = tweakPlayerAttacks(member, warData.warTag, warCounter);

          // adds the war data to the player object
          existingMember.attacks.push(...formattedAttacks);

          // updates the total stars and % counters
          formattedAttacks.forEach((atk) => {
            existingMember.totalPlayerStars += atk.stars;
            existingMember.totalPlayerPercentage += atk.destructionPercentage;
          });
        });
      });
    } catch (error) {
      console.error("Error saving members data:", error);
      return [];
    }

    return clanMembers;
  }
}

module.exports = new cwlProcessor();
