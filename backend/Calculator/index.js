// SERVICES
const apiService = require("./services/apiService");

// UTILS
const {
  savedPlayerDataToString,
  warTagsToString,
  correctClanWarsToString,
} = require("./utils/stringUtils");
const { transformTag } = require("./utils/tagUtils");

// CONFIG
const { officialCocClient, clashKingClient } = require("./config/api");

module.exports = {
  apiService,
  savedPlayerDataToString,
  warTagsToString,
  correctClanWarsToString,
  transformTag,
  officialCocClient,
  clashKingClient,
};
