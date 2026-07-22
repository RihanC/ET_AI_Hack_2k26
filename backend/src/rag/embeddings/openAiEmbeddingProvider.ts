import type { EmbeddingProvider } from "./embeddingProvider.js";

/**
 * NOTE: api.openai.com is not reachable from this sandbox's network allowlist,
 * so this class is untested here (it correctly cannot be exercised end-to-end
 * in this environment). It's a straightforward embeddings call, kept intentionally
 * simple. Swap the model/endpoint for Voyage AI or another provider by changing
 * the URL and request/response shape — the EmbeddingProvider interface stays the same.
 */
export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1536; // text-embedding-3-small

  constructor(private apiKey: string, private model = "text-embedding-3-small") {}

  async embed(texts: string[]): Promise<number[][]> {
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ model: this.model, input: texts }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI embeddings API error (${response.status}): ${await response.text()}`);
    }

    const data = (await response.json()) as { data: Array<{ embedding: number[] }> };
    return data.data.map((d) => d.embedding);
  }
}
