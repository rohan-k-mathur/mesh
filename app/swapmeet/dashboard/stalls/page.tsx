"use client";

import useSWR from "swr";
import Link from "next/link";
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
import { useMemo, useState } from "react";
import StallForm from "@/components/forms/StallForm";
import { compressImage, generateBlurhash } from "@/lib/image";
import { uploadStallImage } from "@/lib/utils";
import { uploadStallThumb } from "@/lib/uploadthumbnail";
import { StallPresenceTracker } from "@/components/PresenceBadge";
import { Button } from "@/components/ui/button";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function StallsPage() {
  const { data: stalls, mutate } = useSWR(
    "/swapmeet/api/my-stalls",
    fetcher,
    { revalidateOnFocus: false },
  );  const isLoading = !stalls;

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
    data: stalls ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  async function createStall(values: {
    name: string;
    sectionId: number;
    image?: File;
  }) {
    try {
      setLoading(true);
  
      /* ----------------------------------------------------------- 1. create row */
      const res = await fetch("/swapmeet/api/stall", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: values.name, sectionId: values.sectionId }),
      });
  
      if (res.status === 409) {
        alert("You already have a stall in that section.");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
  
      const { id } = (await res.json()) as { id: number };
  
      /* -------------------------------------------------- 2. optional thumbnail */
      let publicUrl: string | null = null;
  
      if (values.image instanceof File) {
        const compressed = await compressImage(values.image);
        const blurhash   = await generateBlurhash(compressed);
        publicUrl        = await uploadStallThumb(
          compressed,
          BigInt(id),            // helper expects bigint
        );
  
        await fetch("/swapmeet/api/stall-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stallId: id,
            url: publicUrl,
            blurhash,
          }),
        });
      }
  
      /* ------------------------------------------- 3. optimistic SWR local cache */
      mutate(
        (prev: any[] | undefined) =>
          prev
            ? prev.concat({
                id,
                name: values.name,
                // visitors: 0,
                img: publicUrl ?? null,
              })
            : [
                { id, name: values.name, visitors: 0, img: publicUrl ?? null },
              ],
        false,               // keep optimistic cache, no fetch yet
      );
      setOpen(false);               // close modal
    } catch (err: any) {
      console.error(err);
      alert("Failed to create stall — see console for details.");
    } finally {
      setLoading(false);
    }
  }
  

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold mb-4">My Stalls</h1>
      <button
        onClick={() => setOpen(true)}
        className="bg-[var(--ubz-brand)] text-white shadow-ubz1 fixed top-4 right-4 savebutton px-3 py-1 rounded-lg"
        disabled={loading}
      >
        {loading ? "Saving..." : "+ New Stall"}
      </button>
      <div className="rounded-none">
      <table className="w-full text-sm shadow-xl mt-8 rounded-none">
        <thead className="bg-[var(--ubz-street)] text-white rounded-none">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="border px-2 py-1 text-left rounded-none">
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
                  <td colSpan={3} className="px-2 py-1 rounded-none">
                    <div className="animate-pulse h-6 bg-gray-200 rounded-none" />
                  </td>
                </tr>
              ))
            : table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="border px-2 py-1 bg-white/30 shadow-xl rounded-none">
                      <button className="savebutton w-full text-left px-4">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </button>
                    </td>
                  ))}
                  <StallPresenceTracker stallId={row.original.id} />
                </tr>
              ))}
        </tbody>
      </table>
      </div>
      <Link href="/swapmeet/market/0/0" className="flex flex-col savebutton rounded-xl w-fit bg-white/20 p-3  mt-8">Back to Market</Link>
      <StallForm open={open} onOpenChange={setOpen} onSubmit={createStall} loading={loading} />
    </div>
  );
}

