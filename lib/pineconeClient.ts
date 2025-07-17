import { Pinecone } from '@pinecone-database/pinecone';
import { createClient, SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | null = null;
function getSupabase() {
  if (supabase) return supabase;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.warn("Supabase env vars missing; pgvector fallback disabled");
    return null;
  }
  supabase = createClient(url, key);
  return supabase;
}

export async function knnPgvector(vec: number[], k = 200) {
  const sb = getSupabase();
  if (!sb) return [];                // silent noop fallback
  const { data, error } = await sb.rpc("knn_user_vectors", {
    query_vector: vec,
    result_count: k,
  });
  if (error) throw error;
  return data;
}
const projectName = process.env.PINECONE_PROJECT_NAME;
const apiKey = process.env.PINECONE_API_KEY;
const environment = process.env.PINECONE_ENVIRONMENT;
const indexName = process.env.PINECONE_INDEX_NAME || "users";

// --- singleton pattern avoids reconnecting every call ----
const pinecone = new Pinecone();
let pineconeReady = false;

async function initPinecone() {
  if (pineconeReady) return;
  if (!apiKey || !environment) return; // graceful fallback
  await pinecone.init({
    apiKey,
    environment,
    ...(projectName ? { projectName } : {}),
  });
  pineconeReady = true;
}

/** Returns the index or `undefined` if env-vars are missing. */
export async function getPineconeIndex() {
  await initPinecone();
  return pineconeReady ? pinecone.Index(indexName) : undefined;
}

/* ---------- optional pgvector fallback ------------------ */
// const supabase = createSupabaseClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_ANON_KEY!
// );

// export async function knnPgvector(vector: number[], k = 200) {
//   const { data, error } = await supabase.rpc("knn_user_vectors", {
//     query_vector: vector,
//     result_count: k,
//   });
//   if (error) throw error;
//   return data;
// }

// async function init() {
//   if (!initialized) {
//     await client.init({
//       apiKey: process.env.PINECONE_API_KEY || "",
//       environment: process.env.PINECONE_ENV || process.env.PINECONE_ENVIRONMENT || "",
//     });
//     initialized = true;
//   }
// }

// export async function getPineconeIndex() {
//     if (!apiKey || !environment || !indexName) return undefined;   // graceful fallback

//   await init();
//   const indexName = process.env.PINECONE_INDEX || "users";
//   return client.Index(indexName);
// }
// export async function getPineconeIndex() {
//   if (!apiKey || !environment || !indexName) return undefined;   // graceful fallback

//   const pinecone = new Pinecone({ apiKey, environment });
//   await pinecone.init();                                         // required!
//   return pinecone.Index(indexName);
// }

/* optional pgvector fallback helper */
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_ANON_KEY!
// );

// export async function knnPgvector(userVector: number[], k = 200) {
//   const { data, error } = await supabase.rpc('knn_user_vectors', {
//     query_vector: userVector,
//     result_count: k,
//   });
//   if (error) throw error;
//   return data;
// }
