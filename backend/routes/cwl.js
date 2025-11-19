//dependencies
const express = require("express");
const router = express.Router();

const apiService = require("../Calculator/services/apiService");

//capire se eliminare
//app.set("json spaces", 2); // <-- JSON indentato automaticamente

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "CWL route attiva!" });
});

router.get("/cwlSeason", async (req, res) => {
  try {
    const { clanTag } = req.query;

    if (!clanTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag parameter",
      });
    }

    // saves all season data in a constant
    const seasonData = await apiService.savedPlayerData(clanTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      data: seasonData,
    });

    //capire se eliminare
    //returns the same json as above but with indentation
    //res.setHeader("Content-Type", "application/json");
    //res.send(JSON.stringify({ ok: true, clanTag, seasonData }, null, 2));
  } catch (error) {
    console.error("Error fetching CWL season data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
