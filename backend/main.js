//DEBUG MAIN
const { cwlProcessor, cocApiClient } = require(".");

// TAGs for production
//note: i tag per l'API kings devono essere senza '#' mentre per l'API ufficiale devono comprendere "#" e poi essere codificate con encodeURIComponent(tag)
const C_ItalianArmyTag = "2RPVPQLYJ";
const C_ClanMadre = "9UPYRU9U";
const P_Lore = "C0UUYY2R";
const CWL_IAtag = "8QGGJQ8CY";

async function main() {
  try {
    console.log("started main");
    let data = cwlProcessor.getCWLSeasonMainData(C_ItalianArmyTag);
  } catch (error) {
    console.error("Errore nel main:", error);
  }
}

//main();
