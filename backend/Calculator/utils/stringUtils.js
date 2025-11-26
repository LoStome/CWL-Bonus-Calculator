//TO STRINGS FOR DEBUGGING PURPOSES
/*
//does not make sense to have
//have to decide if i'm gonna delete this for cleaner code
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
}*/

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

module.exports = {
  //warTagsToString,
  correctClanWarsToString,
  savedPlayerDataToString,
};
