// LIBRERIE
require('dotenv').config()
const axios = require('axios');
//const clashApi = require('clashofclans.js')

// API KEYS
const COC_API_KEY = process.env.COC_API_TOKEN //official CoC api 

// API URLs
const CLASHKING_BASE_URL = 'https://api.clashk.ing'; 
const OFFICIAL_COC_API_URL= 'https://api.clashofclans.com/v1/';


//INSTANZE API
//OFFICIAL COC API 
const officialCocClient = axios.create({
    baseURL:OFFICIAL_COC_API_URL,
    headers: {
        'Authorization': `Bearer ${COC_API_KEY}`,
        'Accept': 'application/json',
        'User-Agent': 'CWL Bonus Calculator (Discord: lo_stome)' 
    }
});

//CLASH KING API
//IMPORTANTE!
//CLASH KING NON USA '#' NEI TAG
const clashKingClient = axios.create({
  baseURL: CLASHKING_BASE_URL,
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'CWL Bonus Calculator (Discord: lo_stome)' 
  }
});

//FINE INSTANZE API


// TAGS PER PRODUZIONE
//note: i tag per l'API kings devono essere senza '#' mentre per l'API ufficiale devono comprendere "#" e poi essere codificate con encodeURIComponent(tag)
const C_ItalianArmyTag = '2RPVPQLYJ';
const P_Lore = 'C0UUYY2R';
const CWL_IAtag= '8QGGJQ8CY'; 


//METODI DI PROVA

//API UFFICIALE

async function showPlayerInfo(playerTag) {

    console.log("player tag passato= "+playerTag)
  try {
    const response = await officialCocClient.get(`/players/${playerTag}`);
    console.log("Player CoC API Ufficiale:", response.data);
    return response.data;
  } catch (error) {
    console.error(`Errore nel recupero dati del giocatore:\n ERROR MSG =`, error.response?.data || error.message);
  }
}


//API KINGS
/*
async function ShowClanInfo(tag) {
  try {
    const clanInfo = await client.getClan(tag)
    console.log("this is the clan info:", clanInfo)

  } catch (error) {
    console.error(error)
  }
}
*/


async function getCwlCurrentSeason(clanTag) {
  try {
    const response = await clashKingClient.get(`/cwl/${clanTag}/group`);
    console.log("Info gruppo CWL:", response.data);
    return response.data;
  } catch (error) {
    console.error("Errore nel recupero dati della CWL:"+"\n ERROR MSG =", error.response?.data || error.message);
  }
}


async function getCurrentSeasonCWLWarTags(clanTag) {
    try {
        //gets API data
        let response = await clashKingClient.get(`/cwl/${clanTag}/group`);
        let cwlData = response.data; 

        let allWarTags = [];

        cwlData.data.rounds.forEach(function(round, roundIndex) {

            //Creates an Object for each round with its WarTags in it
            let roundData = {
                roundNumber: roundIndex + 1,
                //#0 are invalid war for CoC's API, so they are filtered out
                warTags: round.warTags.filter(warTag => warTag && warTag !== '#0')
            };
            //console.log("Round creato:", roundData.roundNumber); 
            allWarTags.push(roundData);
        });
        return allWarTags;

    } catch (error) {
         console.error("Errore nel recupero dati CWL:"+"\n ERROR MSG =", error.response?.data || error.message);
    }
}

//Ritorna i dati della war con war tag associato
async function getWarData(warTag) {
    try {
        //let clanTagOF = "#"+C_ItalianArmyTag 
        let response = await officialCocClient.get(`/clanwarleagues/wars/${warTag}`);
        let warData = response.data; 
        console.log("Dati della War"+ warTag, warData);
        return warData
    } catch (error) {
         console.error("Errore nel recupero dati della War "+ warTag+"\n ERROR MSG =", error.response?.data || error.message);
    }
}

//input tag without '#', output encoded tag with #
//the output is used for the official CoC API
function transformTag(tag){
    let transformedTag = encodeURIComponent('#' + tag)
    return transformedTag
}

function warTagsToString(warTagsData) {
    //console.log("toString Called")
    let result = "=== CWL WAR TAGS ===\n";
  
    warTagsData.forEach(round => {
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



async function main() {

    let warTagsData = await getCurrentSeasonCWLWarTags(C_ItalianArmyTag);
    console.log(warTagsToString(warTagsData))
    

    getWarData(transformTag('8QR02GGCY'))
}
main()

//chiamate di prova
//showPlayerInfo(transformTag(P_Lore))
//ShowClanInfo(C_ItalianArmyTag)
//GetCWLsTags(CWL_IAtag) 
//getCwlCurrentSeason(C_ItalianArmyTag)


