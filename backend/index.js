const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// IMPORT SERVICES
const apiService = require("./Calculator/services/apiService");

// IMPORT UTILS
const {
  savedPlayerDataToString,
  warTagsToString,
  correctClanWarsToString,
} = require("./Calculator/utils/stringUtils");

const { transformTag } = require("./Calculator/utils/tagUtils");

// IMPORT API CONFIG
const {
  officialCocClient,
  clashKingClient,
} = require("./Calculator/config/api");

// EXPORT
module.exports = {
  apiService,
  savedPlayerDataToString,
  warTagsToString,
  correctClanWarsToString,
  transformTag,
  officialCocClient,
  clashKingClient,
};

// ===== ROUTES =====
const cwlRoutes = require("./routes/cwl");
app.use("/api/cwl", cwlRoutes);

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
