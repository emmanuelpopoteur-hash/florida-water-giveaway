export function distanceKm(a, b) {
  const rad = n => n * Math.PI / 180;
  const dlat = rad(b[0] - a[0]), dlon = rad(b[1] - a[1]);
  const x = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a[0])) * Math.cos(rad(b[0])) * Math.sin(dlon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(Math.max(0, 1 - x)));
}
export function nearbySystems(systems, point, radius = 40) {
  return systems.map(system => ({...system, distance: Math.min(...system.points.map(p => distanceKm(point, p)))}))
    .filter(s => s.distance <= radius).sort((a,b) => a.distance-b.distance || a.name.localeCompare(b.name));
}
export function searchSystems(systems, query) {
  const normalize = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const words = normalize(query).trim().split(/\s+/).filter(Boolean);
  return systems.filter(s => words.every(word => normalize(`${s.name} ${s.city} ${s.id} ${(s.aliases||[]).join(' ')}`).includes(word)));
}

// A ZIP suggestion is not an address-level service assignment.
export function zipSystems(systems, zips, zip) {
  const point=zips[zip];
  if(!point)return [];
  const list=nearbySystems(systems,point);
  const suggested={'34771':'FL3491373'}[zip];
  if(suggested){const i=list.findIndex(s=>s.id===suggested);if(i>0)list.unshift(...list.splice(i,1));}
  return list;
}
