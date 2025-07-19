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


console.log('All workers bootstrapped');
