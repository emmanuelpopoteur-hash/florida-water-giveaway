# Legacy Water USA — Virtual Sales Advisor

## Current deployment mode
- Guided bilingual (ES/EN) sales advisor works entirely in the browser, at any hour, without an AI API key.
- Visible as a floating widget on the homepage, systems catalog, RO inquiry page, free water test, and Colombia pilot pages.
- Answers are curated: drinking RO, whole-home, well water, city water, UV, maintenance, pricing, warranty, H2 status, bottled water, and human escalation.
- Spanish is fixed on the Colombia pilot pages. **No U.S. prices are quoted for Colombia**.
- Users can request a callback inside the widget. Florida water-test requests go to `/api/leads`, US RO inquiries to `/api/ro-inquiries`. No orders, checkout, payments, or appointment slots are created.
- Lead contact details are validated in the existing Cloudflare Pages Functions, stored in D1, and sent to the existing notification email. Chat transcripts are not sent to D1.
- RO lead campaign labels include `virtual-advisor` to compare performance against forms on the RO page.
- Widget assets: `/chatbot/assistant.css` and `/chatbot/assistant.js`. Build script must copy `chatbot` to `dist`.

## Optional conversational AI (OFF by default)
The server-side endpoint `/api/sales-chat` supports OpenAI Responses API via Cloudflare Pages Functions. **Do not put an API key inside browser JavaScript or GitHub.**

Before enabling AI:
1. Configure a Cloudflare KV namespace and bind it to the production Pages environment as `CHATBOT_RATE_LIMIT`.
2. In Cloudflare Workers & Pages > production project > Settings > Variables and Secrets, add an **encrypted secret** `OPENAI_API_KEY`.
3. Add `CHATBOT_AI_ENABLED=true` as a production variable, then redeploy. Optionally set `CHATBOT_AI_MODEL` to a supported, cost-controlled model.
4. Configure Cloudflare WAF/rate limiting or equivalent abuse protections for `/api/sales-chat` before exposing AI to significant traffic.
5. Verify the GET endpoint returns `{"enabled":true}` when correctly configured. Without all requirements, it returns `{"enabled":false}` and the guided sales advisor remains available.
6. Test the AI answers for U.S. vs Colombia prices, customer warranty, UV limits, and H2 disclaimers. Review costs and API usage regularly.

## Acceptance testing (live)
- Open homepage on iPhone, open floating chatbot. Verify welcome, quick replies, and Spanish/English selection.
- From RO, ask “What is the price?” and “Can it make pH 10.5?” Confirm the proposed $1,199 price and absence of unverified H2 claims.
- From Colombia page, ask for price. Confirm no U.S. price is shown.
- Request a callback with test contact details only with the owner's authorization. Verify success reference, D1 record, and Resend delivery. In CRM check campaign tag `virtual-advisor`.
- Check mobile keyboard, close behavior, external links and both language versions.
- Do not test payment processing; the widget never collects cards.

## Limitations
The guided mode recognizes common keywords and fixed sales topics, not arbitrary questions with general AI reasoning. Configuring the optional server-side AI service is required for open-ended generative conversations. Never advertise live human agents 24/7.

## Requested one-time RO information email — configuration required

This optional feature lets U.S. visitors select Essential, Advanced, or Premium H2, enter their own email, and explicitly authorize **one informational message**. It is not a marketing mailing-list opt-in. The browser never sends email or contains Resend credentials. Colombia pages do not expose U.S. prices or this U.S. email flow.

