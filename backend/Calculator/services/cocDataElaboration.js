const cocApiClient = require("./cocApiClient");
const { transformTag, standardizeTag } = require("../utils/tagUtils");

//--------DATA ELABORATION--------

class CocDataProcessor {
  /*trying to implement a way to call the cocApiClient only once for each tag
    instead of twice (getCurrentCWLSeasonMainData and getCurrentCWLSeasonWarTags)  
    
    if done like this it would not work when receiving the second clan's tag
    would return the first clan's data
  
  constructor() {
    this.cwlData = null;
  }

  async saveCurrentSeasonData(clanTag) {
    if (this.cwlData == null) {
      this.cwlData = await cocApiClient.getCurrentCWLSeasonData(clanTag);
    }
    return this.cwlData;
  } */

  async getCurrentCWLSeasonMainData(clanTag) {
    try {
      let { data: cwlData } = await cocApiClient.getCurrentCWLSeasonData(
        clanTag
      );
      //console.log("CWL Data: ", cwlData);

      let cwlMainData = {
        state: cwlData.state,
        season: cwlData.season,
        clans: [],
      };

      cwlData.clans.forEach((clan) => {
        const clanData = {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
        };
        cwlMainData.clans.push(clanData);
      });

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
      let { data: cwlData } = await cocApiClient.getCurrentCWLSeasonData(
        clanTag
      );
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
      //console.log('clantag to match: '+clanTagToMatch)

      // Iteration on every round (che è un oggetto)
      for (let round of allSeasonWarTags) {
        //console.log(`Processing round ${round.roundNumber}`);

        // Iteration of concurrent round
        for (let warTag of round.warTags) {
          //console.log(warTag)
          let war = await cocApiClient.getWarData(warTag);

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

  async savePlayerData(clanTag) {
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

module.exports = new CocDataProcessor();
