/*
 * Refactored Code for retrieving CWL data based only on the clanTag,
 * utilizing the official COC API endpoint for the concurrent league group.
 * The 'season' parameter has been removed from all methods.
 */

// Si assume che questi moduli siano disponibili nell'ambiente di esecuzione (es. Node.js)
const cocApiClient = require("../../cocApiClient");
const { transformTag, standardizeTag } = require("../../../utils/tagUtils");

//--------DATA ELABORATION--------

class currentCWLProcessor {
  constructor() {
    // Cache per i dati del gruppo CWL corrente, chiave: standardizedTag
    // Struttura: { "TAG": { ...current_season_data... } }
    this.cwlDataCache = {};

    // Cache per i dati delle singole guerre (war tags), chiave: warTag
    this.warCache = {};
  }

  // Helper per assicurare il recupero dei dati del gruppo CWL corrente (caching basato sul clan tag)
  async _ensureCurrentLeagueGroupData(clanTag) {
    const stdTag = standardizeTag(clanTag);

    // 1. Controlla se i dati del gruppo CWL corrente per questo clan sono in cache
    if (this.cwlDataCache[stdTag]) {
      return this.cwlDataCache[stdTag];
    }

    try {
      // 2. Chiama la nuova API che ritorna solo i dati del gruppo CWL attuale
      const response = await cocApiClient.getCurrentCWLSeasonData(stdTag);

      // Gestione del caso in cui il clan non è in CWL o l'API non ha dati (es. state: 'notInWar')
      if (!response || response.state === "notInWar") {
        console.warn(`CWL Data not found for ${stdTag}. Returning 'noSeasonData'.`);
        // fake data structure to indicate no season data
        return { state: "noSeasonData" };
      }

      // 3. Salva nella cache e ritorna
      this.cwlDataCache[stdTag] = response;
      return response;
    } catch (error) {
      console.error(`Error fetching current CWL data for ${stdTag}:`, error.message);
      return { state: "error", message: error.message };
    }
  }

