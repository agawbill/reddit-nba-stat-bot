import dotenv from "dotenv";

dotenv.config();

export const checkComment = (comment, startTime) => {
  return (
    comment.created_utc > startTime / 1000 &&
    (comment.body.toLowerCase().includes(`/u/${process.env.REDDIT_USER}`) ||
      comment.body.toLowerCase().includes(`u/${process.env.REDDIT_USER}`))
  );
};
