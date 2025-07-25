export interface StallSummary {
  id: number;
  name: string;
  live: boolean;
}

export async function getSection(x: number, y: number): Promise<{ stalls: StallSummary[] }> {
  // TODO: replace with database query
  return { stalls: [] };
}
