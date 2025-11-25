const cocApiClient = require("./cocApiClient");
const { transformTag, standardizeTag } = require("../utils/tagUtils");

//--------DATA ELABORATION--------

class CocDataProcessor {
  constructor() {
    //object to cache different seasons
    //Structure: { "2024-01": { ...data... }, "2024-02": { ...data... } }
    this.cwlDataCache = {}; // Cache per i dati del gruppo (season)

    this.warCache = {}; // key: warTag, value: warData
    //this.warCache = []; //keeping this for the other version with array
  }

  //helper function to cache the CWL data for multiple calls
  async _ensureLeagueGroupData(clanTag, season) {
    const stdTag = standardizeTag(clanTag);

    // 1. Checks if there is cached data for the requested season
    if (this.cwlDataCache[season]) {
      const cachedSeasonData = this.cwlDataCache[season];

      //checks if the cached data is for the requested clan
      if (cachedSeasonData.data && cachedSeasonData.data.clans) {
        // 2. searches if the requested clan is present in the 'clans' array of the cached data
        const isClanInCache = cachedSeasonData.data.clans.some((c) => c.tag === clanTag);

        if (isClanInCache) {
          return this.cwlData;
        }
      }
    }

    try {
      //3. If not, fetch new data from the API
      //console.log(`Fetching NEW API data for ${stdTag}`);
      const response = await cocApiClient.getCWLSeasonData(stdTag, season);
      //console.log("CWL Season Data from ClashKing API:", response);

      if (!response) {
        console.warn(
          `CWL Data not found for ${stdTag} in season ${season}. Returning 'noSeasonData'.`
        );
        // fake data structure to indicate no season data
        return { state: "noSeasonData" };
      }
      // 4. Save to cache specifically for this season
      this.cwlDataCache[season] = response;
      return response;
    } catch (error) {
      // 5. Gestione errori reali (es. API down, timeout, errori di rete)
      console.error(`Error fetching CWL data for ${stdTag}:`, error.message);

      return { state: "error", message: error.message };
    }
  }

