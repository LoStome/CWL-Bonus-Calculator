const express = require("express");
const cors = require("cors");

//initialize express instance
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
const routes = {
  "/api/cwl": require("./routes/cwl"),
  "/api/clan": require("./routes/clan"),
  "/api/player": require("./routes/player"),
};

Object.entries(routes).forEach(([path, router]) => {
  app.use(path, router);
});

// ===== SERVER START =====
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
