// components/dashboard/ItemsPanel.tsx
'use client';
import useSWR from 'swr';
import { AddItemModal } from './AddItemModal';

export function ItemsPanel({ stallId }: { stallId: string }) {
  const { data, mutate } = useSWR(`/api/stalls/${stallId}/items`, (url: string) =>
    fetch(url).then(r => r.json()),
  );

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Your Items</h2>
        <AddItemModal stallId={stallId} />
      </div>

      {!data ? (
        <p>Loading…</p>
      ) : data.length === 0 ? (
        <p className="text-gray-500">No items yet.</p>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.map((item: any) => (
            <li key={item.id} className="rounded border p-4 space-y-2">
              <img src={item.images[0]} className="h-32 w-full object-cover rounded" />
              <h3 className="font-medium">{item.name}</h3>
              <p>${item.price.toFixed(2)} &middot; Stock {item.stock}</p>
              {item.sold && <span className="text-green-600">Sold</span>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
