# Welcome Home — controlled 10-house pilot (NO GO)
**Updated:** 2026-11-18. **Public branding:** Legacy Water USA + La Casita Celebrations.  
**Owner data:** never commit recipient records, addresses or phone numbers to this repository.

## Experience to preserve
1. Personally addressed welcome letter → QR `legacywaterusa.com/welcome-home/?c=sc01` or phone `(407) 257-6911`.
2. Warm, bilingual landing with a complimentary in-home water check and a Dominican cake tasting.
3. `/check/` collects ZIP, *preferred* weekday/weekend + morning/afternoon/evening, full name and phone. This is an **appointment request, not a confirmed reservation**.
4. Team calls to confirm; technician performs the free evaluation, may explain optional paid treatment, **no system purchase or financing application required**.
5. **After the completed visit**, the representative hands a physical La Casita Celebrations voucher. The envelope contains NO voucher.
6. Bakery fulfills **one traditional ¼-lb-size Dominican mini cake without interior filling + three traditional fillings in separately packaged cups**, subject to finalized terms and safe food-handling rules.

## Gates (all required before sending even one letter)
| Gate | Status | Acceptance evidence |
| --- | --- | --- |
| Responsive landing and EN/ES UX | **PASS in preview** | iPhone recordings, Cloudflare mobile checks; final public-host check pending |
| Lead form → staging D1 → CRM | **PASS** | 2026-11-18 synthetic HTTP 201 and matching staging records; exact cleanup verified |
| Staging Resend delivery | **PASS (existing staging version)** | Delivery recorded 2026-11-18; subject is still generic |
| New Welcome Home email code | **PASS (mock + GitHub Actions)** | `node --test tests/welcome-home-notification.test.mjs`, 4/4 tests; no real sending |
| Enhanced subject on full-binding staging | **PENDING** | Real isolated staging delivery specifically using latest PR code and campaign; do not alter public production |
| Cake formulation and food handling | **PENDING** | Exact approved fillings, manufacturer/production permit or eligible lawful pathway, food-safe preparation/labels, allergens, refrigeration and shelf-life validated |
| Voucher terms and logistics | **PENDING** | Eligible area, household limit, clear redemption/collection process, expiration and pickup hours; written approval from La Casita |
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
1. The actual **three fillings**, their ingredients and whether each requires refrigeration/licensed food preparation.
2. **Where and when** the family redeems/picks up the tasting kit, and the voucher's expiration.
3. An actual sender address and ten independently verified mailing recipients.

Once agreed: update EN/ES landing + physical print terms together, make a proof and approve public launch explicitly.
