import {test,expect} from '@playwright/test';

test('dashboard displays safe demo leads and KPIs',async({page},info)=>{
 await page.goto('/');
 await expect(page.getByRole('heading',{name:'Mis oportunidades'})).toBeVisible();
 await expect(page.locator('#total')).toHaveText('5');
 await expect(page.locator('#newCount')).toHaveText('1');
 await expect(page.locator('#wonCount')).toHaveText('1');
 await expect(page.locator('#dueCount')).toHaveText('2');
 await expect(page.locator('.lead')).toHaveCount(5);
 await expect(page.locator('.lead-list')).not.toContainText('Real Customer');
 await page.screenshot({path:info.outputPath('crm-dashboard-'+info.project.name+'.png'),fullPage:true});
});

test('search, filter and open a prospect detail',async({page})=>{
 await page.goto('/');
 await page.locator('#search').fill('María');
 await expect(page.locator('.lead')).toHaveCount(1);
 await page.locator('.lead').first().click();
 await expect(page.locator('#drawer')).toBeVisible();
 await expect(page.locator('#detailHeading')).toHaveText('María Ejemplo');
 await expect(page.locator('#detailBody')).toContainText('water-test-direct');
 await page.locator('#drawerClose').click();
 await expect(page.locator('#drawer')).toBeHidden();
 await page.locator('#search').fill('');
 await page.locator('#filter').selectOption('won');
 await expect(page.locator('.lead')).toHaveCount(1);
 await expect(page.locator('.lead')).toContainText('Cliente de Muestra');
});

test('sales followup and notes are editable in the demo',async({page})=>{
 await page.goto('/');
 await page.locator('.lead').first().click();
 await expect(page.locator('#detailHeading')).toHaveText('María Ejemplo');
 const form=page.locator('#detailBody form').first();
 await form.locator('select').selectOption('contacted');
 await form.locator('input[type=date]').fill('2026-10-30');
 await form.getByRole('button',{name:'Guardar cambios'}).click();
 await expect(page.locator('#detailBody form select').first()).toHaveValue('contacted');
 await page.locator('#detailBody textarea').fill('Cliente solicitó seguimiento después de las 5.');
 await page.locator('#detailBody').getByRole('button',{name:'Agregar nota'}).click();
 await expect(page.locator('#detailBody')).toContainText('Cliente solicitó seguimiento después de las 5.');
});

test('manual referral lead creation works without reaching public data',async({page})=>{
 await page.goto('/');
 await page.locator('#newButton').click();
 await page.locator('#newForm [name=full_name]').fill('Prospecto de Demostración');
 await page.locator('#newForm [name=phone]').fill('4075550109');
 await page.locator('#newForm [name=zip]').fill('34769');
 await page.locator('#newForm [name=product_interest]').selectOption('well_water');
 await page.locator('#newForm [name=campaign]').fill('referido-prueba');
 await page.locator('#newForm').getByRole('button',{name:'Guardar prospecto'}).click();
 await expect(page.locator('#detailHeading')).toHaveText('Prospecto de Demostración');
 await expect(page.locator('#total')).toHaveText('6');
});
