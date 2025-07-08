import { IntegrationApp } from "@/lib/integrations/types";

interface AnalyticsStore {
  shopify?: any[];
  instagram?: any[];
  tiktok?: any[];
  report?: string;
}

const store: AnalyticsStore = {};

export const integration: IntegrationApp = {
  name: "analytics",
  description: "Aggregate ecommerce and social metrics into reports",
  actions: [
    {
      name: "fetchShopify",
      run: async () => {
        const res = await fetch("https://dummyjson.com/products?limit=5");
        const data = await res.json();
        store.shopify = data.products;
        return `Fetched ${store.shopify.length} Shopify products`;
      },
    },
    {
      name: "fetchInstagram",
      run: async () => {
        const res = await fetch(
          "https://jsonplaceholder.typicode.com/posts?userId=1"
        );
        store.instagram = await res.json();
        return `Fetched ${store.instagram.length} Instagram posts`;
      },
    },
    {
      name: "fetchTikTok",
      run: async () => {
        const res = await fetch(
          "https://jsonplaceholder.typicode.com/photos?albumId=1"
        );
        store.tiktok = await res.json();
        return `Fetched ${store.tiktok.length} TikTok videos`;
      },
    },
    {
      name: "aggregateData",
      run: async () => {
        const totals = {
          products: store.shopify?.length ?? 0,
          instagram: store.instagram?.length ?? 0,
          tiktok: store.tiktok?.length ?? 0,
        };
        store.report = JSON.stringify(totals, null, 2);
        return "Aggregated analytics";
      },
    },
    {
      name: "generateReport",
      run: async () => {
        if (!store.report) {
          return "No data to report";
        }
        const parsed = JSON.parse(store.report);
        const lines = [
          "# Weekly Report",
          `Products: ${parsed.products}`,
          `Instagram Posts: ${parsed.instagram}`,
          `TikTok Videos: ${parsed.tiktok}`,
        ];
        store.report = lines.join("\n");
        return "Generated report";
      },
    },
    {
      name: "sendReport",
      run: async () => {
        console.log(store.report ?? "No report available");
        return store.report ?? "No report available";
      },
    },
  ],
};

export default integration;
