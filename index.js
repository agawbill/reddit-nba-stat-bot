import dotenv from "dotenv";
import Snoowrap from "snoowrap";
import Snoostorm from "snoostorm";
import { NbaApi } from "./apis/index.js";
import { getMessage } from "./services/nbaServices.js";
import http from "http";

const { CommentStream, SubmissionStream } = Snoostorm;

dotenv.config();

const r = new Snoowrap({
  userAgent: "video-bot",
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS,
});

const commentStream = new CommentStream(r, {
  subreddit: "bottesting",
  results: 50,
  pollTime: 1000,
});

const nbaApi = new NbaApi();

const startTime = Date.now();

http
  .createServer((req, res) => {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.send("it is running\n");
  })
  .listen(process.env.PORT || 5000);

console.log(`Reddit bot started at ${new Date(startTime)}...`);

commentStream.on("item", async (comment) => {
  let isForBot =
    comment.created_utc > startTime / 1000 &&
    (comment.body.toLowerCase().includes(`/u/${process.env.REDDIT_USER}`) ||
      comment.body.toLowerCase().includes(`u/${process.env.REDDIT_USER}`));

  if (isForBot) {
    try {
      const averages = await nbaApi.getAverages(comment.body);
      const message = getMessage(averages);
      console.log(message);
      comment.reply(message);
    } catch (error) {
      console.error(error);
    }
  }
});
