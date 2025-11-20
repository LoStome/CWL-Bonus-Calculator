//dependencies
const express = require("express");
const router = express.Router();

//const apiService = require("../Calculator/services/apiService");

//da finire
const api = require("../Calculator/services/cocApiClient");
const processor = require("../Calculator/services/cocDataElaboration;");

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "CWL route attiva!" });
});

//trasformare in getCurrent Season (solo clan tag in input)
//ritorna i dati della season principali
/*router.get("/getCurrentSeasonData", async (req, res) => {
  try {
    const { clanTag } = req.query;

    if (!clanTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag parameter",
      });
    }

    // saves all season data in a constant
    //rifare qui manda solo i dati dei giocatori
    const seasonData = await apiService.savedPlayerData(clanTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      data: seasonData,
    });
  } catch (error) {
    console.error("Error fetching CWL season data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});
*/

router.get("/getCurrentSeasonPlayerData", async (req, res) => {
  try {
    const { clanTag } = req.query;

    if (!clanTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag parameter",
      });
    }

    // saves all season data in a constant
    //rifare qui manda solo i dati dei giocatori
    const playerData = await apiService.savePlayerData(clanTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      data: playerData,
    });
  } catch (error) {
    console.error("Error fetching CWL season data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

//creare getAnyCwlSeason(clanTag, date)
//creare getAnySeasonPlayerData(clanTag, date)
//feature successiva, uguali a quelli sopra ma con data in input (anche l'api da cui prende i dato  e' diverso)

module.exports = router;
