export async function createItem(stallId: string, data: any) {
  const res = await fetch(`/api/stalls/${stallId}/items`, {
    method: "POST",
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Item create failed");
}
