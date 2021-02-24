export const getValues = (body) => {
  const values = body.toLowerCase().split(" ");
  const usernameIndex =
    values.indexOf(`/u/${process.env.REDDIT_USER}`) === -1
      ? values.indexOf(`u/${process.env.REDDIT_USER}`)
      : values.indexOf(`/u/${process.env.REDDIT_USER}`);
  const statsIndex = values.indexOf("find");
  const playersIndex = values.indexOf("for");
  const dateIndex = values.indexOf("in");

  if (validateRequest([usernameIndex, statsIndex, playersIndex, dateIndex])) {
    const stats = values.slice(statsIndex + 1, playersIndex);
    const names = values.slice(
      playersIndex + 1,
      dateIndex === -1 ? values.length : dateIndex
    );
    const players = mapPlayers(
      names.length > 1 ? names.join(" ").split(",") : names
    );
    const date =
      dateIndex === -1 ? null : values.slice(dateIndex + 1, values.length)[0];
    return {
      stats:
        stats.length > 1
          ? standardizeStats(stats.join(" ").split(","))
          : standardizeStats(stats),
      players,
      date,
      isValid: true,
    };
  }

  return { isValid: false };
};

export const getMessage = (data) => {
  const { isHeadToHead, foundAverages, playersNotFound, isValid } = data;

  if (!isValid) {
    return (
      "Sorry, I wasn't able to understand your request." +
      " Please make sure you ask your question in the following format: " +
      "'Find {stats here, separated by commas} for {player full names here, separated by commas}'." +
      " Optionally, you can add 'in {year of season here}' to the end of that query to get stats for a specific season." +
      "\n\nYou can also search for all the season averages for a particular player, or head to head statistics" +
      " for a group of players. This will return results in a table format, and the column value for the player with" +
      " the best (greatest) statistic category will be highlighted as bold when compared to the other players in the query." +
      " To trigger head to head comparisons, or return all the statistics for a particular player, the user must enter" +
      " 'all' or 'head to head' for the 'stats' parameter. Like the regular 'stats' parameter, it must be preceded by the word 'find'." +
      "\n\nFor more detailed information, you can read" +
      " [this post](https://www.reddit.com/user/Negative_Vehicle_51/comments/lpzau6/redditbot_instructions/)."
    );
  }

  if (foundAverages.length > 0 && playersNotFound.length > 0) {
    const foundMessage = isHeadToHead
      ? messageConstructor("headToHead", foundAverages)
      : messageConstructor("stats", foundAverages);
    const notFoundMessage = messageConstructor(
      "playersNotFound",
      playersNotFound
    );
    return isHeadToHead
      ? `${notFoundMessage} \n\n ${foundMessage}`
      : `${foundMessage}\n\n${notFoundMessage}`;
  } else if (foundAverages.length > 0) {
    const foundMessage = isHeadToHead
      ? messageConstructor("headToHead", foundAverages)
      : messageConstructor("stats", foundAverages);
    return foundMessage;
  } else if (playersNotFound.length > 0) {
    const notFoundMessage = messageConstructor(
      "playersNotFound",
      playersNotFound
    );
    return notFoundMessage;
  } else {
    return "Sorry. I couldn't find any statistics matching you query. Check your request and try again. ";
  }
};

