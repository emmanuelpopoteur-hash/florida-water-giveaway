// Staging-only retention. Production requires a separate reviewed rollout.
export const STAGING_DB_ID = '2b3f58bf-f666-4165-a33d-0aff8d2a08ac';
export const EXPIRED_SQL = "SELECT COUNT(*) AS expired_rows FROM ro_email_requests WHERE julianday(created_at) < julianday(?, '-7 days')";
export const DELETE_SQL = "DELETE FROM ro_email_requests WHERE julianday(created_at) < julianday(?, '-7 days')";

export async function cleanup(env, {dryRun = true, now = new Date()} = {}) {
  if (env.RETENTION_ENVIRONMENT !== 'staging' || env.RETENTION_DATABASE_ID !== STAGING_DB_ID || !env.DB) {
    throw new Error('Staging retention binding required');
  }
  const cutoffReference = now.toISOString();
  if (dryRun) {
    const row = await env.DB.prepare(EXPIRED_SQL).bind(cutoffReference).first();
    return {dry_run: true, expired_rows: Number(row?.expired_rows || 0)};
  }
  const result = await env.DB.prepare(DELETE_SQL).bind(cutoffReference).run();
  if (!result.success) throw new Error('Retention cleanup failed');
  return {dry_run: false, deleted_rows: Number(result.meta?.changes || 0)};
}

export default {
  async fetch() { return new Response('Not found', {status: 404}); },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(cleanup(env, {dryRun: false, now: new Date(event.scheduledTime)}).then(result => {
      console.log(JSON.stringify({event: 'ro_staging_retention', ...result}));
    }));
  }
};
