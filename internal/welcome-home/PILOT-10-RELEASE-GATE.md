# Welcome Home — controlled 10-house pilot (NO GO)
**Updated:** 2026-11-18. **Voucher valid:** 30 calendar days after issue at completed visit. **Public branding:** Legacy Water USA + La Casita Celebrations.  
**Owner data:** never commit recipient records, addresses or phone numbers to this repository.

## Experience to preserve
1. Personally addressed welcome letter → QR `legacywaterusa.com/welcome-home/?c=sc01` or phone `(407) 257-6911`.
2. Warm, bilingual landing with a complimentary in-home water check and a Dominican cake tasting.
3. `/check/` collects ZIP, *preferred* weekday/weekend + morning/afternoon/evening, full name and phone. This is an **appointment request, not a confirmed reservation**.
4. Team calls to confirm; technician performs the free evaluation, may explain optional paid treatment, **no system purchase or financing application required**.
5. **After the completed visit**, the representative hands a physical La Casita Celebrations voucher. The envelope contains NO voucher.
6. Bakery fulfills **one traditional ¼-lb-size Dominican mini cake without interior filling + three confirmed fillings: guava, pineapple and dulce de leche, in separately packaged cups**. Recipes, packaging and food-handling rules still require validation.

## Gates (all required before sending even one letter)
| Gate | Status | Acceptance evidence |
| --- | --- | --- |
| Responsive landing and EN/ES UX | **PASS in preview** | iPhone recordings, Cloudflare mobile checks; final public-host check pending |
| Lead form → staging D1 → CRM | **PASS** | 2026-11-18 synthetic HTTP 201 and matching staging records; exact cleanup verified |
| Staging Resend delivery | **PASS (existing staging version)** | Delivery recorded 2026-11-18; subject is still generic |
| New Welcome Home email code | **PASS (mock + GitHub Actions)** | `node --test tests/welcome-home-notification.test.mjs`, 4/4 tests; no real sending |
| Enhanced subject on full-binding staging | **PENDING** | Real isolated staging delivery specifically using latest PR code and campaign; do not alter public production |
| Cake formulation and food handling | **PARTIAL — flavors confirmed; compliance PENDING** | Confirmed guava, pineapple, dulce de leche. Validate recipes, licensing or suitable lawful production pathway, safe storage, allergen labels, refrigeration and finished-product shelf life (especially dairy-based dulce de leche) |
| Voucher terms and logistics | **PARTIAL — validity confirmed; logistics PENDING** | Voucher valid for **30 calendar days from date handed out after completed water evaluation**. Confirm eligible area, one-per-household implementation, redemption/collection process and pickup hours; written fulfillment approval from La Casita |
| Pilot economics and inventory | **PENDING** | Cost of one kit × eligible visits, fulfillment capacity for **all** vouchers promised; do not assume sales conversion |
| Mailing recipients | **PENDING** | Ten homeowners independently checked for current ownership, postal deliverability, property ready, confidentiality/opt-out; choose only verified records |
| Postage/addressing | **PENDING** | Approved physical sender address and printed #10 envelope test |
| Public campaign URL and physical QR | **PENDING** | Explicit publication approval, public bilingual page verified on domain, two-phone *paper* QR scan, campaign tag retained, test lead in approved environment |
| Final print and release | **PENDING** | Correct artwork, logos, cake image/description, final offer conditions, no draft watermark, owner approval |

**NO GO** until all pending gates are closed. Do not merge draft PR #17 solely because technical tests passed.

## Roles and low-cost operating method
- **Legacy Water USA:** source and verify postal addresses, mail letters, receive/confirm appointments, conduct water checks, record eligible completed visits, hand out vouchers, respond to questions.
- **La Casita Celebrations:** approve actual product photographs, recipes and compliant packaging; confirm pickup/redemption terms; prepare the tasting kits and record redemptions.
- **Tracking:** a protected internal log (not a public repository or customer-facing QR) records mail batch, mailed date, request date, confirmed appointment, completed visit, voucher issued, voucher redeemed, and optional sales outcome. Record only data necessary for operations; avoid duplicating sensitive customer details.
- **Voucher codes:** assign simple non-personal unique codes internally, e.g. `WH-SC01-001`; do not claim a code has been issued until the visit is completed.
- **No app needed:** validate 10 individually addressed letters and the real fulfillment process manually before expanding to 50.

## Immediate next decision package
Confirm only the operational details that cannot be inferred from code:
1. **Confirmed fillings: guava, pineapple, dulce de leche.** Verify ingredients, actual preparations and which require refrigeration/licensed food preparation, especially dulce de leche.
2. **Where and when** the family redeems/picks up the tasting kit; voucher expiration is **30 calendar days after issuance** (not after mailing or scheduling). Track issued date and expiration on each numbered voucher.
3. An actual sender address and ten independently verified mailing recipients.

