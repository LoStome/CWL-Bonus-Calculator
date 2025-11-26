require("dotenv").config();
const axios = require("axios");

// API KEYS
const COC_API_KEY = process.env.COC_API_TOKEN; //official CoC api

// API URLs
const CLASHKING_BASE_URL = "https://api.clashk.ing";
const OFFICIAL_COC_API_URL = "https://api.clashofclans.com/v1/";

//API INSTANCES
//OFFICIAL COC API
const officialCocClient = axios.create({
  baseURL: OFFICIAL_COC_API_URL,
  headers: {
    Authorization: `Bearer ${COC_API_KEY}`,
    Accept: "application/json",
    "User-Agent": "CWL Bonus Calculator (Discord: lo_stome)",
  },
});

//CLASH KING API
// IMPORTANT: CLASH KING DOES API CALLS WITHOUT THE '#' IN THE TAG
// AND DOES NOT NEED TO BE ENCODED
const clashKingClient = axios.create({
  baseURL: CLASHKING_BASE_URL,
  headers: {
    Accept: "application/json",
    "User-Agent": "CWL Bonus Calculator (Discord: lo_stome)",
  },
});

module.exports = {
  officialCocClient,
  clashKingClient,
  COC_API_KEY,
};
