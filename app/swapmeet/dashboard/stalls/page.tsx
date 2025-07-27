"use client";

import useSWR from "swr";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import StallForm from "@/components/forms/StallForm";
import { StallPresenceTracker } from "@/components/PresenceBadge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StallsPage() {
  const { data, mutate } = useSWR("/swapmeet/api/section?x=0&y=0", fetcher);
  const stalls = data?.stalls ?? [];

  const [open, setOpen] = useState(false);

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      { accessorKey: "id", header: "ID" },
      { accessorKey: "name", header: "Name" },
    ],
    [],
  );

  const table = useReactTable({
    data: stalls,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function createStall(values: any) {
    await fetch("/swapmeet/api/stall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    mutate();
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">My Stalls</h1>
      <Button onClick={() => setOpen(true)} className="mb-2">New Stall</Button>
      <table className="min-w-full border">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="border px-2 py-1 text-left">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="border px-2 py-1">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
              <StallPresenceTracker stallId={row.original.id} />
            </tr>
          ))}
        </tbody>
      </table>
      <Link href="/swapmeet" className="block mt-4">Back to market</Link>
      <StallForm open={open} onOpenChange={setOpen} onSubmit={createStall} />
    </div>
  );
}
