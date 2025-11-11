// LIBRERIE
require("dotenv").config();
const axios = require("axios");
//const clashApi = require('clashofclans.js')

// API KEYS
const COC_API_KEY = process.env.COC_API_TOKEN; //official CoC api

// API URLs
const CLASHKING_BASE_URL = "https://api.clashk.ing";
const OFFICIAL_COC_API_URL = "https://api.clashofclans.com/v1/";

//INSTANZE API
//OFFICIAL COC API
const officialCocClient = axios.create({
  baseURL: OFFICIAL_COC_API_URL,
  headers: {
    Authorization: `Bearer ${COC_API_KEY}`,
    Accept: "application/json",
    "User-Agent": "CWL Bonus Calculator (Discord: lo_stome)",
  },
});

//CLASH KING API
//IMPORTANTE!
//CLASH KING NON USA '#' NEI TAG
const clashKingClient = axios.create({
  baseURL: CLASHKING_BASE_URL,
  headers: {
    Accept: "application/json",
    "User-Agent": "CWL Bonus Calculator (Discord: lo_stome)",
  },
});
//FINE INSTANZE API

// TAGS PER PRODUZIONE
//note: i tag per l'API kings devono essere senza '#' mentre per l'API ufficiale devono comprendere "#" e poi essere codificate con encodeURIComponent(tag)
const C_ItalianArmyTag = "2RPVPQLYJ";
const P_Lore = "C0UUYY2R";
const CWL_IAtag = "8QGGJQ8CY";

//METODI DI PROVA
//API UFFICIALE
async function showPlayerInfo(playerTag) {
  console.log("player tag passato= " + playerTag);
  try {
    //transformo il tag perche' uso l'API UFFICIALE
    const response = await officialCocClient.get(
      `/players/${transformTag(playerTag)}`
    );
    console.log("Player CoC API Ufficiale:", response.data);
    return response.data;
  } catch (error) {
    console.error(
      `Errore nel recupero dati del giocatore:\n ERROR MSG =`,
      error.response?.data || error.message
    );
  }
}

//API KINGS

async function ShowPlayerInfoKING(tag) {
  try {
    let playerInfo = await clashKingClient.get(`/player/${tag}/stats`)(tag);
    console.log("(CLASH KING) this is the player info:", playerInfo);
  } catch (error) {
    console.error(error);
  }
}

async function getCurrentSeasonCWLWarTags(clanTag) {
  try {
    //gets API data
    let response = await clashKingClient.get(`/cwl/${clanTag}/group`);
    let cwlData = response.data;
    //console.log("Info gruppo CWL:", cwlData);

    let allWarTags = [];

    cwlData.data.rounds.forEach(function (round, roundIndex) {
      //Creates an object for each round with its WarTags in it
      let roundData = {
        roundNumber: roundIndex + 1,

        //warTags: round.warTags.filter(warTag => warTag && warTag !== '#0')
        warTags: round.warTags
          //#0 are invalid war for CoC's API, so they are filtered out
          .filter((warTag) => warTag && warTag !== "#0")
          // removes # to standardize all tags
          .map((warTag) => warTag.replace("#", "")),
      };
      //console.log("Round creato:", roundData.roundNumber);
      allWarTags.push(roundData);
    });
    return allWarTags;
  } catch (error) {
    console.error(
      "Errore nel recupero dati CWL:" + "\n ERROR MSG =",
      error.response?.data || error.message
    );
  }
}

//Ritorna i dati della war con war tag associato
async function getWarData(warTag) {
  try {
    //transformo il tag perche' uso l'API UFFICIALE
    let response = await officialCocClient.get(
      `/clanwarleagues/wars/${transformTag(warTag)}`
    );
    let warData = response.data;
    //console.log("Dati della War " + warTag, warData);
    return warData;
  } catch (error) {
    console.error(
      "Errore nel recupero dati della War " + warTag + "\n ERROR MSG =",
      error.response?.data || error.message
    );
  }
}

