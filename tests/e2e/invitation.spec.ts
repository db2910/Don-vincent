import { test, expect, type Page, type Route } from "@playwright/test";
import { readFile } from "node:fs/promises";
const pageErrors = new WeakMap<Page,string[]>();
const viewports = [{width:320,height:568},{width:390,height:844},{width:768,height:1024},{width:1024,height:768},{width:1440,height:1000},{width:844,height:390}];
const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
function preparedReply(route: Route) {
  const payload = route.request().postDataJSON();
  const reference = route.request().headers()['idempotency-key'];
  const fields = { Guest: payload.fullName, 'Phone or email': payload.contact, Attendance: payload.attendanceStatus,
    'Message for the couple': payload.guestMessage || '', _template: 'table', _honey: '', _url: 'http://127.0.0.1:3000/#rsvp', Reference: reference };
  return { reference, delivery: { action: 'https://formsubmit.co/ajax/client%40example.test', fields: { ...fields, _captcha: 'false' } },
    verification: { action: 'https://formsubmit.co/client%40example.test', fields } };
}

test.beforeEach(async ({page, context}) => {
  const errors: string[] = []; pageErrors.set(page,errors);
  page.on("pageerror", error => errors.push(error.message));
  // Keep layout/envelope checks independent of third-party video timing.
  // Player states and failures have unit coverage; live playback is checked separately.
  await page.route('https://www.youtube.com/iframe_api', route => route.abort());
  // All browser submissions are fixtures, including on machines configured for live email.
  await page.route("**/api/rsvp", route => route.fulfill({status:200,contentType:"application/json",body:JSON.stringify(preparedReply(route))}));
  await context.route('https://formsubmit.co/**', route => route.fulfill({status:200,headers:corsHeaders,contentType:'application/json',body:JSON.stringify({success:'true'})}));
});
test.afterEach(async ({page}) => { expect(pageErrors.get(page) ?? []).toEqual([]); });
async function enter(page:Page) { await page.goto("/",{waitUntil:"domcontentloaded"}); await page.getByRole("button",{name:"Skip introduction"}).click(); }
async function guest(page:Page) { await page.locator("#rsvp-fullName").fill("Test Guest"); await page.locator("#rsvp-contact").fill("guest@example.test"); }

test("refresh covers the restored section before JavaScript loads", async ({ page }) => {
  test.setTimeout(60_000);
  await enter(page);
  await page.locator("#rsvp").scrollIntoViewIfNeeded();
  await page.evaluate(() => history.replaceState(history.state, "", "#rsvp"));
  let releaseScripts!: () => void;
  const scriptsReleased = new Promise<void>(resolve => { releaseScripts = resolve; });
  await page.route(/\/_next\/static\/.*\.js(?:\?|$)/, async route => {
    await scriptsReleased;
    await route.continue();
  });
  try {
    await page.reload({ waitUntil: "commit" });
    const envelope = page.locator(".envelope-dialog");
    await expect(envelope).toBeVisible();
    await expect(envelope).toHaveCSS("position", "fixed");
    expect(await envelope.evaluate(element => element.matches(":modal"))).toBe(false);
    const covered = await page.evaluate(() => [[1, 1], [innerWidth / 2, innerHeight / 2], [innerWidth - 2, innerHeight - 2]]
      .every(([x, y]) => !!document.elementFromPoint(x, y)?.closest(".envelope-dialog")));
    expect(covered).toBe(true);
    // Avoid injecting caret styles into server HTML before React hydrates.
    await page.screenshot({ path: "test-results/envelope-before-javascript.png", caret: "initial" });
  } finally { releaseScripts(); }
  await expect.poll(() => page.locator(".envelope-dialog").evaluate(element => element.matches(":modal"))).toBe(true);
  await page.getByRole("button", { name: "Skip introduction" }).click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});