const messageConstructor = (type, data) => {
  let message = "";

  switch (type) {
    case "playersNotFound":
      message = "I couldn't find information regarding ";
      data.forEach((player, index) => {
        let firstName =
          player.firstName !== ""
            ? player.firstName[0].toUpperCase() + player.firstName.slice(1)
            : null;
        let lastName =
          player.lastName !== ""
            ? player.lastName[0].toUpperCase() + player.lastName.slice(1)
            : null;
        let name =
          firstName && lastName
            ? `${firstName} ${lastName}`
            : `${firstName || lastName}`;
        if (data.length > 1) {
          if (index === data.length - 1) {
            message += `and ${name}. `;
          } else {
            message += `${name}, `;
          }
        } else {
          message += `${name}. `;
        }
      });
      message +=
        "Please check your spelling or make sure the players are active in the year that you're searching. ";
      break;
    case "stats":
      message = "I found ";
      let invalidStats;
      data.forEach((player) => {
        if (player.stats.length > 0) {
          let [firstName, lastName] = player.name.split(" ");
          message += `${firstName} ${lastName} averaged `;
          const validStats = player.stats.map((stat, index) => {
            if (player.stats.length > 1) {
              if (index === player.stats.length - 1) {
                return `and ${stat.value} ${stat.name} per game. `;
              }
              return `${stat.value} ${stat.name} per game, `;
            } else {
              return `${stat.value} ${stat.name} per game. `;
            }
          });
          message += validStats.join("");
        }
        invalidStats =
          player.invalidStats.length > 0
            ? player.invalidStats.map((stat, index) => {
                if (player.invalidStats.length > 1) {
                  if (index === player.invalidStats.length - 1) {
                    return `and ${stat}. `;
                  }
                  return `${stat}, `;
                } else {
                  return `${stat}. `;
                }
              })
            : null;
      });
      if (invalidStats) {
        message += "I was unable to find the following stats: ";
        message += invalidStats.join("");
        message +=
          "Are you sure you spelled them correctly, and that they're separated by commas? ";
      }
      break;
    case "headToHead":
      const statHeaders = data[0].stats
        .map((stat) => `| **${stat.name}** `)
        .join("");
      const headers = "**Player** " + statHeaders;
      const formatColumns = ":--" + data[0].stats.map(() => "|:-:").join("");
      const topStats = calculateTopStats(data);
      const columns = data
        .map((player) => {
          let [firstName, lastName] = player.name.split(" ");
          const stats = player.stats
            .map((stat) =>
              stat.value === topStats[stat.name]
                ? `| **${stat.value}** `
                : `| ${stat.value} `
            )
            .join("");
          return `**${firstName} ${lastName}** ${stats}\n `;
        })
        .join("");
      message = `${headers}\n${formatColumns}\n${columns}`;
      break;
    default:
      break;
  }

  return message;
};

const calculateTopStats = (data) => {
  let baseStats = {};

  data.forEach((player) => {
    player.stats.forEach((stat) => {
      let baseStatKeys = Object.keys(baseStats);
      if (baseStatKeys.indexOf(stat.name) === -1) {
        baseStats = { ...baseStats, [stat.name]: stat.value };
      } else {
        if (baseStats[stat.name] < stat.value)
          baseStats = { ...baseStats, [stat.name]: stat.value };
      }
    });
  });

  return baseStats;
};

const validateRequest = (indexes) => {
  const [usernameIndex, statsIndex, playersIndex, dateIndex] = indexes;
  let isValid = true;

  if (usernameIndex === -1 || statsIndex === -1 || playersIndex === -1) {
    isValid = false;
  }

  if (usernameIndex < statsIndex < playersIndex) {
    if (dateIndex > -1) {
      isValid = dateIndex > playersIndex;
    }
  }

  return isValid;
};

const mapPlayers = (names) => {
  let players = [];

  names.forEach((name) => {
    name = name.trim();
    if (!name.match(/^[a-zA-Z0-9]/)) {
      name = name.slice(1);
    }
    if (!name.match(/[a-zA-Z0-9]$/)) {
      name = name.slice(0, -1);
    }
    let fullName = name.trim().split(" ");
    const [firstName, lastName] = [
      fullName[0].trim(),
      fullName.slice(1).join(" ").trim(),
    ];
    players = [...players, { firstName, lastName }];
  });

  return players;
};

