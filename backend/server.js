require("dotenv").config();
const express = require("express");
const { apiService } = require("./Calculator");

const app = express();
const port = process.env.PORT || 3001;

// Esempio di endpoint per ottenere i dati del clan
app.get("/api/clan/:tag", async (req, res) => {
  try {
    const data = await apiService.savedPlayerData(req.params.tag);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(port, () => {
  console.log(`🚀 Backend server running at http://localhost:${port}`);
});