test("envelope runs all phases, returns on refresh and always returns replays to the hero",async({page})=>{
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
  await page.reload(); await expect(modal).toBeVisible();await page.getByRole("button",{name:"Skip introduction"}).click();
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

test('hero uses couple.jpeg with a confirmed Kigali countdown and subtle hearts',async({page})=>{
  await page.setViewportSize({width:1440,height:1000});await enter(page);
  const hero=page.locator('#home');const background=hero.locator('picture img');
  const bounds=(await hero.boundingBox())!;const photo=(await hero.locator('picture').boundingBox())!;
  expect(photo.width).toBeLessThanOrEqual(bounds.width);expect(photo.height).toBeLessThan(bounds.height);expect(bounds.height).toBeGreaterThanOrEqual(1000);
  await expect(hero.getByRole('timer')).toBeVisible();await expect(page.getByRole('timer')).toHaveCount(1);await expect(hero.getByText('3:00 PM · Kigali time')).toBeVisible();
  await expect(background).toHaveAttribute('src',/couple.jpeg/);
  await expect(page.locator('[data-hearts="page"]')).toHaveCSS('pointer-events','none');expect(await page.locator('[data-hearts="page"] > span').count()).toBeLessThanOrEqual(12);
  await expect(page.getByRole('button',{name:'Play wedding music'})).toBeVisible();
});

test('the opening click requests music within the browser user gesture, once',async({page})=>{
  await page.addInitScript(()=>{(window as unknown as {musicGesture:boolean[]}).musicGesture=[];window.addEventListener('sd:request-wedding-music',()=>{(window as unknown as {musicGesture:boolean[]}).musicGesture.push(navigator.userActivation.isActive);});});
  await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/');await page.getByRole('button',{name:'Open your invitation',exact:true}).click();expect(await page.evaluate(()=>(window as unknown as {musicGesture:boolean[]}).musicGesture)).toEqual([true]);
});

test('wedding itinerary matches the confirmed programme and refresh at RSVP reopens the envelope', async({page})=>{
  await enter(page);
  const itinerary=page.locator('#itinerary');
  await expect(itinerary.getByRole('heading',{name:'The Itinerary'})).toBeVisible();
  await expect(itinerary.locator('li')).toHaveCount(2);
  await expect(itinerary.locator('li').first()).toContainText('3:00 PM');
  await expect(itinerary.locator('li').first()).toContainText('Wedding Ceremony');
  await expect(itinerary.locator('li').first()).toContainText('Kigali City Hall');
  await expect(itinerary.locator('li').last()).toContainText('4:30 PM');
  await expect(itinerary.locator('li').last()).toContainText('Kigali Serena Hotel');
  await expect(page.locator('body')).not.toContainText(/Gusaba/i);
  await expect(page).toHaveTitle(/Wedding Invitation/);
  await expect(page.locator('main')).not.toContainText(/civil|4:00 PM/i);
  await page.locator('#rsvp').scrollIntoViewIfNeeded();
  await page.evaluate(()=>history.replaceState(history.state,'','#rsvp'));
  await page.reload();
  await expect(page.locator('.envelope-dialog')).toBeVisible();
  await expect(page.getByRole('button',{name:'Open your invitation',exact:true})).toBeInViewport();
  await page.getByRole('button',{name:'Skip introduction'}).click();
  await expect.poll(()=>page.evaluate(()=>window.scrollY)).toBe(0);
});

test('experience cards allow multiple interests, keyboard selection and an accurate submitted reply', async ({ page }) => {
  let submitted: Record<string, unknown> | undefined;
  await page.route('**/api/rsvp', async route => {
    submitted = route.request().postDataJSON();
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(preparedReply(route))});
  });
  await enter(page); await guest(page);
  await page.getByRole('radio', { name: 'Joyfully accepts' }).check();
  await page.getByRole('radio', { name: 'No, I have my own arrangements' }).check();
  const cards = page.locator('.rsvp-experience-card');
  await expect(cards).toHaveCount(4);
  await cards.first().click();
  const forest = page.getByRole('checkbox', { name: 'Nyungwe canopy walk' });
  await forest.focus(); await page.keyboard.press('Space');
  await expect(forest).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Lake Kivu escape' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Akagera safari' })).not.toBeChecked();
  expect(await page.locator('#rsvp-experiences').evaluate(el => !!(el.compareDocumentPosition(document.getElementById('rsvp-guestMessage')!) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(decodeURIComponent((await page.getByRole('link', { name: /RSVP via WhatsApp/ }).getAttribute('href'))!)).toContain('Lake Kivu escape, Nyungwe canopy walk');
  await page.getByRole('button', { name: 'Send My RSVP' }).click();
  await expect(page.locator('#rsvp').getByRole('status')).toContainText('Your reply has been submitted');
  expect(submitted?.experiences).toEqual(['lake_kivu', 'nyungwe_canopy']);
  await page.getByText('View your submitted reply').click();
  await expect(page.locator('.rsvp-review')).toContainText('Lake Kivu escape, Nyungwe canopy walk');
});

for(const choice of ['yes','no','declined']) {
  test(`continuous RSVP reveals only applicable fields for ${choice}`,async({page})=>{
    let submitted:Record<string,unknown>|undefined;
    await page.unroute('**/api/rsvp');await page.route('**/api/rsvp',async route=>{submitted=route.request().postDataJSON();await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(preparedReply(route))});});
    await enter(page);await guest(page);await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);
    await page.getByRole('radio',{name:choice==='declined'?'Regretfully declines':'Joyfully accepts'}).check();
    if(choice==='declined') await expect(page.getByRole('group',{name:'Will you need accommodation?'})).toHaveCount(0);
    else {
      await expect(page.getByRole('group',{name:/Will you need accommodation/})).toBeVisible();
      await page.getByRole('radio',{name:choice==='yes'?'Yes':'No, I have my own arrangements',exact:true}).check();
      if(choice==='yes') {
        await page.locator('#rsvp-budgetCurrency').selectOption('RWF');await page.locator('#rsvp-budgetAmount').fill('35000');await page.locator('#rsvp-nights').fill('3');await page.getByRole('radio',{name:'Bed and breakfast',exact:true}).check();await page.getByRole('radio',{name:'Hotel',exact:true}).check();await page.getByRole('radio',{name:'I prefer a private room',exact:true}).check();await page.locator('#rsvp-roomOccupants').fill('2');
      } else await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);
    }
    await page.locator('#rsvp-guestMessage').fill('With love from this test fixture.');await expect(page.getByRole('button',{name:'Continue',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:/RSVP via WhatsApp/})).toHaveAttribute('href',/^https:\/\/wa\.me\/250788408241\?text=/);await expect(page.getByText(/RSVP preview|once the hosts add their contact number/)).toHaveCount(0);
    await page.getByRole('button',{name:'Send My RSVP'}).click();await expect(page.getByRole('status')).toContainText('Your reply has been submitted');await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');
    expect(submitted?.accommodationStatus).toBe(choice==='declined'?'not_applicable':choice);expect(submitted?.budgetAmount).toBe(choice==='yes'?35000:null);
  });
}

