//libreria dotenv
require('dotenv').config()
//libreria clash
const clashApi = require('clash-of-clans-api')
//api key
const CoCAPIkey = process.env.COC_API_TOKEN

//player and clans tags
const C_ItalianArmyTag = '#2RPVPQLYJ';
const P_Lore = '#C0UUYY2R';

//const CWL tag;


let client = clashApi({
  token: CoCAPIkey 
});

async function showPlayerInfo(tag) {
  try {
    const playerInfo = await client.playerByTag(tag)
    //console.log("this is the player info:", playerInfo)

  } catch (error) {
    console.error(error)
  }
}
showPlayerInfo(P_Lore)


async function ShowClanInfo(tag) {
  try {
    const clanInfo = await client.clanByTag(tag)
    console.log("this is the clan info:", clanInfo)

  } catch (error) {
    console.error(error)
  }
}
ShowClanInfo(C_ItalianArmyTag)

