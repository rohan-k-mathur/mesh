"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StallsPage() {
  const { data } = useSWR("/api/section?x=0&y=0", fetcher);
  const stalls = data?.stalls ?? [];

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">My Stalls</h1>
      <table className="min-w-full border">
        <thead>
          <tr>
            <th className="border px-2 py-1 text-left">ID</th>
            <th className="border px-2 py-1 text-left">Name</th>
          </tr>
        </thead>
        <tbody>
          {stalls.map((s: any) => (
            <tr key={s.id}>
              <td className="border px-2 py-1">{s.id}</td>
              <td className="border px-2 py-1">{s.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/swapmeet">Back to market</Link>
    </div>
  );
}