const standardizeStats = (stats) => {
  let standardizedStats = [];
  let notFoundStats = [];
  stats.forEach((stat) => {
    switch (stat.trim()) {
      case "blocks":
      case "block":
      case "blk":
      case "blks":
      case "blocks per game":
      case "block per game":
      case "blk per game":
      case "blks per game":
      case "blocks pg":
      case "block pg":
      case "blk pg":
      case "blks pg":
      case "blockspg":
      case "blockpg":
      case "blkpg":
      case "blkspg":
        standardizedStats = [...standardizedStats, "blk"];
        break;
      case "points":
      case "point":
      case "points per game":
      case "ppg":
      case "pt":
      case "pts per game":
      case "pt pg":
      case "pts pg":
      case "pt":
      case "pts":
        standardizedStats = [...standardizedStats, "pts"];
        break;
      case "minutes":
      case "mins":
      case "mpg":
      case "minutes per game":
      case "mins per game":
      case "min":
        standardizedStats = [...standardizedStats, "min"];
        break;
      case "field goals":
      case "field goals made":
      case "field goals made per game":
      case "fgmpg":
      case "field goals per game":
      case "field goal per game":
      case "field goal":
      case "fgs":
      case "fg":
      case "fgm":
        standardizedStats = [...standardizedStats, "fgm"];
        break;
      case "field goals attempted":
      case "fga":
      case "field goal attempted":
      case "fgapg":
        standardizedStats = [...standardizedStats, "fga"];
        break;
      case "3pt fg pg":
      case "3pt fg per game":
      case "3pt field goals per game":
      case "3 pt field goals per game":
      case "three point field goals per game":
      case "3pt ppg":
      case "3 pt ppg":
      case "three pointers per game":
      case "three points made":
      case "three pointers made":
      case "3 pointers made":
      case "3 points made":
      case "three pointers":
      case "3pfgpg":
      case "3pfg":
      case "fg3m":
        standardizedStats = [...standardizedStats, "fg3m"];
        break;
      case "3pt fga pg":
      case "3pt fg  attempts per game":
      case "3pt field goals attempts per game":
      case "3 pt field goal attempts per game":
      case "3 pt field goal attempt per game":
      case "3 pt field goal attempts":
      case "3 pt field goal attempt":
      case "three pt field goal attempts":
      case "three point field goals attempts per game":
      case "three point field goal attempts per game":
      case "three point field goal attempt per game":
      case "three point attempts per game":
      case "3pt attempts per game":
      case "3pt attempts":
      case "3pt fgapg":
      case "3pt fga":
      case "3ptfga":
      case "3ptfga":
      case "3pa":
      case "three point attempts":
      case "three pointers attempts":
      case "three pt attempts":
      case "three pts attempts":
      case "3 pts attempts":
      case "3 pt attempts":
      case "3pfgapg":
      case "3pfga":
      case "fg3a":
        standardizedStats = [...standardizedStats, "fg3a"];
        break;
      case "free throws made":
      case "free throws made per game":
      case "free throw made":
      case "free throw made per game":
      case "ft made":
      case "ft made per game":
      case "ftsm":
      case "ftsmpg":
      case "ftsm pg":
      case "ftmpg":
      case "ftm":
        standardizedStats = [...standardizedStats, "ftm"];
        break;
      case "free throws":
      case "free throw":
      case "free throws per game":
      case "free throws attempts":
      case "free throws attempts per game":
      case "free throw attempts":
      case "free throw attempts per game":
      case "ft attempts":
      case "ft attempts per game":
      case "fts":
      case "ftsa":
      case "ftsapg":
      case "ftsa pg":
      case "fta pg":
      case "ftapg":
      case "ftpg":
      case "ftspg":
      case "fta":
        standardizedStats = [...standardizedStats, "fta"];
        break;
      case "offensive rebounds":
      case "offensive rebound":
      case "offensive rebounds per game":
      case "offensive rebound per game":
      case "offensive rebounds pg":
      case "offensive rebound dpg":
      case "o rebounds pg":
      case "o rebound pg":
      case "offensive rbs":
      case "o rbs":
      case "o rebounds":
      case "off rebounds":
      case "of rebounds":
      case "of rebounds pg":
      case "off rebounds pg":
      case "off rebound pg":
      case "of rebound pg":
      case "of rebound per game":
      case "off rebound per game":
      case "off rebounds per game":
      case "of rebounds per game":
      case "orbs":
      case "orb":
      case "orebs":
      case "oreb":
        standardizedStats = [...standardizedStats, "oreb"];
      case "defensive rebounds":
      case "defensive rebound":
      case "defensive rebounds per game":
      case "defensive rebound per game":
      case "defensive rebounds pg":
      case "defensive rebound pg":
      case "d rebounds ppg":
      case "d rebound ppg":
      case "defensive rbs":
      case "d rbs":
      case "drbs":
      case "drb":
      case "d rebounds":
      case "d rebounds pg":
      case "d rebound pg":
      case "d rebounds per game":
      case "d rebound per game":
      case "def rebounds":
      case "def rebounds pg":
      case "def rebound pg":
      case "def rebound per game":
      case "def rebounds per game":
      case "drbs":
      case "drebs":
      case "dreb":
        standardizedStats = [...standardizedStats, "dreb"];
        break;
      case "rebounds":
      case "rebound":
      case "rebounds per game":
      case "rebound per game":
      case "rebounds pg":
      case "rebound pg":
      case "rebounds per game":
      case "rebound per game":
      case "rbs":
      case "rebs":
      case "reb":
        standardizedStats = [...standardizedStats, "reb"];
        break;
      case "assists":
      case "assist":
      case "assists per game":
      case "assist per game":
      case "assist pg":
      case "assists pg":
      case "a":
      case "as":
      case "asts":
      case "ast":
        standardizedStats = [...standardizedStats, "ast"];
        break;
      case "steals":
      case "steal":
      case "steals per game":
      case "steal per game":
      case "steals pg":
      case "steal pg":
      case "stls per game":
      case "stl per game":
      case "stls pg":
      case "stl pg":
      case "stlpg":
      case "stls":
      case "stl":
        standardizedStats = [...standardizedStats, "stl"];
        break;
      case "turnovers":
      case "turnover":
      case "turnovers per game":
      case "turnover per game":
      case "turnovers pg":
      case "turnover pg":
      case "tos per game":
      case "to per game":
      case "to pg":
      case "tos pg":
      case "topg":
      case "tos":
      case "to":
        standardizedStats = [...standardizedStats, "turnover"];
        break;
      case "personal fouls":
      case "personal foul":
      case "foul":
      case "fouls":
      case "personal fouls per game":
      case "personal foul per game":
      case "personal fouls pg":
      case "personal foul pg":
      case "fouls pg":
      case "foul pg":
      case "pfs per game":
      case "pf per game":
      case "pf pg":
      case "pfs pg":
      case "pfpg":
      case "pfspg":
      case "pfs":
      case "pf":
        standardizedStats = [...standardizedStats, "pf"];
        break;
      case "field goal percentage":
      case "field goals percentage":
      case "fg percentage":
      case "fgs percentage":
      case "fg%":
      case "fgs%":
      case "field goal pct":
      case "field goals pct":
      case "fg pct":
      case "fgs pct":
      case "fgpct":
      case "fgspct":
      case "fieldgoals percentage":
      case "fieldgoal percentage":
      case "fieldgoals pct":
      case "fieldgoal pct":
      case "fieldgoal %":
      case "fieldgoals %":
      case "fg_pct":
        standardizedStats = [...standardizedStats, "fg_pct"];
        break;
      case "three point field goal percentage":
      case "three point field goals percentage":
      case "three point fg percentage":
      case "three point fgs percentage":
      case "three point fg%":
      case "three point fgs%":
      case "three point field goal pct":
      case "three point field goals pct":
      case "three point fg pct":
      case "three point fgs pct":
      case "three point fgpct":
      case "three point fgspct":
      case "three point fieldgoals percentage":
      case "three point fieldgoal percentage":
      case "three point fieldgoals pct":
      case "three point fieldgoal pct":
      case "three point fieldgoal %":
      case "three point fieldgoals %":
      case "three point fg_pct":
      case "3 point field goal percentage":
      case "3 point field goals percentage":
      case "3 point fg percentage":
      case "3 point fgs percentage":
      case "3 point fg%":
      case "3 point fgs%":
      case "3 point field goal pct":
      case "3 point field goals pct":
      case "3 point fg pct":
      case "3 point fgs pct":
      case "3 point fgpct":
      case "3 point fgspct":
      case "3 point fieldgoals percentage":
      case "3 point fieldgoal percentage":
      case "3 point fieldgoals pct":
      case "3 point fieldgoal pct":
      case "3 point fieldgoal %":
      case "3 point fieldgoals %":
      case "3 point fg_pct":
      case "3 pt field goal percentage":
      case "3 pt field goals percentage":
      case "3 pt fg percentage":
      case "3 pt fgs percentage":
      case "3 pt fg%":
      case "3 pt fgs%":
      case "3 pt field goal pct":
      case "3 pt field goals pct":
      case "3 pt fg pct":
      case "3 pt fgs pct":
      case "3 pt fgpct":
      case "3 pt fgspct":
      case "3 pt fieldgoals percentage":
      case "3 pt fieldgoal percentage":
      case "3 pt fieldgoals pct":
      case "3 pt fieldgoal pct":
      case "3 pt fieldgoal %":
      case "3 pt fieldgoals %":
      case "3 pt fg_pct":
      case "3pt field goal percentage":
      case "3pt field goals percentage":
      case "3pt fg percentage":
      case "3pt fgs percentage":
      case "3pt fg%":
      case "3pt fgs%":
      case "3pt field goal pct":
      case "3pt field goals pct":
      case "3pt fg pct":
      case "3pt fgs pct":
      case "3pt fgpct":
      case "3pt fgspct":
      case "3pt fieldgoals percentage":
      case "3pt fieldgoal percentage":
      case "3pt fieldgoals pct":
      case "3pt fieldgoal pct":
      case "3pt fieldgoal %":
      case "3pt fieldgoals %":
      case "3pt fg_pct":
      case "3point field goal percentage":
      case "3point field goals percentage":
      case "3point fg percentage":
      case "3point fgs percentage":
      case "3point fg%":
      case "3point fgs%":
      case "3point field goal pct":
      case "3point field goals pct":
      case "3point fg pct":
      case "3point fgs pct":
      case "3point fgpct":
      case "3point fgspct":
      case "3point fieldgoals percentage":
      case "3point fieldgoal percentage":
      case "3point fieldgoals pct":
      case "3point fieldgoal pct":
      case "3point fieldgoal %":
      case "3point fieldgoals %":
      case "3point fg_pct":
      case "3pt%":
      case "3 pt percentgae":
      case "three pt percentgae":
      case "three point percentgae":
      case "3pt percentgae":
      case "3point fg_pct":
      case "fg3_pct":
        standardizedStats = [...standardizedStats, "fg3_pct"];
        break;
      case "free throw percentage":
      case "free throws percentage":
      case "ft percentage":
      case "fts percentage":
      case "ft%":
      case "fts%":
      case "ft %":
      case "fts %":
      case "free throw pct":
      case "free throw pct":
      case "ft pct":
      case "fts pct":
      case "ftpct":
      case "ftspct":
      case "freethrows percentage":
      case "freethrow percentage":
      case "freethrows pct":
      case "freethrow pct":
      case "freethrow %":
      case "freethrows %":
      case "free throws pct":
      case "free throw pct":
      case "free throw %":
      case "free throws %":
      case "ft_pct":
        standardizedStats = [...standardizedStats, "ft_pct"];
        break;
      case "all":
      case "head to head":
      case "all stats":
      case "all statistics":
        standardizedStats = [...standardizedStats, "all"];
        break;
      default:
        notFoundStats = [...notFoundStats, stat.trim()];
        break;
    }
  });

  return {
    validStats: standardizedStats,
    invalidStats: notFoundStats.filter((stat) => stat !== null || stat !== ""),
  };
};
