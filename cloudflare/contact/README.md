# Free-plan contact: Pages -> private Worker -> verified destination

Pages project: leolaguna. Worker: leo-laguna-contact.
functions/api/contact.js forwards the original request through CONTACT_WORKER.
Worker index.mjs uses cloudflare:email EmailMessage and EMAIL.send, never REST.
handler.mjs validates origin, method, size, email/header injection, message <=500,
honeypot, Turnstile action/hostname and the Worker rate limiter (5/minute/IP/location).
Recipient is hardcoded AND restricted by send_email to sanchezlaguna99@gmail.com.
Visitor is Reply-To. Public/copy email remains hello@leolaguna.com.

## Exact deployment order (stay on Workers Free)

1. From X:\MainWP\cloudflare\contact run: npx wrangler deploy
   wrangler.jsonc supplies CONTACT_FROM=forms@leolaguna.com, EMAIL restricted to
   the verified Gmail address, and CONTACT_RATE_LIMITER. Check namespace 1001
   is not already used elsewhere in the account; choose an unused ID if needed.
   No Worker routes, workers.dev, preview URLs or custom domains are configured.
2. In the same directory: npx wrangler secret put TURNSTILE_SECRET_KEY
   Enter the real secret for Leo Laguna Contact interactively; never commit it.
3. Pages leolaguna > Settings > Bindings > Add > Service binding:
   Variable name CONTACT_WORKER; Service leo-laguna-contact; Production.
4. Redeploy the existing Git-connected Pages project with the forwarding Function.
   No changes to build config, DNS, MX or Email Routing are needed by this code.
5. Start Worker runtime logs with npx wrangler tail, then submit ONE valid production
   form at https://leolaguna.com using a fresh real Turnstile token. Check POST
   /api/contact, Worker logs, the verified Gmail inbox, and Reply-To.

## Sender acceptance is NOT yet verified in the real account

Cloudflare documents free sends to verified destinations even with Email Routing
only, but the sender domain must be available to Email Service. Do not infer that
forms@leolaguna.com is accepted from a mock test or the recipient's verified status.
If EMAIL.send rejects it, the Worker returns JSON 503/unavailable, preserves the
visitor draft, and logs Contact EMAIL.send failed with the provider's code/message
(visitor email redacted). Copy that error for diagnosis and STOP. Do not onboard
outbound Email Sending, modify DNS/MX, or upgrade the plan automatically.

Pages requires only CONTACT_WORKER, not an email API token or Account ID.
The REST adapter has been removed. Previously configured REST credentials are
unused; revoke the old token if it was created solely for this discarded solution.
The public Site Key stays in src/data/contact.ts; the secret belongs to the Worker.

## Tests

node --test cloudflare/contact/handler.test.mjs cloudflare/contact/pages.test.mjs
npm run build

All tests use mocks; they do not prove live sender acceptance or inbox delivery.
Local astro dev does not execute Pages Functions or the private Worker.

References:
https://developers.cloudflare.com/email-service/platform/pricing/
https://developers.cloudflare.com/pages/functions/bindings/#service-bindings
https://developers.cloudflare.com/email-service/configuration/send-bindings/