  // Funzione principale: elabora i dati del gruppo CWL corrente
  async getCWLSeasonMainData(clanTag) {
    try {
      // Chiama la funzione di caching (ora solo con clanTag)
      let cwlData = await this._ensureCurrentLeagueGroupData(clanTag);

      if (cwlData.state === "noSeasonData" || cwlData.state === "error") {
        throw new Error(cwlData.message || "No current season data available");
      }

      let cwlMainData = {
        state: cwlData.state,
        season: cwlData.season, // 'season' è ancora presente nella response API
        clans: [],
      };

      for (let clan of cwlData.clans) {
        let clanData = {
          tag: clan.tag,
          name: clan.name,
          clanLevel: clan.clanLevel,
          badgeUrls: clan.badgeUrls,
          results: null, // to be filled later
        };

        // Chiamata a getWarsResults senza 'season'
        const warResults = await this.getWarsResults(clanData.tag);

        clanData.results = warResults;
        cwlMainData.clans.push(clanData);
      }

      cwlMainData = this.calculateClansPosition(cwlMainData);

      return cwlMainData;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL season main data elaboration error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // Ordina i clan in base a stelle totali e percentuale e assegna la posizione
  calculateClansPosition(cwlMainData) {
    let clans = {};

    cwlMainData.clans.forEach((clan) => {
      clans[clan.tag] = {
        totalStars: clan.results.totalStars,
        totalPercentage: clan.results.totalPercentage,
      };
    });

    let sortedClans = Object.entries(clans).sort((a, b) => {
      if (b[1].totalStars === a[1].totalStars) {
        return b[1].totalPercentage - a[1].totalPercentage;
      }
      return b[1].totalStars - a[1].totalStars;
    });

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

  // Ottiene i tag delle guerre della stagione corrente
  async getCWLSeasonWarTags(clanTag) {
    // RIMOSSO SEASON
    try {
      let cwlData = await this._ensureCurrentLeagueGroupData(clanTag); // CHIAMATA AGGIORNATA

      if (!cwlData || !cwlData.rounds) {
        return [];
      }

      let allWarTags = [];

      cwlData.rounds.forEach(function (round, roundIndex) {
        let roundData = {
          roundNumber: roundIndex + 1,
          warTags: round.warTags

            // NEW CODE TO HANDLE BOTH OLD AND NEW JSON FORMATS
            .map((warEntry) => {
              if (warEntry && typeof warEntry === "object") {
                return warEntry.tag;
              }
              return warEntry;
            })
            .filter((tagString) => tagString && tagString !== "#0")
            .map((tagString) => standardizeTag(tagString)),
        };

        allWarTags.push(roundData);
      });
      return allWarTags;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL season war tags elaboration error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  // Filtra tutte le guerre per trovare quelle del CLAN TAG corrispondente
  async warFilter(clanTag) {
    // RIMOSSO SEASON
    let correctClanWars = [];
    let allSeasonWarTags = await this.getCWLSeasonWarTags(clanTag); // CHIAMATA AGGIORNATA

    try {
      let clanTagToMatch = "#" + clanTag;

      for (let round of allSeasonWarTags) {
        for (let warTag of round.warTags) {
          let war;

          if (this.warCache[warTag]) {
            war = this.warCache[warTag];
          } else {
            // Utilizza l'API per i dati della guerra CWL corrente
            war = await cocApiClient.getCurrentCWLSeasonWarData(warTag);
            this.warCache[warTag] = war;
          }

          if (war.clan.tag === clanTagToMatch || war.opponent.tag === clanTagToMatch) {
            let warData = {
              warTag: warTag,
              war: war,
            };
            correctClanWars.push(warData);
            break; // Passa al round successivo (assumendo una sola guerra per clan per round)
          }
        }
      }
    } catch (error) {
      console.error("Error during war filtering:", error);
    }

    return correctClanWars;
  }

  // Calcola i risultati totali (W/L/D, stelle, percentuale) per il clan
  async getWarsResults(clanTag) {
    // RIMOSSO SEASON
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

    let wars = await this.warFilter(stdTag); // CHIAMATA AGGIORNATA

    for (let i = 0; i < wars.length; i++) {
      let warData = wars[i];
      let clanTagToMatch = "#" + stdTag;

      let myClan, opponentClan;
      if (warData.war.clan.tag === clanTagToMatch) {
        myClan = warData.war.clan;
        opponentClan = warData.war.opponent;
      } else {
        myClan = warData.war.opponent;
        opponentClan = warData.war.clan;
      }

      results.gainedStars += myClan.stars;
      results.totalPercentage += myClan.destructionPercentage;

      if (myClan.stars > opponentClan.stars) {
        results.wins++;
      } else if (myClan.stars < opponentClan.stars) {
        results.losses++;
      } else {
        if (myClan.destructionPercentage > opponentClan.destructionPercentage) {
          results.wins++;
        } else if (myClan.destructionPercentage < opponentClan.destructionPercentage) {
          results.losses++;
        } else {
          results.draws++;
        }
      }
    }

    // Calcoli finali
    results.bonusStars = results.wins * 10;
    results.totalStars = results.gainedStars + results.bonusStars;

    return results;
  }

  // Salva i dati di tutti i membri che hanno partecipato alle guerre
  async saveMembersData(clanTag) {
    // RIMOSSO SEASON
    let correctClanWars = await this.warFilter(clanTag); // CHIAMATA AGGIORNATA
    let clanTagToMatch = "#" + clanTag;
    let clanMembers = [];

    try {
      for (let i = 0; i < correctClanWars.length; i++) {
        let warData = correctClanWars[i];
        let members = this.getMembersFromCorrectSide(warData, clanTagToMatch);

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
          };

          let existingIndex = clanMembers.findIndex((member) => member.tag === memberData.tag);

          if (existingIndex === -1) {
            let attackData = this.tweakAttacksData(
              existingIndex,
              memberData,
              warData,
              member,
              i + 1
            );
            clanMembers.push(attackData);
          } else {
            for (let k = 0; k < member.attacks?.length || 0; k++) {
              clanMembers[existingIndex].totalPlayerStars += member.attacks[k].stars;
              clanMembers[existingIndex].totalPlayerPercentage +=
                member.attacks[k].destructionPercentage;
            }

            let attackData = this.tweakAttacksData(
              existingIndex,
              memberData,
              warData,
              member,
              i + 1
            );
            // Il tweakAttacksData ritorna un array di attacchi modificati
            // Dobbiamo estrarre gli elementi e aggiungerli all'array esistente
            if (Array.isArray(attackData)) {
              clanMembers[existingIndex].attacks.push(...attackData);
            }
          }
        }
      }
    } catch (error) {
      console.error("Errore durante il salvataggio dei dati dei giocatori:", error);
      return [];
    }
    return clanMembers;
  }

  //=====Helper functions=====
  // Ritorna l'array dei membri del clan corretto
  getMembersFromCorrectSide(warData, clanTagToMatch) {
    const correctClan = this.getClanFromCorrectSide(warData, clanTagToMatch);
    return correctClan.members;
  }

  // Ritorna l'oggetto clan corretto
  getClanFromCorrectSide(warData, clanTagToMatch) {
    if (warData.war.clan.tag === clanTagToMatch) {
      return warData.war.clan;
    } else {
      return warData.war.opponent;
    }
  }

  // Modifica gli attacchi aggiungendo warTag e warNumber
  tweakAttacksData(existingIndex, memberData, warData, member, warCounter) {
    let attacksWithWarInfo = (member.attacks || []).map((attack) => ({
      ...attack,
      warTag: warData.warTag,
      warNumber: warCounter,
    }));

    // Se il giocatore è nuovo
    if (existingIndex === -1) {
      for (let k = 0; k < member.attacks?.length || 0; k++) {
        memberData.totalPlayerStars += member.attacks[k].stars;
        memberData.totalPlayerPercentage += member.attacks[k].destructionPercentage;
      }

      // Sostituisci l'array di attacchi originale con l'array modificato
      memberData.attacks = attacksWithWarInfo;
      return memberData;
    }

    // Se il giocatore esiste già, ritorna solo i nuovi attacchi per l'aggiunta
    return attacksWithWarInfo;
  }
}

module.exports = new currentCWLProcessor();
