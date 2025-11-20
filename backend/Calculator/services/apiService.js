//vecchio file da confrontare per costruire i nuovi
//potrebbe anche essere eliminato

const { officialCocClient, clashKingClient } = require("../config/api");
const { transformTag, standardizeTag } = require("../utils/tagUtils");

class ApiService {
  //OFFICIAL CoC API
  //returns the data of the player json
  async getPlayerInfo(playerTag) {
    //console.log("passed player tag= " + playerTag);
    try {
      //tranforms the tag because it's using official COC API
      const response = await officialCocClient.get(
        `/players/${transformTag(playerTag)}`
      );
      //console.log("Player CoC API Ufficiale:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error getting player data:",
        error.response?.data || error.message
      );
      throw new Error(
        `Player API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //returns the data of the clan (json)
  async getClanInfo(clanTag) {
    //console.log("passed clan tag= " + clanTag);
    //console.log("transformed clan tag: " + transformTag(clanTag));
    try {
      //tranforms the tag because it's using official COC API
      const response = await officialCocClient.get(
        `/clans/${transformTag(clanTag)}`
      );
      //console.log("Player CoC API Ufficiale:", response.data);
      return response.data;
    } catch (error) {
      console.error(
        "Error getting clan data:",
        error.response?.data || error.message
      );
      throw new Error(
        `Clan API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //return the war data of the inputted war tag
  async getWarData(warTag) {
    try {
      let response = await officialCocClient.get(
        `/clanwarleagues/wars/${transformTag(warTag)}`
      );
      let warData = response.data;
      //console.log("War Data of war: " + warTag, warData);
      return warData;
    } catch (error) {
      console.error(
        "Error getting war data:",
        error.response?.data || error.message
      );
      throw new Error(
        `War API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //API CLASH KING
  //funzione di prova
  async getPlayerInfoKINGS(tag) {
    try {
      let playerInfo = await clashKingClient.get(`/player/${tag}/stats`)(tag);
      console.log("(CLASH KING) this is the player info:", playerInfo);
    } catch (error) {
      console.error(error);
      throw new Error(
        `Player API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  async getCurrentSeasonCWLWarTags(clanTag) {
    try {
      //gets API data
      let response = await clashKingClient.get(`/cwl/${clanTag}/group`);
      let cwlData = response.data;
      //console.log("CWL Data: ", cwlData);

      let allWarTags = [];

      cwlData.data.rounds.forEach(function (round, roundIndex) {
        //Creates an object for each round with its WarTags in it
        let roundData = {
          roundNumber: roundIndex + 1,

          //warTags: round.warTags.filter(warTag => warTag && warTag !== '#0')
          warTags: round.warTags
            //#0 are invalid war for CoC's API, so they are filtered out
            .filter((warTag) => warTag && warTag !== "#0")
            //since tag is used, it gets standardized
            .map((warTag) => standardizeTag(warTag)),
        };
        //console.log("Round created:", roundData.roundNumber);
        allWarTags.push(roundData);
      });
      return allWarTags;
    } catch (error) {
      console.error(
        "Error getting CWL data:",
        error.response?.data || error.message
      );
      throw new Error(
        `CWL API error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //--------DATA ELABORATION--------

  //filters all the wars of the CWL season to find the ones with the correspondent CLAN TAG
  //returns an array which contains the wars battled by the clan in the season
  async warFilter(clanTag) {
    let correctClanWars = [];
    let allSeasonWarTags = await this.getCurrentSeasonCWLWarTags(clanTag);
    //console.log('clantag to find: '+clanTag)

    try {
      let clanTagToMatch = "#" + clanTag;
      //console.log('clantag to match: '+clanTagToMatch)

      // Iteration on every round (che è un oggetto)
      for (let round of allSeasonWarTags) {
        //console.log(`Processing round ${round.roundNumber}`);

        // Iteration of concurrent round
        for (let warTag of round.warTags) {
          //console.log(warTag)
          let war = await this.getWarData(warTag);

          //if clanTag is found inside the war, the data of the war is saved in correctClanWars
          if (
            war.clan.tag === clanTagToMatch ||
            war.opponent.tag === clanTagToMatch
          ) {
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
      return [];
    }

    return correctClanWars;
  }

  async savedPlayerData(clanTag) {
    let correctClanWars = await this.warFilter(clanTag);
    let clanTagToMatch = "#" + clanTag;
    //console.log('clantag to match: '+clanTagToMatch)
    let clanMembers = [];

    try {
      //for each round
      for (let i = 0; i < correctClanWars.length; i++) {
        let warData = correctClanWars[i];

        let members;
        //console.log("\nWar N: " + (i + 1));
        //checks which is the correct clan from where to save player data for this round
        if (warData.war.clan.tag === clanTagToMatch) {
          members = warData.war.clan.members;
        } else {
          members = warData.war.opponent.members;
        }

        //starts to save each player as an object
        for (let j = 0; j < members.length; j++) {
          let member = members[j];

          let memberData = {
            tag: member.tag,
            name: member.name,
            townhallLevel: member.townhallLevel,
            mapPosition: member.mapPosition,
            attacks: member.attacks || [],
            /*
          defences not implemented
          opponentAttacks: member.opponentAttacks || 0,
          bestOpponentAttack: member.bestOpponentAttack || null
          */
          };

          // to checks if player already exists, saves member index
          let existingIndex = clanMembers.findIndex(
            (member) => member.tag === memberData.tag
          );

          //console.log("Player N " + (j + 1) + " = " + member.name);
          //checks if the player already exists with it's tag
          if (existingIndex === -1) {
            //modifies the attacks property of memberData
            memberData.attacks = (member.attacks || []).map((attack) => ({
              ...attack, //copies attack properties
              warTag: warData.warTag, //adds war's wartag
              warNumber: i + 1, //adds war's number
            }));
            //adds player to the list
            clanMembers.push(memberData);
            /*console.log(
            "New member added: " +
              member.name +
              ": added  " +
              (member.attacks?.length || 0) +
              " attacks\n"
          );*/
          } else {
            //adds war attacks to the already added player
            let attacksWithWarInfo = (member.attacks || []).map((attack) => ({
              ...attack,
              warTag: warData.warTag,
              warNumber: i + 1,
            }));

            clanMembers[existingIndex].attacks.push(...attacksWithWarInfo);
            /*
          console.log(
            "Already existing member, added " +
              (member.attacks?.length || 0) +
              " attacks\n"
          );
          */
          }
        }
      }
    } catch (error) {
      console.error(
        "Errore durante il salvataggio dei dati dei giocatori:",
        error
      );
      return [];
    }
    return clanMembers;
  }
}

module.exports = new ApiService();
