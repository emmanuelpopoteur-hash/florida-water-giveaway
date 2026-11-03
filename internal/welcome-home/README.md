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
