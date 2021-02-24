import HttpClient from "../utils/httpClient.js";
import dotenv from "dotenv";
import { getValues } from "../services/nbaServices.js";

dotenv.config();

export class NbaApi {
  constructor() {
    this.playersClient = new HttpClient(
      `${process.env.NBA_API_BASE_URL}players`
    );
    this.averagesClient = new HttpClient(
      `${process.env.NBA_API_BASE_URL}season_averages`
    );
    this.gamesClient = new HttpClient(`${process.env.NBA_API_BASE_URL}games`);
  }

  async getPlayer(name) {
    const { firstName, lastName } = name;

    let page = 1;
    let playerData = [];
    let foundPlayer;

    do {
      try {
        let params = [
          { type: "search", value: lastName },
          { type: "page", value: page },
        ];

        let { data, meta } = await this.playersClient.get(params);
        if (data && data.length > 0) {
          playerData = [...playerData, ...data];
        }
        page = meta.next_page;
      } catch (error) {
        page = null;
        console.error(error);
      }
    } while (page);

    if (playerData.length > 0) {
      playerData.forEach((player) => {
        if (
          player.first_name.toLowerCase() === firstName &&
          player.last_name.toLowerCase() === lastName
        ) {
          foundPlayer = { ...player };
        }
      });
    }

    return foundPlayer;
  }

  async getPlayers(players) {
    let foundPlayers = [];
    let playersNotFound = [];

    for (const player of players) {
      let foundPlayer = await this.getPlayer(player);
      if (foundPlayer) {
        foundPlayers = [...foundPlayers, foundPlayer];
      } else {
        playersNotFound = [...playersNotFound, player];
      }
    }

    return {
      foundPlayers,
      playersNotFound,
    };
  }

  async getAverages(player, stats, date) {
    let allStats;
    let matchingStats = [];

    const { validStats, invalidStats } = stats;

    try {
      let params = [
        { type: "player_ids[]", value: player.id },
        { type: "season", value: date },
      ];
      allStats = (await this.averagesClient.get(params)).data[0];
    } catch (error) {
      console.error(error);
    }

    if (validStats.length > 0) {
      if (validStats.indexOf("all") === -1) {
        for (const key in allStats) {
          const stat = allStats[key];
          if (validStats.indexOf(key) > -1) {
            matchingStats = [...matchingStats, { name: key, value: stat }];
          }
        }
      } else {
        for (const key in allStats) {
          if (key !== "player_id") {
            const stat = allStats[key];
            matchingStats = [...matchingStats, { name: key, value: stat }];
          }
        }
      }
    }

    return {
      name: player.name,
      stats: matchingStats,
      invalidStats: invalidStats,
    };
  }

  async getStats(body) {
    let foundAverages = [];
    const { stats, players, date, isValid } = getValues(body);

    if (isValid) {
      let { foundPlayers, playersNotFound } = await this.getPlayers(players);

      for (const player of foundPlayers) {
        let average = await this.getAverages(
          { id: player.id, name: `${player.first_name} ${player.last_name}` },
          stats,
          date
        );

        if (average && average.stats.length > 0) {
          foundAverages = [...foundAverages, average];
        } else if (average && average.stats.length < 1) {
          playersNotFound = [
            ...playersNotFound,
            { firstName: player.first_name, lastName: player.last_name },
          ];
        }
      }

      return {
        isHeadToHead: stats.validStats.includes("all"),
        foundAverages,
        playersNotFound,
        isValid,
      };
    }

    return { isValid };
  }
}