  async getCWLSeasonMainData(clanTag, season) {
    try {
      let cwlData = await this._ensureLeagueGroupData(clanTag, season);
      //console.log("CWL Data: ", cwlData);

      if (cwlData.state === "noSeasonData" || cwlData.state === "error") {
        // Puoi decidere se ritornare null o l'oggetto errore
        throw new Error(cwlData.message || "No season data available");
      }

      let cwlMainData = {
        state: cwlData.state,
        season: cwlData.season,
        clans: [],
      };

      for (let clan of cwlData.clans) {
        let clanData = {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,

          results: {
            wins: 0,
            losses: 0,
            draws: 0,
            gainedStars: 0, //stars gained by attacking
            bonusStars: 0, //stars gained by winning wars
            totalStars: 0,
            totalPercentage: 0, //can be multiplied later with the numbers of players of a war (for a single clan) to show the same statistic shown in the game
            clanPosition: null,
          },
        };

        //gets the wars results for the clan
        const warResults = await this.getWarsResults(clanData.tag, season);

        clanData.results.wins = warResults.wins;
        clanData.results.losses = warResults.losses;
        clanData.results.draws = warResults.draws;

        clanData.results.gainedStars = warResults.gainedStars;
        clanData.results.bonusStars = warResults.wins * 10;
        clanData.results.totalStars = warResults.gainedStars + clanData.results.bonusStars;
        clanData.results.totalPercentage = warResults.totalPercentage;

        //adds the clanData to the cwlMainData
        cwlMainData.clans.push(clanData);
      }

      //calculates and assigns the clans position in the CWL
      cwlMainData = this.calculateClansPosition(cwlMainData);

      //console.log(this.warCache);
      //console.log("CWL Main Data: ", cwlMainData);
      return cwlMainData;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL season main data elaboration error (${season}): ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  //sorts the clans by total stars and percentage and assigns their position
  calculateClansPosition(cwlMainData) {
    let clans = {}; //key: clanTag, value: {totalStars, totalPercentage}

    //creates the sortable object
    cwlMainData.clans.forEach((clan) => {
      clans[clan.tag] = {
        totalStars: clan.results.totalStars,
        totalPercentage: clan.results.totalPercentage,
      };
    });

    //sorts the clans by totalStars and totalPercentage
    let sortedClans = Object.entries(clans).sort((a, b) => {
      if (b[1].totalStars === a[1].totalStars) {
        return b[1].totalPercentage - a[1].totalPercentage;
      }
      return b[1].totalStars - a[1].totalStars;
    });

    //assigns the position to each clan in the main data object
    sortedClans.forEach((clanEntry, index) => {
      let clanTag = clanEntry[0];
      let position = index + 1;
      let clanInMainData = cwlMainData.clans.find((clan) => clan.tag === clanTag);
      if (clanInMainData) {
        clanInMainData.results.clanPosition = position;
      }
    });

    return cwlMainData;
  }

  async getCWLSeasonWarTags(clanTag, season) {
    try {
      let cwlData = await this._ensureLeagueGroupData(clanTag, season);
      //console.log("CWL Data: ", cwlData);

      // Controllo sicurezza
      if (!cwlData) {
        throw new Error("CWL season data not available");
      } else if (!cwlData.rounds) {
        return [];
      }

      let allWarTags = [];

      cwlData.rounds.forEach(function (round, roundIndex) {
        //Creates an object for each round with its WarTags in it
        let roundData = {
          roundNumber: roundIndex + 1,

          warTags: round.warTags
            // --- PASSAGGIO 1: ESTRAZIONE ---
            // Controlliamo se l'elemento è un oggetto (nuovo JSON) o una stringa (vecchio JSON o "#0")
            .map((warEntry) => {
              if (warEntry && typeof warEntry === "object") {
                // Nel nuovo JSON il tag sta dentro la proprietà .tag
                return warEntry.tag;
              }
              // Se è già una stringa (es. "#0" o vecchio formato), lo ritorniamo così com'è
              return warEntry;
            })
            // --- PASSAGGIO 2: FILTRO ---
            // Ora abbiamo un array di stringhe o null, possiamo filtrare
            .filter((tagString) => tagString && tagString !== "#0")
            // --- PASSAGGIO 3: STANDARDIZZAZIONE ---
            // Rimuoviamo il "#" usando la tua utility
            .map((tagString) => standardizeTag(tagString)),

          /*
            *old code
            //#0 are invalid war for CoC's api, so they are filtered out
            .filter((warTag) => warTag && warTag !== "#0")
            .map((warTag) => standardizeTag(warTag)),
            */
        };

        //adds the roundData only if there are warTags inside
        //in theory not needed because if the war do not exits they are not presents in the api call
        //if (roundData.warTags.length > 0) {
        allWarTags.push(roundData);
        //}
      });
      //console.log("all War Tags: ", allWarTags);
      return allWarTags;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL season war tags elaboration error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //filters all the wars of the CWL season to find the ones with the correspondent CLAN TAG
  //returns an array which contains the wars battled by the clan in the season
  async warFilter(clanTag, season) {
    let correctClanWars = [];
    let allSeasonWarTags = await this.getCWLSeasonWarTags(clanTag, season);

    try {
      let clanTagToMatch = "#" + clanTag;
      // Iteration on every round (che è un oggetto)
      for (let round of allSeasonWarTags) {
        // Iteration of concurrent round
        //checks each warTag of the round
        for (let warTag of round.warTags) {
          //calls the war data from cache if already present, otherwise calls the API

          //O(1) lookup using object
          let war;
          if (this.warCache[warTag]) {
            war = this.warCache[warTag];
          } else {
            war = await cocApiClient.getWarData(warTag);
            this.warCache[warTag] = war;
          }

          /*
          O(N^2) lookup using array
          let cachedWar = this.warCache.find((w) => w.warTag === warTag);
          if (cachedWar !== undefined) {
            war = cachedWar.war;
          } else {
            war = await cocApiClient.getWarData(warTag);
            this.warCache.push({ warTag, war });
          }*/

          //if clanTag is found inside the war, the data of the war is saved in correctClanWars
          if (war.clan.tag === clanTagToMatch || war.opponent.tag === clanTagToMatch) {
            //creates an object that contains the correct war data and the war tag
            let warData = {
              warTag: warTag,
              war: war,
            };
            correctClanWars.push(warData);
            break; // Go to next round
          }
        }
      }
    } catch (error) {
      console.error("Error during war filtering:", error);
    }

    return correctClanWars;
  }

  async getWarsResults(clanTag, season) {
    const stdTag = standardizeTag(clanTag);
    let results = {
      wins: 0,
      losses: 0,
      draws: 0,
      gainedStars: 0,
      bonusStars: 0,
      totalStars: 0,
      totalPercentage: 0,
      clanPosition: null,
    };

    //TODO: implement wins, losses, draws calculation

    let wars = await this.warFilter(stdTag, season);
    //console.log("Filtered wars for clan " + clanTag + ": ", wars);

    // calculates total stars and total percentage
    for (let i = 0; i < wars.length; i++) {
      let warData = wars[i];
      let clanTagToMatch = "#" + stdTag;

      const correctWar = this.getClanFromCorrectSide(warData, clanTagToMatch);

      //checks if the correctWar exists
      if (correctWar) {
        results.gainedStars += correctWar.stars;
        results.totalPercentage += correctWar.destructionPercentage;

        // Esempio calcolo wins/loss (opzionale da implementare)
        // if(correctWar.stars > opponent.stars) results.wins++;

        //FINIRE
        //results.wins = results.wins += ;
        //results.losses = results.losses +=;
        //results.draws = results.draws +=;
      }
      console.log(correctWar);
    }
    return results;
  }

  async saveMembersData(clanTag, season) {
    let correctClanWars = await this.warFilter(clanTag, season);
    let clanTagToMatch = "#" + clanTag;
    let clanMembers = [];

    try {
      //for each round
      for (let i = 0; i < correctClanWars.length; i++) {
        let warData = correctClanWars[i];

        let members = this.getMembersFromCorrectSide(warData, clanTagToMatch);

        //starts to save each player as an object
        for (let j = 0; j < members.length; j++) {
          let member = members[j];

          let memberData = {
            tag: member.tag,
            name: member.name,
            townhallLevel: member.townhallLevel,
            mapPosition: member.mapPosition,
            totalPlayerStars: 0,
            totalPlayerPercentage: 0,
            attacks: member.attacks || [],

            /*
            not planning to implemente defences for now
            this is what is needed to implement them
            //opponentAttacks: member.opponentAttacks || 0,
            //bestOpponentAttack: member.bestOpponentAttack || null
            */
          };

          //to checks if player already exists in the saved array of player, saves the member index
          let existingIndex = clanMembers.findIndex((member) => member.tag === memberData.tag);

          if (existingIndex === -1) {
            //if player is not found, modifies the attacks property of memberData
            let attackData = this.tweakAttacksData(
              existingIndex,
              memberData,
              warData,
              member,
              i + 1
            );
            clanMembers.push(attackData);
          } else {
            //if player is found, updates totalPlayerStars and totalPlayerPercentage
            for (let k = 0; k < member.attacks?.length || 0; k++) {
              clanMembers[existingIndex].totalPlayerStars += member.attacks[k].stars;
              clanMembers[existingIndex].totalPlayerPercentage +=
                member.attacks[k].destructionPercentage;
            }

            //adds the new attacks to the existing player's attacks array (main difference with above)
            let attackData = this.tweakAttacksData(
              existingIndex,
              memberData,
              warData,
              member,
              i + 1
            );
            clanMembers[existingIndex].attacks.push(attackData);
          }
        }
      }
    } catch (error) {
      console.error("Errore durante il salvataggio dei dati dei giocatori:", error);
      return [];
    }
    return clanMembers;
  }

  //helper funtions for saveMembersData
  //returns the members array from the correct side of the war
  getMembersFromCorrectSide(warData, clanTagToMatch) {
    const correctClan = this.getClanFromCorrectSide(warData, clanTagToMatch);

    return correctClan.members;
  }

  //returns the clan data from the correct side of the war
  getClanFromCorrectSide(warData, clanTagToMatch) {
    if (warData.war.clan.tag === clanTagToMatch) {
      return warData.war.clan;
    } else {
      return warData.war.opponent;
    }
  }

  //modifies the attacks property of memberData
  tweakAttacksData(existingIndex, memberData, warData, member, warCounter) {
    memberData.attacks = (member.attacks || []).map((attack) => ({
      //copies attack properties
      ...attack,
      //adds war's wartag
      warTag: warData.warTag,
      //adds war's number
      warNumber: warCounter,
    }));

    //if player is not found
    if (existingIndex === -1) {
      for (let k = 0; k < member.attacks?.length || 0; k++) {
        memberData.totalPlayerStars += member.attacks[k].stars;
        memberData.totalPlayerPercentage += member.attacks[k].destructionPercentage;
      }

      return memberData;
    } else {
      let attacksWithWarInfo = (member.attacks || []).map((attack) => ({
        ...attack,
        warTag: warData.warTag,
        warNumber: warCounter,
      }));

      return attacksWithWarInfo;
    }
  }
}

module.exports = new CocDataProcessor();
