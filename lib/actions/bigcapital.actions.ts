"use server";

import {
  createInvoice as localCreateInvoice,
  recordExpense as localRecordExpense,
  fetchBalance as localFetchBalance,
} from "@/lib/bigcapital/local";

export async function createInvoice({
  invoice,
}: {
  invoice: Record<string, any>;
}) {
  return await localCreateInvoice({ invoice });
}

export async function recordExpense({
  expense,
}: {
  expense: Record<string, any>;
}) {
  return await localRecordExpense({ expense });
}

export async function fetchBalance({
  accountId,
}: {
  accountId: string;
}) {
  return await localFetchBalance({ accountId });
}
