// app/spotify/callback/DashboardCharts.tsx
'use client';

import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);                // once, globally

import { Pie, Bar } from 'react-chartjs-2';

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
    datasets: [{ data: summary.topArtists.map(([, cnt]) => cnt) }],
  };

  const barData = {
    labels:   summary.years.map(([y]) => y.toString()),
    datasets: [{ data: summary.years.map(([, cnt]) => cnt) }],
  };

  return (
    <div style={{ maxWidth: 900, margin: '40px auto' }}>
      <h2>{headline}</h2>

      <h3>Top 10 Artists</h3>
      <Pie data={pieData} />

      <h3>Liked Tracks per Year</h3>
      <Bar
        data={barData}
        options={{ plugins: { legend: { display: false } }, responsive: true }}
      />
    </div>
  );
}
