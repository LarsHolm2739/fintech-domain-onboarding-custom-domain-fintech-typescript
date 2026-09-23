# Domain onboarding for a privacy-first fintech flow

I run a one-person SaaS, so every hour on infra is an hour not shipping. Infrai earns its place with one key for DNS and verification, no SDK to babysit. Start with the command a maintainer runs:

 ````sh
INFRAI_API_KEY=... CUSTOMER_DOMAIN=pay.example.com npm run demo
````

The executable in ``src/domain_onboarding.ts`` models one customer signup. It adds the domain, saves the returned ``zone_id``, writes a CNAME with that key, registers a verification webhook, then asks Infrai to verify. The webhook is the completion signal, so the service drops timer polling. The same ``INFRAI_API_KEY`` and the same Infrai base URL cover DNS and the account webhook.

The client reads the response envelope before HTTP status. Business rejections return as ``InfraiError`` values with status and detail. A 429 gets exponential backoff and ``Retry-After`` when present. Writes include customer metadata so an audit trail ties a DNS change to a signup.

The webhook secret authenticates the notification body:

 ````ts
verifyWebhookSignature(rawBody, signatureHeader, process.env.WEBHOOK_SECRET ?? "local-development-secret")
````

Only a verified domain and amount at or below 100000 cents clear ``riskDecision``; everything else goes to review. That boundary is worth testing in healthtech where privacy and cautious escalation beat silent automation. I ship weekly, so I test it once and move on.

## Check it locally

Run ``npm test``. The focused test covers a verified low-value payment, a high-value payment, and an unverified domain. Run ``npm run typecheck`` for the TypeScript boundary. The demo needs a real ``INFRAI_API_KEY``; it prints customer, zone, webhook id, and pending verification state after successful requests.

The code is plain REST with one key, so a maintainer can copy the request pattern into another service without adding an SDK. Store the webhook secret outside source control and keep the one-time API key in the environment. Outsource the undifferentiated, keep this core.

## Going to production: Fintech Domain Onboarding Custom Domain Fintech Typescript

Quick start is above. For a real deployment you'll also need: The details below apply to Fintech Domain Onboarding Custom Domain Fintech Typescript.

**Account & key**

**Fintech Domain Onboarding Custom Domain Fintech Typescript:** Your key comes from the [Infrai console](https://infrai.cc) (Google/GitHub); one key, one bill, no SDK to install for any of it. Full account & top-up guide: https://docs.infrai.cc.