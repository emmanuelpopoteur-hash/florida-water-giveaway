# Welcome Home direct-mail pilot — draft, not approved for launch

Owner: Legacy Water USA. Partner cake brand: La Casita Celebrations.

## Flow
1. Send a personalized welcome letter to a recent homeowner. The envelope **does not** contain a cake voucher.
2. QR opens `https://legacywaterusa.com/welcome-home/?c=sc01` (replace `sc01` per mailing batch). Include call option (407) 257-6911.
3. Landing CTA goes to the existing `/check/` lead form. It sends `utm_source=qr`, `utm_medium=direct_mail`, and `utm_campaign=welcome_home_2026_sc01` to the existing `/api/leads` logic via the current form.
4. The form collects a **preferred** day and time, not a confirmed appointment; team contacts requester to confirm.
5. After the free in-home evaluation is completed, the rep hands over a physical mini-cake voucher from La Casita Celebrations. No purchase required.

## Implementation boundaries
- Landing page only; no new collection endpoint, database migration, messaging automation, CRM privilege change, or production merge.
- Build script copies the new `welcome-home` directory to `dist` and injects the existing consent-based analytics loader.
- This landing is `noindex` during review. Do not print QR codes before destination is live and verified.
- Attribution tracks batch by `utm_campaign` in the existing `water_test_leads.campaign` field; caller attribution still needs manual recording.
- Never include household names/addresses in query parameters or the QR URL.

## REQUIRED before publishing or mailing
- Finalize mini cake weight/size, eligible flavors, ingredient/allergen disclosures, redemption method, pickup location or region, expiration, per-household limitations, stock/production commitment and any other material restrictions. Replace placeholder statement in landing terms.
- Verify cottage-food suitability of exact cake recipe, packaging and labeling; determine whether third-party bulk/gift arrangement is permissible.
- Confirm the compliance of the incentive advertising with Florida's free-gift advertising statute, and confirm how the sales discussion is presented during the evaluation.
- Verify business registration and branding under Legacy Water USA, working phone number, site privacy policy and any cross-site tracking/analytics consent behavior.
- Manually test bilingual switches, QR codes, staging page, /check/ form, D1 write, CRM mirror, Resend notification, and phone button on mobile.
- Confirm capacity and cost of fulfilling 100% of valid vouchers.
- Review marketing list for mailing address match, duplicates and any public-record confidentiality or removal requirements.

## Pilot targeting
Request from the official Osceola County Property Appraiser a list of deeded residential improved-property sales recorded 2026-08-05 through 2026-10-13 for 34769, 34771, 34772. Ask for sale date, parcel, site address, owner name (if not protected), owner mailing address (if not protected), use code, and sale price. Request CSV/Excel and **estimate only** before any charge or fulfillment. Dedupe and verify delivery addresses before selecting 50.

Official custom-request form: https://datarequest.property-appraiser.org/
Official data page: https://www.property-appraiser.org/data/


## QA verification — Nov 3, 2026
- The Welcome Home landing page rendered on an iPhone in both EN and ES.
- On the **staging preview**, the real form submitted `PRUEBA WELCOME HOME` with `source=water-test-qr` and `campaign=welcome_home_2026_sc01`. The row was verified in staging leads D1 and the owner received an alert. The exact test lead was then deleted. A mirror diagnostic reported `service_binding_unavailable`, consistent with the preview environment not having CRM binding or secret.
- On the **staging project production environment** (`legacy-water-staging.pages.dev`), a synthetic request `QA WELCOME HOME CRM` was posted via the actual `/api/leads` HTTP handler, with `source=qr` and `campaign=welcome_home_2026_crmqa`. Response was **201 saved=true**. Independently verified one matching row in `legacy-water-leads-staging` and one in `legacy-water-crm-staging`, both retaining `source=water-test-qr` and the campaign. Mirror diagnostic recorded **accepted HTTP 201**.
- The exact synthetic record was removed from **both** staging D1 databases with four-field safeguards; both databases were checked and returned 0 remaining records for the test ID. Operational diagnostic remains for audit.
- This proves the **form -> staging leads D1 -> stage CRM** path in the staging project production environment. It does **not** mean the welcome-home preview has a CRM binding or that the public Legacy Water site has been deployed.
- Staging Cloudflare deployments for the updated PR (which adds `Campaign:` to owner email notices) report success; the new notification field has not been independently checked via a new preview message.
- **No changes** to `legacy-water-production` project production configuration, its D1 lead data, production CRM, production branch, or mailed postcards.

### Remaining gates before production merge and printing
1. Final legal, food-production and gift-offer review: exact mini cake, permitted recipe/packaging, size, pickup area, redemption restrictions and expiration; update landing terms to remove placeholders.
2. Validate the 50 selected properties and USPS-deliverable mailing addresses. Do not use protected or confidential owner information.
3. Test and approve final public URL and QR, verify analytics consent and campaign attribution in deployed site, then generate print artwork.
4. Decide responsible operational owner for booking confirmation, completed-test verification, voucher issuance and redemption.

## Tasting kit — decision (Nov 3, 2026)
- Confirmed: **one unfilled Dominican mini cake** (no filling inside) plus **three traditional fillings in separate, individually sealed food-safe containers**. This is a tasting experience for La Casita Celebrations, not a generic cake gift.
- Flavor candidates previously discussed: guava, pineapple and dulce de leche. **The specific three flavors are not yet approved**; final options depend on recipe, production licensing, safe storage, allergen labeling and whether refrigeration is required.
- Tasting-kit voucher continues to be delivered after the complimentary in-home water evaluation; no water system purchase is required. Local bakery pickup arrangement remains to be finalized.
- Confirm mini cake size, filling container sizes, ingredient/allergen labels, temperature control, permitted food production and distribution, total cost, voucher expiration and fulfillment capacity for up to 50 kits *before* printing or public launch.
- The customer should be invited through an optional, separate QR to browse La Casita Celebrations' cake catalog and place future orders (no automatic marketing consent).
