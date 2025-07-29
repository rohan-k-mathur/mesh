"use client";

import useSWR from "swr";
import Link from "next/link";

const fetcher = (u: string) => fetch(u).then((r) => r.json());

export default function CartButton() {
  const { data } = useSWR("/api/cart/count", fetcher, { refreshInterval: 15000 });
  const n = data?.n ?? 0;
  return (
    <Link href="/cart" className="relative">
      🛒
      {n > 0 && (
        <span className="absolute -right-2 -top-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
          {n}
        </span>
      )}
    </Link>
  );
}
