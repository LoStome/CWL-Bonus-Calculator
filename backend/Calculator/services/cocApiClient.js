//Only API calls here
//most API calls are in order of use

const { officialCocClient, clashKingClient } = require("../config/api");
const { transformTag, standardizeTag } = require("../utils/tagUtils");

class CocApiClient {
  //uses the official COC API
  //returns the data of the player json
  async getPlayerInfo(playerTag) {
    //console.log("passed player tag= " + playerTag);
    try {
      //tranforms the tag because it's using official COC API
      const response = await officialCocClient.get(`/players/${transformTag(playerTag)}`);
      //console.log("Player CoC API Ufficiale:", response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Official CoC Player API request error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //uses the official COC API
  //returns the data of the clan (json)
  async getClanInfo(clanTag) {
    //console.log("passed clan tag= " + clanTag);
    //console.log("transformed clan tag: " + transformTag(clanTag));
    try {
      //tranforms the tag because it's using official COC API
      const response = await officialCocClient.get(`/clans/${transformTag(clanTag)}`);
      //console.log("Player CoC API Ufficiale:", response.data);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Official CoC Clan API request error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //Uses ClashKingAPI
  //this API calls returns all the season CWL season Data of the inputted season
  async getCWLSeasonData(clanTag, season) {
    try {
      let response = await clashKingClient.get(`/cwl/${standardizeTag(clanTag)}/${season}`);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL ClashKing API request error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //Uses the official COC API
  //this API calls returns all the concurrent CWL season Data
  async getCurrentCWLSeasonData(clanTag) {
    try {
      let response = await officialCocClient.get(
        `/clans/${transformTag(clanTag)}/currentwar/leaguegroup`
      );
      return response.data;
    } catch (error) {
      console.error(error);
      throw new Error(
        `CWL ClashKing API request error: ${error.response?.data?.message || error.message}`
      );
    }
  }

  //uses
  //returns the CWL war data of the inputted war tag (onlu current season)
  async getCurrentCWLSeasonWarData(warTag) {
    try {
      let response = await officialCocClient.get(`/clanwarleagues/wars/${transformTag(warTag)}`);
      let warData = response.data;
      //console.log("War Data of war: " + warTag, warData);
      return warData;
    } catch (error) {
      console.error(error);
      throw new Error(
        `Official CoC War API request error: ${error.response?.data?.message || error.message}`
      );
    }
  }
}

module.exports = new CocApiClient();
