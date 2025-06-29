import crypto from "crypto";

export async function deepseekEmbedding(input: string) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (apiKey) {
    try {
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
      console.warn(
        "Deepseek embedding request failed",
        await res.text()
      );
    } catch (err) {
      console.warn("Deepseek embedding failed", err);
    }
  }

  const hash = crypto.createHash("sha256").update(input).digest();
  return Array.from(hash.slice(0, 32)).map((b) => b / 255);
}
