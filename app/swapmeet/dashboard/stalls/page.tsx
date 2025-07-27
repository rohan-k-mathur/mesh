"use client";

import useSWR from "swr";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import StallForm from "@/components/forms/StallForm";
import { compressImage, generateBlurhash } from "@/lib/image";
import { uploadStallImage } from "@/lib/utils";
import { StallPresenceTracker } from "@/components/PresenceBadge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StallsPage() {
  const { data, mutate } = useSWR("/swapmeet/api/section?x=0&y=0", fetcher);
  const stalls = data?.stalls ?? [];
  const isLoading = !data;

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

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
    const { image, ...rest } = values;
    setLoading(true);
    const res = await fetch("/swapmeet/api/stall", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rest),
    });
    const data = await res.json();
    const stallId = data.id;
    if (image instanceof File) {
      const compressed = await compressImage(image);
      const [blurhash, upload] = await Promise.all([
        generateBlurhash(compressed),
        uploadStallImage(compressed),
      ]);
      if (upload.fileURL) {
        await fetch("/swapmeet/api/stall-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stallId, url: upload.fileURL, blurhash }),
        });
      }
    }
    mutate(
      (prev) =>
        prev
          ? { ...prev, stalls: [...prev.stalls, { id: stallId, name: rest.name }] }
          : prev,
      false,
    );
    setLoading(false);
  }

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">My Stalls</h1>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[var(--ubz-brand)] text-white shadow-ubz1 fixed top-4 right-4"
        disabled={loading}
      >
        {loading ? "Saving..." : "+ New Stall"}
      </Button>
      <table className="w-full text-sm">
        <thead className="bg-[var(--ubz-street)] text-white">
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
          {isLoading
            ? [1, 2, 3].map((n) => (
                <tr key={n}>
                  <td colSpan={3} className="px-2 py-1">
                    <div className="animate-pulse h-6 bg-gray-200 rounded" />
                  </td>
                </tr>
              ))
            : table.getRowModel().rows.map((row) => (
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
      <StallForm open={open} onOpenChange={setOpen} onSubmit={createStall} loading={loading} />
    </div>
  );
}
