// Campaign URL construction is intentionally dependency-free and does not send analytics.
import { readFile } from 'node:fs/promises';

export const configPath = new URL('../campaigns/qr-campaigns.json', import.meta.url);
export async function loadCampaigns() {
  return JSON.parse(await readFile(configPath, 'utf8'));
}
const validId = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export function buildCampaignLinks(config) {
  const origin = new URL(config.base);
  if (origin.protocol !== 'https:' || origin.hostname !== 'legacywaterusa.com' || origin.pathname !== '/') {
    throw new Error('Campaign links must use the approved Legacy Water USA HTTPS domain');
  }
  const seen = new Set(), links = [];
  for (const item of config.campaigns) {
    if (!validId.test(item.id) || seen.has(item.id)) throw new Error('Invalid or repeated campaign ID');
    seen.add(item.id);
    if (!['/check/','/water-test/','/ro/'].includes(item.path)) throw new Error('Unexpected landing page');
    if (item.source !== 'qr' || item.medium !== 'print' || item.campaign !== item.id) {
      throw new Error('Invalid tracking metadata');
    }
    const url = new URL(item.path, origin);
    url.searchParams.set('utm_source', item.source);
    url.searchParams.set('utm_medium', item.medium);
    url.searchParams.set('utm_campaign', item.campaign);
    if (item.interest) {
      if (item.path !== '/check/' || !['city_water','well_water','drinking_ro'].includes(item.interest))
        throw new Error('Invalid campaign product interest');
      url.searchParams.set('interest', item.interest);
    }
    links.push({id:item.id,description:item.description,url:url.href});
  }
  return links;
}
