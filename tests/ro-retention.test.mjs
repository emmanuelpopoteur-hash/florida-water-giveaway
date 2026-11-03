import test from 'node:test';
import assert from 'node:assert/strict';
import {spawnSync} from 'node:child_process';
import worker, {cleanup, STAGING_DB_ID, DELETE_SQL, EXPIRED_SQL} from '../scripts/ro-retention-staging.js';

test('retention SQL expires old pending and accepted rows without touching unrelated data',()=>{
  const py = `
import sqlite3,json,sys
delete_sql,count_sql=json.loads(sys.argv[1])
db=sqlite3.connect(':memory:')
db.executescript("CREATE TABLE ro_email_requests(id TEXT,created_at TEXT,status TEXT);CREATE TABLE water_test_leads(id TEXT);INSERT INTO water_test_leads VALUES ('keep');")
rows=[('old-accepted','2026-10-26T16:00:00Z','accepted'),('old-pending','2026-10-26T16:00:00Z','pending'),('boundary','2026-10-27T16:00:00Z','accepted'),('recent','2026-11-03T16:00:00Z','accepted'),('malformed','invalid','pending')]
db.executemany('INSERT INTO ro_email_requests VALUES (?,?,?)',rows)
now=('2026-11-03T16:00:00Z',)
assert db.execute(count_sql,now).fetchone()[0]==2
db.execute(delete_sql,now)
assert set(x[0] for x in db.execute('SELECT id FROM ro_email_requests'))=={'boundary','recent','malformed'}
assert db.execute('SELECT COUNT(*) FROM water_test_leads').fetchone()[0]==1
assert db.execute(count_sql,now).fetchone()[0]==0
`;
  const r=spawnSync('python3',['-c',py,JSON.stringify([DELETE_SQL,EXPIRED_SQL])],{encoding:'utf8'});
  assert.equal(r.status,0,r.stderr || r.error?.message);
});
function environment(){
  const calls=[];
  return {calls,RETENTION_ENVIRONMENT:'staging',RETENTION_DATABASE_ID:STAGING_DB_ID,DB:{
    prepare(sql){return {bind(reference){calls.push({sql,reference});return {
      async first(){return {expired_rows:2}},
      async run(){return {success:true,meta:{changes:2}}}
    }}}}
  }};
}
test('cleanup defaults to a read-only count and refuses non-staging configuration',async()=>{
  const env=environment(),now=new Date('2026-11-03T16:00:00Z');
  assert.deepEqual(await cleanup(env,{now}),{dry_run:true,expired_rows:2});
  assert.equal(env.calls[0].sql,EXPIRED_SQL);
  assert.equal(env.calls[0].reference,now.toISOString());
  for(const overrides of [{RETENTION_ENVIRONMENT:'production'},{RETENTION_DATABASE_ID:'different'},{DB:undefined}])
    await assert.rejects(()=>cleanup({...env,...overrides},{dryRun:false}),/Staging retention binding required/);
  assert.equal(env.calls.length,1);
});
test('delete failure rejects instead of reporting a successful purge',async()=>{
  const env=environment();env.DB.prepare=()=>({bind:()=>({run:async()=>({success:false})})});
  await assert.rejects(()=>cleanup(env,{dryRun:false}),/Retention cleanup failed/);
});
test('HTTP requests cannot trigger cleanup',async()=>{
  assert.equal((await worker.fetch()).status,404);
});
test('scheduled cleanup uses the event time and writes aggregate-only logs',async()=>{
  const env=environment(),tasks=[],logs=[],original=console.log;
  console.log=x=>logs.push(JSON.parse(x));
  try {
    await worker.scheduled({scheduledTime:Date.parse('2026-11-03T08:00:00Z')},env,{waitUntil:p=>tasks.push(p)});
    await Promise.all(tasks);
    assert.equal(env.calls[0].sql,DELETE_SQL);
    assert.equal(env.calls[0].reference,'2026-11-03T08:00:00.000Z');
    assert.deepEqual(logs,[{event:'ro_staging_retention',dry_run:false,deleted_rows:2}]);
  }finally{console.log=original}
});
