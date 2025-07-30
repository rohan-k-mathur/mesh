// app/spotify/callback/DashboardCharts.tsx
'use client';
import React from 'react';
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);                // once, globally

import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';

export type Summary = {
  total:      number;
  topArtists: [string, number][];
  years:      [number, number][];
};

export default function DashboardCharts(
  { summary, headline }:
  { summary: Summary; headline: string }
) {
  /* ---------- datasets ---------- */
  const pieData = {
    labels:   summary.topArtists.map(([name]) => name),
    datasets: [{ data: summary.topArtists.map(([, cnt]) => cnt) , 
    // BackgroundColor: [
    //     'rgba(255, 99, 132, 0.2)',
    //     'rgba(54, 162, 235, 0.2)',
    //     'rgba(255, 206, 86, 0.2)',
    //     'rgba(75, 192, 192, 0.2)',
    //     'rgba(153, 102, 255, 0.2)',
    //     'rgba(255, 159, 64, 0.2)',
    //     'rgba(255, 159, 64, 0.2)',
    //     'rgba(255, 159, 64, 0.2)',
    //     'rgba(255, 159, 64, 0.2)',
    //     'rgba(255, 159, 64, 0.2)',

    //   ],
    //   borderColor: [
    //     'rgba(255, 99, 132, 1)',
    //     'rgba(54, 162, 235, 1)',
    //     'rgba(255, 206, 86, 1)',
    //     'rgba(75, 192, 192, 1)',
    //     'rgba(153, 102, 255, 1)',
    //     'rgba(255, 159, 64, 1)',
    //     'rgba(255, 159, 64, 1)',
    //     'rgba(255, 159, 64, 1)',
    //     'rgba(255, 159, 64, 1)',
    //     'rgba(255, 159, 64, 1)',

    //   ],
      borderWidth: 1,}],
  };
//   export const data = {
//     labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//     datasets: [
//       {
//         label: '# of Votes',
//         data: [12, 19, 3, 5, 2, 3],
//         backgroundColor: [
//           'rgba(255, 99, 132, 0.2)',
//           'rgba(54, 162, 235, 0.2)',
//           'rgba(255, 206, 86, 0.2)',
//           'rgba(75, 192, 192, 0.2)',
//           'rgba(153, 102, 255, 0.2)',
//           'rgba(255, 159, 64, 0.2)',
//         ],
//         borderColor: [
//           'rgba(255, 99, 132, 1)',
//           'rgba(54, 162, 235, 1)',
//           'rgba(255, 206, 86, 1)',
//           'rgba(75, 192, 192, 1)',
//           'rgba(153, 102, 255, 1)',
//           'rgba(255, 159, 64, 1)',
//         ],
//         borderWidth: 1,
//       },
//     ],
//   };
  const barData = {
    labels:   summary.years.map(([y]) => y.toString()),
    datasets: [{ data: summary.years.map(([, cnt]) => cnt) }],
  };

  return (
    <div className='space-y-3' style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2 className='text-[2rem] text-center'>{headline}</h2>
      <hr></hr>
    <div className='space-y-2'>

      <h3 className='text-[1.8rem]  text-center'>Liked Tracks per Year</h3>
      <Bar
        data={barData}
        options={{ plugins: { legend: { display: false } }, responsive: true }}
      />
            <hr></hr>

      <h3 className='text-[1.8rem] text-center justify-center'>Your Top 10 Artists</h3>
      <Pie className='w-3/4 h-3/4 items-center justify-center mx-auto' data={pieData} 
      />

      </div>
    </div>
  );
}
