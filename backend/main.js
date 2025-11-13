const { apiService, savedPlayerDataToString } = require("./Calculator");

// TAGs for production
//note: i tag per l'API kings devono essere senza '#' mentre per l'API ufficiale devono comprendere "#" e poi essere codificate con encodeURIComponent(tag)
const C_ItalianArmyTag = "2RPVPQLYJ";
const P_Lore = "C0UUYY2R";
const CWL_IAtag = "8QGGJQ8CY";

async function main() {
  try {
    console.log("started main");
    let savedPlayerData1 = await apiService.savedPlayerData(C_ItalianArmyTag);
    console.log(savedPlayerDataToString(savedPlayerData1));
  } catch (error) {
    console.error("Errore nel main:", error);
  }
}

main();
