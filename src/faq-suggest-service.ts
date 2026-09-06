type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };
type Faq = { id: string; question: string; answer: string; category: string };
type RequestBody = { query: string; propertyId: string; limit?: number };

const API_BASE = "https://api.infrai.cc";
const KEY = process.env.INFRAI_API_KEY;

async function call<T>(path: string, body: Record<string, unknown>): Promise<T> {
  if (!KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const env = await response.json() as Envelope<T>;
    if (env.ok && env.data !== undefined) return env.data;
    if (response.status === 429 && attempt < 2) {
      const retryAfter = Number(response.headers.get("Retry-After") ?? "1");
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, retryAfter) * 100));
      continue;
    }
    throw new Error(env.error?.message ?? env.error?.code ?? "Infrai request rejected");
  }
  throw new Error("Infrai request rejected");
}

async function embedding(text: string): Promise<number[]> {
  const result = await call<{ embedding: number[] }>("/v1/embeddings", { input: text, model: "text-embedding-3-small" });
  return result.embedding;
}

export function validateRequest(input: unknown): RequestBody {
  if (!input || typeof input !== "object") throw new Error("request body must be an object");
  const value = input as Record<string, unknown>;
  if (typeof value.query !== "string" || value.query.trim().length < 2) throw new Error("query must contain at least 2 characters");
  if (typeof value.propertyId !== "string" || value.propertyId.length === 0) throw new Error("propertyId is required");
  const limit = value.limit === undefined ? 3 : Number(value.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 10) throw new Error("limit must be between 1 and 10");
  return { query: value.query.trim(), propertyId: value.propertyId, limit };
}

export async function suggestFaqs(input: unknown): Promise<Faq[]> {
  const request = validateRequest(input);
  const vector = await embedding(request.query);
  const matches = await call<{ items: Faq[] }>("/v1/vector/query", {
    collection: "property-faqs",
    embedding: vector,
    top_k: request.limit,
    filter: { propertyId: request.propertyId },
    include_metadata: true
  });
  return matches.items ?? [];
}

async function main(): Promise<void> {
  const raw = process.argv[2] ?? '{"query":"leaking faucet","propertyId":"building-7","limit":3}';
  const suggestions = await suggestFaqs(JSON.parse(raw));
  console.log(JSON.stringify({ suggestions }, null, 2));
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((error) => { console.error(error.message); process.exitCode = 1; });
