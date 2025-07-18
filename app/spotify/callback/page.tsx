// // app/(pages)/spotify/callback/DashboardCharts.tsx
// 'use client';                 // required for Chart.js in the app router

// import { Chart as ChartJS, registerables } from 'chart.js';
// ChartJS.register(...registerables);

// import { Doughnut, Bar, Line } from 'react-chartjs-2';

// import { useEffect, useState } from 'react';
// import { useSearchParams }     from 'next/navigation';

// export const dynamic = 'force-dynamic';

// type Summary = {
//   total: number;
//   topArtists: [string, number][];
//   years:      [number, number][];
// };

// export default function SpotifyCallback() {
//   const params = useSearchParams();
//   const [msg,     setMsg]     = useState('Checking sync status…');
//   const [summary, setSummary] = useState<Summary | null>(null);

//   // helper: poll status until "done"
//   async function fetchStatus(): Promise<void> {
//     const res  = await fetch('/api/v2/favorites/spotify/status');
//     const data = await res.json();
//     if (data.status === 'done' && data.path) {

//         const sRes = await fetch(
//             `/api/v2/favorites/spotify/summary?path=${encodeURIComponent(data.path)}`
//           );
          
//           let sum: any = {};
//           if (sRes.ok && +sRes.headers.get('content-length')! > 0) {
//             // body exists → parse JSON
//             sum = await sRes.json();
//           }
          
//           if (sRes.ok && sRes.status === 200 && sum.total) {
//             setSummary(sum);
//             setMsg(`Imported ${sum.total} liked tracks`);
//           } else {
//             setMsg('Summary still building – please refresh in a moment');
//           }



//     //   const sRes = await fetch(`/api/v2/favorites/spotify/summary?path=${encodeURIComponent(data.path)}`);
//     //   const sum  = await sRes.json();
//     //   setSummary(sum);
//     //   setMsg(`Imported ${sum.total} liked tracks`);
//     } else if (data.status === 'none') {
//       // trigger import only once
//       const code = params.get('code');
//       if (code) {
//         await fetch('/api/v2/favorites/import/spotify', {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body:    JSON.stringify({ code }),
//         });
//         setMsg('Syncing your Spotify likes…');
//       }
//       setTimeout(fetchStatus, 5000);
//     } else {
//       // syncing / pending → poll
//       setTimeout(fetchStatus, 5000);
//     }
//   }

//   useEffect(() => { fetchStatus(); }, []);

//   /* ---------- render ---------- */
//   if (!summary) return <p style={{ padding: 32 }}>{msg}</p>;

//   const pieData = {
//     labels: summary.topArtists.map(a => a[0]),
//     datasets: [{ data: summary.topArtists.map(a => a[1]) }],
//   };

//   const barData = {
//     labels: summary.years.map(y => y[0]),
//     datasets: [{ data: summary.years.map(y => y[1]) }],
//   };

//   return (
//     <div style={{ maxWidth: 900, margin: '40px auto' }}>
//       <h2>{msg}</h2>

//       <h3>Top 10 Artists</h3>
//       <Pie data={pieData} />

//       <h3>Number of Liked Tracks per Year</h3>
//       <Bar data={barData} options={{ plugins: { legend: { display: false }}}} />
//     </div>
//   );
// }

// app/spotify/callback/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams }     from 'next/navigation';

import DashboardCharts, { type Summary } from './DashboardCharts';

/* ------------------------------------------------------------------ */

export const dynamic = 'force-dynamic';

export default function SpotifyCallback() {
  const params              = useSearchParams();
  const [msg, setMsg]       = useState('Checking sync status…');
  const [summary, setSum]   = useState<Summary | null>(null);
  const [inFlight, setFly ] = useState(false);         // guard against double polling

  /** Poll `/status` until it says `done`, then load the summary                */
  const pollStatus = async () => {
    if (inFlight) return;                              // don’t start another fetch loop
    setFly(true);

    try {
      const res  = await fetch('/api/v2/favorites/spotify/status', { cache: 'no-store' });
      const data = res.ok ? await res.json() : { status: 'error', error: res.statusText };

      if (data.status === 'done' && data.path) {
        /* ---------- try to read the summary ---------- */
        const sRes = await fetch(
          `/api/v2/favorites/spotify/summary?path=${encodeURIComponent(data.path)}`,
          { cache: 'no-store' }
        );

        let sum: Summary | null = null;
        if (sRes.ok && Number(sRes.headers.get('content-length') || 0) > 0) {
          sum = await sRes.json();
        }

        if (sum && sum.total) {
          setSum(sum);
          setMsg(`Imported ${sum.total} liked tracks`);
        } else {
          // summary not ready yet – poll again in 5 s
          setTimeout(pollStatus, 5_000);
        }
      }

      else if (data.status === 'none') {
        /* ---------- first time: kick off the import ---------- */
        const code = params.get('code');
        if (code) {
          await fetch('/api/v2/favorites/import/spotify', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ code }),
          });
          setMsg('Syncing your Spotify likes…');
        }
        // try again in 5 s
        setTimeout(pollStatus, 5_000);
      }

      else {
        // status is ‘syncing’ / ‘pending’ / error – keep polling
        setTimeout(pollStatus, 5_000);
      }
    } catch (err) {
      console.error(err);
      setMsg('Network error – retrying in 10 s');
      setTimeout(pollStatus, 10_000);
    } finally {
      setFly(false);
    }
  };

  useEffect(() => { pollStatus(); }, []);              // eslint-disable-line react-hooks/exhaustive-deps

  /* ---------- render ---------- */
  if (!summary) {
    return <p style={{ padding: 32 }}>{msg}</p>;
  }

  return <DashboardCharts summary={summary} headline={msg} />;
}
