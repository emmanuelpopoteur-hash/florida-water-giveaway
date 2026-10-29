import {defineConfig,devices} from '@playwright/test';

export default defineConfig({
 testDir:'../tests/crm-e2e',
 timeout:20000,
 expect:{timeout:7000},
 retries:process.env.CI?1:0,
 reporter:'list',
 use:{baseURL:'http://127.0.0.1:4188',screenshot:'only-on-failure',trace:'retain-on-failure'},
 projects:[
  {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
  {name:'mobile-safari',use:{...devices['iPhone 13']}}
 ],
 webServer:{
  command:'node crm/dev/preview-server.mjs',
  url:'http://127.0.0.1:4188/',
  reuseExistingServer:!process.env.CI,
  timeout:15000,
  env:{CRM_ENABLE_LOCAL_DEMO:'1'}
 }
});
