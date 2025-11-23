const cocApiClient = require("./cocApiClient");
const { transformTag, standardizeTag } = require("../utils/tagUtils");

//--------DATA ELABORATION--------

class CocDataProcessor {
  /*trying to implement a way to call the cocApiClient only once for each tag
    instead of twice (getCurrentCWLSeasonMainData and getCurrentCWLSeasonWarTags)  
    
    if done like this it would not work when receiving the second clan's tag
    would return the first clan's data
  */
  constructor() {
    this.cwlData = null; // Cache per i dati del gruppo (season)
    //this.warCache = [];
    this.warCache = {}; // key: warTag, value: warData
  }

  /*async saveCurrentSeasonData(clanTag) {
    if (this.cwlData == null) {
      this.cwlData = await cocApiClient.getCurrentCWLSeasonData(clanTag);
    }
    return this.cwlData;
  }*/

  async getCurrentCWLSeasonMainData(clanTag) {
    try {
      let { data: cwlData } = await cocApiClient.getCurrentCWLSeasonData(clanTag);
      //console.log("CWL Data: ", cwlData);

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
            totalStars: 0,
            totalPercentage: 0,
            clanPosition: null,
          },
        };

        //gets the wars results for the clan
        const warResults = await this.getWarsResults(clanData.tag);
        clanData.results.totalStars = warResults.totalStars;
        clanData.results.totalPercentage = warResults.totalPercentage;

        //TODO: implementare la posizione del clan nella classifica
        //clanData.results.clanPosition = warResults.clanPosition;

        //adds the clanData to the cwlMainData
        cwlMainData.clans.push(clanData);
      }

      //console.log(this.warCache);

      //console.log("CWL Main Data: ", cwlMainData);
      return cwlMainData;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Current CWL season main data elaboration error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  async getCurrentCWLSeasonWarTags(clanTag) {
    try {
      let { data: cwlData } = await cocApiClient.getCurrentCWLSeasonData(clanTag);
      //console.log("CWL Data: ", cwlData);

      let allWarTags = [];

      cwlData.rounds.forEach(function (round, roundIndex) {
        //Creates an object for each round with its WarTags in it
        let roundData = {
          roundNumber: roundIndex + 1,

          warTags: round.warTags

            //#0 are invalid war for CoC's api, so they are filtered out
            //.filter((warTag) => warTag && warTag !== "#0")
            .map((warTag) => standardizeTag(warTag)),
        };
        //console.log("Round created:", roundData.roundNumber);
        allWarTags.push(roundData);
      });
      //console.log("all War Tags: ", allWarTags);
      return allWarTags;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Current CWL season war tags elaboration error: ${
          error.response?.data?.message || error.message
        }`
      );
    }
  }

  //filters all the wars of the CWL season to find the ones with the correspondent CLAN TAG
  //returns an array which contains the wars battled by the clan in the season
  async warFilter(clanTag) {
    let correctClanWars = [];
    let allSeasonWarTags = await this.getCurrentCWLSeasonWarTags(clanTag);
    //console.log('clantag to find: '+clanTag)

    try {
      let clanTagToMatch = "#" + clanTag;
      // Iteration on every round (che è un oggetto)
      for (let round of allSeasonWarTags) {
        //console.log(`Processing round ${round.roundNumber}`);

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
            //console.log("clan found in war: "+warTag)
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

  async getWarsResults(clanTag) {
    let results = {
      totalStars: 0,
      totalPercentage: 0,
      clanPosition: null,
    };

    let wars = await this.warFilter(standardizeTag(clanTag));

    // calculates total stars and total percentage

    for (let i = 0; i < wars.length; i++) {
      let warData = wars[i];
      let clanTagToMatch = "#" + clanTag;

      console.log(warData);

      const correctWar = this.getClanFromCorrectSide(warData, clanTagToMatch);

      results.totalStars = results.totalStars += correctWar.stars;
      results.totalPercentage = results.totalPercentage += correctWar.destructionPercentage;
    }

    return results;
  }

  async saveMembersData(clanTag) {
    let correctClanWars = await this.warFilter(clanTag);
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
