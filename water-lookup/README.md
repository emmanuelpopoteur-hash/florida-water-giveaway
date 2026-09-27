# Florida water-system discovery

The homepage and `/agua-local/` share ZIP, provider/city/PWS-ID, and opt-in browser geolocation searches.

## Sources and scope

- Florida DEP Public Water Supply Plants (Non-Federal): https://geodata.dep.state.fl.us/datasets/public-water-supply-pws-plants-non-federal/about
- Source API: https://ca.dep.state.fl.us/arcgis/rest/services/OpenData/PWS/MapServer/1
- Census 2025 ZCTA Gazetteer: https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_zcta_national.zip

Snapshot: 1,541 distinct ACTIVE COMMUNITY systems with ACTIVE plant records; 1,536 have usable Florida plant coordinates. 1,013 Florida ZCTA centers. Federal facilities, inactive systems, noncommunity systems, and systems absent from the plant layer are outside this directory. This is not an exhaustive service-coverage database.

Refresh with `python3 scripts/refresh-water-directory.py`. The script paginates the source and fails on API errors, retains official system IDs/names, groups multiple plants under one system, and records the retrieval date. Friendly aliases supplement a few existing systems without replacing official names. Florida postal prefixes 320–339 and 341–349 select Gazetteer entries; postal-only ZIPs may have no ZCTA. Census centers are not postal delivery or utility service boundaries.

## Matching and privacy

ZIP search ranks plants within 40 km of the Census center. GPS uses the same ranking from the user's coordinates. Neither approach determines a home's water provider. Every result requires explicit provider selection. Name/city/ID search covers the entire directory, including records without coordinates. Lists show at most 40 candidates and ask users to narrow longer lists. No match never means the water is safe or service is unavailable.

GPS is requested only after clicking Use my location. Coordinates are held in page memory only, are not sent in network requests or URLs, and are not written to storage or lead submissions. Denied, unavailable, timeout, and overly imprecise locations fall back to manual search. Switching searches invalidates late GPS responses. GPS/provider searches clear an earlier ZIP to avoid carrying stale location into the lead form.

`historical.json` preserves the pre-existing EWG transcriptions from commit `1dc282d`. It is not newly verified current sampling data. Only three systems have detailed measurements. Other selected systems show an explicit unavailable message and a link to look up the PWS ID in EWG; EWG may not have a record for every DEP system. Facility coordinates do not supply contaminant results. Future additions require source, sampling period, units and system-ID verification.

## Validation

- `node --test tests/water-lookup.test.mjs`: data shape, unique IDs, Central Florida ZIPs, statewide ZIPs, distance filtering, out-of-state/no-coordinate cases and name/ID matching.
- `node scripts/build-cloudflare.mjs`: shared assets included in output.
- DOM integration checks completed for both entry pages: language switching, provider confirmation, invalid ZIP, GPS success/denial/imprecision, late callback cancellation, and only static dataset network requests during geolocation.
- Local Chrome walkthrough: ZIP 34771 produces candidate systems and preserves ZIP handoff to the lead form.

Service-area promises and the lead database schema are unchanged by this lookup expansion.

## Official report expansion (2026-09-26)

The statewide directory and verified report coverage are different datasets. Seventeen systems currently have transcribed official 2025 report tables: seven Toho systems and all ten systems in Orange County Utilities' 2025 report. Do not describe the statewide report work as complete. The plant directory contains 1,541 systems, supplemented by two report-backed purchased-water systems without plant coordinates; those two can be found by name or PWS ID, not by guessed location.

Official results live in `historical.json.officialReports`, keyed by the exact PWS ID. Every row records English/Spanish names, reported value, units, range, sampling date, report limit, metric type and PDF page. The report year is not a substitute for the sampling year. Source documents: Toho St. Cloud 2025 English PDF pages 6–8 and Orange County Utilities 2025 PDF pages 11–20. All relevant pages were visually reviewed against the extracted tables. `report-systems.json` retains CCR-backed labels and supplemental systems across directory refreshes.

Eastern's monitoring issue, individual TTHM results, and printed February 2026 nitrate date are disclosed. Western's printed combined-radium limit of 15 is held as pending verification instead of promoted as a valid comparison. Magnolia Woods' nondetected tap lead is explained without fabricating a numeric value. Purchased-water suppliers do not inherit another retailer's distribution measurements. Monthly/annual, locational-average and percentile metrics are kept distinct. Source report pages remain linked.

Next acquisition areas: OUC, remaining Central Florida utilities, then statewide municipal and smaller community systems. Each requires verified PWS identity, dated official report, table/footnote review and source-specific exceptions before publication. No background job is configured. Run `node --test tests/*.test.mjs` and the build before publishing changes.

Toho expansion includes Eastern (Central report), Harmony, Sunbridge, Poinciana, Western and Hidden Glen. All 14 relevant pages were visually reviewed. Sunbridge keeps both 2025 tap sampling periods and the one individual lead site above the action level, without incorrectly labeling this a system action-level exceedance. Running annual averages (RAA) are distinct from locational running annual averages (LRAA).

OUC added from its official 2024 report (latest linked on the checked listing), PDF pages 4–5 / printed pages 6–8, visually verified. Coverage now totals 18 systems and 220 measurement rows; report years vary. OUC copper includes one individual site above AL while the system percentile does not exceed AL. The UI no longer hardcodes 2025 in the limit legend.

Tampa (FL6290327) added from its official 2025 report, visually verified PDF pages 12–15. Coverage: 19 systems, 234 measurement rows plus separately labeled turbidity, TOC-removal and PFAS reporting details. Semiannual lead/copper rows remain separate; the July–December lead-site exceedance is preserved. TOC removal ratios are not presented as ppm concentrations, and PFAS reporting thresholds are not legal limits.

JEA 2025 added for six named grids matched to DEP system IDs: Major Grid, Mayport, Lofton Oaks, Ponce de Leon, Ponte Vedra and Palm Valley. PDF page 4 visually verified. Coverage now 25 systems / 295 numerical measurement rows. Secondary exceedances are separate, with report-specific status text overriding the default. Major Grid individual TTHM exceedance and Mayport copper-site exceedance are disclosed. Palm Valley nondetected lead is not fabricated as zero. ND-only entries and unreported tap ranges are explicitly described.