Configuration checklist (apply to staging first; production changes belong to a separate rollout):
1. In the existing Cloudflare D1 database bound as `DB`, run `migrations/2026-10-29-ro-email-requests.sql` for production. Run the same migration in preview/staging D1 if you will test there first. Back up the database beforehand.
2. Create a Cloudflare KV namespace, bind it as `RO_EMAIL_RATE_LIMIT` in the relevant Pages environments (Production and separately Preview for testing).
3. Confirm the existing encrypted `RESEND_API_KEY` and `LEAD_ALERT_TO=info@legacywaterusa.com` remain available in that Pages environment. The verified sender remains `leads@legacywaterusa.com`. Never commit secrets to GitHub.
4. Set a Cloudflare WAF/rate-limiting rule for POST `/api/ro-info` to supplement non-atomic KV limits; consider a challenge for suspicious repeated attempts.
5. Deploy the new branch in preview. GET `/api/ro-info` should show `{"enabled":true}` only when D1, KV and Resend are configured. Otherwise the chat falls back to a manual mailto and the POST fails closed.
6. Test with a mailbox you own or have permission to use: ask the advisor “Envíame información de los sistemas RO a mi email”, select each product in turn, check opt-in/validation, confirm the provider **accepted** the email (not necessarily delivered), check inbox, D1 record and owner's separate notification. Test rate limiting, honeypot, Colombia exclusions and iPhone keyboard.

Behavior and privacy:
- One predefined, bilingual, product-specific text email with accurate **proposed** Essential pricing. No free-form user text is relayed, no attachment, no mass send and no financial/medical claims.
- Email, selected product, language, consent timestamp and send-accepted status are stored in `ro_email_requests` (separate from `water_test_leads`). No automated marketing permission is inferred.
- KV allows up to 3 requests/IP/hour, 10/IP/day and 2/recipient/day (best-effort, not atomic). WAF is required for stronger protection. Requests fail closed when Cloudflare client IP/rate-limiter is unavailable.
- Failed Resend acceptance leaves a pending row for a retry with the same request identifier. The UI should not claim confirmed mailbox delivery.
- Define a data-retention/deletion policy and purge stale email addresses from D1 appropriately before general launch.

## Staging verification — 2026-11-03

Scope: PR #5 only, isolated from the customer-facing production deployment. The PR remains a draft; no marketing campaign or subscription is enabled.

Confirmed:
- Backed up `legacy-water-leads-staging` before applying the RO email migration. The table and both explicit indexes exist.
- Preview `DB` uses the staging database; the customer-facing production project uses a different database.
- Created staging KV and bound `RO_EMAIL_RATE_LIMIT` only to the staging project's Preview environment.
- Staging Preview has the encrypted Resend key and owner-alert recipient configured. A real send confirmed the credentials work for this flow.
- `ro-staging.legacywaterusa.com` points to the PR's staging branch alias. Access policies restrict that hostname and staging preview aliases to the owner.
- A new WAF rate-limit rule matches only that staging hostname, POST, and `/api/ro-info`: 3 requests per 10 seconds per IP/colo, with a 10-second block. Existing managed rules were preserved.
- Six authorized empty-body test submissions returned three HTTP 429 and three HTTP 403 responses. D1 still contained zero requests after that test. This demonstrates edge blocking; it does not independently attribute each 403 or prove exact global threshold/concurrency behavior.
- The owner completed one Essential/Spanish request on a real iPhone. The UI displayed provider acceptance; the product email and separate owner alert both reached Inbox.
- D1 contained exactly one request, product `essential`, language `es`, consent timestamp, status `accepted`, and acceptance timestamp matching that test.
- `node --test tests/ro-info.test.mjs`: 15 tests passed using mocked D1/KV/Resend. Coverage includes invalid consent/fields, honeypot, absent migration/bindings/IP, KV failure, all three limits, accepted replay, request-ID conflict, provider rejection/retry, independent owner-alert failure, and fixed content for all products in both languages.
- Syntax check passed for the advisor after translating Spanish product dropdown labels.

Important distinctions:
- `enabled:true` checks binding/variable presence and a readable table, not Resend credential validity, KV health, WAF coverage, or delivery.
- One-time means one accepted email per request ID, not one email per address forever. A new ID may send another requested email within the limits.
- The owner alert is a separate message. A failed owner alert does not fail the customer request, and an accepted replay does not retry that alert.
- KV counters are best-effort and non-atomic. WAF covers the custom staging hostname; direct preview aliases are restricted by Access, not covered by that zone WAF rule.
- Existing chat messages/actions retain the language in which they were created after a language switch. New replies use the selected page language. Do not mark seamless live language switching as passed.
- The backend does not establish a visitor's geographic location; the Colombia exclusion is in the advisor UI.

