// hooks/useMarket.ts
import useSWR from "swr";
import { Market } from "@/lib/types/prediction";


interface MarketResponse {
  market: Market;
  price: number;
  canResolve: boolean;
}

const fetcher = (url: string) =>
  fetch(url).then(r => r.json()).then((j: MarketResponse) => j.market);  // ← flatten
  
export function useMarket(id: string, initial?: Market) {
  return useSWR<Market>(
    id ? `/api/market/${id}` : null,   // null → SWR skips when id falsy
    fetcher,
    {
      refreshInterval: 5000,
      fallbackData: initial            // EXACT Market type
    }
  );
}
