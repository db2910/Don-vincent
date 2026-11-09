import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
const pageErrors = new WeakMap<Page,string[]>();
const viewports = [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1440,height:1000},{width:844,height:390}];

test.beforeEach(async ({page}) => {
  const errors: string[] = []; pageErrors.set(page,errors);
  page.on("pageerror", error => errors.push(error.message));
  // All browser submissions are fixtures, including on machines configured for a live DB.
  await page.route("**/api/rsvp", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify({mode:"preview",stored:false})}));
});
test.afterEach(async ({page}) => { expect(pageErrors.get(page) ?? []).toEqual([]); });
async function enter(page:Page) { await page.goto("/",{waitUntil:"domcontentloaded"}); await page.getByRole("button",{name:"Skip introduction"}).click(); }
async function guest(page:Page) { await page.locator("#rsvp-fullName").fill("Test Guest"); await page.locator("#rsvp-contact").fill("guest@example.test"); }

test("envelope runs all phases, remembers session and always returns replays to the hero",async({page})=>{
  test.setTimeout(60_000);
  await page.goto("/",{waitUntil:"domcontentloaded"});
  const modal=page.getByRole("dialog",{name:"Open Your Invitation"});
  await expect(modal).toBeVisible(); await expect(page.locator("body")).toHaveCSS("overflow","hidden");
  await expect(page.getByRole("button",{name:"Open your invitation",exact:true})).toBeFocused();
  await page.evaluate(()=>{(window as unknown as {phases:string[]}).phases=[]; const dialog=document.querySelector('.envelope-dialog')!;new MutationObserver(()=>{(window as unknown as {phases:string[]}).phases.push(dialog.getAttribute('data-state')!);}).observe(dialog,{attributes:true,attributeFilter:['data-state']});});
  await page.keyboard.press("Enter");
  await expect.poll(()=>page.locator('.envelope-dialog').getAttribute('data-state'),{intervals:[50]}).toBe('card-visible');
  await page.screenshot({path:'test-results/envelope-revealed-desktop.png'});
  await expect(modal).not.toBeVisible({timeout:10000});
  expect(await page.evaluate(()=>(window as unknown as {phases:string[]}).phases)).toEqual(expect.arrayContaining(['opening','revealing-card','card-visible','transitioning','completed']));
  await expect(page.locator('#couple-names')).toBeFocused();
  await expect(page.locator('body')).not.toHaveCSS('overflow','hidden');
  await page.reload(); await expect(modal).not.toBeVisible();
  const replay=page.getByRole('button',{name:'Open the envelope again'});
  for(let repeat=0;repeat<2;repeat++) {
    await replay.scrollIntoViewIfNeeded();
    expect(await page.evaluate(()=>window.scrollY)).toBeGreaterThan(1000);
    await page.evaluate(()=>history.replaceState(history.state,'','#rsvp'));
    await replay.click();await page.getByRole('button',{name:'Open your invitation',exact:true}).click();await expect.poll(()=>page.locator('.envelope-dialog').getAttribute('data-state'),{intervals:[50]}).toBe('card-visible');await expect(modal).not.toBeVisible({timeout:10000});
    await expect(page.locator('#couple-names')).toBeFocused();
    await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
    await expect(page).toHaveURL(/#home$/);
  }
});

test('closed envelope has a centered seal and larger hearts on desktop and mobile',async({page})=>{
  for(const viewport of [{width:320,height:568},{width:390,height:844},{width:1440,height:1000}]) {
    await page.setViewportSize(viewport);await page.goto('/');
    await expect(page.locator('.envelope-dialog')).toBeVisible();
    await expect(page.locator('#envelope-couple-names')).toHaveCount(0);
    const envelope=(await page.locator('.envelope-open').boundingBox())!;
    const seal=(await page.locator('.wax-seal').boundingBox())!;
    expect(Math.abs(seal.x+seal.width/2-envelope.x-envelope.width/2)).toBeLessThan(1);
    expect(Math.abs(seal.y+seal.height/2-envelope.y-envelope.height/2)).toBeLessThan(1);
    const heartSizes=await page.evaluate(()=>['envelope','page'].map(variant=>parseFloat(getComputedStyle(document.querySelector(`[data-hearts="${variant}"] > span`)!).width)));
    expect(heartSizes[0]/heartSizes[1]).toBeCloseTo(1.6,1);
    await page.screenshot({path:`test-results/envelope-centered-${viewport.width}.png`});
  }
});

test('skip interruption, Escape, reduced motion and no-JavaScript access recover safely',async({page,browser})=>{
  await page.goto('/');await page.getByRole('button',{name:'Open your invitation',exact:true}).click();await expect(page.getByRole('button',{name:'Open your invitation',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Skip introduction'}).click();
  await expect(page.locator('#couple-names')).toBeFocused();
  await page.getByRole('button',{name:'Open the envelope again'}).click();await page.keyboard.press('Escape');await expect(page.locator('.envelope-dialog')).not.toBeVisible();
  await page.emulateMedia({reducedMotion:'reduce'});await page.getByRole('button',{name:'Open the envelope again'}).click();await page.getByRole('button',{name:'Open your invitation',exact:true}).click();await expect(page.locator('.envelope-dialog')).not.toBeVisible();await expect(page.locator('[data-hearts="page"]')).not.toBeVisible();
  const context=await browser.newContext({javaScriptEnabled:false});const staticPage=await context.newPage();await staticPage.goto('http://127.0.0.1:3000');await expect(staticPage.locator('#couple-names')).toBeVisible();await expect(staticPage.locator('.envelope-dialog')).not.toBeVisible();await expect(staticPage.getByRole('form',{name:'Wedding RSVP'})).toHaveAttribute('method','post');await context.close();
});

test('hero is full-background photography with a provisional Kigali countdown and subtle hearts',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await enter(page);
  const hero=page.locator('#home');const background=hero.locator('picture img');
  const bounds=(await hero.boundingBox())!;const photo=(await background.boundingBox())!;
  expect(photo.width).toBeCloseTo(bounds.width,0);expect(photo.height).toBeCloseTo(bounds.height,0);expect(bounds.height).toBeGreaterThanOrEqual(1000);
  await expect(hero.getByRole('timer')).toBeVisible();await expect(page.getByRole('timer')).toHaveCount(1);await expect(hero.getByText('Date countdown · Ceremony time unconfirmed')).toBeVisible();
  await expect(background).toHaveAttribute('src',/12.04.15/);
  await expect(page.locator('[data-hearts="page"]')).toHaveCSS('pointer-events','none');expect(await page.locator('[data-hearts="page"] > span').count()).toBeLessThanOrEqual(12);
  await expect(page.getByRole('button',{name:'Play wedding music'})).toHaveCount(0);
});

test('the opening click requests music within the browser user gesture, once',async({page})=>{
  await page.addInitScript(()=>{(window as unknown as {musicGesture:boolean[]}).musicGesture=[];window.addEventListener('sd:request-wedding-music',()=>{(window as unknown as {musicGesture:boolean[]}).musicGesture.push(navigator.userActivation.isActive);});});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'Open your invitation',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {musicGesture:boolean[]}).musicGesture)).toEqual([true]);
});

