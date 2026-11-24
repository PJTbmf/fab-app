/* Fab App test suite.
   Run from the repository folder:  node tests/run.cjs
   Needs Playwright (npm i -D playwright) and Chrome or Chromium.
   Serves the folder on a local port, then checks:
   1. Every built-in lesson pack is valid; the validator rejects bad packs.
   2. Every flightpath step makes correct questions (answers re-worked
      independently), sensible choices and hints with no gaps, many times over.
   3. The hint, worked-step and answer-shown flow, and climbing up and down.
   4. The child and teacher screens by clicking, tapping and typing.
   5. Per-child links keep progress, and old saved progress is ignored.
   6. The Christmas Carol lesson still works.
   7. The classroom demo: a child's step shows on the teacher's grid live.
   No console errors are allowed anywhere. */
const http = require('http');
const fs = require('fs');
const path = require('path');
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Playwright not found. Install it with: npm i -D playwright'); process.exit(2);
}

const ROOT = path.resolve(__dirname, '..');
const TYPES = { '.css':'text/css', '.pdf':'application/pdf', '.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.json':'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if(!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

let passed = 0, failed = 0;
const results = [];
async function test(name, fn){
  try { await fn(); passed++; results.push(`  ✓ ${name}`); }
  catch (e) { failed++; results.push(`  ✗ ${name}\n      ${String(e && e.message || e).split('\n').join('\n      ')}`); }
}
function assert(c, msg){ if(!c) throw new Error(msg || 'assertion failed'); }

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const launchOpts = { headless: true };
  if(process.env.CHROME_PATH) launchOpts.executablePath = process.env.CHROME_PATH;
  else if(fs.existsSync('/usr/bin/google-chrome')) launchOpts.executablePath = '/usr/bin/google-chrome';
  const browser = await chromium.launch(launchOpts);
  const errors = [];
  async function newPage(url, ctx){
    const page = await (ctx || browser).newPage();
    page.on('pageerror', e => errors.push(`${url}: ${e.message}`));
    page.on('console', m => { if(m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(`${url}: console: ${m.text()}`); });
    page.on('response', r => { if(r.status() >= 400 && !/\/favicon\.ico$/.test(r.url())) errors.push(`${url}: missing ${r.url()} (${r.status()})`); });
    await page.goto(base + url);
    await page.waitForFunction(() => typeof BUILT_IN_PACKS !== 'undefined' && typeof pwQuestion === 'function');
    return page;
  }

  const page = await newPage('/index.html');

  /* ---------- 1. Packs and validator ---------- */
  await test('every built-in pack is valid', async () => {
    const bad = await page.evaluate(() => BUILT_IN_PACKS.map(p => [p.id, validatePack(p)]).filter(x => x[1].length));
    assert(!bad.length, JSON.stringify(bad));
  });
  await test('every question kind the engine makes is allowed by the validator', async () => {
    const r = await page.evaluate(() => [Object.keys(PW_GEN).sort().join(), PATHWAY_KINDS.slice().sort().join()]);
    assert(r[0] === r[1], `engine ${r[0]} vs validator ${r[1]}`);
  });
  await test('the multiplication and division flightpath has 23 tagged steps', async () => {
    const r = await page.evaluate(() => {
      const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division');
      const s = p.screens.find(x => x.type === 'pathway');
      return { rev: p.rev, n: s.steps.length, attribution: s.attribution, steps: s.steps.map(t => ({ name:t.name, year:t.year, nc:t.nc, oak:t.oak, hints:t.hints })) };
    });
    assert(r.rev >= 3, 'rev should be 3 or more (I do / we do steps)');
    assert(r.n === 23, `expected 23 steps, got ${r.n}`);
    assert(/Open Government Licence v3\.0/.test(r.attribution), 'OGL attribution missing');
    r.steps.forEach((t, i) => {
      assert(t.year && /^Y\d/.test(t.year), `step ${i + 1} has no year tag`);
      assert(t.nc && t.nc.objective && t.nc.year >= 1 && t.nc.year <= 6, `step ${i + 1} has no NC objective`);
      assert(t.oak && t.oak.unit && t.oak.lessons.length >= 1, `step ${i + 1} has no Oak unit/lessons`);
      t.oak.lessons.forEach(l => assert(/^[a-z0-9-]+$/.test(l.slug) && l.title, `step ${i + 1} bad lesson ${JSON.stringify(l)}`));
      const oakHints = Object.values(t.hints).filter(h => h.oak);
      assert(oakHints.length >= 1 || i === 20, `step ${i + 1} has no Oak misconception hint`);
      oakHints.forEach(h => assert(h.oak.misconception && h.oak.response, `step ${i + 1} Oak hint missing text`));
    });
    const years = r.steps.map(t => t.oak.year);
    assert(years.every((y, i) => i === 0 || y >= years[i - 1]), 'steps are not in Oak year order: ' + years.join(','));
  });
  await test('the validator rejects broken flightpaths and accepts old ones', async () => {
    const r = await page.evaluate(() => {
      const mk = steps => ({ format:'bmf-lesson-pack', version:1, id:'t', title:'T', subject:'Maths', years:'Year 4', objective:'O', childAim:'A', screens:[{ type:'pathway', title:'P', steps }] });
      const ok = { name:'A', kind:'facts', params:{ tables:[2] } };
      const old = [{ name:'Which way round?', year:'Y1', kind:'orient', params:{ digits:[6, 9] } },
        { name:'Count on in 6s', kind:'countOn', params:{ by:[6] } }, { name:'6s', kind:'facts', params:{ tables:[6] } },
        { name:'3-digit', kind:'mulWritten', params:{ by:[6, 7] } }, { name:'Short division', kind:'shortDiv', params:{ by:[6, 7], maxQuotient:99 } }];
      return {
        old: validatePack(mk(old)).length,
        tooMany: validatePack(mk(Array(31).fill(ok))).length,
        unknown: validatePack(mk([ok, { name:'B', kind:'teleport' }])).length,
        badHint: validatePack(mk([ok, { name:'B', kind:'facts', hints:{ any:{ label:'x' } } }])).length,
        badParams: validatePack(mk([ok, { name:'B', kind:'facts', params:[1] }])).length,
        thirty: validatePack(mk(Array(30).fill(ok))).length,
      };
    });
    assert(r.old === 0, 'old-style pack should still be valid');
    assert(r.thirty === 0, '30 steps should be allowed');
    assert(r.tooMany > 0 && r.unknown > 0 && r.badHint > 0 && r.badParams > 0, JSON.stringify(r));
  });

  /* ---------- 2. Question generation, many times per step ---------- */
  const genReport = await page.evaluate(() => {
    const out = [];
    const pack = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division');
    const steps = pack.screens.find(x => x.type === 'pathway').steps.concat([
      { name:'old orient', kind:'orient', params:{ digits:[6, 9] } },
      { name:'old countOn', kind:'countOn', params:{ by:[6] } },
      { name:'old mulWritten 2-digit', kind:'mulWritten', params:{ digits:2, by:[6, 7] } },
      { name:'old shortDiv', kind:'shortDiv', params:{ by:[6, 7], maxQuotient:99 } },
    ]);
    const evalExpr = s => Function(`return (${s.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-').replace(/,/g, '')})`)();
    const isPrime = x => { if(x < 2) return false; for(let i = 2; i * i <= x; i++) if(x % i === 0) return false; return true; };
    const bad = (step, q, why) => { if(out.length < 40) out.push(`${step.name}: ${why} :: ${JSON.stringify(q)}`); };
    const gap = t => /\{\w+\}|undefined|NaN|null/.test(t);
    steps.forEach(step => {
      for(let i = 0; i < 400; i++){
        const q = pwQuestion(step);
        if(!q){ bad(step, q, 'no question'); continue; }
        /* independent answer */
        let expect;
        switch(step.kind){
          case 'orient': expect = '1'; break;
          case 'countOn': { const s = q.vis.seq; expect = String(s[2] + (s[1] - s[0])); if(s[1] - s[0] !== s[2] - s[1]) bad(step, q, 'uneven sequence'); break; }
          case 'groups': expect = String(q.vis.groups * q.vis.size); break;
          case 'remainder': { const [d, n] = q.say.split(' ÷ ').map(Number); expect = `${Math.floor(d / n)} r ${d % n}`; if(d % n === 0) bad(step, q, 'no remainder'); break; }
          case 'factorPair': {
            if(q.mode === 'num'){ const m = q.ask.match(/^(\d+) × \? = (\d+)$/); expect = String(Number(m[2]) / Number(m[1])); }
            else { const x = Number(q.ask.match(/factor of (\d+)/)[1]); const fs = q.choices.filter(c => x % Number(c) === 0 && Number(c) !== x); if(fs.length !== 1) bad(step, q, 'not exactly one factor among choices'); expect = fs[0]; }
            break;
          }
          case 'prime': { const x = Number(q.ask.match(/Is (\d+)/)[1]); expect = isPrime(x) ? 'Yes' : 'No'; break; }
          default: expect = String(evalExpr(q.say));
        }
        if(String(q.ans) !== String(expect)) bad(step, q, `answer ${q.ans} but expected ${expect}`);
        if(q.mode === 'num' && !/^\d+$/.test(q.ans)) bad(step, q, 'answer is not a whole number');
        /* choices */
        if(q.mode !== 'orient'){
          const ch = q.choices || [];
          const want = step.kind === 'prime' ? 2 : 3;
          if(ch.length !== want) bad(step, q, `${ch.length} choices`);
          if(ch.filter(c => pwNorm(c) === pwNorm(q.ans)).length !== 1) bad(step, q, 'answer not exactly once in choices');
          if(new Set(ch.map(pwNorm)).size !== ch.length) bad(step, q, 'duplicate choices');
          if(ch.some(c => gap(String(c)) || /^-/.test(String(c)))) bad(step, q, 'bad choice');
        }
        (q.wrong || []).forEach(w => { if(pwNorm(w.v) === pwNorm(q.ans)) bad(step, q, 'a slip equals the answer'); });
        if(q.ask && gap(q.ask)) bad(step, q, 'gap in question');
        /* hints for every slip, plus the generic hint, worked step and reveal */
        const tags = [null, ...(q.wrong || []).map(w => w.tag)];
        tags.forEach(tag => { const h = pwFindHint(step, q, tag); if(!h.text || gap(h.text)) bad(step, q, `hint for ${tag}: ${h.text}`); });
        const wk = PW_WORKED[q.kind] ? PW_WORKED[q.kind](q) : 'x';
        if(!wk || gap(wk)) bad(step, q, `worked step: ${wk}`);
        if(gap(pwReveal(q))) bad(step, q, `reveal: ${pwReveal(q)}`);
        /* sizes that suit the step */
        if(step.kind === 'remainder'){ const [, r] = q.ans.split(' r ').map(Number); const n = q.vars.n; if(r < 1 || r >= n) bad(step, q, 'remainder out of range'); }
        if(step.kind === 'shortDiv' && step.params.maxDividend && q.vars.d > step.params.maxDividend) bad(step, q, 'dividend too big');
        if(step.kind === 'longDiv' && q.vars.d > 9999) bad(step, q, 'dividend over 4 digits');
        if(step.kind === 'partition' && q.vars.a % 10 === 0) bad(step, q, 'multiple of 10');
        if(q.mode !== 'orient' && JSON.stringify(q) !== JSON.stringify(JSON.parse(JSON.stringify(q)))) bad(step, q, 'not plain data');
      }
    });
    /* a slip in a specific misconception gets that misconception's hint */
    const rem = steps.find(s => s.kind === 'remainder');
    let q; do { q = pwQuestion(rem); } while(!q.wrong.some(w => w.tag === 'tooHigh'));
    const h = pwFindHint(rem, q, 'tooHigh');
    if(!/is more than/.test(h.text) || h.label !== 'Chose a multiple bigger than the number') out.push('remainder tooHigh hint not chosen: ' + h.text);
    const six = steps.find(s => s.name === '3 and 6 times tables');
    let q6; do { q6 = pwQuestion(six); } while(q6.vars.n !== 6);
    if(!/Double it for × 6/.test(pwFindHint(six, q6, 'neighbour').text)) out.push('table-specific hint (neighbour@6) not used');
    return out;
  });
  await test('every flightpath step makes correct questions, choices and hints (400 each)', async () => {
    assert(!genReport.length, genReport.join('\n'));
  });

  /* ---------- 3. Hint flow and climbing ---------- */
  await test('right answers offer the next step; slips get hint, worked step, then answer', async () => {
    const r = await page.evaluate(() => {
      const pack = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division');
      const s = pack.screens.find(x => x.type === 'pathway');
      const st = {}; const id = 'tester'; const i = s.steps.findIndex(t => t.kind === 'remainder');
      pwStart(s, st, id, i);
      const kid = st.kids[id], log = [];
      log.push(kid.tap === true);
      for(let k = 0; k < 3; k++) pwCheck(s, kid, kid.q.ans);
      log.push(kid.offer, kid.secured.includes(i), kid.streak);
      kid.offer = false;
      let q; do { kid.q = pwQuestion(s.steps[i]); q = kid.q; } while(!q.wrong.some(w => w.tag === 'tooHigh'));
      const slip = q.wrong.find(w => w.tag === 'tooHigh').v;
      log.push(pwCheck(s, kid, slip), /is more than/.test(kid.msg), kid.hintLabel, kid.streak);
      log.push(pwCheck(s, kid, '0 r 0'), kid.hintLabel);
      const before = kid.q.say;
      log.push(pwCheck(s, kid, '0 r 0'), kid.msg.startsWith(before), kid.tries, kid.q !== q);
      return log;
    });
    const [tapDefault, offer, secured, streak, r1, specific, label1, streak0, r2, label2, r3, revealOk, tries, fresh] = r;
    assert(tapDefault, 'tap an answer should be on by default');
    assert(offer && secured && streak === 3, 'three right should offer the next step and secure it');
    assert(r1 === 'try' && specific && label1 === 'Chose a multiple bigger than the number' && streak0 === 0, `first slip: ${r}`);
    assert(r2 === 'try' && label2 === 'Worked first step shown', `second slip: ${r}`);
    assert(r3 === 'reveal' && revealOk && tries === 0 && fresh, `third slip: ${r}`);
  });

  /* ---------- 4. Child and teacher screens ---------- */
  await test('child picks a step, taps the answer, types an answer, uses r, climbs down', async () => {
    await page.evaluate(() => {
      const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division');
      learnOpen(p); learnGo(1);
    });
    assert(await page.locator('.pw-stage-head').count() === 6, 'six stages expected');
    /* open "All the tables" and choose Remainders (step 14) */
    await page.locator('.pw-stage-head', { hasText: 'All the tables' }).click();
    await page.locator('[data-pwpick="13"]').click();
    assert(await page.locator('.pw-stephead').innerText().then(t => /Remainders/.test(t)), 'did not start on Remainders');
    assert(await page.evaluate(() => Learn.state[1].kids.local.phase) === 'ido', 'a new step starts with I do');
    await page.locator('[data-pwact="practise"]').first().click();
    const ans = await page.evaluate(() => Learn.state[1].kids.local.q.ans);
    await page.locator('.pw-choice', { hasText: new RegExp('^' + ans.replace(/ /g, '\\s*') + '$') }).click();
    assert(await page.locator('.pw-fb.good').count() === 1, 'tapping the answer should be praised');
    await page.locator('[data-pwact="mode"]').click();
    assert(await page.locator('.pw-keys.rem [data-pwkey="r"]').count() === 1, 'remainder keypad needs an r key');
    const ans2 = await page.evaluate(() => Learn.state[1].kids.local.q.ans);
    const [qq, rr] = ans2.split(' r ');
    for(const ch of qq) await page.locator(`[data-pwkey="${ch}"]`).click();
    await page.locator('[data-pwkey="r"]').click();
    for(const ch of rr) await page.locator(`[data-pwkey="${ch}"]`).click();
    await page.locator('[data-pwkey="✓"]').click();
    assert(await page.locator('.pw-fb.good').count() === 1, 'typed remainder answer should be right');
    /* keyboard typing */
    const ans3 = await page.evaluate(() => Learn.state[1].kids.local.q.ans);
    await page.keyboard.type(ans3.replace(/ /g, ''));
    await page.keyboard.press('Enter');
    assert(await page.evaluate(() => Learn.state[1].kids.local.offer), 'three in a row should offer the next step');
    await page.locator('[data-pwact="stay"]').click();
    await page.locator('[data-pwact="down"]').click();
    assert(await page.locator('.pw-stephead').innerText().then(t => /All facts to 12/.test(t)), 'easier step should go back one');
    if(await page.locator('[data-pwact="practise"]').count()) await page.locator('[data-pwact="practise"]').first().click();
    assert(await page.locator('.pw-keys').count() === 1, 'typing choice should be remembered across steps');
    await page.locator('[data-pwact="mode"]').click();
    /* a wrong tap gives a gentle hint, never "wrong" */
    const wrongChoice = await page.evaluate(() => { const q = Learn.state[1].kids.local.q; return q.choices.findIndex(c => pwNorm(c) !== pwNorm(q.ans)); });
    await page.locator(`[data-pwchoice="${wrongChoice}"]`).click();
    const fb = await page.locator('.pw-fb.try').innerText();
    assert(/^Good try!/.test(fb) && !/wrong|incorrect/i.test(fb), 'gentle hint expected: ' + fb);
    assert(!/[0-9]+ ?%|score/i.test(await page.locator('.pw-child').innerText()), 'no scores on the child screen');
  });
  await test('teacher view shows the grid with hint, and the step guide with Oak links', async () => {
    await page.locator('[data-pwact="view-teacher"]').click();
    assert(await page.locator('.pw-card').count() === 1, 'one child card');
    assert(await page.locator('.pw-card-hint').count() === 1, 'last hint shown to teacher');
    await page.locator('[data-pwact="guide"]').click();
    assert(await page.locator('.pw-guide tbody tr').count() === 23, '23 guide rows');
    const links = await page.locator('.pw-guide a[href^="https://www.thenational.academy/teachers/"]').count();
    assert(links >= 23 + 40, `expected many Oak links, got ${links}`);
    assert(/Open Government Licence/.test(await page.locator('.pw-attrib').innerText()), 'attribution in guide');
    await page.locator('[data-pwact="grid"]').click();
    await page.locator('.pw-card-btns button', { hasText: 'Harder' }).click();
    assert(await page.locator('.pw-card-step').innerText().then(t => /Step 14: Remainders/.test(t)), 'teacher can move a child up a step');
    await page.locator('.pw-card-btns button', { hasText: 'Easier' }).click();
    assert(await page.locator('.pw-card-step').innerText().then(t => /Step 13: All facts/.test(t)), 'teacher can move a child down a step');
    await page.locator('[data-pwact="view-child"]').click();
  });

  /* ---------- 5. Per-child links ---------- */
  await test('per-child links keep progress, and progress from the old flightpath is ignored', async () => {
    const ctx = await browser.newContext();
    const url = '/index.html?lesson=maths-flightpath-multiplication-division&learner=otter-482';
    const p1 = await newPage(url, ctx);
    await p1.evaluate(() => { learnGo(1); });
    await p1.evaluate(() => { const s = Learn.pack.screens[1]; pwStart(s, Learn.state[1] = Learn.state[1] || {}, pwMe(), 5); learnRender(); });
    await p1.close();
    const p2 = await newPage(url, ctx);
    const step = await p2.evaluate(() => Learn.step === 1 && Learn.state[1].kids['learner:otter-482'].step);
    assert(step === 5, 'progress not restored: ' + step);
    await p2.evaluate(() => store.setJSON('bmf_progress_maths-flightpath-multiplication-division_otter-482', { step:1, state:{ 1:{ kids:{ 'learner:otter-482':{ step:4 } } } }, saved:1 }));
    await p2.close();
    const p3 = await newPage(url, ctx);
    const after = await p3.evaluate(() => (Learn.state[1] && Learn.state[1].kids) ? 'restored' : 'fresh');
    assert(after === 'fresh', 'old (rev 1) progress should be ignored');
    await ctx.close();
  });

  /* ---------- 6. Every lesson pack opens ---------- */
  await test('every lesson pack opens and every screen renders', async () => {
    const n = await page.evaluate(() => {
      for(const p of BUILT_IN_PACKS){ learnOpen(p); for(let i = 0; i < p.screens.length; i++){ learnGo(i); if(!document.getElementById('lpStage').innerHTML.trim()) return -1; } }
      const p = BUILT_IN_PACKS[0];
      learnOpen(p);
      for(let i = 0; i <= p.screens.length; i++){ learnGo(i); if(!document.getElementById('lpStage').innerHTML.trim()) return -i; }
      return p.screens.length;
    });
    assert(n > 0, 'blank screen at ' + (-n));
  });

  /* ---------- 6b. The board in the centre of the lesson, on a laptop and an iPad ---------- */
  for(const dev of [{ name:'laptop', viewport:{ width:1366, height:900 } }, { name:'iPad', viewport:{ width:1180, height:820 }, hasTouch:true, isMobile:true }, { name:'small iPad', viewport:{ width:1024, height:768 }, hasTouch:true, isMobile:true }]){
    await test(`${dev.name}: board in the centre, slides, picture, modelling tools`, async () => {
      const ctx = await browser.newContext({ viewport:dev.viewport, hasTouch:!!dev.hasTouch, isMobile:!!dev.isMobile });
      const pg = await newPage('/index.html', ctx);
      const tap = async sel => { const l = pg.locator(sel).first(); try{ if(dev.hasTouch) await l.tap({ timeout:5000 }); else await l.click({ timeout:5000 }); }catch(e){ throw new Error('could not tap ' + sel + ': ' + String(e.message).split('\n').filter(x => /intercepts|not visible|outside/.test(x)).slice(0, 2).join(' ')); } };
      await pg.evaluate(() => { const p = BUILT_IN_PACKS.find(x => x.id === 'science-flightpath-y34'); learnOpen(p); learnGo(1); const s = p.screens[1]; Learn.state[1] = Learn.state[1] || {}; pwStart(s, Learn.state[1], pwMe(), 1); learnRender(); });
      await pg.waitForFunction(() => window.FabBoard && FabBoard.inlaid() && FabBoard.state().doc && FabBoard.page());
      const lay = await pg.evaluate(() => { const r = e => document.querySelector(e).getBoundingClientRect(); const m = r('.pw-main'), c = r('.pw-centre'), b = r('#screen-board');
        return { centreRight:c.left > m.left, boardFits:b.bottom <= innerHeight + 2 || c.height >= 480, pic:FabBoard.page().bg, visShown:!document.getElementById('bdVis').hidden && !!document.querySelector('#bdVis .fv'), wide:document.documentElement.scrollWidth <= innerWidth + 1, over:[...document.querySelectorAll('body *')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && e.getBoundingClientRect().width > 0).slice(0, 4).map(e => (e.id || e.className) + ':' + Math.round(e.getBoundingClientRect().right)).join(', ') + ' sw=' + document.documentElement.scrollWidth }; });
      assert(lay.centreRight, 'board should sit beside the teaching');
      assert(lay.pic === 'vis' && lay.visShown, 'a step with a picture opens on its picture: ' + JSON.stringify(lay));
      assert(lay.wide, 'nothing should spill off the side of the screen: ' + lay.over);
      /* Slides: one tap makes the whole deck */
      await tap('.bd-view:has-text("Slides")');
      const sl = await pg.evaluate(() => { const p = FabBoard.page(); return { slide:p.slide, of:p.slides, html:p.bg === 'html' && /fab-char bell/.test(p.html), shown:!!document.querySelector('#bdVis .bsl'), label:document.getElementById('bdPageN').textContent }; });
      assert(sl.slide === 1 && sl.of === 6 && sl.html && sl.shown && /Slide 1( of |\/)6/.test(sl.label), 'slides deck: ' + JSON.stringify(sl));
      await tap('#bdNext'); await tap('#bdNext'); await tap('#bdNext');
      const we = await pg.evaluate(() => (FabBoard.page().html.match(/fab-char (yellow|green)/g) || []).join());
      assert(we === 'fab-char yellow,fab-char green', 'We do slide shows Bramble and Moss: ' + we);
      /* modelling tools */
      await tap('.bd-view:has-text("Tools")');
      assert(await pg.locator('.bd-kit .bk-tile').count() >= 4, 'tools for science');
      await tap('.bd-kit [data-kit="venn"]');
      const t = await pg.evaluate(() => { const p = FabBoard.page(); return { tool:p.tool, locked:p.items.every(i => i.lock) && p.items.length > 0 }; });
      assert(t.tool === 'venn' && t.locked, 'Venn page added: ' + JSON.stringify(t));
      /* draw, rub out: the template stays */
      const box = await pg.locator('#bdCanvas').boundingBox();
      await pg.mouse.move(box.x + box.width * .3, box.y + box.height * .5); await pg.mouse.down(); await pg.mouse.move(box.x + box.width * .6, box.y + box.height * .55, { steps:6 }); await pg.mouse.up();
      const n1 = await pg.evaluate(() => FabBoard.page().items.length);
      await tap('[data-tool="rub"]');
      const box2 = await pg.locator('#bdCanvas').boundingBox();
      assert(Math.abs(box2.y - box.y) < 2 && Math.abs(box2.height - box.height) < 2, 'the page should not jump when the tool changes');
      await pg.mouse.move(box.x + box.width * .2, box.y + box.height * .5); await pg.mouse.down(); await pg.mouse.move(box.x + box.width * .7, box.y + box.height * .55, { steps:20 }); await pg.mouse.up();
      const after = await pg.evaluate(() => ({ n:FabBoard.page().items.length, locked:FabBoard.page().items.filter(i => i.lock).length }));
      assert(after.n === n1 - 1 && after.locked === n1 - 1, `rubber takes the child's line only: ${n1} -> ${JSON.stringify(after)} tool=${await pg.evaluate(() => FabBoard.state().tool)}`);
      /* big board and back */
      await tap('#bdBack');
      assert(await pg.evaluate(() => document.getElementById('screen-board').classList.contains('big')), 'big board');
      await tap('#bdBack');
      assert(await pg.evaluate(() => !document.getElementById('screen-board').classList.contains('big')), 'back to the lesson');
      await ctx.close();
    });
  }
  await test('50/50 lesson: teaching and board share the screen; My flightpath opens as a drawer', async () => {
    const ctx = await browser.newContext({ viewport:{ width:1505, height:812 } });
    const pg = await newPage('/index.html', ctx);
    await pg.evaluate(() => { const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(p); learnGo(1); const s = p.screens[1]; Learn.state[1] = {}; pwStart(s, Learn.state[1], pwMe(), 17); learnRender(); });
    await pg.waitForFunction(() => window.FabBoard && FabBoard.inlaid() && FabBoard.page());
    const r = await pg.evaluate(() => { const m = document.querySelector('.pw-main').getBoundingClientRect(), c = document.querySelector('.pw-centre').getBoundingClientRect(), side = document.querySelector('.pw-side');
      return { ratio:c.width / m.width, sideHidden:getComputedStyle(side).visibility === 'hidden', page:document.getElementById('bdCanvas').getBoundingClientRect().width }; });
    assert(r.ratio > .9 && r.ratio < 1.1 && r.sideHidden && r.page > 500, JSON.stringify(r));
    await pg.locator('[data-pwdrawer]').first().click({ timeout:5000 });
    await pg.waitForTimeout(400);
    assert(await pg.evaluate(() => getComputedStyle(document.querySelector('.pw-side')).visibility === 'visible'), 'drawer opens');
    await pg.locator('.pw-drawer-x').click();
    await pg.waitForTimeout(400);
    assert(await pg.evaluate(() => !document.body.classList.contains('pw-drawer-open') && document.documentElement.scrollWidth <= innerWidth + 1), 'the ✕ closes the drawer');
    await ctx.close();
  });
  await test('We do shows Bramble and Moss together', async () => {
    const r = await page.evaluate(() => { const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(p); learnGo(1); const s = p.screens[1]; Learn.state[1] = {}; pwStart(s, Learn.state[1], pwMe(), 0);
      const k = Learn.state[1].kids[pwMe()]; k.phase = 'wedo'; k.q = pwQuestion(s.steps[0]); learnRender();
      return { tag:document.querySelectorAll('.pw-phase-tag .fab-char.yellow, .pw-phase-tag .fab-char.green').length, bubble:document.querySelectorAll('.pw-wefoxes .fab-char').length, label:(document.querySelector('.pw-wefoxes') || {}).getAttribute && document.querySelector('.pw-wefoxes').getAttribute('aria-label') }; });
    assert(r.tag === 2 && r.bubble === 2 && /Bramble and Moss/.test(r.label), JSON.stringify(r));
  });

  /* ---------- 7. Classroom demo (live) ---------- */
  await test('classroom demo: a child chooses a step and the teacher sees it live', async () => {
    const demo = await browser.newPage();
    demo.on('pageerror', e => errors.push(`demo: ${e.message}`));
    await demo.goto(base + '/demo.html');
    const frames = () => demo.frames().filter(f => /pencil=demo/.test(f.url()));
    await demo.waitForFunction(() => document.querySelectorAll('iframe').length === 3);
    for(let i = 0; i < 50 && frames().length < 3; i++) await demo.waitForTimeout(100);
    const byId = id => frames().find(f => f.url().includes('as=' + id));
    const teacher = byId('teacher'), child = byId('child-1');
    for(const f of [teacher, child]) await f.waitForFunction(() => typeof Live !== 'undefined' && Live.on && Live.me);
    await teacher.evaluate(() => { learnOpen(BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division')); learnGo(1); });
    await child.waitForFunction(() => Learn.pack && Learn.step === 1, null, { timeout: 5000 });
    await child.locator('[data-pwpick="0"]').click();
    await teacher.waitForFunction(() => document.querySelectorAll('.pw-card:not(.waiting)').length >= 1, null, { timeout: 5000 });
    const card = await teacher.locator('.pw-card:not(.waiting) .pw-card-step').first().innerText();
    assert(/Count in 2s, 5s and 10s/.test(card), 'teacher grid shows: ' + card);
    await demo.close();
  });

  await test('📡 live board: the teacher shows their board, a child sees it update and cannot change it', async () => {
    const demo = await browser.newPage({ viewport:{ width:1600, height:1000 } });
    demo.on('pageerror', e => errors.push(`demo2: ${e.message}`));
    await demo.goto(base + '/demo.html');
    const frames = () => demo.frames().filter(f => /pencil=demo/.test(f.url()));
    await demo.waitForFunction(() => document.querySelectorAll('iframe').length === 3);
    for(let i = 0; i < 50 && frames().length < 3; i++) await demo.waitForTimeout(100);
    const byId = id => frames().find(f => f.url().includes('as=' + id));
    const teacher = byId('teacher'), child = byId('child-1');
    for(const f of [teacher, child]) await f.waitForFunction(() => typeof Live !== 'undefined' && Live.on && Live.me);
    await teacher.evaluate(() => { learnOpen(BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division')); learnGo(1); });
    await child.waitForFunction(() => Learn.pack && Learn.step === 1, null, { timeout:5000 });
    await child.evaluate(() => { const b = document.querySelector('[data-pwpick="0"]'); b.click(); });
    await child.waitForFunction(() => window.FabBoard && FabBoard.inlaid() && FabBoard.page(), null, { timeout:5000 });
    await teacher.evaluate(() => document.getElementById('lpBoard').click());
    await teacher.waitForFunction(() => window.FabBoard && FabBoard.page() && !document.getElementById('bdLive').hidden, null, { timeout:5000 });
    assert(await child.evaluate(() => document.getElementById('bdLive').hidden), 'children cannot share the board');
    await teacher.evaluate(() => document.getElementById('bdLive').click());
    await teacher.evaluate(() => { const B = FabBoard.state(); B.doc.pages[B.page].items.push({ t:'x', x:100, y:100, s:60, c:'#000', txt:'Hello class' }); FabBoard._paint(); FabBoard.go(B.page); });
    await child.waitForFunction(() => { const p = FabBoard.page(); return p && p.key === 'live' && p.items.some(i => i.txt === 'Hello class'); }, null, { timeout:5000 });
    const tabs = await child.evaluate(() => [...document.querySelectorAll('.bd-view')].map(b => b.textContent.trim()).join('|'));
    assert(/Teacher/.test(tabs), 'child gets a Teacher’s board tab: ' + tabs);
    await teacher.evaluate(() => { const B = FabBoard.state(); B.doc.pages[B.page].items.push({ t:'k', e:'⭐', x:300, y:300, s:80 }); FabBoard.go(B.page); });
    await child.waitForFunction(() => FabBoard.page().items.some(i => i.e === '⭐'), null, { timeout:5000 });
    const before = await child.evaluate(() => FabBoard.page().items.length);
    const box = await child.locator('#bdCanvas').boundingBox();
    await child.evaluate(() => { const b = document.querySelector('[data-tool="pen"]'); b.click(); });
    await demo.mouse.move(box.x + 40, box.y + 40); await demo.mouse.down(); await demo.mouse.move(box.x + 140, box.y + 90, { steps:5 }); await demo.mouse.up();
    assert(await child.evaluate(() => FabBoard.page().items.length) === before, 'a child cannot draw on the teacher’s board');
    /* My page is still the child's own */
    await child.evaluate(() => [...document.querySelectorAll('.bd-view')].find(b => /My page/.test(b.textContent)).click());
    assert(await child.evaluate(() => FabBoard.page().key !== 'live'), 'My page goes back to the child’s page');
    /* stop sharing: the teacher's board leaves the child's screen */
    await teacher.evaluate(() => document.getElementById('bdLive').click());
    await child.waitForFunction(() => !FabBoard.hasLive(), null, { timeout:5000 });
    await demo.close();
  });
  await test('Fab Fox World: each child names their cub, and every label uses the name', async () => {
    const pg = await newPage('/index.html');
    await pg.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await pg.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    await fr.evaluate(() => { const S = WORLD.S(); S.cub.has = false; S.cub.name = null; WORLD.hatch(); });
    assert(await fr.evaluate(() => WORLD.cubNm()) === 'Pip', 'Pip until the child chooses');
    await fr.waitForSelector('.namechip', { timeout:6000 });
    await fr.fill('#nameIn', 'clover!!');
    await fr.click('#nameGo');
    await fr.evaluate(() => WORLD.mNest());
    await pg.waitForTimeout(400);
    const r = await fr.evaluate(() => { const t = document.body.innerText; return { name:WORLD.cubNm(), pip:(t.match(/\bPip\b/g) || []).length, mine:(t.match(/Clover/g) || []).length }; });
    assert(r.name === 'Clover' && r.pip === 0 && r.mine >= 3, JSON.stringify(r));
    assert(/feed Clover/.test(await pg.evaluate(() => pwTreasureLine('🍎'))), 'the Learning Hub uses the name too');
    await pg.close();
  });
  await test('fractions: children shade parts to answer, and slides show the fraction models', async () => {
    const r = await page.evaluate(() => {
      const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-fractions'); learnOpen(p); learnGo(1);
      const s = p.screens[1], st = Learn.state[1] = {}; pwStart(s, st, pwMe(), 3);
      const k = st.kids[pwMe()]; k.phase = 'ydo'; let q; do { q = pwQuestion(s.steps[3]); } while(q.mode !== 'shade'); k.q = q; learnRender();
      const parts = document.querySelectorAll('[data-pwshade]').length;
      for(let i = 0; i < q.vars.k; i++) document.querySelector(`[data-pwshade="${i}"]`).dispatchEvent(new MouseEvent('click', { bubbles:true }));
      document.querySelector('[data-pwact="shadecheck"]').click();
      const sl = FabLearnBoard.slidesFor({ p, s, stp:s.steps[3], i:3 })();
      const idea = sl[0].make().html;
      return { parts, d:q.shade.d, right:k.last === 'right' || k.streak === 1, idea:/1\/3/.test(idea) && /a third/.test(idea) && /pw-frac/.test(idea) };
    });
    assert(r.parts === r.d, 'one button per part');
    assert(r.right, 'shading the right number of parts is right: ' + JSON.stringify(r));
    assert(r.idea, 'the big idea slide models thirds with fraction bars');
  });
  await test('Fab Fox World: Fab Says Field, Dad’s Workshop 3D builder, and the 3D studio make', async () => {
    const pg = await newPage('/index.html');
    await pg.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await pg.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    const r = await fr.evaluate(async () => {
      const out = {}; const W = window.WORLD;
      out.places = W.PLACES.map(p => p.n).join('|');
      W.startMini('move'); await new Promise(r => setTimeout(r, 300)); document.querySelector('[data-w="sit"]').click(); await new Promise(r => setTimeout(r, 200));
      out.move = /reach|wiggle|roll|touch|clap|march|flap|row|stretch|shake|breath|nod|move like|waddle|flutter|swing|scratch|sway/.test(document.querySelector('.mv-t').textContent);
      W.closeScene(true);
      W.startMini('workshop'); await new Promise(r => setTimeout(r, 300)); document.querySelector('[data-m="blocks"]').click(); await new Promise(r => setTimeout(r, 200));
      document.querySelector('[data-tpl="house"]').click(); await new Promise(r => setTimeout(r, 300));
      const cv = document.getElementById('cad3d'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data; let orange = 0; for(let i = 0; i < d.length; i += 16) if(d[i] > 180 && d[i + 1] < 120 && d[i + 2] < 80) orange++;
      out.blocks3d = orange > 200;
      return out;
    });
    assert(/Fab Says Field/.test(r.places) && !/Bouncy Hole|Sunny’s|Leaf’s/.test(r.places), 'places: ' + r.places);
    assert(r.move, 'a movement idea shows');
    assert(r.blocks3d, 'the house appears in 3D');
    await pg.close();
  });
  await test('Fab Fox World: missions, the Music Hut beat maker, the nest, and the 3D view', async () => {
    const pg = await newPage('/index.html');
    await pg.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await pg.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    const r = await fr.evaluate(async () => {
      const out = {}; const W = window.WORLD, S = W.S(), wait = ms => new Promise(r => setTimeout(r, ms));
      S.visited = { treehouse:1, shed:1, den:1 }; S.cub.has = true; S.cub.name = 'Pebble';
      document.getElementById('misBtn').click(); await wait(300);
      out.ready = document.querySelectorAll('.mrow.ready').length; const before = S.spk;
      document.querySelector('.mrow.ready .claim').click(); out.gained = S.spk - before; W.closeScene(true);
      out.hut = !!W.PLACES.find(p => p.id === 'music');
      mMusicHut(); await wait(200); document.querySelector('[data-m="beat"]').click(); await wait(200);
      out.cells = document.querySelectorAll('.bcell').length; document.getElementById('bPlay').click(); await wait(3500);
      out.loops = BEAT.loops; W.closeScene(true);
      W.mNest(); await wait(5000); out.fabMoved = Math.abs(NS.fabX - 300) > 20 || Math.abs(NS.fabT - 300) > 20; W.closeScene(true);
      document.getElementById('v3Btn').click(); await wait(500); out.v3 = V3;
      const gl = document.getElementById('glc'); out.sky = !!gl && gl.style.display === 'block' && GL.ok;
      WORLD.P.x = 2095; WORLD.P.y = 5; S.visited = {}; for(let i = 0; i < 20; i++) S.visited['v' + i] = 1; S.missions = 30; WORLD.keys.ArrowUp = true; await wait(400); WORLD.keys.ArrowUp = false; out.wrapY = WORLD.P.y > 600;
      document.getElementById('v3Btn').click(); out.v3off = !V3;
      return out;
    });
    assert(r.ready >= 2 && r.gained >= 2, 'missions ready and collected: ' + JSON.stringify(r));
    assert(r.hut && r.cells >= 56 && r.loops >= 1, 'the beat maker plays: ' + JSON.stringify(r));
    assert(r.fabMoved, 'Fab walks about in the nest');
    assert(r.wrapY, 'walking off the top of the world comes back at the bottom: ' + JSON.stringify(r));
    assert(r.v3 && r.sky && r.v3off, 'the 3D view shows a sky and switches back: ' + JSON.stringify(r));
    await pg.close();
  });
  await test('games: Fab’s friends help in every game, and finishing a game sends stars to Fab Fox World', async () => {
    const pg = await newPage('/index.html');
    const r = await pg.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms)), out = { missing:[] };
      Object.keys(FabGameCast.games).forEach(id => { if(!document.getElementById(id)) out.missing.push(id); });
      showScreen('screen-c4'); await w(500);
      out.chips = [...document.querySelectorAll('#screen-c4 .gc-chip .fab-char')].map(e => e.className.split(' ')[1]).join(',');
      out.how = !!document.querySelector('.gc-how'); FabGameCast.close();
      const k = 'fabworld-pending-' + ((typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'local'), b = +localStorage.getItem(k) || 0;
      flashBanner(document.getElementById('c4Banner'), '🔴 Flame wins! Brilliant! 🎉'); await w(300);
      out.gain = (+localStorage.getItem(k) || 0) - b; out.elder = !!document.querySelector('.gc-cheer .fab-char.elder');
      return out;
    });
    assert(!r.missing.length, 'every listed game has a screen: ' + r.missing);
    assert(r.chips === 'bell,yellow,green,doc,nurse,lark', 'one friend per job: ' + r.chips);
    assert(r.how, 'Miss Bell shows how to play the first time');
    assert(r.gain === 2 && r.elder, 'a win gives 2 stars and Mr Elder celebrates: ' + JSON.stringify(r));
    await pg.close();
  });
  await test('wellbeing hub: friends in their roles, an energy check, and a star for each activity', async () => {
    const pg = await newPage('/index.html');
    const r = await pg.evaluate(async () => {
      const w = ms => new Promise(r => setTimeout(r, ms)), out = {};
      showScreen('screen-wellbeing'); await w(300);
      out.groups = [...document.querySelectorAll('.wb2-group .wb2-gh .fab-char')].map(e => e.className.split(' ')[1]).join(',');
      document.querySelector('[data-en="low"]').click(); out.today = [...document.querySelectorAll('#wbMenu .wb-tile.today h3')].map(h => h.textContent).join('|');
      const k = 'fabworld-pending-' + ((typeof fabLearnerCode === 'function' && fabLearnerCode()) || 'local'), b = +localStorage.getItem(k) || 0;
      document.querySelector('[data-wb="mood"]').click(); await w(100); document.querySelector('#wbMood .mood-btn').click(); await w(100);
      out.gain = (+localStorage.getItem(k) || 0) - b; out.helloHidden = document.querySelector('.wb2-hello').style.display === 'none';
      return out;
    });
    assert(r.groups === 'nurse,elder,yellow,green,fab', 'one friend per job: ' + r.groups);
    assert(/Bubble Breathing/.test(r.today) && !/Beat Maker/.test(r.today), 'a little energy suggests calm things: ' + r.today);
    assert(r.gain === 1 && r.helloHidden, 'an activity sends a star and the panel fills the page: ' + JSON.stringify(r));
    await pg.close();
  });
  await test('no console errors anywhere', async () => { assert(!errors.length, errors.slice(0, 10).join('\n')); });

  await browser.close(); server.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