Confirmed customer-facing terms were updated in EN/ES landing and form on 2026-11-18, but remain **preview-only** until safe production/fulfillment and pickup are approved. Next: update the physical printed voucher to display its issuance date and expiry date, review mailing artwork, and obtain explicit public launch approval.

## Approved mockup implementation — 2026-11-18
- The user approved a mobile marketing mockup using a **white mini Dominican cake with pink piped roses and pearls**, gold cake board, Florida home/water photograph, navy/sky-blue/yellow accents, and both brand names. Actual cake style reference supplied as a user-uploaded photograph; **styling is representative, not a promise of identical decorations**.
- Draft website branch now contains `welcome-home/la-casita-rose-cake.svg` (a vector **illustration** of this cake style plus three separate filling cups), `welcome-home/approved-2026.css` (responsive style override), and updated `welcome-home/index.html`: stronger homeowner headline, yellow appointment-request CTA, illustrated pink cake featured ahead of benefits, EN/ES copy, 30-day voucher and three confirmed flavors.
- **Important fidelity distinction:** the actual user-provided cake **photograph is not yet hosted in the GitHub website**; it is used in the new offline print proof and a web-optimized photo file prepared for later asset upload. Never describe the web's vector illustration as a real bakery photograph. Before launch, upload the user-approved cake photo to an owned HTTPS asset path and swap the `<img>` source with correct alt text, then QA sizing.
- Draft printed artifact prepared offline: `Welcome_Home_Carta_Arte_Rosa_30_Dias_PRUEBA_NO_ENVIAR.pdf`, **2 US Letter pages**, including the user-supplied rose-frosted cake photo, house/water concept, offer terms and planned vector QR (`https://legacywaterusa.com/welcome-home/?c=sc01`). QR digitally decoded from a 150-dpi render. The PDF includes **DO NOT MAIL** proof markings; it is neither postal-personalized nor release-approved.
- Cloudflare preview at `https://d5326049.legacy-water-production.pages.dev/welcome-home/?c=sc01`, deployment `e5a904ce4f5baddc6ee8546d13215a4ecfbc290f` marked `success` in **preview** environment. At **390px mobile width**, both hero and illustration loaded, no horizontal overflow, EN→ES worked, CTA maintained campaign tag and language, bakery section appears before benefits. Desktop screenshot QA not fully completed because the remote browser imposed an HTTP 429 rate limit.
- No change to any database, CRM, public domain or production deployment. **Launch remains NO GO** pending actual photo asset upload, safe/legal cake + filling preparation/packaging, pickup/redemption details, postal/address checks, and public QR plus print scan approval.

## A/B priority-routing QA — 2026-11-18
- Version A (curiosity): 5 letters, group QR `https://legacywaterusa.com/welcome-home/?c=sc01a` → `welcome_home_2026_sc01a`.
- Version B (active buyer): 5 letters, group QR `https://legacywaterusa.com/welcome-home/?c=sc01b` → `welcome_home_2026_sc01b`. Its “Compare My Options” CTA passes `welcome_home_2026_sc01b__compare`.
- The **group-level** QR identifiers cannot establish exactly which house scanned. Keep a separate protected mapping of mail ID to confirmed recipient/address off GitHub. Telephone replies must be tagged manually with letter version.
- Email notification now distinguishes A/B and quote comparison: `WELCOME HOME — QUOTE COMPARISON — <ZIP>` for comparison-intent requests, and `WELCOME HOME — New water test request — <ZIP>` otherwise. Comparison intent is a triage flag, **not** a booking or proof that the homeowner is qualified.
- Added two more no-network regression tests for source and priority routing. Six mocked notification tests passed against current code, **no real email sent**. Actual delivery of the new priority subject in full-binding staging is still pending.
- Built internal blank workbook **`Legacy_Welcome_Home_Piloto_AB_10_Cartas.xlsx`** in the conversation to track 5+5 slots, recipient/USPS checks, sent dates, group lead counts, confirmed appointments, visits, quotations and sales. Workbook contains **no owner names, addresses, or real lead data** and defaults to **NO ENVIAR** for all 10.
- Treat this 5+5 round as an operations/signal pilot; it cannot prove one letter statistically superior. Compare **confirmed appointments and sales per letter mailed** rather than only QR scans. Do not send before approved lender/RO terms, printed public-QR test, mail verification, food-safe kit and pickup terms. Do not assume promotions can be combined.
