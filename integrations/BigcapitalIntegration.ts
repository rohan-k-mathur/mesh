import { IntegrationApp } from "@/lib/integrations/types";
import {
  createInvoice,
  recordExpense,
  fetchBalance,
} from "@/lib/actions/bigcapital.actions";

export const integration: IntegrationApp = {
  name: "bigcapital",
  description: "Automate accounting tasks with Bigcapital",
  actions: [
    {
      name: "createInvoice",
      run: async (
        params: { invoice: Record<string, any> },
        creds: { token: string }
      ) => {
        return await createInvoice({ invoice: params.invoice, token: creds.token });
      },
    },
    {
      name: "recordExpense",
      run: async (
        params: { expense: Record<string, any> },
        creds: { token: string }
      ) => {
        return await recordExpense({ expense: params.expense, token: creds.token });
      },
    },
    {
      name: "fetchBalance",
      run: async (
        params: { accountId: string },
        creds: { token: string }
      ) => {
        return await fetchBalance({ accountId: params.accountId, token: creds.token });
      },
    },
  ],
  triggers: [
    {
      name: "invoicePaid",
      onEvent: async (cb) => {
        /* events pushed via webhook */
      },
    },
    {
      name: "lowInventory",
      onEvent: async (cb) => {
        /* events pushed via webhook */
      },
    },
  ],
};

export default integration;
