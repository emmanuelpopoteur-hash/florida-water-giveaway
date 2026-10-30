// Generate *staging only* Wrangler configs after creating a dedicated D1 database.
// Safe by default: never invokes Wrangler, creates cloud resources, or writes secrets.
import { writeFile, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory=dirname(fileURLToPath(import.meta.url));
const crm=join(directory,'..');
const dbId=process.env.CRM_STAGING_D1_ID||'';
if(!/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(dbId)) {
 console.error('Specify CRM_STAGING_D1_ID as the UUID of your SEPARATE staging D1 database.');
 process.exitCode=1;
} else {
 const configs=[
  {from:'wrangler.example.toml',to:'wrangler-stage-dashboard.toml',
   name:'legacy-water-crm-stage',main:'src/worker.js'},
  {from:'wrangler-ingest.example.toml',to:'wrangler-stage-ingest.toml',
   name:'legacy-water-crm-ingest-stage',main:'src/ingest.js'}
 ];
 for (const config of configs){
  let text=await readFile(join(crm,config.from),'utf8');
  text=text.replace(/name = "legacy-water-crm-(?:private|ingest)"/, 'name = "'+config.name+'"');
  text=text.replace('database_name = "legacy-water-crm-private"','database_name = "legacy-water-crm-staging"');
  text=text.replace('REPLACE_WITH_PRIVATE_CRM_DATABASE_ID',dbId);
  if(!text.includes('main = "'+config.main+'"')||
      !text.includes('workers_dev = false')||
      !text.includes('preview_urls = false')||
      text.includes('REPLACE_WITH_PRIVATE'))throw Error('Invalid staging template');
  await writeFile(join(crm,config.to),text,{flag:'wx',mode:0o600});
  console.log('Created local-only staging configuration: crm/'+config.to);
 }
 console.log('No Cloudflare deployment performed. Review generated files and protect the dashboard Worker with Access before enabling any route.');
}
