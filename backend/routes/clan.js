//dependencies
const express = require("express");
const router = express.Router();

const { cocDataElaboration, cocApiClient } = require("../");

router.get("/test", (req, res) => {
  res.json({ ok: true, message: "CLAN route attiva!" });
});

router.get("/getClanData", async (req, res) => {
  try {
    const { clanTag } = req.query;

    if (!clanTag) {
      return res.status(400).json({
        ok: false,
        error: "Missing clanTag parameter",
      });
    }

    // saves all clan data in a constant
    const clanData = await cocApiClient.getClanInfo(clanTag);

    //outputs the data structure as json
    res.json({
      ok: true,
      data: clanData,
    });
  } catch (error) {
    console.error("Error fetching clan data:", error);
    res.status(500).json({
      ok: false,
      error: "Server error",
    });
  }
});

module.exports = router;
