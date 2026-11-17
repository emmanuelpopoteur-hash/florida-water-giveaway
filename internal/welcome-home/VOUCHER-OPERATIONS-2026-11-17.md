# Welcome Home — manual voucher operations (17 Nov 2026)

**Status: pilot design only; not live.** All recipient addresses are unverified; no correspondence, redeemable gift codes, or public QR has been authorized.

## Linked but separate businesses
- **Legacy Water USA:** invites qualified new homeowners to request a free water evaluation and may describe optional paid water-treatment systems. No purchase or financing application required to qualify for the tasting voucher; the requirement to complete a confirmed in-home visit must be disclosed prominently before any mail goes out.
- **La Casita Celebrations:** fulfills the tasting kit and optionally invites families to view its Dominican cake catalog. Do **not** transfer water-lead contact information to the bakery for marketing without a separate affirmative opt-in. A separate bakery QR is not an automatic subscription.

## Physical tasting kit
- **1 unfilled Dominican mini cake**, and **3 traditional fillings** in three individual food-safe, prepackaged cups.
- All recipes, cake frosting/suspiro, specific fillings, allergens, temperature requirements, food labels, weight and packaging require approval. Serving fillings separately does **not** solve food refrigeration or licensing requirements.
- No flavor is promised yet; no product voucher can be redeemed until specific terms, pickup location, and expiry are disclosed and approved.

## Manual lifecycle
1. **Find candidate:** assign only an internal household ID; keep homeowner name, address, postal verification and opt-out status in the private recipient workbook.
2. **Verify mailing eligibility:** current ownership, USPS-deliverable address, no applicable restricted/confidential record, occupancy and other exclusions; keep `NO ENVIAR` until checks pass.
3. **Send letter after approval:** track `No enviada / Enviada / Devuelta`; the invitation contains a marketing disclosure and approved final production QR.
4. **Handle appointment:** `Sin solicitud / Solicitada / Confirmada / Cancelada`; preferred date/time on website is a request, **not** a confirmed booking.
5. **Perform evaluation:** mark `Completada` and the completion date after a real visit.
6. **Issue physical voucher:** give it only after a completed free water evaluation. One voucher per eligible household; assign and write down a unique redemption code in the **private** ledger. No active codes are stored in this GitHub repository.
7. **Fulfill with bakery:** bakery checks the code and its current status before preparing the kit, logs `Canjeado` once, dates the redemption, and confirms pickup. Do not issue duplicate kits.
8. **Measure two independent outcomes:** count completed water evaluations, optionally water purchases, actual bakery referrals/purchases and only separately authorized marketing signups. Do not assume every voucher redemption becomes a bakery client.
9. **Resolve disputes:** a missing code, an attempt to redeem a code twice, a redeemed-before-issued status, or a voucher issued without completed visit triggers manual review; never automatically issue a second gift.

## Offline pilot tool
Private file `Legacy_Water_Welcome_Home_Control_Vouchers_y_Costos_17nov2026.xlsx` (do NOT commit) contains five tabs:
- Panel — actual campaign measures; starts at 0 except 10 candidates and $8.20 minimum postage.
- Canjes — 10 internal household IDs, blank redemption codes, status tracking, duplicate and early-issuance warnings. Initial state is blocked for all 10.
- Economía — editable real quotations for cake, three fillings, cups/packaging, labor and transport; costs left blank until documented; postage $0.82 per up-to-1-oz stamped letter (verify weight).
- Seguridad del kit — independent recipe/label/temp/licensing checks.
- Puertas de lanzamiento — approvals and go/no-go; no automatic permission to send.

## Sources and release blockers
- USPS postage: https://www.usps.com/ship/first-class-mail.htm
- FDACS cottage food and prepackaged samples: https://www.fdacs.gov/Business-Services/Food/Food-Establishments/Cottage-Foods
- UF/IFAS (refrigeration and disallowed recipes): https://ask.ifas.ufl.edu/publication/FS425
- Florida 2026 statutory food labeling/exemption: https://www.flsenate.gov/Laws/Statutes/2026/500.80
- Florida free gift disclosure law: https://www.flsenate.gov/Laws/Statutes/2026/817.415

**No-Go until:** food and offer legal/operational conditions resolved, each recipient verified, working approved public URL/QR/UTM flow, bakery fulfillment capacity and pricing, voucher redemption method and manual publication/print release.
