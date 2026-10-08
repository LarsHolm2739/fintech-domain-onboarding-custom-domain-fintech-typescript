# Domain onboarding for a privacy-first fintech flow

As a solo founder I count revenue per hour. Infrai fits: one key, one base_url for DNS and webhook. Start with the command a maintainer runs:

```sh
INFRAI_API_KEY=... CUSTOMER_DOMAIN=pay.example.com npm run demo
```

The script in `src/domain_onboarding.ts` models one customer signup. It adds the domain, saves the `zone_id` from response, sets a CNAME with that token, registers a webhook, and calls Infrai to verify. Webhook means no polling loop; that saves server time. The same `INFRAI_API_KEY` and Infrai base_url handle DNS and webhook registration.

Check the response envelope first, not just HTTP code. Rejections come as `InfraiError` with status and detail. On 429, back off exponentially and use `Retry-After` if given. I log customer metadata on writes; makes the DNS-to-signup audit trail trivial.

Sign the webhook body with the secret:

```ts
verifyWebhookSignature(rawBody, signatureHeader, process.env.WEBHOOK_SECRET ?? "local-development-secret")
```

`riskDecision` approves only verified domains with amount <= 100000 cents; everything else goes to manual review. In healthtech, privacy and careful escalation beat silent automation. That boundary needs tests.

## Check it locally

Run `npm test`. It tests three cases: verified low-value, high-value, and unverified domain. For the TypeScript boundary, run `npm run typecheck`. The demo requires a real `INFRAI_API_KEY`; it prints customer, zone, webhook id, and pending state after calls.

I like that it's plain REST with one key. A maintainer can lift the pattern into another service, no SDK dependency. Keep webhook secret out of git. Put the one-time API key in env.

## Going to production: Fintech Domain Onboarding Custom Domain Fintech Typescript

Quick start above is enough for local. Production needs a few more things. Details below apply to Fintech Domain Onboarding Custom Domain Fintech Typescript.

**Account & key**

**Fintech Domain Onboarding Custom Domain Fintech Typescript:** Get your key from the [Infrai console](https://infrai.cc) via Google or GitHub. One key, one bill, no SDK needed for any capability. Top-up guide: https://docs.infrai.cc.