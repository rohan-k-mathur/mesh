// import "./spotifyIngest";
// import "./reembed";
// import "./scrollRealtime";
import 'dotenv/config';
import '@/workers/spotifyIngest';
import '@/workers/reembed';
import "@/workers/scrollRealtime";
import '@/workers/tasteVector';
import "@/workers/candidate-builder";
import "@/workers/user-knn-builder";
import "@/workers/sectionHeat";
import "@/workers/decayConfidenceJob";
import "@/workers/computeSharedAuthorEdges";

// ─────────────────────────────────────────────────────────
// Phase 3.1: Source Trust Infrastructure workers
// DISABLED during pre-launch development
// To re-enable: uncomment the imports below
// See: lib/sources/WORKERS_README.md for full documentation
// ─────────────────────────────────────────────────────────
// import "@/workers/sourceVerification";
// import "@/workers/sourceArchiving";


console.log('All workers bootstrapped');
