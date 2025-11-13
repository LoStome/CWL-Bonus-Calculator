


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
