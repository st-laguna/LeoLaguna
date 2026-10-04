# Contact Card — activation checklist

Frontend: `src/data/contact.ts` contains only the public Site Key and `/api/contact`.
The original `mailto:` links remain progressive-enhancement fallbacks. Normal clicks open a real HTML form.

The Worker code is prepared but is NOT deployed or connected to production.
The existing GitHub Pages deployment and Email Routing DNS/MX/rules are unchanged.

## Required next dashboard configuration

1. Create/deploy the HTTP Worker `leo-laguna-contact` from this directory.
2. Add secret `TURNSTILE_SECRET_KEY` in Worker Settings → Variables and Secrets.
3. Enable/add the **Send Email** binding named `EMAIL`, restricted to the already verified
   destination `sanchezlaguna99@gmail.com`. Equivalent Wrangler configuration is in `wrangler.jsonc`.
   Do not use the pending `hello@leolaguna.com` as a destination.
4. `CONTACT_FROM` is `forms@leolaguna.com`: confirm Cloudflare permits that sender for the existing
   Email Routing-enabled domain. Do not replace existing DNS/MX records to activate this code.
   If the dashboard requires additional domain changes, pause and review them first.
5. The `CONTACT_RATE_LIMITER` binding allows 5 attempts/minute per IP per Cloudflare location;
   namespace `1001` must be unused by other rate limit bindings in your account, or choose another.
6. Add HTTP Worker routes `leolaguna.com/api/contact*` and, if used, `www.leolaguna.com/api/contact*`.
   HTTP routes are distinct from email routing rules. The hostnames must already be proxied by Cloudflare.
   If they are not, pause; do not change the site's DNS automatically.
7. Confirm the Managed Turnstile widget permits these hostnames. Production credentials are not
   intended for localhost. For local UI tests, mock the widget and endpoint; never send real mail in tests.

After activation, perform one authorized end-to-end submission and verify inbox delivery and Reply-To.
Until then, the modal may be reviewed, but real delivery is not verified. A 503/404 or failed challenge
never displays a success message and preserves the visitor's draft.

## Verification

`node --test cloudflare/contact/handler.test.mjs`
`npm run build`

Worker security: strict origin/action/hostname checks; server-side Siteverify; fixed destination;
plain-text UTF-8 MIME; Reply-To validation; 500-character and 8KB payload limits; rate limiting.
No visitor content, secrets, or full IP addresses are logged or stored by the application.
Turnstile tokens are single-use and must be renewed after every submission attempt.

The SVG contains no submit control. The action is placed in its existing blank area between the
field frame and separator; the Turnstile challenge appears below the card only when required.
