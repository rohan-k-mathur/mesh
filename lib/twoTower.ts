import axios from "axios";

export async function getTwoTowerCandidates(userId: number, limit = 400): Promise<string[]> {
  try {
    const url = process.env.TWO_TOWER_URL || "http://localhost:4000/candidates";
    const { data } = await axios.get(url, { params: { userId, limit } });
    if (Array.isArray(data)) return data as string[];
    if (Array.isArray(data.items)) return data.items as string[];
    return [];
  } catch {
    return [];
  }
}
