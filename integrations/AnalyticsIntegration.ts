import { IntegrationApp } from "@/lib/integrations/types";

export const integration: IntegrationApp = {
  name: "analytics",
  description: "Aggregate analytics data and generate reports",
  actions: [
    {
      name: "fetchData",
      run: async () => {
        console.log("Fetching analytics data");
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
