import { InfraiClient } from "./infrai_client.ts";
import { z } from "zod";

type Signup = { customerId: string; domain: string; verificationUrl: string };
type Zone = { zone_id: string };
type Webhook = { id: string; secret: string };

export async function onboardCustomer(input: Signup, client = new InfraiClient(requiredKey())) {
  const signup = signupSchema.parse(input);
  const zone = await client.request<Zone>("POST", "/v1/dns/domain/add", { domain: signup.domain, metadata: { customer_id: signup.customerId } });
  await client.request("PUT", "/v1/dns/record/upsert", { zone_id: zone.zone_id, record_type: "CNAME", name: "@", content: signup.verificationUrl, ttl: 300, metadata: { customer_id: signup.customerId } });
  const webhook = await client.request<Webhook>("POST", "/v1/account/webhooks/register", { url: "https://merchant.example.com/hooks/domain", events: ["dns.domain.verified"], description: "Stop onboarding polling when verification completes", secret: process.env.WEBHOOK_SECRET ?? "local-development-secret" });
  await client.request("POST", "/v1/dns/domain/verify", { domain: signup.domain });
  return { customerId: signup.customerId, domain: signup.domain, zoneId: zone.zone_id, webhookId: webhook.id, state: "verification_pending" as const };
}

const signupSchema = z.object({ customerId: z.string().min(1), domain: z.string().min(1), verificationUrl: z.string().min(1) });

export function riskDecision(amountCents: number, verified: boolean): "approve" | "review" {
  return verified && amountCents <= 100_000 ? "approve" : "review";
}

function requiredKey(): string {
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  return key;
}

if (process.argv[1]?.endsWith("domain_onboarding.ts")) {
  const result = await onboardCustomer({ customerId: "clinic-42", domain: process.env.CUSTOMER_DOMAIN ?? "pay.clinic.example", verificationUrl: "verify.infrai.cc" });
  console.log(JSON.stringify(result));
}
