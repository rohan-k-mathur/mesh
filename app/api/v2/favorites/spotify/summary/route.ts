// // import { Readable }         from 'node:stream';   // ✅ Node streams, not node:stream/web
// // import { parser }           from 'stream-json';
// // import { streamArray }      from 'stream-json/streamers/StreamArray';

// // export const runtime = 'nodejs';   // keep it in Node, not edge// app/api/v2/favorites/spotify/summary/route.ts
// // import { NextRequest, NextResponse } from 'next/server';
// // import { getUserFromCookies }        from '@/lib/serverutils';
// // // lib/supabaseServer.ts
// // import { createClient } from '@supabase/supabase-js';
// // // import { Chart as ChartJS, registerables } from 'chart.js';



// // import { Chart as ChartJS, registerables } from 'chart.js';
// // ChartJS.register(...registerables);

// // import { Doughnut, Bar, Line } from 'react-chartjs-2';  

// // // Service-role key **must** stay on the server!
// // const supabase = createClient(
// //   process.env.NEXT_PUBLIC_SUPABASE_URL!,   // your project URL
// //   process.env.SUPABASE_SERVICE_ROLE_KEY!,  // service-role key
// //   {
// //     auth: { persistSession: false }        // no cookies on server
// //   }
// // );

// // export { supabase };
// // export async function GET(req: NextRequest) {
// //   const user = await getUserFromCookies();
// //   const path = req.nextUrl.searchParams.get('path');
// //   if (!user?.userId || !path)
// //     return NextResponse.json({ error: 'bad req' }, { status: 400 });

// //   /* ---------- download the file as a stream ---------- */
// //   const { data: blob, error } =
// //     await supabase.storage.from('favorites-raw').download(path);
// //   if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  

// //   /* ---------- stream-parse & aggregate ---------- */
// //   const totalByArtist = new Map<string, number>();
// //   const totalByYear   = new Map<number, number>();
// //   let   total         = 0;

// //   await new Promise<void>((resolve, reject) => {
// //     // turn the Blob into a Node-style Readable
// //     Readable
// //       .fromWeb((blob as Blob).stream())   // Node 18+ helper
// //       .pipe(parser())
// //       .pipe(streamArray())
// //       .on('data', ({ value }) => {
// //         /* your aggregate logic here */
// //       })
// //       .on('end',   resolve)
// //       .on('error', reject);
// //   });

// //   const topArtists = [...totalByArtist.entries()]
// //                       .sort((a,b) => b[1]-a[1]).slice(0,10);
// //   const years      = [...totalByYear.entries()]
// //                       .sort((a,b) => a[0]-b[0]);

// //   return NextResponse.json({ total, topArtists, years });
// // }

// // app/api/v2/favorites/spotify/summary/route.ts
// import { Readable } from 'node:stream';

// import { NextRequest, NextResponse } from 'next/server';
// import { getUserFromCookies }        from '@/lib/serverutils';
// import { createClient }              from '@supabase/supabase-js';
// import { parser }                    from 'stream-json';
// import { streamArray }               from 'stream-json/streamers/StreamArray';

// // ----- Supabase service-role client -----
// const supabase = createClient(
//   process.env.NEXT_PUBLIC_SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!,
//   { auth: { persistSession: false } }
// );

// const nodeStream = Readable.fromWeb(blob.stream()); // ← magic adapter


// export const runtime = 'nodejs';   // keep it on Node – we need streams

// export async function GET(req: NextRequest) {
//   const user = await getUserFromCookies();
//   const path = req.nextUrl.searchParams.get('path');

//   if (!user?.userId || !path) {
//     return NextResponse.json({ error: 'bad req' }, { status: 400 });
//   }

//   // 1. download as Blob (15 MB in your case)
//   const { data: blob, error } =
//     await supabase.storage.from('favorites-raw').download(path);

//   if (error || !blob) {
//     return NextResponse.json({ error: error?.message ?? 'download failed' },
//                              { status: 500 });
//   }

//   //* ---------- stream-parse & aggregate ---------- */
// const byArtist = new Map<string, number>();
// const byYear   = new Map<number, number>();
// let   total    = 0;

// // convert the Blob’s Web stream → Node stream, then pipe into stream-json
// await new Promise<void>((resolve, reject) => {
//   Readable.fromWeb(blob.stream())
//     .pipe(parser())
//     .pipe(streamArray())
//     .on('data', ({ value }) => {
//       total++;

//       const artist = value.track?.artists?.[0]?.name ?? 'Unknown';
//       byArtist.set(artist, (byArtist.get(artist) ?? 0) + 1);

//       const year = Number(value.track?.album?.release_date?.slice(0, 4));
//       if (year) byYear.set(year, (byYear.get(year) ?? 0) + 1);
//     })
//     .on('end',   resolve)
//     .on('error', reject);
// });


//   const topArtists = [...byArtist.entries()]
//                      .sort((a,b) => b[1]-a[1])
//                      .slice(0, 10);

//   const years      = [...byYear.entries()]
//                      .sort((a,b) => a[0]-b[0]);

//   return NextResponse.json({ total, topArtists, years });  // <= non-empty body
// }

// app/api/v2/favorites/spotify/summary/route.ts
import { Readable } from 'node:stream';            // 👈 classic streams
import { NextRequest, NextResponse } from 'next/server';
import { getUserFromCookies } from '@/lib/serverutils';
import { createClient } from '@supabase/supabase-js';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';

export const runtime = 'nodejs';                   // we need Node streams

/* ───────── Supabase (service-role) ───────── */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/* ───────── GET /summary ───────── */
export async function GET(req: NextRequest) {
  const user = await getUserFromCookies();
  const path = req.nextUrl.searchParams.get('path');
  if (!user?.userId || !path) {
    return NextResponse.json({ error: 'bad req' }, { status: 400 });
  }

  /* 1. download the JSON file as a Blob */
  const { data: blob, error } =
    await supabase.storage.from('favorites-raw').download(path);
  if (error || !blob) {
    return NextResponse.json(
      { error: error?.message ?? 'download failed' },
      { status: 500 }
    );
  }

  /* 2. stream-parse & aggregate */
  const byArtist = new Map<string, number>();
  const byYear   = new Map<number, number>();
  let   total    = 0;

  await new Promise<void>((resolve, reject) => {
    Readable.fromWeb(blob.stream())        // 👈 Web-stream → Node stream
      .pipe(parser())
      .pipe(streamArray())
      .on('data', ({ value }) => {
        total++;

        const artist = value.track?.artists?.[0]?.name ?? 'Unknown';
        byArtist.set(artist, (byArtist.get(artist) ?? 0) + 1);

        const year = Number(value.track?.album?.release_date?.slice(0, 4));
        if (year) byYear.set(year, (byYear.get(year) ?? 0) + 1);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  /* 3. build summary */
  const topArtists = [...byArtist.entries()]
                       .sort((a, b) => b[1] - a[1])
                       .slice(0, 10);

  const years      = [...byYear.entries()]
                       .sort((a, b) => a[0] - b[0]);

  return NextResponse.json({ total, topArtists, years });
}
