# Welcome Home direct-mail A/B pilot — DRAFT / NO MAIL
Updated: 2026-11-18. Commercial approval pending. No recipient data belongs in this repository.

## Goal
Compare two ways to reach new homeowners who may already be talking to other water-treatment providers. **Not** a statistically powered experiment: a 10-house pilot is directional feedback only.

## Variants (same actual owner-provided Ecoverse installation photo)
| Attribute | A — Curiosity | B — Active buyer |
| --- | --- | --- |
| Print headline | Your home is new. How well do you know its water? | Already received a water system quote? |
| Next line | Get to know your water before choosing a system. | Before you decide, see another option. |
| Primary action | Request a free in-home water check | Compare a quote / treatment options |
| Public QR (after launch) | `https://legacywaterusa.com/welcome-home/?c=sc01a` | `https://legacywaterusa.com/welcome-home/?c=sc01b` |
| Lead campaign — standard free check | `welcome_home_2026_sc01a` | `welcome_home_2026_sc01b` |
| Lead campaign — comparison | `welcome_home_2026_sc01a__compare` | `welcome_home_2026_sc01b__compare` |

The home-page A/B selection is performed in the existing `/welcome-home/` client script; both pages offer two clear options. The special `__compare` campaign suffix selects a comparison-focused intro and confirmation on the existing `/check/` form, without modifying lead database schema or routing to unrelated systems. The form collects ZIP, day/time *preferences*, name and phone only; these do **not** book an appointment automatically.

## Pilot allocation
- Mail **five independently verified addresses** with A and **five with B** using a balanced/randomized allocation across similar sale dates and neighborhoods.
- Check current owner, USPS deliverability, confidentiality/opt-outs and sender address *before printing or mailing*. Keep address/name lists in access-controlled operational files, not here.
- If a homeowner calls instead of scanning the QR, identify which letter was sent to the address from the private mailing log; do not infer attribution from ZIP alone.
- Log for each version: letters sent, responses (QR or phone), contactability, actual confirmed appointments, completed water checks, vouchers issued/redeemed, and resulting closed sales. An A/B response difference at n=5 is *not conclusive*.
- Do not attribute an uncontacted homeowner to a competitor merely because another vendor advertised to them.

## Customer offer — do not promise unconditional stacking
- Water systems **starting from $3,990** (only if exact eligible package and included installation/taxes are verified).
- **Six months with no payments** only if actual lender offer, eligibility, interest accrual, fees and mandatory disclosures are checked. **Never rewrite this as 0% interest without lender approval.**
- RO included at **no additional charge** only on *verified qualifying packages* under an approved promotion; terms and possible non-combinability must be explicit.
- Free home-water evaluation is separate from any purchase/financing application and is a promotional visit, **not** certified comprehensive lab analysis.
- Physical La Casita Celebrations voucher is handed to the household only **after completion of the water visit**, with no purchase needed; it expires 30 calendar days after issuance. Traditional ¼-lb-style unfilled cake plus separately packaged guava, pineapple and dulce de leche fillings. Cake photo is a representative style image, not proof of exact decoration.
- Cake pickup location, eligibility area, safe food handling, storage, manufacturing requirements and voucher terms still require approval. This campaign is **NO GO** until these and financing/RO conditions are confirmed.

## Proofs and acceptance
- Two single-page, home-printer Letter proofs are created separately: `Legacy_Welcome_Home_AB_A_Curiosidad_NO_ENVIAR.pdf` and `Legacy_Welcome_Home_AB_B_Antes_De_Decidir_NO_ENVIAR.pdf` in the project working area; **not** committed with recipient data.
- Verified embedded QR reads digitally as expected for `sc01a` and `sc01b`; a printed physical scan on at least two devices remains pending.
- Preview environment must be verified for both landing variants and both comparison paths; staging D1/CRM/Resend is already tested for normal water leads but the new compare campaign must undergo a safe synthetic dry-run / staged QA before production.
- PR #17 remains draft. No production merge and no outgoing letters without explicit approval.
