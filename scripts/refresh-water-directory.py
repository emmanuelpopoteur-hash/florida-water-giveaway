"""Refresh public facility locations (not service boundaries) and Census ZCTA centers."""
import csv, io, json, pathlib, urllib.parse, urllib.request, zipfile, datetime
ROOT = pathlib.Path(__file__).resolve().parents[1]
API = 'https://ca.dep.state.fl.us/arcgis/rest/services/OpenData/PWS/MapServer/1/query'
CENSUS = 'https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_Gaz_zcta_national.zip'
params = dict(where="PWS_STATUS='ACTIVE' AND PLANT_STATUS='ACTIVE' AND PWS_TYPE='COMMUNITY'", outFields='PWS_ID,PWS_NAME,PWS_CITY', outSR='4326', returnGeometry='true', f='json', orderByFields='OBJECTID', resultRecordCount=2000)
systems={}; offset=0
while True:
    params['resultOffset']=offset
    with urllib.request.urlopen(API+'?'+urllib.parse.urlencode(params),timeout=60) as r: data=json.load(r)
    if 'error' in data: raise RuntimeError(data['error'])
    for feature in data['features']:
        a=feature['attributes']; g=feature.get('geometry') or {}; pid='FL'+str(a['PWS_ID']).zfill(7)
        item=systems.setdefault(pid,dict(id=pid,name=a['PWS_NAME'].strip(),city=(a['PWS_CITY'] or '').strip(),points=[]))
        x,y=g.get('x'),g.get('y')
        if x is not None and y is not None and -88<x<-79 and 24<y<32:
            point=[round(y,5),round(x,5)]
            if point not in item['points']: item['points'].append(point)
    if not data.get('exceededTransferLimit'): break
    offset+=len(data['features'])
with urllib.request.urlopen(CENSUS,timeout=60) as r: z=zipfile.ZipFile(io.BytesIO(r.read()))
rows=csv.DictReader(io.StringIO(z.read(z.namelist()[0]).decode()),delimiter='|')
zips={}
for row in rows:
    row={k.strip():v.strip() for k,v in row.items()}; code=row['GEOID']; prefix=int(code[:3])
    if 320<=prefix<=339 or 341<=prefix<=349:
        zips[code]=[float(row['INTPTLAT']),float(row['INTPTLONG'])]
aliases={'FL3480962':['OUC'], 'FL3491373':['City of St Cloud','St. Cloud'], 'FL3484132':['Orange County Utilities East'], 'FL3484119':['Orange County Utilities South'], 'FL3481546':['Orange County Utilities West']}
for pid, names in aliases.items():
    if pid in systems: systems[pid]['aliases']=names
out=dict(retrieved=datetime.datetime.now(datetime.timezone.utc).date().isoformat(),sources=[API,CENSUS],systems=sorted(systems.values(),key=lambda s:s['name']),zips=zips)
assert len(systems)>1000 and len(zips)>800
(ROOT/'water-lookup/directory.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
print(f'{len(systems)} community systems, {len(zips)} ZCTA centers, {sum(bool(s["points"]) for s in systems.values())} systems with coordinates')
