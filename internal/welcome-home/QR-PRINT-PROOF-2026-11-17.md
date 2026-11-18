# Welcome Home — QR vector print proof (Nov 17, 2026)

**STATUS: DO NOT MAIL / NO PRODUCTION RELEASE.** This proof reproduces the user-approved raster artwork without restyling and makes only one visual replacement: the former non-scannable QR placeholder is covered with a **vector QR** in the original yellow/white outlined area on the front. Page two retains original design; both pages have a small draft warning in the white bottom margin.

## Files prepared locally (not in GitHub)
- `Welcome_Home_Grafica_Fiel_QR_Provisional_NO_ENVIAR.pdf` — 2-page US Letter home-print PDF with front QR and unchanged reverse.
- `Welcome_Home_Preview_QR_Pendiente.png` — side-by-side preview.
- `Welcome_Home_QR_Planeado_NO_ACTIVADO.png` — standalone QR for planned final destination.
- `Welcome_Home_QR_Prueba_Formulario_Activo.png` — standalone QR for existing `/check/` form with testing UTM values, **not the promotional mail URL**.
- `Welcome_Home_Estado_QR_y_Aprobaciones.txt` — print settings and launch gate details.
- `Welcome_Home_Grafica_Fiel_QR_En_Revision.zip` — package.

## Verification
- Proposed mail QR target: `https://legacywaterusa.com/welcome-home/?c=sc01`.
- The branch landing parses `c=sc01` and redirects to `/check/` with `utm_source=qr`, `utm_medium=direct_mail`, and `utm_campaign=welcome_home_2026_sc01` (see `welcome-home/index.html`). These routes work only **after** the landing is publicly deployed.
- As independently checked Nov 17, public `/welcome-home/` still serves the general Legacy Water homepage, **not the Welcome Home offer**, and PR #17 remains an open draft. The QR is scannable but the linked campaign destination is **NOT activated**.
- Vector QR in PDF decoded successfully using computer vision at a 200-dpi rendered proof and returns the exact intended URL. Standalone planned QR and separate form-test QR were also decoded successfully.
- Home print: US Letter 8.5 x 11, color, 100% scale, 2-sided long-edge flip. Artwork resolution remains approximately 138 pixels/inch; new QR modules are vector.
- Visually important content issue: the original illustrative image on back features **a slice with interior filling** although the approved product is **a ¼-pound traditional mini cake without interior filling + 3 fillings served separately**. Must correct before customer mail; do not present that photo as the actual product.
- User-approved text and branding should be checked against official brand assets; the concept images may not be the original official logos. No homeowner PII in this file.

## Blocking release tasks
1. Confirm final flavors/label/food safety/pickup/expiry, legal advertising terms and gift fulfillment.
2. Fix reverse-side illustrative product inconsistency without changing the overall visual design.
3. Publish and QA the bilingual landing on the real domain, **only with explicit production approval**.
4. Verify QR opens the specific published offer on two phones; verify form campaign attribution.
5. Verify current property owners, USPS deliverability and final sender address; 10 candidates currently not approved.
6. Export the final release PDF without warning text, with approved official logos and active QR only after review.

No production changes, no mailings, and no new customer data have been created by this proof.
