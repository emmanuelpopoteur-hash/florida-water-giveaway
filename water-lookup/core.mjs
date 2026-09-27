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
const normalizeSearch = text => String(text || '').normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

// Edit distance with adjacent transpositions: "thoo" is one typo from "toho".
function typoDistance(a, b) {
  const grid = Array.from({length:a.length+1}, () => Array(b.length+1).fill(0));
  for(let i=0;i<=a.length;i++)grid[i][0]=i;
  for(let j=0;j<=b.length;j++)grid[0][j]=j;
  for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++){
    grid[i][j]=Math.min(grid[i-1][j]+1,grid[i][j-1]+1,grid[i-1][j-1]+(a[i-1]===b[j-1]?0:1));
    if(i>1&&j>1&&a[i-1]===b[j-2]&&a[i-2]===b[j-1])grid[i][j]=Math.min(grid[i][j],grid[i-2][j-2]+1);
  }
  return grid[a.length][b.length];
}
export function searchSystems(systems, query) {
  const words=normalizeSearch(query).split(' ').filter(Boolean);
  if(!words.length)return [];
  return systems.map((system,index)=>{
    const text=normalizeSearch(`${system.name} ${system.displayName||''} ${system.city||''} ${system.id} ${(system.aliases||[]).join(' ')}`);
    const tokens=[...new Set(text.split(' '))];
    let score=0;
    for(const word of words){
      if(text.includes(word))continue;
      // Never guess identifiers or numbers; short terms are too ambiguous.
      const limit=/\d/.test(word)||word.length<4?0:word.length>=7?2:1;
      if(!limit)return null;
      let best=limit+1;
      for(const token of tokens){
        if(/\d/.test(token)||Math.abs(token.length-word.length)>limit)continue;
        best=Math.min(best,typoDistance(word,token));
      }
      if(best>limit)return null;
      score+=best;
    }
    return {system,score,index};
  }).filter(Boolean).sort((a,b)=>a.score-b.score||a.index-b.index).map(item=>item.system);
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
