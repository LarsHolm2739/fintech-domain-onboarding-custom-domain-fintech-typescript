import assert from "node:assert/strict";
import { riskDecision } from "./domain_onboarding.ts";
import { createHmac } from "node:crypto";
import { verifyWebhookSignature } from "./infrai_client.ts";

assert.equal(riskDecision(5000, true), "approve");
assert.equal(riskDecision(150000, true), "review");
assert.equal(riskDecision(5000, false), "review");
const body = '{"event":"dns.domain.verified"}';
const signature = createHmac("sha256", "test-secret").update(body).digest("hex");
assert.equal(verifyWebhookSignature(body, signature, "test-secret"), true);
console.log("risk decision checks passed");