Still required before considering release:
- Real iPhone validation of English and remaining product selections; verify consent starts unchecked, invalid email/no consent cannot submit, keyboard/scroll/close behavior, and Colombia email-flow exclusion.
- Real staging retry/replay validation with the original request ID, checking provider logs for duplicates; current replay evidence is mocked.
- Decide whether retained earlier-language actions are acceptable or require a UI fix. Recheck the translated dropdown in Spanish on iPhone.
- Implement and verify the owner-approved retention policy below, including D1, owner-alert mailboxes/forwarding, provider logs, and backup recovery windows. No automatic deletion has been configured or run.
- Owner selected a 30-day personal-data retention period on 2026-11-03, with staging test records limited to 7 days. Implementation and verification remain release gates.
- Record the remaining evidence before marking the PR ready. Production migration, KV binding, WAF, deployment and smoke test remain a separate authorized rollout; do not perform those steps as part of staging verification.
- No customer-facing production configuration has been changed and the PR has not been merged.

Test planning: the recipient limit is 2/day and the IP limit is 3/hour. Do not try all three products with the same mailbox in one day or remove limits to make tests pass; use authorized mailboxes and separate windows.


### Additional verified evidence — 2026-11-03
- Real iPhone Advanced/English request succeeded. Product email and owner notification reached Inbox; D1 records `advanced`, `en`, consent timestamp and `accepted` status. Exactly two RO request rows now exist in staging.
- Resend delivery records independently show exactly four matching messages for the two tests: two customer messages and two separate owner notifications, all marked `delivered`. This is not a live replay/idempotency test.
- The personal test mailbox has reached the 2/recipient/day limit. Premium testing must use a different owner-controlled mailbox or a later UTC day; retain the IP/hour limit as well.

### Retention decision and implementation requirements
Owner decision: retain personal data associated with one-time product email requests for 30 days from creation; staging test records for 7 days. This consent does not authorize marketing, contact-list enrollment or further promotional messages.

Implementation scope:
1. D1: remove expired `ro_email_requests` rows; include both pending and accepted rows. Operate only on this table, never on `water_test_leads`, CRM or evaluation records.
2. Owner mailboxes: remove expired owner alerts and controlled forwarded copies under the same window. The business does not control a customer's copy of the requested message.
3. Provider records and backups: verify actual configurable retention, document any provider-controlled recovery/log windows, and reapply deletion after a restore before re-enabling service. Do not promise immediate erasure from provider backups.
4. Keep deletion evidence limited to aggregate counts and timestamps, without recording deleted email addresses.
5. Add and test a cleanup mechanism, with a dry run and an environment-specific cutoff, before general release. This policy has been defined; automated enforcement has not been implemented.

Read-only staging dry run (no deletion):
```sql
SELECT COUNT(*) AS expired_rows
FROM ro_email_requests
WHERE julianday(created_at) < julianday('now', '-7 days');
```

### Premium live test — 2026-11-03
- Owner completed Premium H2/English on iPhone using the business mailbox. Both the product message and separate owner notification reached Inbox, as shown in owner-provided screenshots.
- D1 confirms one additional `premium`/`en` request with consent timestamp and `accepted` status. There are exactly three staging request rows in total, one per product.
- Real delivery coverage now includes Essential/Spanish, Advanced/English and Premium/English. This does not establish all six product/language combinations or remaining validation/replay/Colombia/mobile checks.
- No additional successful sends should be attempted from the same IP in the current UTC hour; the 3/IP/hour allowance has been used by the three successful requests. Do not clear counters or relax limits.
- Automated retention enforcement, real replay validation, remaining UI checks and production rollout remain outstanding. PR remains a draft.
