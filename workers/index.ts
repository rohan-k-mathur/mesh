// import "./spotifyIngest";
// import "./reembed";
// import "./scrollRealtime";
import 'dotenv/config';
import '@/workers/spotifyIngest';
import '@/workers/reembed';
import "@/workers/scrollRealtime";

console.log('All workers bootstrapped');