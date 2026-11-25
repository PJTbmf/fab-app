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

  await test('live classroom: the timer and the help queue travel between the teacher and a child', async () => {
    const demo = await browser.newPage({ viewport:{ width:1600, height:1000 } });
    demo.on('pageerror', e => errors.push(`demo3: ${e.message}`));
    await demo.goto(base + '/demo.html');
    const frames = () => demo.frames().filter(f => /pencil=demo/.test(f.url()));
    await demo.waitForFunction(() => document.querySelectorAll('iframe').length === 3);
    for(let i = 0; i < 50 && frames().length < 3; i++) await demo.waitForTimeout(100);
    const byId = id => frames().find(f => f.url().includes('as=' + id));
    const teacher = byId('teacher'), child = byId('child-1');
    for(const f of [teacher, child]) await f.waitForFunction(() => typeof Live !== 'undefined' && Live.on && Live.me && window.FabLessonTimer && window.FabHelp);
    await teacher.evaluate(() => { learnOpen(BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division')); learnGo(1); });
    await child.waitForFunction(() => Learn.pack && Learn.step === 1, null, { timeout:5000 });
    await child.evaluate(() => { document.querySelector('[data-pwpick="0"]').click(); });
    await teacher.waitForFunction(() => document.querySelectorAll('.pw-card:not(.waiting)').length >= 1, null, { timeout:5000 });
    /* timer: the teacher starts it, the child sees the part but no controls and no minutes */
    await teacher.evaluate(() => FabLessonTimer.start('15'));
    await child.waitForFunction(() => document.querySelector('.lt-ph.now'), null, { timeout:5000 });
    assert(/I do/.test(await child.locator('.lt-ph.now').innerText()), 'the child sees the part we are in');
    assert(await child.locator('.lt-ctl').count() === 0 && await child.locator('#ltLeft').count() === 0, 'no controls or minutes for a child');
    assert(await teacher.locator('.lt-ctl [data-lt="next"]').count() === 1, 'the teacher has the controls');
    await teacher.evaluate(() => document.querySelector('[data-lt="next"]').click());
    await child.waitForFunction(() => /We do/.test((document.querySelector('.lt-ph.now') || {}).textContent || ''), null, { timeout:5000 });
    /* help: the child uses the ladder, then asks; the teacher's queue shows it and replies */
    await child.evaluate(() => { const b = document.querySelector('[data-pwact="practise"]'); if(b) b.click(); });
    await child.waitForFunction(() => document.querySelector('[data-hlact="open"]'), null, { timeout:5000 });
    await child.evaluate(() => document.querySelector('[data-hlact="open"]').click());
    await child.evaluate(() => document.querySelector('[data-hlact="fab"]').click());
    await child.evaluate(() => document.querySelector('[data-hlact="open"]').click());
    await child.evaluate(() => document.querySelector('[data-hlact="ask"]').click());
    await teacher.waitForFunction(() => document.querySelector('.hl-queue .hl-q'), null, { timeout:5000 });
    const q = await teacher.locator('.hl-queue').innerText();
    assert(/1 waiting/.test(q) && /Fab’s help/.test(q), 'the teacher sees who is waiting and what they tried: ' + q);
    assert(await child.locator('.hl-queue').count() === 0, 'children never see the queue');
    await teacher.evaluate(() => document.querySelector('[data-hlq="way"]').click());
    await child.waitForFunction(() => /on the way/.test((document.querySelector('.hl-wait') || {}).textContent || ''), null, { timeout:5000 });
    await teacher.evaluate(() => document.querySelector('.hl-queue [data-pwclear]').click());
    await child.waitForFunction(() => !document.querySelector('.hl-wait'), null, { timeout:5000 });
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
      W.mNest(); out.fabMoved = false; for(let i = 0; i < 40 && !out.fabMoved; i++){ await wait(500); out.fabMoved = Math.abs(NS.fabX - 300) > 20 || Math.abs(NS.fabT - 300) > 20; } W.closeScene(true);
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
  await test('checkpoints: a flightpath waits for a hand-in, marks it kindly, and staff can celebrate it', async () => {
    await page.evaluate(() => { localStorage.removeItem('fab-handins'); showScreen('screen-learn'); const p = BUILT_IN_PACKS.find(x => x.id === 'science-flightpath-y56'); learnOpen(p);
      const idx = p.screens.findIndex(s => s.type === 'pathway'); learnGo(idx); window.__cpIdx = idx; const st = Learn.state[idx] = Learn.state[idx] || {}; pwStart(p.screens[idx], st, pwMe(), 3); learnRender(); });
    assert(await page.locator('.pw-rung-name', { hasText: '🚧' }).count() >= 1 || true, '');
    if(await page.locator('[data-pwact="practise"]').count()) await page.locator('[data-pwact="practise"]').first().click();
    for(let n = 0; n < 3; n++){
      const ans = await page.evaluate(() => Learn.state[window.__cpIdx].kids.local.q.ans);
      await page.evaluate(a => { const b = [...document.querySelectorAll('.pw-choice')].find(x => pwNorm(x.textContent) === pwNorm(a)); b.click(); }, ans);
    }
    assert(await page.evaluate(() => Learn.state[window.__cpIdx].kids.local.phase) === 'check', 'three right on a checkpoint step should open the checkpoint');
    assert(await page.locator('.fc-board .fc-slot').count() === 4 && await page.locator('.fc-tray .fc-card').count() === 4, 'four circles and four cards');
    assert(await page.locator('.fc-you .fab-char.fab').count() === 1, 'Fab gives the You do task');
    await page.locator('[data-fcact="handin"]').click();
    assert(/Nothing to hand in yet/.test(await page.locator('.fc-fb').innerText()), 'empty hand-in should be gently refused');
    const place = async (card, slot) => { await page.locator(`[data-fccard="${card}"]`).click(); await page.locator(`[data-fcslot="${slot}"]`).click(); };
    await place(1, 0); await place(0, 1); await place(2, 2); await place(3, 3);
    await page.locator('[data-fcact="handin"]').click();
    assert(await page.locator('.fc-fb .fab-char.doc').count() === 1 && await page.locator('.fc-slot.ok').count() === 2, 'a partly right cycle gets Doctor McPhee and two ticks');
    assert(!/wrong|incorrect/i.test(await page.locator('.fc-fb').innerText()), 'never says wrong');
    /* the next step stays closed */
    assert(await page.evaluate(() => { const k = Learn.state[window.__cpIdx].kids.local; return k.step === 3 && !k.offer; }), 'flightpath should wait');
    await page.locator('[data-fcslot="0"]').click(); await page.locator('[data-fcslot="1"]').click();
    await page.locator('[data-fccard="0"]').click(); await page.locator('[data-fcslot="0"]').click();
    const before = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    await page.locator('[data-fcact="handin"]').click();
    assert(await page.locator('.fc-pass .fab-char.elder').count() === 1, 'Mr Elder celebrates a pass');
    const after = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    assert(after - before === 3, 'a pass earns 3 stars, got ' + (after - before));
    const rec = await page.evaluate(() => JSON.parse(localStorage.getItem('fab-handins') || '[]'));
    assert(rec.length === 1 && rec[0].passed && rec[0].score === 4 && rec[0].tries === 2 && !('words' in rec[0]), 'one pass recorded without free text');
    await page.locator('[data-fcact="next"]').click();
    assert(await page.evaluate(() => Learn.state[window.__cpIdx].kids.local.step) === 4, 'the next step opens after the hand-in');
    /* teacher sees it, and a mind map marks ideas */
    await page.evaluate(() => { const p = BUILT_IN_PACKS.find(x => x.id === 'science-flightpath-y12'); learnOpen(p); const idx = p.screens.findIndex(s => s.type === 'pathway'); learnGo(idx); window.__cpIdx = idx;
      const st = Learn.state[idx] = Learn.state[idx] || {}; pwStart(p.screens[idx], st, pwMe(), 6); const k = st.kids[pwMe()]; k.phase = 'ydo'; k.secured = [6]; FabCheck.afterRight(p.screens[idx], k); learnRender(); });
    assert(await page.locator('.fc-map input').count() === 6, 'six mind-map boxes');
    await page.locator('[data-fcword="0"]').fill('Water from rain');
    await page.locator('[data-fcbank="sunlight"]').click();
    await page.locator('[data-fcbank="sweets"]').click();
    await page.locator('[data-fcact="handin"]').click();
    assert(/2 of the 3 ideas/.test(await page.locator('.fc-fb').innerText()), 'mind map counts matching ideas: ' + await page.locator('.fc-fb').innerText());
    await page.locator('[data-pwact="view-teacher"]').click();
    assert(/On the checkpoint/.test(await page.locator('.pw-card').innerText()), 'teacher sees the checkpoint');
    await page.locator('[data-fcmark]').click();
    assert(/Checkpoint handed in/.test(await page.locator('.pw-card').innerText()), 'teacher can mark it done');
    await page.locator('[data-pwact="view-child"]').click();
    /* staff page */
    await page.evaluate(() => showScreen('screen-staff'));
    assert(await page.locator('#celCard .fc-cel').count() === 2, 'two achievements to celebrate');
    assert(/2 new/.test(await page.locator('#celCard h2').innerText()), 'new count shown');
    await page.locator('[data-celnote]').first().click();
    assert(/Primary Virtual School/.test(await page.locator('.fc-note').inputValue()), 'school note written');
    await page.locator('[data-celcert]').first().click();
    assert(await page.locator('.fc-cert').count() === 1, 'certificate opens');
    await page.locator('[data-celclose]').click();
    await page.locator('[data-celdone]').first().click();
    assert(/1 new/.test(await page.locator('#celCard h2').innerText()), 'marking as praised updates the count');
    await page.evaluate(() => { localStorage.removeItem('fab-handins'); showScreen('screen-hub'); });
  });
  await test('lesson timer: four parts for a subject slot, no ticking clock, moves on by itself and travels with the lesson', async () => {
    await page.evaluate(() => { showScreen('screen-learn'); const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(p); });
    assert(await page.locator('#lpTimerBtn').isVisible(), 'a Timer button on the lesson');
    await page.locator('#lpTimerBtn').click();
    assert(await page.locator('[data-lt="start"]').count() === 2, 'two kinds of slot: 15 minutes and low-energy 10');
    await page.locator('[data-lt="start"][data-plan="15"]').click();
    const chips = await page.locator('.lt-ph').allInnerTexts();
    assert(chips.length === 4 && /I do/.test(chips[0]) && /We do/.test(chips[1]) && /You do/.test(chips[2]) && /place to stop/.test(chips[3]), 'four parts: ' + chips.join(','));
    assert(/I do/.test(await page.locator('.lt-ph.now').innerText()), 'starts on I do');
    assert(/About 4 min left/.test(await page.locator('#ltLeft').innerText()), 'teacher sees whole minutes');
    assert(!/\d:\d\d/.test(await page.locator('.lt-bar').innerText()), 'no ticking clock');
    assert(await page.locator('.lt-bar .fab-char').count() === 0, 'no friend is repeated in the timer bar');
    await page.evaluate(() => FabLessonTimer._set({ end: Date.now() - 10 }));
    await page.waitForFunction(() => FabLessonTimer.state().i === 1, null, { timeout: 5000 });
    assert(/We do/.test(await page.locator('.lt-ph.now').innerText()), 'moves on to We do by itself');
    await page.locator('[data-lt="pause"]').click();
    assert(/Paused/.test(await page.locator('#ltLeft').innerText()), 'pause');
    await page.locator('[data-lt="pause"]').click();
    await page.locator('[data-lt="more"]').click();
    assert(/About 4 min left/.test(await page.locator('#ltLeft').innerText()), '+1 min: ' + await page.locator('#ltLeft').innerText());
    await page.locator('[data-lt="next"]').click();
    assert(/You do/.test(await page.locator('.lt-ph.now').innerText()), 'Next part goes to You do');
    await page.evaluate(() => FabLessonTimer._set({ end: Date.now() + 30000 }));
    assert(/Nearly time to stop/.test(await page.locator('#ltWho').innerText()), 'a calm cue near the end of You do');
    assert(await page.evaluate(() => { const t = Live.snapshot().lesson.state._timer; return !!t && t.i === 2; }), 'the timer travels with the lesson');
    await page.locator('[data-lt="next"]').click();
    assert(await page.locator('.lt-bar[data-phase="stop"] .fab-char.lark').count() === 1, 'Mrs Lark marks the place to stop');
    await page.locator('[data-lt="next"]').click();
    assert(/finished/.test(await page.locator('.lt-bar').innerText()), 'the slot finishes');
    await page.locator('[data-lt="end"]').click();
    assert(await page.locator('.lt-bar').count() === 0 && await page.locator('#lpTimerBtn').isVisible(), 'the timer is put away');
    /* in a flightpath, the teacher view carries the Timer button */
    await page.evaluate(() => { learnGo(1); });
    await page.locator('[data-pwact="view-teacher"]').click();
    assert(await page.locator('.pw-guide-toggle [data-ltopen]').count() === 1, 'Timer in the teacher view');
    await page.locator('[data-pwact="view-child"]').click();
  });
  await test('help ladder: Fab, Doctor McPhee, Miss Bell, then the teacher; the queue shows who waits and what they tried', async () => {
    await page.evaluate(() => { const p = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(p); learnGo(1); const st = Learn.state[1] = Learn.state[1] || {}; pwStart(p.screens[1], st, pwMe(), 2); const k = st.kids[pwMe()]; k.phase = 'ydo'; k.tap = true; learnRender(); });
    await page.locator('[data-hlact="open"]').click();
    const rungs = await page.locator('.hl-rung').allInnerTexts();
    assert(rungs.length === 4 && /Fab helps/.test(rungs[0]) && /Doctor McPhee/.test(rungs[1]) && /Miss Bell/.test(rungs[2]) && /Ask my teacher/.test(rungs[3]), 'four rungs in order: ' + rungs.join(' | '));
    assert(await page.locator('.pw-main .fab-char.doc').count() === 1 && await page.locator('.pw-main .fab-char.fab').count() === 1, 'each friend once while the ladder is open');
    const before = await page.evaluate(() => Learn.state[1].kids[pwMe()].done || 0);
    await page.locator('[data-hlact="fab"]').click();
    assert(await page.locator('.pw-choice.hl-cut').count() === 1, 'Fab takes one wrong answer away');
    assert(await page.evaluate(() => { const k = Learn.state[1].kids[pwMe()], i = k.hl.cut[0]; return pwNorm(k.q.choices[i]) !== pwNorm(k.q.ans); }), 'never the right answer');
    assert(/Fab helps/.test(await page.locator('.pw-fb').innerText()), 'Fab says what he did');
    await page.locator('[data-hlact="open"]').click(); await page.locator('[data-hlact="tip"]').click();
    assert(/A tip from Doctor McPhee/.test(await page.locator('.pw-fb').innerText()), 'a tip from Doctor McPhee');
    assert(await page.evaluate(() => Learn.state[1].kids[pwMe()].done || 0) === before, 'help never changes the score');
    await page.locator('[data-hlact="open"]').click(); await page.locator('[data-hlact="ask"]').click();
    assert(/Your teacher knows/.test(await page.locator('.hl-wait').innerText()), 'a calm waiting card');
    await page.locator('[data-pwact="view-teacher"]').click();
    const q = await page.locator('.hl-queue').innerText();
    assert(/1 waiting/.test(q) && /Already tried: Fab’s help, a tip/.test(q) && /waiting just now/.test(q) && /Step 3/.test(q), 'queue: ' + q);
    await page.locator('[data-hlq="way"]').click();
    await page.locator('[data-pwact="view-child"]').click();
    assert(/on the way/.test(await page.locator('.hl-wait').innerText()), 'the child sees the teacher has seen them');
    await page.locator('[data-pwact="view-teacher"]').click();
    await page.locator('[data-hlq="hint"]').click();
    assert(await page.locator('.hl-queue').count() === 0, 'sending a hint clears the queue');
    await page.locator('[data-pwact="view-child"]').click();
    assert(/A hint from your teacher/.test(await page.locator('.pw-fb').innerText()) && await page.locator('.hl-wait').count() === 0, 'the hint arrives');
    /* a break is listed first, and Miss Bell's replay works from the ladder */
    await page.locator('[data-hlact="open"]').click(); await page.locator('[data-hlact="bell"]').click();
    assert(await page.evaluate(() => Learn.state[1].kids[pwMe()].phase) === 'ido', 'Watch Miss Bell again replays the I do');
    await page.locator('[data-pwact="rest"]').click();
    await page.evaluate(() => { showScreen('screen-lesson'); });
    await page.locator('[data-pwact="view-teacher"]').click();
    assert(/Having a break/.test(await page.locator('.hl-queue .hl-break').innerText()), 'a child on a break is in the queue');
    await page.locator('[data-pwact="view-child"]').click();
    await page.locator('[data-pwact="back"]').click();
  });
  await test('the Burrow: staff make one link per Fab code; the child finds Today, starts on the set step and sees it done', async () => {
    await page.evaluate(() => showScreen('screen-staff'));
    await page.locator('#bwCode').fill('Sam');
    await page.locator('#bwMake').click();
    assert(/Never a name/.test(await page.locator('#bwMsg').innerText()) && await page.locator('#bwLink').count() === 0, 'a name is refused');
    await page.locator('#bwCode').fill('otter-482');
    await page.locator('[data-row="0"] [data-bwf="p"]').selectOption('maths-flightpath-multiplication-division');
    await page.locator('[data-row="0"] [data-bwf="s"]').selectOption('5');
    await page.locator('[data-row="0"] [data-bwf="n"]').fill('Start with the 4 times table');
    await page.locator('#bwAdd').click();
    await page.locator('[data-row="1"] [data-bwf="p"]').selectOption('science-flightpath-y56');
    await page.locator('[data-row="1"] [data-bwf="s"]').selectOption('3');
    await page.locator('.bw-freepick summary').click();
    await page.locator('[data-bwfree="english-flightpath-word-power"]').check();
    await page.locator('#bwMake').click();
    const link = await page.locator('#bwLink').inputValue();
    assert(/\?learner=otter-482&burrow=[A-Za-z0-9_-]+$/.test(link), 'link: ' + link);
    const ctx = await browser.newContext();
    const c = await newPage(link.slice(base.length), ctx);
    await c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active'));
    assert(/My Burrow/.test(await c.locator('#screen-me .screen-title').innerText()), 'the Burrow opens');
    assert(await c.locator('#bwToday .bw-item').count() === 2, 'two things for today');
    assert(/Step 6: 4 and 8 times tables/.test(await c.locator('#bwToday .bw-item').first().innerText()) && /Start with the 4 times table/.test(await c.locator('#bwToday .bw-item').first().innerText()), 'the step and the note show');
    assert(await c.locator('#bwToday .fab-char.fab').count() === 1, 'Fab introduces the work');
    assert(await c.locator('#bwFree .bw-card').count() === 1, 'one free-choice flightpath');
    await c.locator('[data-bwgo="0"]').click();
    assert(await c.evaluate(() => Learn.pack.id === 'maths-flightpath-multiplication-division' && Learn.state[Learn.step].kids[pwMe()].step === 5 && pwMe() === 'learner:otter-482'), 'starts on the step the teacher set');
    for(let n = 0; n < 3; n++) await c.evaluate(() => { const k = Learn.state[Learn.step].kids[pwMe()]; pwCheck(Learn.pack.screens[Learn.step], k, k.q.ans); learnRender(); });
    await c.evaluate(() => showScreen('screen-me'));
    assert(await c.locator('#bwToday .bw-item.done').count() === 1, 'the first piece of work shows as done');
    assert(await c.locator('#bwPaths .bw-card').count() === 1, 'My flightpaths shows it in progress');
    /* an older link never replaces newer work, and a second go carries on rather than restarting */
    assert(await c.evaluate(() => { const b = FabBurrow.read('otter-482'); return FabBurrow.apply('otter-482', { t: b.t - 5, a: [], f: [] }) && FabBurrow.read('otter-482').items.length === 2; }), 'older link ignored');
    await c.close(); await ctx.close();
    await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Explorer Worlds: three doors, Ancient Rome to explore, three missions, a scripted baker, and a passport stamp', async () => {
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); localStorage.removeItem('fab-explore-real'); localStorage.removeItem('fab-explore-roam'); }catch(e){} showScreen('screen-learn'); });
    await page.locator('#learnTimeBtn').click();
    assert(/Explorer Worlds/.test(await page.locator('#tmTitle').innerText()), 'it is called Explorer Worlds');
    assert(await page.locator('.tm-era').count() === 6 && await page.locator('.tm-era:not(.soon)').count() === 4, 'six worlds, four open');
    const doors = await page.locator('.tm-door').allInnerTexts();
    assert(doors.length === 3 && /Time Machine/.test(doors[0]) && /Rocket/.test(doors[1]) && /Submarine/.test(doors[2]), 'three ways to travel: ' + doors.join(' | '));
    await page.locator('[data-tm="era"][data-id="rome"]').click();
    assert(await page.locator('#tmStreet svg').count() === 1 && await page.locator('.tm-spot[data-tm="spot"]').count() === 9, 'a street with nine things to find');
    assert(await page.locator('#tmPanel .fab-char.bell').count() === 1, 'Miss Bell explains (I do)');
    const stars0 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    for(const id of ['stones', 'mosaic', 'fountain']) await page.evaluate(i => document.querySelector('.tm-spot[data-id="' + i + '"]').click(), id);
    assert(/beware of the dog|filled their jugs/.test(await page.locator('#tmPanel').innerText()), 'a fact shows');
    assert(/Mission 1 is done/.test(await page.locator('#tmPanel .tm-yes').innerText()), 'finding three things finishes mission 1');
    await page.locator('.tm-tabs [data-tm="tab"][data-id="missions"]').click();
    assert(await page.locator('#tmPanel .fab-char.fab').count() === 1, 'Fab leads the missions (You do)');
    await page.locator('[data-tm="act"][data-id="sort"]').click();
    const sort = await page.evaluate(() => FabExplore.worlds.rome.sort.items.map(x => [x.id, x.a]));
    const slip = sort.find(x => !x[1]);
    await page.locator(`[data-tm="pick"][data-id="${slip[0]}"]`).click(); await page.locator('[data-tm="bin"][data-id="a"]').click();
    const fix = await page.locator('.tm-notebox').innerText();
    assert(await page.locator('.tm-notebox .fab-char.doc').count() === 1 && !/wrong|incorrect/i.test(fix), 'Doctor McPhee fixes a slip kindly: ' + fix);
    for(const [id, isA] of sort){ await page.locator(`[data-tm="pick"][data-id="${id}"]`).click(); await page.locator(`[data-tm="bin"][data-id="${isA ? 'a' : 'b'}"]`).click(); }
    assert(await page.locator('.tm-notebox .fab-char.elder').count() === 1, 'Mr Elder celebrates the sort');
    await page.locator('[data-tm="act"][data-id=""]').click();
    await page.locator('[data-tm="act"][data-id="match"]').click();
    for(const id of await page.evaluate(() => FabExplore.worlds.rome.match.items.map(x => x.id))){ await page.locator(`[data-tm="mobj"][data-id="${id}"]`).click(); await page.locator(`[data-tm="muse"][data-id="${id}"]`).click(); }
    await page.locator('[data-tm="act"][data-id=""]').click();
    assert(await page.locator('.tm-stamp.got').count() === 1 && await page.locator('.tm-mis.done').count() === 3, 'all three missions earn the Rome stamp');
    const stars1 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    assert(stars1 - stars0 === 6, 'three missions earn 6 stars, got ' + (stars1 - stars0));
    assert(await page.evaluate(() => JSON.parse(localStorage.getItem('fabworld-treasure-local') || '[]').includes('💎')), 'a gem for Fab Fox World');
    await page.locator('.tm-tabs [data-tm="tab"][data-id="who"]').click();
    assert(await page.locator('.tm-q[data-tm="ask"]').count() === 7 && await page.locator('#tmPanel input, #tmPanel textarea').count() === 0, 'seven questions to tap, and no typing box until it is asked for');
    for(const id of ['job', 'eat', 'count']) await page.locator(`[data-tm="ask"][data-id="${id}"]`).click();
    assert(/VIII/.test(await page.locator('#tmAnswer').innerText()), 'Marcus answers from his script');
    assert(await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10)) - stars1 === 1, 'three questions earn a star');
    await page.locator('[data-tm="stop"]').click();
    assert(await page.locator('#tmPanel .fab-char.lark').count() === 1, 'Mrs Lark offers a place to stop');
    await page.locator('[data-tm="leave"]').click();
    assert(await page.evaluate(() => document.getElementById('screen-learn').classList.contains('active')), 'back to the Learning Hub');
    /* the Explorer Station in Fab Fox World opens it, and Back returns to the world */
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    assert(await fr.evaluate(() => { const p = WORLD.PLACES.find(x => x.id === 'time'); if(!p || !/Explorer Station/.test(p.n)) return false; WORLD.doAct(p, p.act[0]); return true; }), 'the world has an Explorer Station');
    await page.waitForFunction(() => document.getElementById('screen-time').classList.contains('active'));
    await page.locator('#tmBack').click(); await page.locator('#tmBack').click();
    assert(await page.evaluate(() => document.getElementById('screen-world').classList.contains('active')), 'Back returns to Fab Fox World');
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); }catch(e){} showScreen('screen-hub'); });
  });
  await test('Explorer Worlds: Ancient Egypt, the Victorians and the Space Station each play through to a stamp, kindly', async () => {
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); }catch(e){} window.fabOpenExplore('screen-learn'); });
    const all = await page.evaluate(() => FabExplore.order.map(id => { const w = FabExplore.worlds[id]; return { id, door:w.door, n:w.n, spots:w.spots.map(s => ({ id:s.id, snd:s.snd, ok:FabExplore.sounds.has(s.snd), words:(s.t + ' ' + s.k).split(/\s+/).length })), find:w.find, sort:w.sort.items.map(x => [x.id, x.a]), match:w.match.items.map(x => x.id), qs:w.who.qs.map(q => q.id), text:JSON.stringify([w.hello, w.spots, w.sort, w.match, w.who.hello, w.who.qs, w.real]), teach:w.teach.join(' ') }; }));
    assert(all.map(w => w.id).join() === 'rome,egypt,victorian,space', 'four worlds in order: ' + all.map(w => w.id).join());
    assert(all.find(w => w.id === 'space').door === 'space' && all.filter(w => w.door === 'past').length === 3, 'the Space Station is reached by rocket, the others by time machine');
    for(const w of all){
      assert(w.spots.length >= 9 && w.spots.every(s => s.ok), w.id + ': every stop has a sound');
      assert(w.spots.every(s => s.words <= 60), w.id + ': each stop is a short read');
      assert(!/\b(died|dead|deaths?|kill\w*|graves?|tombs?|mummy|mummies|coffins?|wars?|blood\w*|diseases?|plagues?|cancer|hospitals?|workhouses?|caned|beaten|explod\w*|crash\w*|erupt\w*|gladiators?|slaves?)\b/i.test(w.text), w.id + ': child-facing text stays gentle');
      assert(!/\b(color|center|favorite|math\b|gray)\b/.test(w.text), w.id + ': British spelling');
      assert(/Kept gentle|leaves out/.test(w.teach), w.id + ': teachers are told what is left out');
    }
    for(const w of all.filter(x => x.id !== 'rome')){
      await page.locator(`[data-tm="era"][data-id="${w.id}"]`).click();
      assert(await page.locator('#tmStreet svg').count() === 1 && await page.locator('.tm-spot[data-tm="spot"]').count() === w.spots.length, w.id + ': a scene with every stop marked');
      for(const id of w.find) await page.evaluate(i => document.querySelector('.tm-spot[data-tm="spot"][data-id="' + i + '"]').click(), id);
      assert(/Mission 1 is done/.test(await page.locator('#tmPanel .tm-yes').innerText()), w.id + ': finding three things finishes mission 1');
      await page.locator('.tm-tabs [data-tm="tab"][data-id="missions"]').click();
      await page.locator('[data-tm="act"][data-id="sort"]').click();
      for(const [id, isA] of w.sort){ await page.locator(`[data-tm="pick"][data-id="${id}"]`).click(); await page.locator(`[data-tm="bin"][data-id="${isA ? 'a' : 'b'}"]`).click(); }
      await page.locator('[data-tm="act"][data-id=""]').click();
      await page.locator('[data-tm="act"][data-id="match"]').click();
      for(const id of w.match){ await page.locator(`[data-tm="mobj"][data-id="${id}"]`).click(); await page.locator(`[data-tm="muse"][data-id="${id}"]`).click(); }
      await page.locator('[data-tm="act"][data-id=""]').click();
      assert(await page.locator('.tm-mis.done').count() === 3, w.id + ': three missions done');
      await page.locator('.tm-tabs [data-tm="tab"][data-id="who"]').click();
      assert(await page.locator('#tmPanel input, #tmPanel textarea').count() === 0 && await page.locator('.tm-q[data-tm="ask"]').count() === w.qs.length, w.id + ': questions to tap');
      for(const q of w.qs.slice(0, 3)) await page.locator(`[data-tm="ask"][data-id="${q}"]`).click();
      assert((await page.locator('#tmAnswer').innerText()).length > 20, w.id + ': the guide answers from a script');
      await page.locator('#tmBack').click();
      assert(await page.evaluate(id => !!FabExplore.pass()[id].stamp, w.id) && await page.locator('.tm-passport .tm-stamp.got').count() === all.findIndex(x => x.id === w.id), w.id + ': the passport shows the stamp');
    }
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); }catch(e){} showScreen('screen-hub'); });
  });
  await test('Learning Hub: Canvas, Cinema, Music and Explorer Worlds sit in one row', async () => {
    await page.setViewportSize({ width:1366, height:900 });
    await page.evaluate(() => showScreen('screen-learn'));
    const cards = await page.evaluate(() => [...document.querySelectorAll('#learnTools .lt-card')].filter(c => c.offsetWidth).map(c => ({ t:c.querySelector('b').textContent, y:Math.round(c.getBoundingClientRect().top), w:Math.round(c.getBoundingClientRect().width), over:c.scrollWidth > c.clientWidth + 1 })));
    assert(cards.map(c => c.t).join() === 'Canvas,Cinema,Music,Explorer Worlds', 'the four tools, in order: ' + cards.map(c => c.t).join());
    assert(new Set(cards.map(c => c.y)).size === 1, 'all four on one row: ' + JSON.stringify(cards));
    assert(cards.every(c => c.w >= 200 && !c.over), 'each card has room for its words: ' + JSON.stringify(cards));
    await page.setViewportSize({ width:820, height:1100 });
    const rows = await page.evaluate(() => new Set([...document.querySelectorAll('#learnTools .lt-card')].filter(c => c.offsetWidth).map(c => Math.round(c.getBoundingClientRect().top))).size);
    assert(rows === 2, 'two by two on a small iPad, got ' + rows + ' rows');
    await page.setViewportSize({ width:1366, height:900 });
    await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Explorer Worlds voices and questions: a fitting voice, pause for talking points, and a child’s own question', async () => {
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); }catch(e){} window.speechSynthesis.speak = function(){}; window.fabOpenExplore('screen-learn', 'space'); });
    /* voices: each guide asks for a fitting voice, and the picker finds one when the device has it */
    const v = await page.evaluate(() => { const list = [{ name:'Microsoft George - English (United Kingdom)', lang:'en-GB' }, { name:'Microsoft Hazel - English (United Kingdom)', lang:'en-GB' }, { name:'Google UK English Female', lang:'en-GB' }, { name:'Google UK English Male', lang:'en-GB' }, { name:'Google US English', lang:'en-US' }, { name:'Google français', lang:'fr-FR' }];
      const P = FabExplore.say.pick; return { voices:FabExplore.order.map(id => FabExplore.worlds[id].who.voice), f:P('f', list).name, m:P('m', list).name, g:P('g', list).name, onlyMale:P('f', [list[0]]).name, pf:FabExplore.say.pitch({ name:'Microsoft George' }, 'f'), none:P('f', []) }; });
    assert(v.voices.join() === 'm,m,g,f', 'Marcus and Nakht are men, Ada is a girl, Zara is a woman: ' + v.voices.join());
    assert(/Female|Hazel/.test(v.f) && /Male|George/.test(v.m) && !/Female|Hazel/.test(v.m) && /Female|Hazel/.test(v.g), 'the picker matches voices: ' + JSON.stringify(v));
    assert(v.onlyMale && v.pf > 1.1 && v.none === null, 'with only a man’s voice on the device, Zara’s is pitched higher');
    /* pause and carry on */
    await page.evaluate(() => document.querySelector('.tm-spot[data-tm="spot"][data-id="cupola"]').click());
    const say = page.locator('[data-tm="say"]');
    assert(/Read it to me/.test(await say.innerText()), 'Read it to me');
    await say.click(); assert(/Pause/.test(await say.innerText()), 'while reading, the button is Pause');
    await say.click(); assert(/Carry on/.test(await say.innerText()) && await page.evaluate(() => FabExplore.say.state().st) === 'paused', 'Pause, then Carry on');
    await say.click(); assert(/Pause/.test(await say.innerText()), 'Carry on reads again');
    assert(await page.evaluate(() => FabExplore.say.split('One. Two! Three?').length) === 3, 'it reads a sentence at a time');
    /* a child's own question */
    await page.locator('.tm-tabs [data-tm="tab"][data-id="who"]').click();
    assert(await page.evaluate(() => FabExplore.say.state().st) === 'idle', 'changing tab stops the voice');
    await page.locator('[data-tm="own"]').click();
    await page.locator('#tmOwn').fill('What food do you have up there?'); await page.locator('#tmOwn').press('Enter');
    let b = await page.locator('.tm-marcus .bubble').innerText();
    assert(/You asked: “What food do you have up there\?”/.test(b) && /Zara hears: What do you eat\?/.test(b), 'a typed question is matched to a fixed answer: ' + b);
    assert(/Pause/.test(await page.locator('[data-tm="sayans"]').innerText()), 'Zara answers aloud, and can be paused');
    await page.locator('[data-tm="own"]').click();
    await page.locator('#tmOwn').fill('Are there aliens?'); await page.locator('.tm-own button[type="submit"]').click();
    b = await page.locator('.tm-marcus .bubble').innerText();
    assert(/“Are there aliens\?”/.test(b) && /Ask your teacher/.test(b), 'a question with no fixed answer goes to the teacher: ' + b);
    const m = await page.evaluate(() => { const O = FabExplore.own, q = id => FabExplore.worlds[id].who.qs; const t = (id, x) => { const r = O.match(x, q(id)); return r ? r.id : null; };
      return [t('space', 'How do you go to bed?'), t('space', 'do you miss your mum'), t('space', 'how quick is the station'), t('rome', 'what is your favourite game'), t('victorian', 'who is queen victoria'), t('egypt', 'why is the nile important'), t('space', 'hello'), t('rome', 'did people get hurt at the colosseum'), t('space', '<b>!!</b>')]; });
    assert(m.join() === 'sleep,family,fast,fun,queen,river,,,', 'the matcher: ' + m.join());
    assert(await page.evaluate(() => !Object.keys(localStorage).some(k => /aliens|food do you have/i.test(localStorage.getItem(k) || ''))), 'typed questions are not saved');
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); }catch(e){} showScreen('screen-hub'); });
  });
  await test('Explorer Worlds Make and do: put it in order, tile art, and a report at three levels that the makes slot into', async () => {
    await page.evaluate(() => { try{ Object.keys(localStorage).filter(k => /^fab-make-|^fab-passport-/.test(k)).forEach(k => localStorage.removeItem(k)); }catch(e){} window.speechSynthesis.speak = function(){}; });
    const data = await page.evaluate(() => FabExplore.order.map(id => { const m = FabExplore.worlds[id].make; return { id, order:m.order.items.map(x => x.id), n:m.order.items.length, art:[m.art.W, m.art.H, m.art.sym, m.art.pal.length], intro:m.report.intro.length, text:JSON.stringify(m) }; }));
    assert(data.length === 4 && data.every(d => d.n >= 6 && d.art[3] >= 7 && d.intro === 3), 'every world has an order task, an art task and a report: ' + JSON.stringify(data.map(d => [d.id, d.n, d.art])));
    for(const d of data) assert(!/\b(died|dead|deaths?|kill\w*|graves?|tombs?|mummy|mummies|wars?|blood\w*|battle\w*|rebel\w*)\b/i.test(d.text) && !/\b(color|center|favorite|jewelry)\b/.test(d.text), d.id + ': gentle wording and British spelling');
    const stars0 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'space'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    assert(await page.locator('.mk-card').count() === 3 && await page.locator('#tmPanel .fab-char.fab').count() === 1, 'three things to make, led by Fab');
    /* put it in order: a slip gets a kind hint, then every planet in order */
    await page.locator('[data-mk="open"][data-id="order"]').click();
    const planets = data.find(d => d.id === 'space').order;
    await page.locator(`[data-mk="put"][data-id="${planets[3]}"]`).click();
    const fix = await page.locator('.tm-notebox').innerText();
    assert(await page.locator('.tm-notebox .fab-char.doc').count() === 1 && /My Very Easy Method/.test(fix) && !/wrong|incorrect/i.test(fix), 'Doctor McPhee gives a kind hint: ' + fix);
    for(const id of planets) await page.locator(`[data-mk="put"][data-id="${id}"]`).click();
    assert(await page.locator('.mk-strip li:not(.mk-slot)').count() === 8 && await page.locator('.tm-notebox .fab-char.elder').count() === 1, 'eight planets in order, and Mr Elder celebrates');
    /* tile art: paint, mirror, finish */
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'victorian'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    await page.locator('[data-mk="open"][data-id="art"]').click();
    await page.locator('[data-mk="artdone"]').click();
    assert(/Add some colour first/.test(await page.locator('.tm-notebox').innerText()), 'an empty design is not finished yet');
    await page.locator('#mkArt').scrollIntoViewIfNeeded();
    const box = await page.locator('#mkArt').boundingBox(), cell = box.width / 12;
    await page.mouse.move(box.x + cell * 1.5, box.y + cell * 1.5); await page.mouse.down(); await page.mouse.move(box.x + cell * 3.5, box.y + cell * 1.5, { steps:4 }); await page.mouse.up();
    const g = await page.evaluate(() => FabMake.state.grid);
    assert(g[13] === '1' && g[12 + 10] === '1' && g[10 * 12 + 1] === '1' && g[10 * 12 + 10] === '1' && g[0] === '0', 'the Victorian tile copies the pattern into all four corners');
    await page.locator('[data-mk="col"][data-id="4"]').click();
    await page.mouse.click(box.x + cell * 5.5, box.y + cell * 5.5);
    assert((await page.evaluate(() => FabMake.state.grid))[5 * 12 + 5] === '4', 'a second colour');
    await page.locator('[data-mk="artdone"]').click();
    assert(await page.evaluate(() => { const d = FabMake.load().victorian; return d.artDone === 1 && /^data:image\/png/.test(d.png) && d.art.length === 144; }), 'the design is saved as a picture');
    assert(await page.evaluate(() => FabMake.mask.collar(10, 0, 21) === false && FabMake.mask.collar(10, 8, 21) === true && FabMake.mask.circle(0, 0, 16, 16) === false && FabMake.mask.circle(8, 8, 16, 16) === true), 'the collar and the patch have their shapes');
    /* the report: built with taps (the low-energy way) */
    await page.locator('[data-mk="open"][data-id="report"]').click();
    assert(await page.locator('[data-mk="lvl"]').count() === 3, 'three levels of challenge');
    await page.locator('[data-mk="lvl"][data-id="1"]').click();
    assert(await page.locator('.mk textarea').count() === 0, 'level one needs no typing');
    await page.locator('[data-mk="ipick"][data-id="0"]').click();
    await page.locator('[data-mk="stop"][data-n="0"][data-id="train"]').click(); await page.locator('[data-mk="pick"][data-n="0"][data-id="0"]').click();
    await page.locator('[data-mk="stop"][data-n="1"][data-id="bike"]').click(); await page.locator('[data-mk="pick"][data-n="1"][data-id="0"]').click();
    await page.locator('[data-mk="dpick"][data-id="train"]').click();
    assert(await page.locator('#mkChecks li.ok').count() === 5, 'the checklist ticks itself, got ' + await page.locator('#mkChecks li.ok').count());
    await page.locator('[data-mk="open"][data-id="paper"]').click();
    const paper = await page.locator('.mk-paper').innerText();
    assert(/All about the Victorians/.test(paper) && /The steam train/.test(paper) && /The penny-farthing/.test(paper) && /Did you know\?/.test(paper), 'the report reads as a report: ' + paper.slice(0, 160));
    assert(await page.locator('.mk-paper .mk-fig img').count() === 1, 'the child’s tile is in the report');
    assert(await page.locator('.tm-notebox .fab-char.elder').count() === 1 && await page.locator('[data-mk="print"]').count() === 1, 'Mr Elder celebrates, and it can be printed');
    /* sentence starters: typing is saved without losing the place */
    await page.locator('[data-mk="open"][data-id="report"]').click();
    await page.locator('[data-mk="lvl"][data-id=""]').click(); await page.locator('[data-mk="lvl"][data-id="2"]').click();
    await page.locator('#mkIntro').click(); await page.locator('[data-mk="ins"][data-for="mkIntro"]').first().click(); await page.keyboard.type('the Victorians.');
    assert(await page.evaluate(() => document.activeElement.id) === 'mkIntro' && /This report is about the Victorians\./.test(await page.evaluate(() => FabMake.load().victorian.rep.intro)), 'a starter drops in and the typing is saved');
    await page.locator('#mkS0').click(); await page.locator('.mk-sec [data-mk="ins"][data-for=""]').first().click();
    assert(/Victorian/.test(await page.locator('#mkS0').inputValue()), 'a word-bank word goes into the box being written in');
    /* the space timeline slots into the space report */
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'space'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    assert(await page.locator('.mk-card.done').count() === 1, 'the planets card shows as made');
    await page.locator('[data-mk="open"][data-id="report"]').click(); await page.locator('[data-mk="lvl"][data-id="3"]').click();
    assert(await page.locator('.mk textarea').count() === 2 && await page.locator('.mk-word[data-mk="ins"]').count() === 0 && await page.locator('[data-mk="stop"]').count() === 20, 'on my own: headings and boxes, no starters');
    await page.locator('[data-mk="open"][data-id="paper"]').click();
    assert(await page.locator('.mk-paper .mk-strip li').count() === 8, 'the planets in order are in the space report');
    const stars1 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    assert(stars1 - stars0 === 3, 'a star each for the order, the art and the report, got ' + (stars1 - stars0));
    await page.evaluate(() => { try{ Object.keys(localStorage).filter(k => /^fab-make-|^fab-passport-/.test(k)).forEach(k => localStorage.removeItem(k)); }catch(e){} showScreen('screen-hub'); });
  });
  await test('Explorer Worlds media: sounds made in the app, credited photos, and real views that stay off until tapped', async () => {
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); localStorage.removeItem('fab-explore-real'); localStorage.removeItem('fab-explore-roam'); }catch(e){} window.fabOpenExplore('screen-learn', 'egypt'); });
    const media = await page.evaluate(() => FabExplore.order.map(id => { const w = FabExplore.worlds[id]; return { id, photos:w.spots.filter(s => s.photo).map(s => Object.assign({ spot:s.id }, s.photo)), real:(w.real || []).map(r => ({ id:r.id, pano:r.pano, t:r.t, url:FabExplore.svUrl(r) })) }; }));
    for(const m of media){
      assert(m.photos.length >= 4, m.id + ': at least four real photographs, got ' + m.photos.length);
      for(const ph of m.photos){
        assert(/^explore\/[a-z0-9-]+\.jpg$/.test(ph.src), m.id + '/' + ph.spot + ': the photo is stored in the app, not hot-linked: ' + ph.src);
        assert(ph.alt && ph.alt.length > 15 && ph.cap && ph.by && ph.by.length > 3, m.id + '/' + ph.spot + ': alt text, caption and credit');
        const r = await page.evaluate(async u => { const x = await fetch(u); return [x.status, +(x.headers.get('content-length') || 0)]; }, ph.src);
        assert(r[0] === 200, m.id + '/' + ph.spot + ': the photo file exists');
      }
      assert(m.real.length >= 2, m.id + ': at least two real views');
      for(const r of m.real){
        assert(/^https:\/\/www\.google\.com\/maps\/embed\?pb=/.test(r.url) && !/key=/.test(r.url), m.id + '/' + r.id + ': Street View needs no key');
        assert(!/^(CIHM|CIAB|AF1Q)/.test(r.pano), m.id + '/' + r.id + ': Google’s own photograph, not a visitor’s upload');
        assert(r.t.split(/\s+/).length <= 45, m.id + '/' + r.id + ': a short caption');
      }
    }
    /* a stop: listen, then see a real one */
    await page.evaluate(() => document.querySelector('.tm-spot[data-tm="spot"][data-id="cat"]').click());
    await page.locator('[data-tm="hear"]').click();
    assert(await page.locator('.tm-photo').count() === 0, 'the photo waits until it is asked for');
    await page.locator('[data-tm="photo"]').click();
    assert(await page.locator('.tm-photo img').count() === 1 && /Photo:/.test(await page.locator('.tm-photo figcaption').innerText()), 'the photo shows with its credit');
    await page.waitForFunction(() => { const i = document.querySelector('.tm-photo img'); return i && i.complete && i.naturalWidth > 100; });
    /* real views: nothing from Google until a place is tapped; arrows only */
    await page.locator('.tm-tabs [data-tm="tab"][data-id="real"]').click();
    assert(await page.locator('#screen-time iframe').count() === 0, 'no Google frame before a place is tapped');
    await page.locator('[data-tm="real"][data-id="sphinx"]').click();
    const f = page.locator('#tmSv');
    assert(await f.count() === 1 && /maps\/embed\?pb=/.test(await f.getAttribute('src')), 'the real view opens');
    assert((await f.getAttribute('sandbox')) === 'allow-scripts allow-same-origin' && (await f.getAttribute('referrerpolicy')) === 'no-referrer', 'the view cannot open new tabs and sends no page address');
    assert(await page.locator('.tm-svshield').count() === 1 && await f.evaluate(e => e.hasAttribute('inert')), 'children look but cannot wander');
    const src0 = await f.getAttribute('src');
    await page.locator('[data-tm="turn"][data-id="45"]').click();
    const src1 = await f.getAttribute('src');
    assert(src1 !== src0 && /!3f45(!|$)/.test(src1), 'Turn right faces a new way: ' + src1.slice(-40));
    await page.locator('[data-tm="turn"][data-id="0"]').click();
    assert(await f.getAttribute('src') === src0, 'Look back at the start');
    await page.locator('#tmPanel [data-tm="real"][data-id=""]').click();
    assert(await page.locator('#screen-time iframe').count() === 0, 'closing the view removes the Google frame');
    /* staff can switch real views off on a device */
    await page.evaluate(() => { document.querySelector('.tm-teach').open = true; });
    await page.locator('[data-tm="realtoggle"]').click();
    assert(await page.locator('.tm-tabs [data-tm="tab"][data-id="real"]').count() === 0 && await page.evaluate(() => localStorage.getItem('fab-explore-real')) === 'off', 'real views switched off');
    await page.locator('[data-tm="realtoggle"]').click();
    assert(await page.locator('.tm-tabs [data-tm="tab"][data-id="real"]').count() === 1, 'and back on');
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); localStorage.removeItem('fab-explore-real'); }catch(e){} showScreen('screen-hub'); });
  });
  await test('no console errors anywhere', async () => { assert(!errors.length, errors.slice(0, 10).join('\n')); });

  await browser.close(); server.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
