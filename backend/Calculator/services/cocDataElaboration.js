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
      let { data: cwlData } = await cocApiClient.getCurrentCWLSeasonData(clanTag);
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
          /*
          //to add
          totalStars
          totalPercentage
          clanPosition
          */
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
      //console.log('clantag to match: '+clanTagToMatch)

      // Iteration on every round (che è un oggetto)
      for (let round of allSeasonWarTags) {
        //console.log(`Processing round ${round.roundNumber}`);

        // Iteration of concurrent round
        for (let warTag of round.warTags) {
          //console.log(warTag)
          let war = await cocApiClient.getWarData(warTag);

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
      return [];
    }

    return correctClanWars;
  }

  //ridimensionare
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
            let attackData = this.tweakAttacksData(existingIndex, memberData, warData, member ,i+1);
            clanMembers.push(attackData);

          } else {

            //if player is found, updates totalPlayerStars and totalPlayerPercentage
            for (let k=0; k<member.attacks?.length || 0; k++) {
              clanMembers[existingIndex].totalPlayerStars += member.attacks[k].stars;
              clanMembers[existingIndex].totalPlayerPercentage += member.attacks[k].destructionPercentage;
            }

            //adds the new attacks to the existing player's attacks array (main difference with above)
            let attackData = this.tweakAttacksData(existingIndex, memberData, warData, member ,i+1);
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
    if (warData.war.clan.tag === clanTagToMatch) {
      return warData.war.clan.members;
    } else {
      return warData.war.opponent.members;
    }
  }
  //modifies the attacks property of memberData
  tweakAttacksData(existingIndex, memberData, warData, member ,warCounter) {

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
      for (let k=0; k<member.attacks?.length || 0; k++) {
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

      /*
      capire come implementare all'interno della funzione

      //if player is found, updates totalPlayerStars and totalPlayerPercentage
      for (let k=0; k<member.attacks?.length || 0; k++) {
        clanMembers[existingIndex].totalPlayerStars += member.attacks[k].stars;
        clanMembers[existingIndex].totalPlayerPercentage += member.attacks[k].destructionPercentage;
      }*/

      return attacksWithWarInfo;
    }
  }
}

module.exports = new CocDataProcessor();
