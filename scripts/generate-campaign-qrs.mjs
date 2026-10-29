// Render print-ready QR assets (SVG and PNG) using the open-source node-qrcode library.
// Install on a developer machine: npm install --no-save qrcode@1.5.4
// Run: node scripts/generate-campaign-qrs.mjs [output-directory]
// The resulting files are marketing assets; no browser code or customer data is collected.
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { loadCampaigns, buildCampaignLinks } from './campaign-links.mjs';

const out = path.resolve(process.argv[2] || 'campaign-assets/qr');
const links = buildCampaignLinks(await loadCampaigns());
await mkdir(out, {recursive:true});
for (const item of links) {
  const common = {
    errorCorrectionLevel:'H',
    margin:4,
    color:{dark:'#06343DFF',light:'#FFFFFFFF'}
  };
  await QRCode.toFile(path.join(out,item.id+'.svg'),item.url,{...common,type:'svg'});
  await QRCode.toFile(path.join(out,item.id+'.png'),item.url,{...common,type:'png',width:1200});
  process.stdout.write(item.id+': '+item.url+'\n');
}
await writeFile(path.join(out,'links.json'),JSON.stringify({
  generated_at:new Date().toISOString(),campaigns:links
},null,2)+'\n');
console.log('Generated '+links.length+' tracked QR campaigns in '+out);
