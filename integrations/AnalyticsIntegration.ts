import { IntegrationApp } from "@/lib/integrations/types";

export const integration: IntegrationApp = {
  name: "analytics",
  description: "Aggregate ecommerce and social metrics into reports",
  actions: [
    {
      name: "fetchShopify",
      run: async () => {
        console.log("Fetching Shopify sales data");
      },
    },
    {
      name: "fetchInstagram",
      run: async () => {
        console.log("Fetching Instagram metrics");
      },
    },
    {
      name: "fetchTikTok",
      run: async () => {
        console.log("Fetching TikTok metrics");
      },
    },
    {
      name: "aggregateData",
      run: async () => {
        console.log("Aggregating analytics");
      },
    },
    {
      name: "generateReport",
      run: async () => {
        console.log("Generating analytics report");
      },
    },
    {
      name: "sendReport",
      run: async () => {
        console.log("Sending analytics report");
      },
    },
  ],
};

export default integration;
