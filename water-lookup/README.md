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
