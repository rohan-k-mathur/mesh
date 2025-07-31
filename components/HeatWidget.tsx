"use client";
import { Chart as ChartJS, registerables } from 'chart.js';
ChartJS.register(...registerables);                // once, globally

import { Pie, Bar, Line, Doughnut } from 'react-chartjs-2';
import useSWR from "swr";
export default function HeatWidget({ stallId }:{ stallId:number }){
  const { data=[] } = useSWR(`/api/stall/${stallId}/heat`, (u)=>fetch(u).then(r=>r.json()), { refreshInterval: 10_000 });
  return (
    <div className="max-h-[700px] h-fit flex  w-full ">
    <Bar data={{
      
      labels:["↖","↑","↗","←","•","→","↙","↓","↘"],
      datasets:[{ data, backgroundColor:"rgba(34,99,255,.6)" }],
    }} options={{ plugins:{legend:{display:false}},  scales:{y:{display:false}} }} />
    </div>
  );
}
