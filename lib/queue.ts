import { Queue } from "bullmq";
import redis from "./redis";

export const spotifyIngestQueue = new Queue("spotify:ingest", {
  connection: redis,
});
