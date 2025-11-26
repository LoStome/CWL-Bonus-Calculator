//TODO:
// confrontare la versione vecchia con quella nuova e per cercare del codice da riutilizzare
// (renderlo piu' leggibile o cambiare alcune funzioni)
// cambiare i commenti da italiano a inglese
// controllare tutti gli import e exports, ottimizzarli e creare index.js

const cocApiClient = require("./../cocApiClient");
const { transformTag, standardizeTag } = require("../../utils/tagUtils");
const {
  warFilter,
  getWarsResults,
  calculateClansPosition,
  formatPlayerAttacks,
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

      if (isClanInCache) {
        return cachedData;
      }
    }

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

      // Per ogni clan nel gruppo, calcoliamo le statistiche
      for (let clan of cwlData.clans) {
        let clanData = {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
          results: null,
        };

        // Passiamo 'season' e il tag del clan corrente (non quello dell'utente principale)
        const warResults = await getWarsResults(clanData.tag, season);
        clanData.results = warResults;

        cwlMainData.clans.push(clanData);
      }

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
      // Iteriamo su tutte le guerre (rounds)
      correctClanWars.forEach((warData, index) => {
        const membersInWar = getMembersFromCorrectSide(warData.war, clanTag);
        const warCounter = index + 1;

        membersInWar.forEach((member) => {
          // Cerchiamo se il player è già stato aggiunto all'array principale
          let existingMember = clanMembers.find((m) => m.tag === member.tag);

          // Formattiamo i nuovi attacchi di questa guerra
          const formattedAttacks = formatPlayerAttacks(member, warData.warTag, warCounter);

          if (!existingMember) {
            // Se è la prima volta che vediamo il player, creiamo l'oggetto
            existingMember = {
              tag: member.tag,
              name: member.name,
              townhallLevel: member.townhallLevel,
              mapPosition: member.mapPosition,
              totalPlayerStars: 0,
              totalPlayerPercentage: 0,
              attacks: [],
            };
            clanMembers.push(existingMember);
          }

          // Aggiungiamo gli attacchi e aggiorniamo le stats
          existingMember.attacks.push(...formattedAttacks);

          // Aggiornamento contatori totali
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
