//dependencies
const express = require("express");
const router = express.Router();

const apiService = require("../Calculator/services/apiService");

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "CWL route attiva!" });
});

router.get("/cwlSeason", async (req, res) => {
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
  /*res.json({
    ok: true,
    clanTag,
    seasonData,
  });
  */

  // returns the same json as above but with indentation
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ ok: true, clanTag, seasonData }, null, 2));

  try {
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
