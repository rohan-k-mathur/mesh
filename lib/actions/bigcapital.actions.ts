"use server";

const BASE_URL = process.env.BIGCAPITAL_URL || "http://localhost:4000";

function assertValidUrl() {
  if (!/^https?:\/\//.test(BASE_URL)) {
    throw new Error(
      "BIGCAPITAL_URL must start with http:// or https://"
    );
  }
}

async function request(path: string, method: string, token: string, body?: any) {
  assertValidUrl();
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Bigcapital API error: ${text}`);
  }
  return res.json();
}

export async function createInvoice({
  token,
  invoice,
}: {
  token: string;
  invoice: Record<string, any>;
}) {
  return await request("/api/invoices", "POST", token, invoice);
}

export async function recordExpense({
  token,
  expense,
}: {
  token: string;
  expense: Record<string, any>;
}) {
  return await request("/api/expenses", "POST", token, expense);
}

export async function fetchBalance({
  token,
  accountId,
}: {
  token: string;
  accountId: string;
}) {
  return await request(`/api/accounts/${accountId}/balance`, "GET", token);
}
