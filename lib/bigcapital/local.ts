export async function createInvoice({ invoice }: { invoice: Record<string, any> }) {
  const { SaleInvoiceApplication } = await import("../../bigcapital/packages/server/build/index.js");
  const app = new SaleInvoiceApplication();
  // TODO: wire tenant and user from Mesh once available
  return await app.createSaleInvoice(1, invoice, {} as any);
}

export async function recordExpense({ expense }: { expense: Record<string, any> }) {
  const { ExpensesApplication } = await import("../../bigcapital/packages/server/build/index.js");
  const app = new ExpensesApplication();
  return await app.createExpense(1, expense, {} as any);
}

export async function fetchBalance({ accountId }: { accountId: string }) {
  const { AccountsApplication } = await import("../../bigcapital/packages/server/build/index.js");
  const app = new AccountsApplication();
  const res = await app.getAccounts(1, { id: accountId } as any);
  return res;
}