test('RSVP preserves conditional values and retains one reference after an activation failure',async({page,context})=>{
  let requests=0;const keys:string[]=[];
  await page.route('**/api/rsvp',async route=>{keys.push(route.request().headers()['idempotency-key']);await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(preparedReply(route))});});
  await context.route('https://formsubmit.co/ajax/**',async route=>{if(route.request().method()!=='OPTIONS')requests++;await route.fulfill({status:200,headers:corsHeaders,contentType:'application/json',body:JSON.stringify(requests===1?{success:'false',message:'This form needs Activation. Private provider details'}:{success:'true'})});});
  await enter(page);await guest(page);await page.getByRole('radio',{name:'Joyfully accepts'}).check();await page.getByRole('radio',{name:'Yes',exact:true}).check();await page.locator('#rsvp-budgetAmount').fill('120');await page.getByRole('radio',{name:"No, I have my own arrangements",exact:true}).check();await expect(page.locator('#rsvp-budgetAmount')).toHaveCount(0);await page.getByRole('radio',{name:'Yes',exact:true}).check();await expect(page.locator('#rsvp-budgetAmount')).toHaveValue('120');await page.getByRole('radio',{name:'No, I have my own arrangements',exact:true}).check();
  await page.getByRole('button',{name:'Send My RSVP'}).click();await expect(page.locator('#rsvp').getByRole('alert')).toContainText('awaiting confirmation from the hosts');await expect(page.getByRole('link',{name:/RSVP via WhatsApp/})).toHaveAttribute('href',/^https:\/\/wa\.me\/250788408241\?text=/);await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');await page.getByRole('button',{name:'Try Again'}).click();await expect(page.getByRole('status')).toContainText('Your reply has been submitted');await expect(page.locator('#rsvp-fullName')).toBeDisabled();expect(keys).toHaveLength(2);expect(keys[0]).toBe(keys[1]);
});

