"use client";

import { useEffect, useState } from "react";

const cache: Record<number, string[]> = {};

export function NickCompleter({
  stallId,
  onSelect,
}: {
  stallId: number;
  onSelect: (name: string) => void;
}) {
  const [users, setUsers] = useState<string[]>(cache[stallId] ?? []);

  useEffect(() => {
    if (!cache[stallId]) {
      fetch(`/swapmeet/api/stall/viewers?stallId=${stallId}`)
        .then(res => res.json())
        .then((list: string[]) => {
          cache[stallId] = list;
          setUsers(list);
        });
    }
  }, [stallId]);

  if (users.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 p-2">
      {users.map(u => (
        <button
          key={u}
          type="button"
          onClick={() => onSelect(u)}
          className="text-xs text-blue-600 hover:underline"
        >
          @{u}
        </button>
      ))}
    </div>
  );
}
