A Reddit comment bot that will reply to you with NBA stats for specific players when you ask it. Created using Node and the SnooWrap Reddit API wrapper (along with SnooStorm). Address the bot as follows in a Reddit comment: u/{username of bot} find {stat names, separated by commas} for {player names, separated by commas} in {*optional parameter* year you want to get averages from}

FindNbaStats bot

This is a stat bot utilizing the balldontlie API to retrieve and return stats to Reddit Users that address the bot by username via comment on the r/nba subreddit. 

Instructions for NBA Reddit Bot:

All queries must start by addressing the Reddit bot by username.

The bot is listening for its username to be mentioned on the r/nba subreddit. Once it spots a comment that addresses the bot by username, it assumes everything following the username is the query; therefore, all text preceding the username in the comment will be ignored (with no impact on the bot's response), and all text following the username must be a part of the query (as it will impact the response). If you try to write text after the query in the comment, you're going to get a funky response. 

Correct examples:
- u/FindNbaStats find blocks for Lebron James.
- Here are some stats for Jo and Bron, u/FindNbaStats find blocks, assists for Lebron James, Joel Embiid.
- u/FindNbaStats find blocks, assists for Lebron James, Joel Embiid in 2019.
- Jo and Bron head to head, u/FindNbaStats find head to head for Lebron James, Joel Embiid.
- 
The query portion follows a specific format that's outlined in detail below. 

If you don't follow the format, you're going to get a funky response. 

The query has 3 parameter types: stats, players, season (which is the season's year).

Stats and players are mandatory parameters that must be passed in the query. The season paramenter is optional. Without the season paramenter, the query will default to finding statistics for the most recent season.

Examples:
- u/{username} find {stat(s)} for {player(s)}.
- u/{username} find {stat(s)} for {player(s)} in {season}.
- 
Stats: The names of statistics you wish to search for, separated by commas if you intend to search for multiple stats. Stats must be preceded by the word "find".

Examples:
- Find blocks for Lebron James.
- Find blocks, assists, points for Lebron James.
Players: The full names of the players you want to search for separated by commas. It must be the player's first and last name, and must be preceded by the word "for".
Examples:
- Find blocks for Lebron James.
- Find blocks for Lebron James, Kyrie Irving, Joel Embiid.
- Find blocks, points for Lebron James.
- Find blocks, points for Lebron James, Kyrie Irving, Joel Embiid.
- 
Season: This is an optional paramenter. It must be singular (you can only enter 1 year), and must be preceded by the word "in". If no "season" paramenter is entered, the query will default to searching for stats in the most recent season.

Examples:
- Find blocks, points for Joel Embiid in 2019.
- Find blocks, points for Lebron James, Kyrie Irving, Joel Embiid in 2018.
- 
HEAD TO HEAD

You can also search for all the season averages for a particular player, or head to head statistics for a group of players. This will return results in a table format, and the column value for the player with the best (greatest) statistic category will be highlighted as bold when compared to the other players in the query.

To trigger head to head comparisons, or return all the statistics for a particular player, the user must enter "all" or "head to head" for the "stats" parameter. Like the regular "stats" parameter, it must be preceded by the word "find".

Examples:
- Find all for Joel Embiid.
- Find head to head for Lebron James, Kyrie Irving, Joel Embiid.
- Find all for Joel Embiid in 2019.
- Find head to head for Lebron James, Kyrie Irving, Joel Embiid in 2018.

TLDR:
- The query must start with the username of the bot.
- The "stats" parameter must come next; must be preceded by the word "find"; and the stats must be separated by commas.
- The "players" parameter must follow the stats parameter; must be preceded by the word "for"; and you must include the correctly spelled first AND last name of the players, with each player's full name separated by commas.
- The "season" parameter is optional; but, it must be preceded by the word "in" and include just 1  year (you can't search across multiple seasons). 
