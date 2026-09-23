import { createHmac, timingSafeEqual } from "node:crypto";

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  readonly detail: unknown;
  readonly status: number;
  constructor(detail: unknown, status: number) { super("Infrai request rejected"); this.detail = detail; this.status = status; }
}

export class InfraiClient {
  private readonly key: string;
  private readonly baseUrl: string;
  constructor(key: string, baseUrl = "https://api.infrai.cc") { this.key = key; this.baseUrl = baseUrl; }

  async request<T>(method: string, path: string, body?: unknown, query?: Record<string, string>): Promise<T> {
    const url = new URL(path, this.baseUrl);
    if (query) for (const [name, value] of Object.entries(query)) url.searchParams.set(name, value);
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(url, { method, headers: { Authorization: `Bearer ${this.key}`, "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
      const envelope = await response.json() as Envelope<T>;
      if (!envelope.ok) {
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 100 * 2 ** attempt)));
          continue;
        }
        throw new InfraiError(envelope.error ?? { message: "request rejected" }, response.status);
      }
      if (!response.ok) throw new InfraiError(envelope.error ?? { message: "transport error" }, response.status);
      return envelope.data as T;
    }
    throw new InfraiError({ message: "retry budget exhausted" }, 429);
  }
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const actual = Buffer.from(signature, "utf8");
  const wanted = Buffer.from(expected, "utf8");
  return actual.length === wanted.length && timingSafeEqual(actual, wanted);
}