for(const choice of ['yes','no','unsure','declined']) {
  test(`continuous RSVP reveals only applicable fields for ${choice}`,async({page})=>{
    let submitted:Record<string,unknown>|undefined;
    await page.unroute('**/api/rsvp');await page.route('**/api/rsvp',async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({mode:'preview',stored:false})});});
    await enter(page);await guest(page);await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);
    await page.getByRole('radio',{name:choice==='declined'?'Regretfully declines':'Joyfully accepts'}).check();
    if(choice==='declined') await expect(page.getByRole('group',{name:'Will you need accommodation?'})).toHaveCount(0);
    else {
      await expect(page.getByRole('group',{name:/Will you need accommodation/})).toBeVisible();
      await page.getByRole('radio',{name:choice==='yes'?'Yes':choice==='no'?'No, I have my own arrangements':"I'm not sure yet",exact:true}).check();
      if(choice==='yes') {
        await page.locator('#rsvp-budgetCurrency').selectOption('RWF');await page.locator('#rsvp-budgetAmount').fill('35000');await page.locator('#rsvp-nights').fill('3');await page.getByRole('radio',{name:'Bed and breakfast',exact:true}).check();await page.getByRole('radio',{name:'Either is fine',exact:true}).check();await page.getByRole('radio',{name:'I prefer a private room',exact:true}).check();await page.locator('#rsvp-roomOccupants').fill('2');
      } else await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);
    }
    await page.locator('#rsvp-guestMessage').fill('With love from this test fixture.');await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'RSVP via WhatsApp'})).toBeDisabled();
    await page.getByRole('button',{name:'Send My RSVP'}).click();await expect(page.getByRole('status')).toContainText('Preview complete');await expect(page.getByRole('status')).toContainText('not been stored or emailed');await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');
    expect(submitted?.accommodationStatus).toBe(choice==='declined'?'not_applicable':choice);expect(submitted?.budgetAmount).toBe(choice==='yes'?35000:null);
  });
}

test('RSVP preserves conditional values and retains one idempotency key across a failed retry',async({page})=>{
  let requests=0;const keys:string[]=[];
  await page.unroute('**/api/rsvp');await page.route('**/api/rsvp',async route=>{keys.push(route.request().headers()['idempotency-key']);requests++;await route.fulfill({status:requests===1?503:200,contentType:'application/json',body:JSON.stringify(requests===1?{error:'Temporary failure'}:{stored:true,id:'f9918d32-7358-4cd8-97df-9154e3c79868'})});});
  await enter(page);await guest(page);await page.getByRole('radio',{name:'Joyfully accepts'}).check();await page.getByRole('radio',{name:'Yes',exact:true}).check();await page.locator('#rsvp-budgetAmount').fill('120');await page.getByRole('radio',{name:"I'm not sure yet",exact:true}).check();await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);await page.getByRole('radio',{name:'Yes',exact:true}).check();await expect(page.locator('#rsvp-budgetAmount')).toHaveValue('120');await page.getByRole('radio',{name:'No, I have my own arrangements',exact:true}).check();
  await page.getByRole('button',{name:'Send My RSVP'}).click();await expect(page.locator('#rsvp').getByRole('alert')).toContainText('couldn’t confirm');await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');await page.getByRole('button',{name:'Try Again'}).click();await expect(page.getByRole('status')).toContainText('Your reply is received');await expect(page.locator('#rsvp-fullName')).toBeDisabled();expect(keys).toHaveLength(2);expect(keys[0]).toBe(keys[1]);
});

