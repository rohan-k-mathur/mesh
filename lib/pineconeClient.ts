import { PineconeClient } from "@pinecone-database/pinecone";

const client = new PineconeClient();
let initialized = false;

async function init() {
  if (!initialized) {
    await client.init({
      apiKey: process.env.PINECONE_API_KEY || "",
      environment: process.env.PINECONE_ENV || process.env.PINECONE_ENVIRONMENT || "",
    });
    initialized = true;
  }
}

export async function getPineconeIndex() {
  await init();
  const indexName = process.env.PINECONE_INDEX || "users";
  return client.Index(indexName);
}
