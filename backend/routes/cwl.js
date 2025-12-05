//dependencies
const express = require("express");
const router = express.Router();

const { cwlProcessor, currentCWLProcessor } = require("../Calculator/services");

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "CWL route attiva!" });
});

//returns the data from getCWLSeasonMainData(clanTag)
router.get("/getCurrentCWLSeasonData", async (req, res) => {
  try {
    const { clanTag } = req.query;

    if (!clanTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag parameter",
      });
    }

    const seasonData = await currentCWLProcessor.getCWLSeasonMainData(clanTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      data: seasonData,
    });
  } catch (error) {
    console.error("Error fetching current CWL season data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

router.get("/getCWLSeasonPlayersData", async (req, res) => {
  try {
    const { clanTag, season } = req.query;

    if (!clanTag || !season) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag or season parameter",
      });
    }

    const playersData = await cwlProcessor.saveMembersData(clanTag, season);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      season: season,
      data: playersData,
    });
  } catch (error) {
    console.error("Error fetching current CWL season player's data:", error.message);
    //capire se aggiungere data.state == 'noSeasonData'

    if (error.message.includes("No season data") || error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        error: "CWL data not found for this season/clan",
      });
    }

    res.status(500).json({
      ok: false,
      error: "Server error",
      details: error.message, // optional: useful for frontend debugging
    });
  }
});

//returns the data from getCurrentCWLSeasonMainData(clanTag)
router.get("/getCWLSeasonData", async (req, res) => {
  try {
    const { clanTag, season } = req.query;

    if (!clanTag || !season) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag or season parameter",
      });
    }

    const seasonData = await cwlProcessor.getCWLSeasonMainData(clanTag, season);

    //outputs the data structure as json
    res.json({
      ok: true,
      clanTag: clanTag,
      data: seasonData,
    });
  } catch (error) {
    console.error("Error fetching current CWL season data:", error.message);

    //capire se aggiungere data.state == 'noSeasonData'
    if (error.message.includes("No season data") || error.message.includes("not found")) {
      return res.status(404).json({
        ok: false,
        error: "CWL data not found for this season/clan",
      });
    }
    res.status(500).json({
      ok: false,
      error: "Server error",
      details: error.message, // optional: useful for frontend debugging
    });
  }
});

module.exports = router;
