import dotenv from "dotenv";
import chalk from "chalk";
import Snoowrap from "snoowrap";
import Snoostorm from "snoostorm";
import { NbaApi } from "./apis/index.js";
import { getMessage } from "./services/nbaServices.js";

const { CommentStream } = Snoostorm;

dotenv.config();

const r = new Snoowrap({
  userAgent: process.env.USER_AGENT,
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS,
});

const commentStream = new CommentStream(r, {
  subreddit: process.env.SUBREDDIT,
  limit: parseInt(process.env.POLL_LIMIT),
  pollTime: parseInt(process.env.POLL_TIME),
});

const nbaApi = new NbaApi();

const startTime = Date.now();

console.log(
  chalk.greenBright(`Reddit bot started at ${new Date(startTime)}...\n `)
);

commentStream.on("item", async (comment) => {
  let isForBot =
    comment.created_utc > startTime / 1000 &&
    (comment.body.toLowerCase().includes(`/u/${process.env.REDDIT_USER}`) ||
      comment.body.toLowerCase().includes(`u/${process.env.REDDIT_USER}`));

  if (isForBot) {
    try {
      const averages = await nbaApi.getStats(comment.body);
      const message = getMessage(averages);
      comment.reply(message);
      console.log(
        chalk.blueBright("Replied to ") +
          chalk.blueBright.underline(`${comment.author.name}`) +
          chalk.blueBright(": ") +
          `${message} \n`
      );
    } catch (error) {
      console.error(error);
    }
  }
});

process.on("unhandledRejection", (err) => {
  if (err.message.includes("ETIMEDOUT")) {
    console.log(
      chalk.yellow(
        `A request timed out at ${new Date().toLocaleString(
          "en-US"
        )} due to network; polling will continue. \n`
      )
    );
  }
});

process.on("SIGINT", () => {
  console.log(
    chalk.redBright(`\nReddit bot stopped at ${new Date(startTime)}...`)
  );
  process.exit(0);
});
