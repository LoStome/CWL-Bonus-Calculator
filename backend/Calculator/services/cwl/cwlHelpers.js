const { standardizeTag } = require("../../utils/tagUtils");

//====getCWLSeasonMainData Helpers====

//extracts ONLY the wars related to the specific clan from the full season structure.
//does NOT make additional API calls, uses the nested data in the season JSON.
function warFilter(cwlData, clanTag) {
  //If no valid data or rounds, returns empty array
  if (
    !cwlData ||
    !cwlData.rounds ||
    cwlData.state === "noSeasonData" ||
    cwlData.state === "error"
  ) {
    return [];
  }

  const stdClanTag = standardizeTag(clanTag);
  //creates final total war array
  const myWars = [];

  // iterates on each round
  cwlData.rounds.forEach((round) => {
    //iterates on each war of the round
    for (const warEntry of round.warTags) {
      //war entry is a complete object with all the war data in it
      //now there's no need to call API to retrieve data like the previous version (main difference)
      if (warEntry && typeof warEntry === "object" && warEntry.tag !== "#0") {
        const clanA = standardizeTag(warEntry.clan.tag);
        const clanB = standardizeTag(warEntry.opponent.tag);

        // Schecks wheter the clan is one of the two participants in the war
        if (clanA === stdClanTag || clanB === stdClanTag) {
          //saves the war object if present
          myWars.push({
            warTag: warEntry.tag,
            war: warEntry,
          });

          //if the war is found, immediatly skips to the next round to save time
          break;
        }
      }
    }
  });

  return myWars;
}

function getWarsResults(cwlData, clanTag) {
  const stdTag = standardizeTag(clanTag);
  const wars = warFilter(cwlData, clanTag);

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

  for (const warData of wars) {
    const myClan = getClanFromCorrectSide(warData.war, stdTag);

    //finds the opp for the war to confront the scores
    const opponentTag =
      standardizeTag(warData.war.clan.tag) === stdTag ? warData.war.opponent : warData.war.clan;

    //defines stars and % for the war
    results.gainedStars += myClan.stars;
    results.totalPercentage += myClan.destructionPercentage;

    // Calculate Win/Loss/Draw
    if (myClan.stars > opponentTag.stars) {
      results.wins++;
    } else if (myClan.stars < opponentTag.stars) {
      results.losses++;
    } else {
      // if stars are equal, check destruction percentage
      if (myClan.destructionPercentage > opponentTag.destructionPercentage) results.wins++;
      else if (myClan.destructionPercentage < opponentTag.destructionPercentage) results.losses++;
      else results.draws++;
    }
  }

  //for each win 10 stars are assigned as a bonus
  results.bonusStars = results.wins * 10;
  results.totalStars = results.gainedStars + results.bonusStars;

  return results;
}

function calculateClansPosition(cwlMainData) {
  //creates orderable arrays
  const sortedClans = [...cwlMainData.clans].sort((a, b) => {
    //orders for the number of stars (decreasing order)
    if (b.results.totalStars !== a.results.totalStars) {
      return b.results.totalStars - a.results.totalStars;
    }
    //if the number of stars is the same, orders with percentage (decreasing order)
    return b.results.totalPercentage - a.results.totalPercentage;
  });

  //assigns the position for each clan in the originally given data
  //based on the sortedClans object
  sortedClans.forEach((clan, index) => {
    clan.results.clanPosition = index + 1;
  });

  return cwlMainData;
}

//====saveMembersData Helpers====

//tweaks data attacks for each player
function tweakPlayerAttacks(member, warTag, warNumber) {
  // if there are no attacks for the war (the player has not attacked)
  // an empty array is returned
  if (!member.attacks) return [];

  return member.attacks.map((attack) => ({
    ...attack, //copies existings properties (stars, destructionPercentage, etc.)
    //adds each war data to keep track of it
    warTag: warTag,
    warNumber: warNumber,
  }));
}

function getClanFromCorrectSide(warData, clanTagToMatch) {
  // Accepts either a { war: ... } structure or the war object directly.
  const war = warData.war || warData;

  // standardizes for security porpuses
  const matchTag = standardizeTag(clanTagToMatch);
  const clanTag = standardizeTag(war.clan.tag);

  if (clanTag === matchTag) {
    return war.clan;
  } else {
    return war.opponent;
  }
}

//returns the array of member of the correct clan
function getMembersFromCorrectSide(warData, clanTagToMatch) {
  const correctClan = getClanFromCorrectSide(warData, clanTagToMatch);
  return correctClan.members;
}

module.exports = {
  warFilter,
  getWarsResults,
  calculateClansPosition,
  tweakPlayerAttacks,
  getClanFromCorrectSide,
  getMembersFromCorrectSide,
};
