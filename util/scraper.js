const cheerio = require("cheerio");
const axios = require("axios").default;
module.exports = {
  async fetchHtml(url) {
    try {
      const {
        data
      } = await axios.get(url);
      return data;
    } catch (err) {
      console.error(`ERROR: An error occurred while trying to fetch the URL: ${url}`);
    }
  },
  async scrapePlayerInfo(url) {
    const html = await this.fetchHtml(url);
    const baseUrl = "https://liquipedia.net";
    const selector = cheerio.load(html);
  
    let imageUrl = '';
    try {
      imageUrl = baseUrl + selector("div[class='infobox-image']").find("img").attr("src");
    } catch (err) {
      imageUrl = '';
    }
    const name = selector("#firstHeading > span").text();
  
    const infoSection = selector("#mw-content-text > div > div.fo-nttax-infobox-wrapper.infobox-dota2")
      .children().first().children();
    const playerInfo = {};
    infoSection.map((index, element) => {
      if (index > 2) {
        const attr = selector(element).children().first().text().trim().replace(':', '');
        if (attr === "Country") {
          if (selector(element).children().first().next().children().length > 2) {
            playerInfo["country"] = selector(element).children().first().next().text().trim().split(' ');
          } else {
            playerInfo["country"] = [selector(element).children().first().next().text().trim()];
          }
        } else if (attr === "Alternate IDs") {
          playerInfo["altIds"] = selector(element).children().first().next().text().trim().split(',').map((val) => val.trim());
        } else if (attr === "Birth") {
          playerInfo["birth"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Approx. Total Earnings") {
          playerInfo["earnings"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Signature Hero") {
          playerInfo["heroes"] = selector(element).children().first().next().children().map((i, el) => selector(el).attr("title")).get();
        } else if (attr === "Role(s)") {
          playerInfo["roles"] = selector(element).children().first().next().children().map((i, el) => selector(el).text()).get().filter((el) => el !== '');
        } else if (attr === "Name" || attr === "Romanized Name") {
          playerInfo["name"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Status") {
          playerInfo["status"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Team") {
          playerInfo["team"] = selector(element).children().first().next().text().trim();
        }
      }
    }).get().filter((val) => val !== '');
  
    playerInfo["bio"] = selector("#mw-content-text > div > p").first().text().replace('\n', '');
    const links = selector("div[class='infobox-center infobox-icons']").children();
    playerInfo.links = [];
    links.each((i, link) => {
      playerInfo["links"].push(link.attribs.href);
    });
  
    const achievements = selector("#mw-content-text > div > div.table-responsive > table > tbody").children();
  
    playerInfo.tournaments = [];
    achievements.map((index, element) => {
      const tourney = {};
      if (index > 0 && index < achievements.length - 1) {
        tourney["date"] = selector(element).children().first().text();
        tourney["place"] = selector(element).children().first().next().find("font").text();
        tourney["tier"] = selector(element).children().first().next().next().find("a").text();
        tourney["tournament"] = {
          name: selector(element).children().first().next().next().next().next().find("a").attr("title"),
          link: baseUrl +
            selector(element).children().first().next().next().next().next().find("a").attr("href"),
        }
        tourney["team"] = {
          name: selector(element).children().first().next().next().next().next().next().find("a").attr("title"),
          link: baseUrl +
            selector(element).children().first().next().next().next().next().next().find("a").attr("href"),
          image: baseUrl +
            selector(element).children().first().next().next().next().next().next().find("img").attr("src")
        }
        tourney["prize"] = selector(element).children().first().next().next().next().next().next().next().next().next().text();
        playerInfo.tournaments.push(tourney);
      }
    }).get();
  
    return {
      image: imageUrl,
      name,
      playerInfo
    }
  },
  async scrapeTeamInfo(url)  {
    const html = await this.fetchHtml(url);
    const baseUrl = "https://liquipedia.net";
  
    const selector = cheerio.load(html);
    let imageUrl = '';
    try {
      imageUrl = baseUrl + selector("div[class='img-responsive']").find("img").attr("src");
    } catch (err) {
      console.log(err);
      imageUrl = '';
    }
    const name = selector("#firstHeading > span").text();
    const teamInfo = {};
    teamInfo["bio"] = selector("#mw-content-text > div > p").first().text().replace(/[\r\n]/g, "").replace(/\[.*?\]/g, "");
  
    const infoSection = selector("#mw-content-text > div > div.fo-nttax-infobox-wrapper.infobox-dota2")
      .children().first().children();
    infoSection.map((index, element) => {
      if (index > 2) {
        const attr = selector(element).children().first().text().trim().replace(':', '');
        if (attr === "Location") {
          teamInfo["location"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Region") {
          teamInfo["region"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Coach") {
          teamInfo["coach"] = {
            name: selector(element).children().first().next().text().trim(),
            link: selector(element).children().first().next().find("a")[1] ?
              baseUrl + selector(element).children().first().next().find("a")[1].attribs.href : ''
          }
        } else if (attr === "Manager") {
          teamInfo["manager"] = {
            name: selector(element).children().first().next().text().trim(),
            link: selector(element).children().first().next().find("a")[1] ?
              baseUrl + selector(element).children().first().next().find("a")[1].attribs.href : ''
          }
        } else if (attr === "Team Captain") {
          teamInfo["captain"] = {
            name: selector(element).children().first().next().text().trim(),
            link: selector(element).children().first().next().find("a")[1] ?
              baseUrl + selector(element).children().first().next().find("a")[1].attribs.href : ''
          }
        } else if (attr === "Sponsor") {
          teamInfo["sponsors"] = selector(element).children().first().next().children().map((i, el) => selector(el).text()).get().filter((el) => el !== '');
        } else if (attr === "Total Earnings") {
          teamInfo["earnings"] = selector(element).children().first().next().text().trim();
        }
      }
    }).get().filter((val) => val !== '');
  
    const links = selector("div[class='infobox-center infobox-icons']").children();
    teamInfo.links = [];
    links.each((i, link) => {
      teamInfo["links"].push(link.attribs.href);
    });
  
    const roster = selector("div[class='roster table-responsive']").first().find("table > tbody").children();
    teamInfo.roster = [];
    roster.map((index, element) => {
      const player = {};
      if (index > 1 && index < roster.length) {
        player["id"] = selector(element).children().first().text().trim();
        let playerLink = selector(element).children().first().find("a")[1].attribs.href;
        if (playerLink.includes("redlink")) {
          player["link"] = "";
        } else {
          player["link"] = selector(element).children().first().find("a")[1] ?
            baseUrl + selector(element).children().first().find("a")[1].attribs.href : '';
        }
  
        player["name"] = selector(element).children().first().next().text().trim().replace(/[\\(\\)]/g, "");
        player["position"] = selector(element).find("td.PositionWoTeam2").length ?
          selector(element).find("td.PositionWoTeam2").text() :
          selector(element).children().first().next().next().next().text().replace("Position:", "").trim()
        player["joinDate"] = selector(element).find("div.Date").text().replace(/\[.*?\]/g, "");
        teamInfo.roster.push(player);
      }
    }).get();
  
    const achievements = selector("div[class='table-responsive achievements'] > table > tbody").children();
  
    teamInfo.tournaments = [];
    achievements.map((index, element) => {
      const tourney = {};
      if (index > 0 && index < achievements.length - 1) {
        tourney["date"] = selector(element).children().first().text();
        tourney["place"] = selector(element).children().first().next().find("font").text();
        tourney["tier"] = selector(element).children().first().next().next().find("a").text();
        tourney["tournament"] = {
          name: selector(element).children().first().next().next().next().next().find("a").attr("title"),
          link: baseUrl +
            selector(element).children().first().next().next().next().next().find("a").attr("href"),
        }
        tourney["prize"] = selector(element).children().first().next().next().next().next().next().next().next().text();
        teamInfo.tournaments.push(tourney);
      }
    }).get();
  
    return {
      image: imageUrl,
      name,
      teamInfo
    }
  },
  async scrapeTournamentList() {
    const page = "https://liquipedia.net/dota2/Main_Page";
    const html = await this.fetchHtml(page);
    const baseUrl = "https://liquipedia.net";
  
    const selector = cheerio.load(html);
  
    const tournamentList = selector("ul.tournaments-list").children();
    const tourneysList = [];
  
    tournamentList.map((index, element) => {
      let tourneys;
      if (index === 0) {
        tourneys = selector(element).find("ul.tournaments-list-type-list").children();
        tourneys.map((index, el) => {
          let name = selector(el).find("span.tournaments-list-name").text();
          let link = baseUrl + selector(el).find("a").attr("href");
          tourneysList.push({
            name,
            link,
            status: "Upcoming"
          })
        }).get();
      } else if (index === 1) {
        tourneys = selector(element).find("ul.tournaments-list-type-list").children();
        tourneys.map((index, el) => {
          let name = selector(el).find("span.tournaments-list-name").text();
          let link = baseUrl + selector(el).find("a").attr("href");
          tourneysList.push({
            name,
            link,
            status: "Ongoing"
          })
        }).get();
      } else {
        tourneys = selector(element).find("ul.tournaments-list-type-list").children();
        tourneys.map((index, el) => {
          let name = selector(el).find("span.tournaments-list-name").text();
          let link = baseUrl + selector(el).find("a").attr("href");
          tourneysList.push({
            name,
            link,
            status: "Completed"
          })
        }).get();
      }
    }).get();
  
    return tourneysList;
  },
  async scrapeTourneyInfo(url)  {
    const html = await this.fetchHtml(url);
    const baseUrl = "https://liquipedia.net";
  
    const selector = cheerio.load(html);
    let imageUrl = '';
    try {
      imageUrl = baseUrl + selector("div[class='infobox-image']").find("img").attr("src");
    } catch (err) {
      console.log(err);
      imageUrl = '';
    }
    const name = selector("#firstHeading > span").text();
    const tourneyInfo = {};
    tourneyInfo["bio"] = selector("#mw-content-text > div > p").first().text().replace(/[\r\n]/g, "").replace(/\[.*?\]/g, "");
  
    const infoSection = selector("#mw-content-text > div > div.fo-nttax-infobox-wrapper.infobox-dota2")
      .children().first().children();
    infoSection.map((index, element) => {
      if (index > 2) {
        const attr = selector(element).children().first().text().trim().replace(':', '');
        if (attr === "Series") {
          if (selector(element).children().first().next().children().length > 2) {
            tourneyInfo["series"] = selector(element).children().first().next().text().trim().split("\n");
          } else {
            tourneyInfo["series"] = [selector(element).children().first().next().text().trim()];
          }
        } else if (attr === "Organizer") {
          tourneyInfo["organizer"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Sponsor") {
          tourneyInfo["sponsors"] = selector(element).children().first().next().children().map((i, el) => selector(el).text()).get().filter((el) => el !== '');
        } else if (attr === "Version") {
          tourneyInfo["version"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Type") {
          tourneyInfo["type"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Location") {
          tourneyInfo["location"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Venue") {
          tourneyInfo["venue"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Dates") {
          tourneyInfo["dates"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Teams") {
          tourneyInfo["numOfTeams"] = selector(element).children().first().next().text().trim();
        } else if (attr === "Format") {
          tourneyInfo["format"] = selector(element).children().first().next().children().map((i, el) => selector(el).text()).get().filter((el) => el !== '');
        } else if (attr === "Prize Pool") {
          tourneyInfo["prizePool"] = selector(element).children().first().next().text().trim();
        }
      }
    }).get().filter((val) => val !== '');
  
    const links = selector("div[class='infobox-center infobox-icons']").children();
    tourneyInfo.links = [];
    links.each((i, link) => {
      tourneyInfo["links"].push(link.attribs.href);
    });
  
    const standings = selector("table.wikitable.wikitable-bordered.prizepooltable > tbody").children();
    tourneyInfo.standings = [];
    const teamsStandings = standings.find("span.team-template-text");
  
    teamsStandings.map((index, element) => {
      const team = {};
      if (index < teamsStandings.length) {
        team["name"] = selector(element).text().trim();
        team["position"] = index + 1;
        tourneyInfo.standings.push(team);
      }
    }).get();
  
    tourneyInfo.teams = [];
    const teams = selector("div.teamcard.teamcardmix")
    teams.map((index, element) => {
      const team = {};
      team["name"] = selector(element).find("b").text();
      let teamLink = baseUrl + selector(element).find("a").attr("href") || "";
      if (teamLink.includes("redlink")) {
        team["link"] = "";
      } else {
        team["link"] = selector(element).find("a").length ?
          teamLink : '';
      }
      team["image"] = baseUrl + selector(element).find("div.teamcard-inner > table.table.table-bordered.logo > tbody").find("img").attr("src");
      tourneyInfo.teams.push(team);
    }).get();
  
    tourneyInfo.streamLinks = [];
  
    const streams = selector("#Streams").parent().next().find("table.wikitable > tbody > tr");
    streams.map((index, el) => {
      if (index === streams.length - 1) {
        const entries = selector(el).find("td > a");
        const links = [];
        entries.map((index, el) => {
          const link = selector(el).attr("href");
          if (link.includes("Special:Stream")) {
            links.push(baseUrl + link);
          } else {
            links.push(link);
          }
        }).get();
        // let link = selector(el).find("a").attr("href");
        tourneyInfo.streamLinks.push(...links)
      }
    }).get();
  
    tourneyInfo.upcomingMatches = [];
  
    const upcomingMatches = selector("table.wikitable.wikitable-striped.infobox_matches_content");
    upcomingMatches.map((index, el) => {
      const game = selector(el).find("tbody").children();
      const match = {};
  
      game.map((index, el) => {
        if(index === 0) {
          const team1 = {};
          const team2 = {};
          let team1Name = selector(el).find("td.team-left").text(); 
          team1["name"] = team1Name === "" ? "TBD" : team1Name;

          let team1link = selector(el).find("td.team-left").find("a").attr("href") || "";
          if (team1link.includes("redlink") || team1link == "") {
            team1["link"] = "";
          } else {
            team1["link"] = selector(el).find("td.team-left").find("a") ?
              baseUrl + team1link : '';
          }
  
          let team2Name = selector(el).find("td.team-right").find("a").text();
          team2["name"] = team2Name === "" ? "TBD" : team2Name;
  
          let team2link = selector(el).find("td.team-right").find("a").attr("href") || "";
          if (team2link.includes("redlink") || team2link === "") {
            team2["link"] = "";
          } else {
            team2["link"] = selector(el).find("td.team-right").find("a") ?
              baseUrl + team2link : '';
          }
          match["team1"] = team1;
          match["team2"] = team2;
        } else {
          match["startTime"] = selector(el).find("span.match-countdown").text();
        }
      }).get();
      tourneyInfo.upcomingMatches.push(match)
    }).get();
  
    return {
      image: imageUrl,
      name,
      tourneyInfo
    }
  },
  async scrapeUpcomingMatches() {
    const url = "https://liquipedia.net/dota2/Liquipedia:Upcoming_and_ongoing_matches";
    const html = await this.fetchHtml(url);
    const baseUrl = "https://liquipedia.net";
  
    const selector = cheerio.load(html);
    const matches = [];
    const upcomingMatches = selector("table.wikitable.wikitable-striped.infobox_matches_content");
    upcomingMatches.map((index, el) => {
      const game = selector(el).find("tbody").children();
      const match = {};
  
      game.map((index, el) => {
        if(index === 0) {
          const team1 = {};
          const team2 = {};
          team1["name"] = selector(el).find("td.team-left").text().trim();
          let team1link = selector(el).find("td.team-left").find("a").attr("href") || "";
          if (team1link.includes("redlink")) {
            team1["link"] = "";
          } else {
            team1["link"] = selector(el).find("td.team-left").find("a") ?
              baseUrl + team1link : '';
          }
  
          team2["name"] = selector(el).find("td.team-right").find("a").text().trim();
  
          let team2link = selector(el).find("td.team-right").find("a").attr("href") || "";
          if (team2link.includes("redlink")) {
            team2["link"] = "";
          } else {
            team2["link"] = selector(el).find("td.team-right").find("a") ?
              baseUrl + team2link : '';
          }
          let score = selector(el).find("td.versus").children().first().text();
          if(score === "vs") {
            match["team1score"] = "0"
            match["team2score"] = "0"
            match["status"] = "Not started";
          } else {
            let scores = score.split(":");
            match["team1score"] = scores[0];
            match["team2score"] = scores[1];
            match["status"] = "Live";
          }
          match["team1"] = team1;
          match["team2"] = team2;
        } else {
          match["startTime"] = selector(el).find("span.match-countdown").text();
          match["tournament"] =  {
            name: selector(el).find("td.match-filler").find("div").text().trim(),
            link: baseUrl + selector(el).find("td.match-filler").find("a").attr("href"),
          }
        }
      }).get();
      matches.push(match)
    }).get();
  
    return {
      matches
    }
  }
}