test('rejected RSVPs can continue through a verified browser POST without losing details', async ({ page, context }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  let apiRequests = 0;
  let reference = '';
  await page.route('**/api/rsvp', async route => {
    apiRequests++;
    reference = route.request().headers()['idempotency-key'];
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(preparedReply(route)) });
  });
  // Intercept the external POST too: this test never sends a real email.
  await context.route('https://formsubmit.co/**', route => route.request().url().includes('/ajax/')
    ? route.fulfill({ status: route.request().method() === 'OPTIONS' ? 200 : 403, headers: corsHeaders, body: 'Forbidden' })
    : route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<p>Verification fixture — no email sent</p>' }));
  await enter(page); await guest(page);
  await page.getByRole('radio', { name: 'Regretfully declines' }).check();
  await page.locator('#rsvp-guestMessage').fill('Love & joy <script>never executable</script>');
  await page.getByRole('button', { name: 'Send My RSVP' }).click();
  await expect(page.locator('#rsvp').getByRole('alert')).toContainText('FORM-403-provider_rejected');
  await expect(page.getByText('Your reply has been submitted', { exact: true })).toHaveCount(0);
  await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');
  const handoff = page.getByRole('form', { name: 'RSVP with verification' });
  await expect(handoff).toHaveAttribute('method', 'post');
  await expect(handoff.locator('[name="_captcha"]')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const outgoing = context.waitForEvent('request', request => request.url().startsWith('https://formsubmit.co/') && !request.url().includes('/ajax/'));
  const newTab = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Continue with verification' }).click();
  const request = await outgoing;
  expect(request.method()).toBe('POST');
  expect(request.headers().referer).toBe('http://127.0.0.1:3000/');
  const fields = new URLSearchParams(request.postData()!);
  expect(fields.get('Reference')).toBe(reference);
  expect(fields.get('Guest')).toBe('Test Guest');
  expect(fields.get('Message for the couple')).toBe('Love & joy <script>never executable</script>');
  expect(fields.has('_captcha')).toBe(false);
  expect(apiRequests).toBe(1);
  const popup = await newTab;
  await expect(popup.getByText('Verification fixture — no email sent')).toBeVisible();
  expect(await popup.evaluate(() => window.opener)).toBeNull();
  await popup.close();
  await expect(page.getByText('Your reply has been submitted', { exact: true })).toHaveCount(0);
  await page.locator('#rsvp-fullName').fill('Changed Guest');
  await expect(handoff).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Continue with verification' })).toHaveCount(0);
});

