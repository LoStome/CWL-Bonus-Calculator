//dependencies
const express = require("express");
const router = express.Router();

const { cocDataElaboration, cocApiClient } = require("../");

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "PLAYER route attiva!" });
});

router.get("/getPlayerData", async (req, res) => {
  try {
    const { playerTag } = req.query;

    if (!playerTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing playerTag parameter",
      });
    }

    // saves all clan data in a constant
    const playerData = await cocApiClient.getPlayerInfo(playerTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      data: playerData,
    });
  } catch (error) {
    console.error("Error fetching player data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});
module.exports = router;
