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
  const myWars = [];

  // Iteriamo su ogni round
  cwlData.rounds.forEach((round) => {
    // Iteriamo su ogni guerra nel round
    for (const warEntry of round.warTags) {
      // NEW JSON SUPPORT: warEntry è un oggetto completo, non una stringa
      if (warEntry && typeof warEntry === "object" && warEntry.tag !== "#0") {
        const clanA = standardizeTag(warEntry.clan.tag);
        const clanB = standardizeTag(warEntry.opponent.tag);

        // Se il nostro clan è uno dei due partecipanti
        if (clanA === stdClanTag || clanB === stdClanTag) {
          myWars.push({
            warTag: warEntry.tag,
            war: warEntry, // Salviamo l'intero oggetto guerra già presente
          });
          break; // Trovata la guerra del mio clan in questo round, passo al prossimo round
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

    // Troviamo l'avversario per confrontare i punteggi
    const opponentTag =
      standardizeTag(warData.war.clan.tag) === stdTag ? warData.war.opponent : warData.war.clan;

    // Somma statistiche
    results.gainedStars += myClan.stars;
    results.totalPercentage += myClan.destructionPercentage;

    // Calcolo Vittoria/Sconfitta
    if (myClan.stars > opponentTag.stars) {
      results.wins++;
    } else if (myClan.stars < opponentTag.stars) {
      results.losses++;
    } else {
      if (myClan.destructionPercentage > opponentTag.destructionPercentage) results.wins++;
      else if (myClan.destructionPercentage < opponentTag.destructionPercentage) results.losses++;
      else results.draws++;
    }
  }

  results.bonusStars = results.wins * 10;
  results.totalStars = results.gainedStars + results.bonusStars;

  return results;
}

function calculateClansPosition(cwlMainData) {
  // 1. Creiamo un array ordinabile
  const sortedClans = [...cwlMainData.clans].sort((a, b) => {
    // Ordina per stelle (decrescente)
    if (b.results.totalStars !== a.results.totalStars) {
      return b.results.totalStars - a.results.totalStars;
    }
    // Se stelle uguali, ordina per percentuale (decrescente)
    return b.results.totalPercentage - a.results.totalPercentage;
  });

  // 2. Assegniamo la posizione basata sull'indice nell'array ordinato
  // Nota: Modifichiamo l'oggetto originale per riferimento
  sortedClans.forEach((clan, index) => {
    clan.results.clanPosition = index + 1;
  });

  return cwlMainData;
}

//====saveMembersData Helpers====

// Formatta i dati degli attacchi per il singolo player
function formatPlayerAttacks(member, warTag, warNumber) {
  if (!member.attacks) return [];

  return member.attacks.map((attack) => ({
    ...attack, // Copia proprietà esistenti (stars, destructionPercentage, etc.)
    warTag: warTag,
    warNumber: warNumber,
  }));
}

function getClanFromCorrectSide(warData, clanTagToMatch) {
  // Nel nuovo JSON, warData è direttamente l'oggetto war
  // Supportiamo sia se passiamo { war: ... } sia se passiamo l'oggetto war diretto
  const war = warData.war || warData;

  // Standardizziamo per sicurezza
  const matchTag = standardizeTag(clanTagToMatch);
  const clanTag = standardizeTag(war.clan.tag);

  if (clanTag === matchTag) {
    return war.clan;
  } else {
    return war.opponent;
  }
}

// Restituisce l'array dei membri dal lato corretto
function getMembersFromCorrectSide(warData, clanTagToMatch) {
  const correctClan = getClanFromCorrectSide(warData, clanTagToMatch);
  return correctClan.members;
}

module.exports = {
  warFilter,
  getWarsResults,
  calculateClansPosition,
  formatPlayerAttacks,
  getClanFromCorrectSide,
  getMembersFromCorrectSide,
};