test('untrusted or mismatched preparation never sends data to the provider', async ({ page, context }) => {
  let providerRequests = 0;
  await context.route('https://formsubmit.co/**', route => { providerRequests++; return route.abort(); });
  for (const invalid of ['destination', 'reference']) {
    await page.route('**/api/rsvp', route => {
      const response = preparedReply(route);
      if (invalid === 'destination') response.delivery.action = 'https://untrusted.example/collect';
      else response.reference = 'f9918d32-7358-4cd8-97df-9154e3c79868';
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
    });
    await enter(page); await guest(page);
    await page.getByRole('radio', { name: 'Regretfully declines' }).check();
    await page.getByRole('button', { name: 'Send My RSVP' }).click();
    await expect(page.locator('#rsvp').getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Continue with verification' })).toHaveCount(0);
    await expect(page.locator('#rsvp-fullName')).toHaveValue('Test Guest');
  }
  expect(providerRequests).toBe(0);
});

test('editorial gallery supports arrows, swipe, focus trapping and Escape restoration; calendar includes both wedding events',async({page})=>{
  await enter(page);const trigger=page.locator('#moments button').first();await trigger.click();const modal=page.getByRole('dialog');await expect(modal).toBeVisible();
  const original=await modal.locator('img').getAttribute('src');await page.keyboard.press('ArrowRight');await expect(modal.locator('img')).not.toHaveAttribute('src',original!);await modal.getByRole('button',{name:'Next photograph'}).click();
  const beforeSwipe=await modal.locator('img').getAttribute('src');await modal.locator('img').evaluate(element=>{const target=element.parentElement!;const touch=(x:number)=>new Touch({identifier:1,target,clientX:x,clientY:100});target.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,changedTouches:[touch(220)]}));target.dispatchEvent(new TouchEvent('touchend',{bubbles:true,changedTouches:[touch(50)]}));});await expect(modal.locator('img')).not.toHaveAttribute('src',beforeSwipe!);
  await modal.getByRole('button',{name:'Close photograph'}).focus();await page.keyboard.press('Shift+Tab');await expect(modal.getByRole('button',{name:'Next photograph'})).toBeFocused();await page.keyboard.press('Escape');await expect(trigger).toBeFocused();
  const download=page.waitForEvent('download');await page.getByRole('button',{name:/add to calendar/i}).click();const file=await download;expect(file.suggestedFilename()).toMatch(/\.ics$/);const calendar=await readFile((await file.path())!,'utf8');expect(calendar).toContain('DTSTART:20261217T130000Z');expect(calendar).toContain('DTSTART:20261217T143000Z');expect(calendar.match(/BEGIN:VEVENT/g)).toHaveLength(2);
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
    await expect(page.getByRole('checkbox', {name:'Lake Kivu escape'})).toBeVisible();
    await page.getByRole('checkbox', {name:'Lake Kivu escape'}).check();
    await page.getByRole('checkbox', {name:'Nyungwe canopy walk'}).check();
    await page.locator('#rsvp-experiences').scrollIntoViewIfNeeded();
    await expect.poll(() => page.locator('.rsvp-experience-photo img').evaluateAll(images => images.every(image => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0))).toBe(true);
    await page.screenshot({path:`test-results/experiences-${viewport.width}.png`});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    expect(await page.locator('label[for="rsvp-fullName"]').evaluate(el=>parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(16);
    if(viewport.width<701) expect(await page.locator('#home picture img').evaluate((el:HTMLImageElement)=>el.currentSrc)).toContain('couple.jpeg');
  });
}

test('the emerged paper fits all supported viewports and remains opaque inside the pocket',async({page})=>{
  test.setTimeout(90000);await page.addInitScript(()=>sessionStorage.removeItem('sd-invitation-opened'));
  for(const viewport of viewports) {await page.setViewportSize(viewport);await page.goto('/');await page.getByRole('button',{name:'Open your invitation',exact:true}).click();await expect.poll(()=>page.locator('.envelope-dialog').getAttribute('data-state'),{intervals:[50]}).toBe('card-visible');const paper=(await page.locator('.envelope-card').boundingBox())!;expect(paper.y).toBeGreaterThanOrEqual(10);expect(paper.y+paper.height).toBeLessThanOrEqual(viewport.height-10);await expect(page.locator('.envelope-card')).toHaveCSS('opacity','1');await page.screenshot({path:`test-results/revealed-${viewport.width}.png`});await page.keyboard.press('Escape');}
});
