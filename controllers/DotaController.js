const LiquipediaScraper = require("../util/scraper");
const OpenDotaApiHelper = require("../util/OpenDotaApiHelper");
const _ = require("lodash");

module.exports = {
  async listOngoingAndUpcomingTourneys(req, res) {
    const tournaments = await LiquipediaScraper.scrapeTournamentList();
    res.send(tournaments);
  },
  async listOngoingAndUpcomingGames(req, res) {
    const games = await LiquipediaScraper.scrapeUpcomingMatches();
    res.send(games.matches.slice(0, 25));
  },
  async getTournamentInfo(req, res) {
    const { url } = req.query;
    const tourneyLiquipediaInfo = await LiquipediaScraper.scrapeTourneyInfo(url);
    const ApiTourneyInfo = await OpenDotaApiHelper.getTourneyInfo(tourneyLiquipediaInfo.name, 1);
    const ApiTeamsInfo = await OpenDotaApiHelper.findTeamIds(tourneyLiquipediaInfo.tourneyInfo.teams);
    const matches = [];
    for(const entry of ApiTeamsInfo) {
      let teamMatches;
      teamMatches = await OpenDotaApiHelper.findTourneyTeamMatches(entry, ApiTourneyInfo.item.leagueid)
      matches.push(...teamMatches);
    }
    let uniqueMatches = _.uniqBy(matches, function (e) {
      return e.matchId;
    });

    res.send({
      ...tourneyLiquipediaInfo,
      teams: ApiTeamsInfo,
      matches: uniqueMatches
    });
  },
  async getTeamInfo(req, res) {
    const { url } = req.query;

    const team = await LiquipediaScraper.scrapeTeamInfo(url);
    res.send(team);
  },
  async getMatchInfo(req, res) {
    const { matchId } = req.query;
    const matchInfo = await OpenDotaApiHelper.getMatchDetails(matchId);
    res.send(matchInfo);
  }
}