test('editorial gallery supports arrows, swipe, focus trapping and Escape restoration; calendar stays all-day',async({page})=>{
  await enter(page);const trigger=page.locator('#moments button').first();await trigger.click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
  const original=await modal.locator('img').getAttribute('src');await page.keyboard.press('ArrowRight');await expect(modal.locator('img')).not.toHaveAttribute('src',original!);await modal.getByRole('button',{name:'Next photograph'}).click();
  const beforeSwipe=await modal.locator('img').getAttribute('src');await modal.locator('img').evaluate(element=>{const target=element.parentElement!;const touch=(x:number)=>new Touch({identifier:1,target,clientX:x,clientY:100});target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,changedTouches:[touch(220)]}));target.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[touch(50)]}));});await expect(modal.locator('img')).not.toHaveAttribute('src',beforeSwipe!);
  await modal.getByRole('button',{name:'Close photograph'}).focus();await page.keyboard.press('Shift+Tab');await expect(modal.getByRole('button',{name:'Next photograph'})).toBeFocused();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:/add to calendar/i}).click();const file=await download;expect(file.suggestedFilename()).toMatch(/\.ics$/);const calendar=await readFile((await file.path())!,'utf8');expect(calendar).toContain('DTSTART;VALUE=DATE:20261217');expect(calendar).not.toContain('DTSTART:');
});

test('venue map is optional and keeps directions available when the provider fails',async({page})=>{
  await enter(page);await expect(page.locator('#venue iframe')).toHaveCount(0);await page.route('https://maps.google.com/**',route=>route.abort());await page.getByRole('button',{name:'Load map preview'}).click();await expect(page.locator('#venue iframe')).toHaveAttribute('src',/Kigali%20Serena%20Hotel/);await expect(page.getByRole('link',{name:'Get Directions'})).toHaveAttribute('href','https://www.google.com/maps/search/?api=1&query=Kigali+Serena+Hotel');
});

for(const viewport of viewports) {
  test(`responsive composition and expanded RSVP fit ${viewport.width}x${viewport.height}`,async({page})=>{
    test.setTimeout(45000);await page.setViewportSize(viewport);await page.goto('/');await expect(page.locator('.envelope-dialog')).toBeVisible();await page.screenshot({path:`test-results/envelope-${viewport.width}.png`});await page.getByRole('button',{name:'Skip introduction'}).click();
    await page.evaluate(async()=>{await document.fonts.ready;document.documentElement.style.scrollBehavior='auto';for(let y=0;y<document.body.scrollHeight;y+=550){window.scrollTo({top:y,behavior:'instant'});await new Promise(resolve=>setTimeout(resolve,70));}await Promise.all([...document.images].map(image=>image.decode().catch(()=>{})));window.scrollTo({top:0,behavior:'instant'});document.documentElement.style.removeProperty('scroll-behavior');});
    await page.waitForTimeout(950);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);await page.screenshot({path:`test-results/invitation-${viewport.width}.png`,fullPage:true});await page.screenshot({path:`test-results/hero-${viewport.width}.png`});
    if(viewport.width<=800) { await page.getByRole('button',{name:'Open navigation'}).click();await page.getByRole('link',{name:'The venue',exact:true}).click();await expect(page.locator('#venue')).toBeInViewport();await expect(page.getByRole('button',{name:'Open navigation'})).toHaveAttribute('aria-expanded','false'); }
    await page.getByRole('radio',{name:'Joyfully accepts'}).check();await page.getByRole('radio',{name:'Yes',exact:true}).check();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('label[for="rsvp-fullName"]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    if(viewport.width<701) expect(await page.locator('#home picture img').evaluate((el:HTMLImageElement)=>el.currentSrc)).toContain('12.04.16');
  });
}

test('the emerged paper fits all supported viewports and remains opaque inside the pocket',async({page})=>{
  test.setTimeout(90000);await page.addInitScript(()=>sessionStorage.removeItem('sd-invitation-opened'));
  for(const viewport of viewports) {await page.setViewportSize(viewport);await page.goto('/');await page.getByRole('button',{name:'Open your invitation',exact:true}).click();await expect.poll(()=>page.locator('.envelope-dialog').getAttribute('data-state'),{intervals:[50]}).toBe('card-visible');const paper=(await page.locator('.envelope-card').boundingBox())!;expect(paper.y).toBeGreaterThanOrEqual(10);expect(paper.y+paper.height).toBeLessThanOrEqual(viewport.height-10);await expect(page.locator('.envelope-card')).toHaveCSS('opacity','1');await page.screenshot({path:`test-results/revealed-${viewport.width}.png`});await page.keyboard.press('Escape');}
});