//filters all the wars of the CWL season to find the ones with the correspondent CLAN TAG
//returns an array which contains the wars battled by the clan in the season
async function warFilter(clanTag) {
  let correctClanWars = [];
  let allSeasonWarTags = await getCurrentSeasonCWLWarTags(clanTag);
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
        let war = await getWarData(warTag);

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
    console.error("Errore durante il filtraggio delle guerre:", error);
    return [];
  }

  return correctClanWars;
}

async function savedPlayerData(clanTag) {
  let correctClanWars = await warFilter(clanTag);
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

//input tag without '#', output encoded tag with #
//the output is used for the official CoC API
//in this way the tag can always be passed in it's normal form and then converted for each function if needed
function transformTag(tag) {
  let transformedTag = encodeURIComponent("#" + tag);
  return transformedTag;
}

//TO STRINGS
function warTagsToString(warTagsData) {
  let result = "=== CWL WAR TAGS ===\n";

  warTagsData.forEach((round) => {
    result += `\n📅 ROUND ${round.roundNumber}:\n`;

    if (round.warTags.length > 0) {
      round.warTags.forEach((warTag, warIndex) => {
        result += `   Guerra ${warIndex + 1}: ${warTag}\n`;
      });
    } else {
      result += "   Nessuna guerra in questo round\n";
    }
  });

  return result;
}

function correctClanWarsToString(correctClanWars) {
  let result = "=== Correct Clan Wars ===\n";

  for (let i = 0; i < correctClanWars.length; i++) {
    let warData = correctClanWars[i];
    result += `Guerra ${i + 1} (${warData.warTag}):\n`;
    result += `  Clan: ${warData.war.clan.name} (${warData.war.clan.tag}) vs ${warData.war.opponent.name} (${warData.war.opponent.tag})\n`;
  }

  return result;
}

function savedPlayerDataToString(clanMembers) {
  let result = "=== CLAN MEMBERS DATA ===\n";

  for (let i = 0; i < clanMembers.length; i++) {
    let member = clanMembers[i];
    result += `Member ${i + 1}: ${member.name} (${member.tag})\n`;
    result += `  Townhall: ${member.townhallLevel}, Position: ${member.mapPosition}\n`;
    result += `  Total Attacks: ${member.attacks.length}\n`;

    // Calcola le stelle totali con ciclo for
    let totalStars = 0;
    for (let j = 0; j < member.attacks.length; j++) {
      totalStars += member.attacks[j].stars;
    }
    result += `  Total Stars: ${totalStars}\n`;

    // Raggruppa attacchi per guerra
    let attacksByWar = {};
    member.attacks.forEach((attack) => {
      let warKey = `${attack.warNumber} (${attack.warTag})`;
      if (!attacksByWar[warKey]) attacksByWar[warKey] = [];
      attacksByWar[warKey].push(attack);
    });

    // Mostra attacchi per guerra con stelle per guerra
    Object.keys(attacksByWar).forEach((warKey) => {
      let warStars = 0;
      for (let k = 0; k < attacksByWar[warKey].length; k++) {
        warStars += attacksByWar[warKey][k].stars;
      }
      result += `  War ${warKey}: ${attacksByWar[warKey].length} attacks, ${warStars} stars\n`;
      attacksByWar[warKey].forEach((attack) => {
        result += `    vs ${attack.defenderTag}: ${attack.stars} stars, ${attack.destructionPercentage}%\n`;
      });
    });

    result += "------------------------\n";
  }

  result += `Total members: ${clanMembers.length}\n`;
  return result;
}

// MAIN:

async function main() {
  //let warTagsData = await getCurrentSeasonCWLWarTags(C_ItalianArmyTag);
  //console.log(warTagsToString(warTagsData))

  //let correctClanWars = await warFilter(C_ItalianArmyTag);
  //console.log(correctClanWarsToString(correctClanWars));
  //let randomclan = "8PYC0G2Y";

  let savedPlayerData1 = await savedPlayerData(C_ItalianArmyTag);
  console.log(savedPlayerDataToString(savedPlayerData1));

  //showPlayerInfo("2UPPCGV9");
  //ShowPlayerInfoKING(P_Lore);
}
main();
