const axios = require("axios").default;
const fs = require('fs');
const util = require('util')
const Fuse = require('fuse.js')
const LiquipediaScraper = require("./scraper");
const _ = require("lodash");

module.exports = {
  async getTourneyInfo (name, fuzzySearch) {
    const leagues = (await axios.get("https://api.opendota.com/api/leagues")).data;
  
    if(fuzzySearch) {
      const options = {
        // isCaseSensitive: false,
        // includeScore: false,
        // shouldSort: true,
        // includeMatches: false,
        // findAllMatches: false,
        // minMatchCharLength: 1,
        // location: 0,
        // threshold: 0.6,
        // distance: 100,
        // useExtendedSearch: false,
        // ignoreLocation: false,
        // ignoreFieldNorm: false,
        keys: [
          "name"
        ]
      };
      
      const fuse = new Fuse(leagues, options);
      
      // Change the pattern
      const pattern = name.replace("The", "");
      
      return fuse.search(pattern)[0];
    }
  
    const filtered = await leagues.filter((value) => {
      return value.name === name;
    })
    return {
      item: filtered
    };
  },
  async findTeamIds(teams) {
    const teamsList = (await axios.get("https://api.opendota.com/api/teams")).data;
    const teamIds = [];
    for(const team of teams) {
      const teamId = teamsList.filter((value) => {
        return value.name === team.name;
      })
      if(teamId.length) {
        teamIds.push({
          id: teamId[0].team_id,
          name: team.name
        })
      }
    }
    return teamIds;
  },
  async findTourneyTeamMatches(team, tourney) {
    const { id: teamId, name } = team;
    const matches = (await axios.get(`https://api.opendota.com/api/teams/${teamId}/matches`)).data;
    const filteredMatches = await matches.filter((value) => {
      return value.leagueid === tourney;
    })
    const structuredMatches = await filteredMatches.map((entry) => {
      return {
        matchId: entry.match_id,
        team1: name,
        team1Id: teamId,
        team2: entry.opposing_team_name,
        team2Id: entry.opposing_team_id,
        winner: entry.radiant && entry.radiant_win ? name : entry.opposing_team_name,
        winnerId: entry.radiant && entry.radiant_win ? teamId : entry.opposing_team_id,
        duration: entry.duration,
        tournamentId: tourney
      }
    });
    return structuredMatches;
  },
  async getMatchDetails (matchId) {
    const match = (await axios.get(`https://api.opendota.com/api/matches/${matchId}`)).data;
    const heroes = await this.getHeroes();
    const structuredMatch = {
      matchId: match.match_id,
      radiantTeam: match.radiant_team,
      direTeam: match.dire_team,
      winner: match.radiant_win ? match.radiant_team.team_id : match.dire_team.team_id,
    }
    structuredMatch.direPlayers = [];
    structuredMatch.radiantPlayers = [];
  
    match.players.map((player) => {
      if(player.isRadiant) {
        structuredMatch.radiantPlayers.push({
          name: player.name,
          accountId: player.account_id,
          heroId: player.hero_id,
          hero: heroes.filter((hero) => hero.id === player.hero_id)[0]["localized_name"],
          assists: player.assists,
          kills: player.kills,
          deaths: player.deaths,
        })
      } else {
        structuredMatch.direPlayers.push({
          name: player.name,
          accountId: player.account_id,
          heroId: player.hero_id,
          hero: heroes.filter((hero) => hero.id === player.hero_id)[0]["localized_name"],
          assists: player.assists,
          kills: player.kills,
          deaths: player.deaths,
        })
      }
    });
    structuredMatch.radiantTeam.score = match.radiant_score;
    structuredMatch.direTeam.score = match.dire_score;
  
    return structuredMatch;
  },
  async getHeroes () {
    const heroes = (await axios.get(`https://api.opendota.com/api/heroes`)).data;
    return heroes;
  }
}
