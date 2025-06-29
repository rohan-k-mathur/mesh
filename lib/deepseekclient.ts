import { openai } from "./openaiclient";

export async function deepseekEmbedding(input: string) {
  try {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY");
    const res = await fetch("https://api.deepseek.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.embedding as number[];
    }
  } catch (err) {
    console.warn("Deepseek embedding failed", err);
  }

  const resp = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input,
  });
  return resp.data[0].embedding as number[];
}
