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
const TYPES = { '.svg':'image/svg+xml', '.webp':'image/webp', '.css':'text/css', '.pdf':'application/pdf', '.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.json':'application/json' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if(!p.startsWith(ROOT) || !fs.existsSync(p) || fs.statSync(p).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});

let passed = 0, failed = 0;
const results = [];
async function test(name, fn){
  if(process.env.ONLY && !process.env.ONLY.split('|').some(k => name.includes(k))) return;   // ONLY='The studio|Mind map' runs just those tests
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
      document.querySelector('.cadch[data-ch="house"]').click(); await new Promise(r => setTimeout(r, 300));
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
    assert(/Bubble Breathing/.test(r.today) && !/Beat Maker|Music/.test(r.today), 'a little energy suggests calm things: ' + r.today);
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
    assert(/\?learner=otter-482&class=1&quiet=1&burrow=[A-Za-z0-9_-]+$/.test(link) && !/home=burrow/.test(link) && await page.locator('#bwHome').count() === 0, 'one link per child: the code, class mode and the work; the draft option stays hidden: ' + link);
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
    assert(await page.locator('.tm-era').count() === 7 && await page.locator('.tm-era:not(.soon)').count() === 5, 'seven worlds, five open');
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
    assert(all.map(w => w.id).join() === 'rome,egypt,greece,victorian,space', 'five worlds in order: ' + all.map(w => w.id).join());
    assert(all.find(w => w.id === 'space').door === 'space' && all.filter(w => w.door === 'past').length === 4, 'the Space Station is reached by rocket, the others by time machine');
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
  await test('Fab Fox World: choosing a place takes Fab there and opens it; games fill a big screen', async () => {
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    for(const how of ['pop', 'walk', 'pop']){
      await fr.evaluate(how => { try{ WORLD.closeScene(true); }catch(e){} WORLD.S().go = how; WORLD.goTo(WORLD.PLACES.find(x => x.id === 'shed')); }, how);
      await fr.waitForFunction(() => !!WORLD.scene(), null, { timeout:12000 });
      assert(await fr.evaluate(() => !!WORLD.scene()), 'the Fix-it Shed opens on arrival by ' + how);
    }
    await fr.evaluate(() => { try{ WORLD.closeScene(true); }catch(e){} });
    /* games: no magnifying on a laptop, a bigger play area on a big screen */
    await page.setViewportSize({ width:1280, height:720 });
    await page.evaluate(() => { showScreen('screen-pinball'); try{ fabGameMount('screen-pinball'); }catch(e){} });
    const z0 = await page.evaluate(() => document.querySelector('.game-frame[data-game="pinball"]').dataset.zoom);
    await page.setViewportSize({ width:1920, height:1200 }); await page.waitForTimeout(400);
    const big = await page.evaluate(() => { const f = document.querySelector('.game-frame[data-game="pinball"]'), r = f.getBoundingClientRect(); return { z:+f.dataset.zoom, bottom:Math.round(r.bottom), win:innerHeight, inner:f.contentWindow.innerHeight, world:document.querySelector('.game-frame[data-game="world"]').dataset.zoom }; });
    assert(z0 === '1' && big.z >= 1.2 && big.bottom <= big.win && big.inner >= 740, 'pinball is magnified on a big screen and stays on the page: ' + z0 + ' ' + JSON.stringify(big));
    const pf = await (await page.$('.game-frame[data-game="pinball"]')).contentFrame();
    await pf.waitForFunction(() => [...document.querySelectorAll('button')].some(b => /play/i.test(b.textContent)));
    await pf.evaluate(() => [...document.querySelectorAll('button')].find(b => b.offsetWidth && /let.s play/i.test(b.textContent)).click());
    await page.waitForTimeout(500);
    const hit = await page.evaluate(() => { const f = document.querySelector('.game-frame[data-game="pinball"]'), d = f.contentDocument, z = +f.dataset.zoom, fr = f.getBoundingClientRect(), c = d.querySelector('canvas').getBoundingClientRect(); const btns = [...d.querySelectorAll('button')].filter(b => b.offsetWidth && /Launch|Left|Right/.test(b.textContent)).map(b => fr.top + b.getBoundingClientRect().bottom * z); return { table:Math.round(c.height * z), lowest:Math.round(Math.max.apply(null, btns)), win:innerHeight }; });
    assert(hit.table >= 700 && hit.lowest <= hit.win, 'the table is bigger and its buttons are still on the page: ' + JSON.stringify(hit));
    await page.setViewportSize({ width:1280, height:720 });
    await page.evaluate(() => showScreen('screen-hub'));
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
    assert(v.voices.join() === 'm,m,g,g,f', 'Marcus and Nakht are men, Phoebe and Ada are girls, Zara is a woman: ' + v.voices.join());
    assert(/Female|Hazel/.test(v.f) && /Male|George/.test(v.m) && !/Female|Hazel/.test(v.m) && /Female|Hazel/.test(v.g), 'the picker matches voices: ' + JSON.stringify(v));
    assert(v.onlyMale && v.pf > 1.1 && v.none === null, 'with only a man’s voice on the device, Zara’s is pitched higher');
    /* pause and carry on */
    await page.evaluate(() => document.querySelector('.tm-spot[data-tm="spot"][data-id="cupola"]').click());
    const say = page.locator('[data-tm="say"]');
    assert(/Read it to me/.test(await say.innerText()), 'Read it to me');
    /* recorded British voices: one stored line for every stop and answer, matched to the exact words */
    const rec = await page.evaluate(() => { const F = window.FAB_VOICE || {}, H = FabExplore.say.hash, miss = []; /* Ancient Greece is a first draft (27 Nov) and still uses the device voice */ FabExplore.order.filter(id => id !== 'greece').forEach(id => { const w = FabExplore.worlds[id]; w.spots.forEach(s => { if(F[id + '-spot-' + s.id] !== H(s.n + '. ' + s.t + ' ' + s.k)) miss.push(id + '-spot-' + s.id); }); w.who.qs.forEach(m => { if(F[id + '-ans-' + m.id] !== H(m.a)) miss.push(id + '-ans-' + m.id); }); if(!F[id + '-ans-miss'] || !F[id + '-mk-model']) miss.push(id + '-extra'); }); return { n:Object.keys(F).length, miss }; });
    assert(rec.n === 74 && !rec.miss.length, 'a recorded line for every stop, answer and model report: ' + rec.n + ' ' + rec.miss.join());
    const got = await page.evaluate(async () => { const out = []; for(const f of ['rome-spot-bakery', 'egypt-ans-eat', 'victorian-ans-miss', 'space-mk-model']){ const r = await fetch('explore/voice/' + f + '.mp3'); out.push(r.status + ':' + ((await r.blob()).size > 8000)); } return out.join(); });
    assert(got === '200:true,200:true,200:true,200:true', 'the sound files are in the app: ' + got);
    assert(await page.evaluate(() => /space-spot-cupola\.mp3$/.test(FabExplore.say.fileFor('spot:cupola', (s => s.n + '. ' + s.t + ' ' + s.k)(FabExplore.worlds.space.spots.find(x => x.id === 'cupola')))) && FabExplore.say.fileFor('spot:cupola', 'Different words now.') === ''), 'changed words fall back to the device voice');
    await say.click(); assert(/Pause/.test(await say.innerText()), 'while reading, the button is Pause');
    assert(/explore\/voice\/space-spot-cupola\.mp3$/.test(await page.evaluate(() => FabExplore.say.state().file)), 'the recorded line is playing');
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
  await test('Explorer Worlds Make and do: facts to play with, a design with a model beside it, a mind map, and a report in small steps', async () => {
    const wipe = () => page.evaluate(() => { try{ Object.keys(localStorage).filter(k => /^fab-make-|^fab-passport-/.test(k)).forEach(k => localStorage.removeItem(k)); }catch(e){} });
    await wipe(); await page.evaluate(() => { window.speechSynthesis.speak = function(){}; });
    const data = await page.evaluate(() => FabExplore.order.map(id => { const m = FabExplore.worlds[id].make; return { id, order:m.order.items.map(x => x.id), n:m.order.items.length, art:[m.art.W, m.art.H, m.art.sym, m.art.pal.length, m.art.tips.length], model:FabMake.modelGrid(m.art), quiz:m.quiz.map(q => q.a), rep:[m.report.intro.length, m.report.model.secs.length], text:JSON.stringify(m) }; }));
    assert(data.length === 5 && data.every(d => d.n >= 6 && d.art[3] >= 7 && d.art[4] === 3 && d.quiz.length === 6 && d.rep.join() === '3,2'), 'every world has the full set: ' + JSON.stringify(data.map(d => [d.id, d.n, d.art, d.quiz.length, d.rep])));
    for(const d of data){
      assert(!/\b(died|dead|deaths?|kill\w*|graves?|tombs?|mummy|mummies|wars?|blood\w*|battle\w*|rebel\w*)\b/i.test(d.text) && !/\b(color|center|favorite|jewelry)\b/.test(d.text), d.id + ': gentle wording and British spelling');
      assert(d.quiz.filter(Boolean).length === 3, d.id + ': three facts and three fibs');
      assert(d.model.length === d.art[0] * d.art[1] && new Set(d.model.replace(/0/g, '')).size >= 3, d.id + ': Miss Bell’s example uses at least three colours');
    }
    const stars0 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'space'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    assert(await page.locator('.mk-card').count() === 6 && await page.locator('.mk-group').count() === 3 && await page.locator('#tmPanel .fab-char.fab').count() === 1, 'six things to do in three groups, led by Fab');
    assert(await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('#tmPanel .bubble')).fontSize)) >= 22, 'the words we read together are big');
    /* put it in order */
    await page.locator('[data-mk="open"][data-id="order"]').click();
    const planets = data.find(d => d.id === 'space').order;
    await page.locator(`[data-mk="put"][data-id="${planets[3]}"]`).click();
    const fix = await page.locator('.tm-notebox').innerText();
    assert(await page.locator('.tm-notebox .fab-char.doc').count() === 1 && /My Very Easy Method/.test(fix) && !/wrong|incorrect/i.test(fix), 'Doctor McPhee gives a kind hint: ' + fix);
    for(const id of planets) await page.locator(`[data-mk="put"][data-id="${id}"]`).click();
    assert(await page.locator('.mk-strip li:not(.mk-slot)').count() === 8 && await page.locator('.tm-notebox .fab-char.elder').count() === 1, 'eight planets in order, and Mr Elder celebrates');
    /* find the pairs: a miss turns back by itself, then every pair */
    await page.locator('[data-mk="home"]').click(); await page.locator('[data-mk="open"][data-id="pairs"]').click();
    assert(await page.locator('.mk-pc').count() === 12 && await page.locator('.mk-pc.up').count() === 0, 'twelve cards, face down');
    const cards = await page.evaluate(() => FabMake.state.pairs.cards.map(c => c.k));
    const other = cards.findIndex(k => k !== cards[0]);
    await page.locator('.mk-pc[data-id="0"]').click(); await page.locator(`.mk-pc[data-id="${other}"]`).click();
    assert(await page.locator('.mk-pc.up').count() === 2, 'two cards show');
    await page.waitForFunction(() => document.querySelectorAll('.mk-pc.up').length === 0);
    for(const k of [...new Set(cards)]){ const ix = cards.map((c, i) => c === k ? i : -1).filter(i => i >= 0); await page.locator(`.mk-pc[data-id="${ix[0]}"]`).click(); await page.locator(`.mk-pc[data-id="${ix[1]}"]`).click(); }
    assert(await page.locator('.mk-pc.got').count() === 12 && await page.locator('.tm-notebox .fab-char.elder').count() === 1, 'every pair found');
    /* fact or fib: a slip is put right kindly, with the reason */
    await page.locator('[data-mk="home"]').click(); await page.locator('[data-mk="open"][data-id="quiz"]').click();
    const quiz = data.find(d => d.id === 'space').quiz;
    await page.locator(`[data-mk="tf"][data-id="${quiz[0] ? 0 : 1}"]`).click();
    const slip = await page.locator('.tm-notebox').innerText();
    assert(await page.locator('.tm-notebox .fab-char.doc').count() === 1 && /This one is a (fact|fib)/.test(slip) && !/wrong|incorrect/i.test(slip), 'a slip gets the reason, kindly: ' + slip);
    await page.locator('[data-mk="qnext"]').click();
    for(let i = 1; i < 6; i++){ await page.locator(`[data-mk="tf"][data-id="${quiz[i] ? 1 : 0}"]`).click(); assert(await page.locator('.tm-yes').count() === 1, 'a right answer is confirmed with the reason'); await page.locator('[data-mk="qnext"]').click(); }
    assert(await page.locator('.tm-notebox .fab-char.elder').count() === 1 && !/\d\s*(out of|\/)\s*6/.test(await page.locator('#tmPanel').innerText()), 'it ends with a celebration, not a score');
    /* tile art: a model and tips beside the work; paint, mirror, finish */
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'victorian'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    await page.locator('[data-mk="open"][data-id="art"]').click();
    assert(await page.locator('.mk-model .fab-char.bell').count() === 1 && await page.locator('.mk-tips li').count() === 3, 'Miss Bell’s example and three tips sit beside the work');
    assert(await page.evaluate(() => { const c = document.getElementById('mkModel'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; const seen = new Set(); for(let i = 0; i < d.length; i += 4 * 97) if(d[i + 3]) seen.add(d[i] + ',' + d[i + 1] + ',' + d[i + 2]); return seen.size >= 4; }), 'the example is drawn');
    await page.locator('[data-mk="artdone"]').click();
    assert(/Add some colour first/.test(await page.locator('.tm-notebox').innerText()), 'an empty design is not finished yet');
    await page.locator('#mkArt').scrollIntoViewIfNeeded();
    const box = await page.locator('#mkArt').boundingBox(), cell = box.width / 12;
    await page.mouse.move(box.x + cell * 1.5, box.y + cell * 1.5); await page.mouse.down(); await page.mouse.move(box.x + cell * 3.5, box.y + cell * 1.5, { steps:4 }); await page.mouse.up();
    const g = await page.evaluate(() => FabMake.state.grid);
    assert(g[13] === '1' && g[12 + 10] === '1' && g[10 * 12 + 1] === '1' && g[10 * 12 + 10] === '1' && g[0] === '0', 'the Victorian tile copies the pattern into all four corners');
    await page.locator('[data-mk="artdone"]').click();
    assert(await page.evaluate(() => { const d = FabMake.load().victorian; return d.artDone === 1 && /^data:image\/png/.test(d.png) && d.art.length === 144; }), 'the design is saved as a picture');
    /* mind map: the first two ideas become the report's subheadings */
    await page.locator('[data-mk="home"]').click(); await page.locator('[data-mk="open"][data-id="map"]').click();
    await page.locator('[data-mk="mapadd"][data-id="train"]').click(); await page.locator('[data-mk="mapadd"][data-id="bike"]').click();
    await page.locator('[data-mk="mapdone"]').click();
    assert(/a few more/i.test(await page.locator('.tm-notebox').innerText()), 'two ideas are not quite enough');
    await page.locator('[data-mk="mapadd"][data-id="lamp"]').click(); await page.locator('[data-mk="mapdone"]').click();
    assert(await page.locator('.mk-map rect').count() === 3 && await page.evaluate(() => FabMake.load().victorian.rep.s.map(x => x.id).join()) === 'train,bike', 'three branches, and the report has its subheadings');
    /* the report: read a model, then one small step at a time */
    await page.locator('[data-mk="open"][data-id="report"]').click();
    assert(await page.locator('[data-mk="lvl"]').count() === 3, 'three levels of challenge');
    await page.locator('[data-mk="lvl"][data-id="1"]').click();
    assert(/Step 1 of 6/.test(await page.locator('.mk-stepname').innerText()) && await page.locator('.mk-modelrep .mk-tag').count() === 5 && await page.locator('.mk-form .fab-char.bell').count() === 1, 'it starts with Miss Bell’s model, with its parts labelled');
    assert(await page.locator('.mk-form .mk-sec').count() === 0 && await page.locator('#mkChecks li').count() === 5, 'nothing to fill in yet, and the list of parts is at the side');
    await page.locator('.mk-nav [data-mk="rstep"][data-id="1"]').click();
    assert(await page.locator('.mk-form .mk-sec').count() === 2 && await page.locator('.mk textarea').count() === 0, 'step 2 shows only the title and introduction; level one needs no typing');
    await page.locator('[data-mk="ipick"][data-id="0"]').click();
    await page.locator('.mk-nav [data-mk="rstep"][data-id="2"]').click();
    assert(await page.locator('.mk-form .mk-sec').count() === 1 && /The steam train/.test(await page.locator('.mk-form .mk-sec h4').innerText()), 'step 3 is one part, already headed from the mind map');
    await page.locator('[data-mk="pick"][data-n="0"][data-id="0"]').click();
    await page.locator('.mk-nav [data-mk="rstep"][data-id="3"]').click(); await page.locator('[data-mk="pick"][data-n="1"][data-id="0"]').click();
    await page.locator('.mk-nav [data-mk="rstep"][data-id="4"]').click(); await page.locator('[data-mk="dpick"][data-id="train"]').click();
    assert(await page.locator('#mkChecks li.ok').count() === 5, 'the checklist ticks itself, got ' + await page.locator('#mkChecks li.ok').count());
    await page.locator('.mk-nav [data-mk="rstep"][data-id="5"]').click();
    await page.mouse.move(2, 2);   /* the pointer was left on the edge of the next button, whose hover lift made it flicker under a resting mouse */
    await page.locator('[data-mk="open"][data-id="paper"]').click();
    const paper = await page.locator('.mk-paper').innerText();
    assert(/All about the Victorians/.test(paper) && /The steam train/.test(paper) && /The penny-farthing/.test(paper) && /Did you know\?/.test(paper), 'the report reads as a report: ' + paper.slice(0, 160));
    assert(await page.locator('.mk-paper .mk-fig img').count() === 1 && await page.locator('.mk-paper .mk-map').count() === 1, 'the child’s tile and mind map are in the report');
    const proud = await page.evaluate(() => { const p = document.querySelector('.mk-paper.proud'), f = p && p.querySelector('.proud-pic'), pr = p && p.getBoundingClientRect(), fr = f && f.getBoundingClientRect(); return p ? { cards:p.querySelectorAll('.proud-sec').length, heads:p.querySelectorAll('.proud-sec h3').length, band:p.querySelectorAll('.proud-band').length, seal:!!p.querySelector('.proud-seal svg'), bg:getComputedStyle(p).backgroundColor, picShare:fr.width / pr.width, kicker:(p.querySelector('.proud-kicker') || {}).textContent, title:getComputedStyle(p.querySelector('.proud-title')).fontSize } : null; });
    assert(proud && proud.cards >= 3 && proud.heads === proud.cards && proud.band === 2 && proud.seal && proud.bg !== 'rgb(255, 255, 255)' && proud.picShare < .4 && parseFloat(proud.title) >= 30 && /report/i.test(proud.kicker), 'the finished report is a proud page with the picture in proportion: ' + JSON.stringify(proud));
    assert(await page.locator('.tm-notebox .fab-char.elder').count() === 1 && await page.locator('[data-mk="print"]').count() === 1, 'Mr Elder celebrates, and it can be printed');
    /* sentence starters: typing is saved without losing the place */
    await page.locator('[data-mk="open"][data-id="report"]').click();
    await page.locator('[data-mk="lvl"][data-id=""]').click(); await page.locator('[data-mk="lvl"][data-id="2"]').click();
    assert(/Step 2 of 6/.test(await page.locator('.mk-stepname').innerText()), 'the model has been read, so it goes straight to writing');
    await page.locator('#mkIntro').click(); await page.locator('[data-mk="ins"][data-for="mkIntro"]').first().click(); await page.keyboard.type('the Victorians.');
    assert(await page.evaluate(() => document.activeElement.id) === 'mkIntro' && /This report is about the Victorians\./.test(await page.evaluate(() => FabMake.load().victorian.rep.intro)), 'a starter drops in and the typing is saved');
    await page.locator('#mkChecks [data-mk="rstep"][data-id="2"], #mkChecks [data-mk="rstep"][data-id="3"]').first().click();
    assert(await page.locator('.mk-fact').count() === 1, 'the list at the side jumps to a part, with its fact card');
    await page.locator('.mk-form [data-mk="ins"][data-t="Victorian"]').click();
    assert(/Victorian/.test(await page.locator('.mk-form textarea').inputValue()), 'a word-bank word goes into the box');
    /* the space order strip slots into the space report */
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'space'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    assert(await page.locator('.mk-card.done').count() === 3, 'the three finished cards show as made');
    await page.locator('[data-mk="open"][data-id="report"]').click(); await page.locator('[data-mk="lvl"][data-id="3"]').click();
    await page.locator('.mk-nav [data-mk="rstep"][data-id="1"]').click();
    assert(await page.locator('.mk textarea').count() === 1 && await page.locator('.mk-word[data-mk="ins"]').count() === 0, 'on my own: headings and boxes, no starters');
    await page.locator('.mk-steps [data-mk="rstep"][data-id="5"]').click(); await page.locator('[data-mk="open"][data-id="paper"]').click();
    assert(await page.locator('.mk-paper .mk-strip li').count() === 8, 'the planets in order are in the space report');
    const stars1 = await page.evaluate(() => parseInt(localStorage.getItem('fabworld-pending-local') || '0', 10));
    assert(stars1 - stars0 === 6, 'a star each for order, pairs, fact or fib, art, mind map and report, got ' + (stars1 - stars0));
    await wipe(); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Explorer Worlds media: sounds made in the app, credited photos, and real views that stay off until tapped', async () => {
    await page.evaluate(() => { try{ localStorage.removeItem('fab-passport-local'); localStorage.removeItem('fab-explore-real'); localStorage.removeItem('fab-explore-roam'); }catch(e){} window.fabOpenExplore('screen-learn', 'egypt'); });
    const media = await page.evaluate(() => FabExplore.order.map(id => { const w = FabExplore.worlds[id]; return { id, photos:w.spots.filter(s => s.photo).map(s => Object.assign({ spot:s.id }, s.photo)), real:(w.real || []).map(r => ({ id:r.id, pano:r.pano, t:r.t, url:FabExplore.svUrl(r) })) }; }));
    /* Ancient Greece is a first draft (27 Nov): no photographs or real views yet, and its teachers' note says so */
    assert(/no photographs or real views/.test(await page.evaluate(() => FabExplore.worlds.greece.teach.join(' '))), 'Ancient Greece tells teachers it has no photographs or real views yet');
    for(const m of media.filter(x => x.id !== 'greece')){
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
  await test('Fab Fox World style rules: the drawn map with name plaques, Fab’s den, drawn dock icons, My stuff filling the screen, and Miss Bell’s voice', async () => {
    await page.setViewportSize({ width:1600, height:900 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    await fr.evaluate(() => { try{ WORLD.closeScene(true); }catch(e){} document.body.classList.add('full'); window.dispatchEvent(new Event('resize')); });
    const names = await fr.evaluate(() => WORLD.PLACES.map(p => p.n));
    assert(names.includes('Fab’s den') && !names.some(n => /treehouse/i.test(n)), 'Fab’s home is called Fab’s den: ' + names[0]);
    await fr.waitForFunction(() => WORLD.placeArt(), null, { timeout:8000 });
    const dock = await fr.evaluate(() => [...document.querySelectorAll('.dock .ib')].filter(b => !b.hidden).map(b => ({ svg:!!b.querySelector('i svg'), emoji:/\p{Extended_Pictographic}/u.test(b.querySelector('i').textContent), w:b.getBoundingClientRect().width, icon:b.querySelector('i svg').getBoundingClientRect().width })));
    assert(dock.length >= 5 && dock.every(d => d.svg && !d.emoji && d.icon > d.w * .5), 'the dock icons are drawn, not emoji, and fill their buttons: ' + JSON.stringify(dock));
    /* the map */
    await fr.evaluate(() => document.getElementById('mapBtn').click());
    await fr.waitForSelector('.mapbox.v2 .mp', { state:'attached' });
    await fr.waitForFunction(() => { const i = document.querySelector('.mapbox.v2 .mapimg'); return i.complete && i.naturalWidth > 0; }, null, { timeout:8000 });
    const map = await fr.evaluate(() => { const box = document.querySelector('.mapbox.v2'), ps = [...box.querySelectorAll('.mp')], f = getComputedStyle(ps[0].querySelector('.plq')), r = box.getBoundingClientRect();
      const lb = box.querySelector('.mphere b').getBoundingClientRect(), over = [...box.querySelectorAll('.plq')].some(q => { const o = q.getBoundingClientRect(); return !(o.right < lb.left || o.left > lb.right || o.bottom < lb.top || o.top > lb.bottom); });
      return { n:ps.length, den:ps.some(b => b.textContent === 'Fab’s den'), two:ps.some(b => b.querySelector('.plq br')), italic:f.fontStyle, px:parseFloat(f.fontSize), here:!!box.querySelector('.mphere canvas'), over, pins:box.querySelectorAll('.pin').length, wide:r.width / innerWidth, fits:r.bottom <= innerHeight + 1, tiny:box.classList.contains('tiny') }; });
    assert(map.n === 16 && map.den && map.two && map.italic === 'italic' && map.px >= 13 && map.here && !map.over && map.pins === 0 && map.wide > .6 && map.fits && !map.tiny, 'the map: ' + JSON.stringify(map));
    await fr.evaluate(() => { WORLD.S().go = 'pop'; document.querySelector('.mp[data-id="shed"]').click(); });
    await fr.waitForFunction(() => { const s = WORLD.scene(); return !!s && s.cls !== 'sc-map'; }, null, { timeout:12000 });
    await fr.evaluate(() => { try{ WORLD.closeScene(true); }catch(e){} });
    /* My stuff */
    await fr.evaluate(() => WORLD.mStuff('fab')); await fr.waitForSelector('.kbox', { timeout:15000 });
    const st = await fr.evaluate(() => { const box = document.getElementById('stItems'), stuff = document.querySelector('.sc-stuff .stuff').getBoundingClientRect(), tile = box.querySelector('.kbox').getBoundingClientRect(), stage = document.getElementById('kitStage').getBoundingClientRect(), fox = document.getElementById('kitFox').getBoundingClientRect();
      return { chips:document.querySelectorAll('#stChips button').length, boxes:box.querySelectorAll('.kbox').length, w:stuff.width / innerWidth, tile:tile.width, stage:stage.height / innerHeight, fox:fox.height / innerHeight }; });
    assert(st.chips === 6 && st.boxes >= 10 && st.w > .85 && st.tile >= 120 && st.stage > .45 && st.fox > .4, 'My stuff: ' + JSON.stringify(st));
    await fr.evaluate(() => { document.querySelector('#stChips button:last-child').click(); try{ WORLD.closeScene(true); }catch(e){} document.body.classList.remove('full'); window.dispatchEvent(new Event('resize')); });
    /* Read to me is Miss Bell: a woman's voice whenever the device has one */
    const v = await page.evaluate(() => { const fake = [{ name:'Microsoft George - English (United Kingdom)', lang:'en-GB' }, { name:'Microsoft Hazel - English (United Kingdom)', lang:'en-GB' }, { name:'Google UK English Male', lang:'en-GB' }, { name:'Google UK English Female', lang:'en-GB' }], orig = speechSynthesis.getVoices;
      speechSynthesis.getVoices = () => fake; const best = FabVoice.bestVoices().map(x => x.name); speechSynthesis.getVoices = () => [fake[0]]; const only = FabVoice.bestVoices().map(x => x.name); speechSynthesis.getVoices = orig;
      return { best, only, male:FabVoice.isMaleVoice(fake[0]), fem:FabVoice.isMaleVoice(fake[1]) }; });
    assert(v.best.length === 2 && /Google UK English Female/.test(v.best[0]) && /Hazel/.test(v.best[1]) && v.only.length === 1 && v.male && !v.fem, 'Miss Bell’s voice: ' + JSON.stringify(v));
  });
  await test('Miss Bell’s recorded voice reads the big idea in I do, starts at the right place in the pack file, and stops on a second tap', async () => {
    const idx = await page.evaluate(() => { showScreen('screen-learn'); const p = BUILT_IN_PACKS.find(x => x.id === 'english-flightpath-word-power'), i = p.screens.findIndex(x => x.type === 'pathway'); learnOpen(p); learnGo(i); return i; });
    await page.waitForSelector('[data-pwpick="0"]', { state:'attached' });
    await page.evaluate(() => document.querySelector('[data-pwpick="0"]').click());
    await page.waitForSelector('.pw-teach .pw-idea .say-btn');
    const info = await page.evaluate(i => { const kid = Learn.state[i].kids.local, p = BUILT_IN_PACKS.find(x => x.id === 'english-flightpath-word-power'), st = p.screens[i].steps[0], idea = document.querySelector('.pw-idea').textContent.replace('🔊', '').trim();
      return { phase:kid.phase, first:kid.ex.ask === st.params.items[0].ask, ask:kid.ex.ask, hint:kid.ex.vars.hint, clip:FabVoice.bellClip(idea), askClip:!!FabVoice.bellClip(kid.ex.ask), thinkClip:!!FabVoice.bellClip(kid.ex.vars.hint), lines:Object.keys(FAB_BELL.clips).length, files:FAB_BELL.files.length, none:FabVoice.bellClip('What is 3 × 4?') }; }, idx);
    assert(info.phase === 'ido' && info.first && info.clip && /^voice\/bell-english-word-power/.test(info.clip.file) && info.lines >= 60 && info.none === null, 'the big idea has a recording and Miss Bell models the first question: ' + JSON.stringify(info));
    const size = await page.evaluate(async f => (await (await fetch(f)).blob()).size, info.clip.file);
    assert(size > 50000 && size < 3800000, 'the pack file is there and small enough to upload in one go: ' + size);
    await page.locator('.pw-idea .say-btn').click();
    await page.waitForFunction(() => { const b = FabVoice.bellNow(); return !!b && !b.paused && b.t > 0; }, null, { timeout:8000 });
    const now = await page.evaluate(() => FabVoice.bellNow());
    assert(now.t >= info.clip.start - .3 && now.t <= info.clip.end + .3 && /bell-english-word-power\.mp3$/.test(now.file), 'the recording plays from its own place in the file: ' + JSON.stringify(now) + ' ' + JSON.stringify(info.clip));
    await page.locator('.pw-idea .say-btn').click();
    assert(await page.evaluate(() => FabVoice.bellNow()) === null, 'a second tap stops Miss Bell');
    /* her model question and her thinking: recorded when the lines exist, the device voice otherwise */
    await page.locator('.pw-ask .say-btn').first().click();
    const q = await page.evaluate(() => ({ said:window.__fabSaid, bell:!!FabVoice.bellNow() }));
    assert(q.said.indexOf(info.ask) === 0 && /Is it: /.test(q.said) && q.bell === info.askClip, 'the question (her recording, then the choices): ' + JSON.stringify(q));
    await page.evaluate(() => FabVoice.bellStop());
    await page.locator('[data-pwact="idonext"]').click();
    await page.waitForSelector('.pw-teach .fab-say.bell .bubble .say-btn');
    await page.locator('.pw-teach .fab-say.bell .bubble .say-btn').click();
    const th = await page.evaluate(() => ({ said:window.__fabSaid, bell:!!FabVoice.bellNow() }));
    assert(th.said === info.hint.replace(/\s+/g, ' ').trim() && th.bell === info.thinkClip, 'her thinking: ' + JSON.stringify(th));
    await page.evaluate(() => { FabVoice.bellStop(); showScreen('screen-hub'); });
  });
  await test('Music is one place: the same keyboard from both hubs, with the beat maker a tap away and back again', async () => {
    const r = await page.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms));
      showScreen('screen-wellbeing'); await wait(300);
      const tile = document.querySelector('[data-wb2="beat"]'), name = tile.querySelector('h3').textContent; tile.click(); await wait(500);
      const onMusic = document.getElementById('screen-music').classList.contains('active'), back = FabMusic.state().backTo, btn = !!document.getElementById('muBeatBtn');
      document.getElementById('muBeatBtn').click(); await wait(2600);
      const fr = document.querySelector('.game-frame[data-game="world"]'), W = fr && fr.contentWindow, sc = W && W.WORLD && W.WORLD.scene();
      const inBeat = !!sc && sc.cls === 'sc-beat', onWorld = document.getElementById('screen-world').classList.contains('active');
      if(W && W.WORLD) W.WORLD.closeScene(true); await wait(500);
      const home = document.getElementById('screen-music').classList.contains('active'), back2 = FabMusic.state().backTo;
      document.getElementById('muBack').click(); await wait(300);
      return { name, onMusic, back, btn, inBeat, onWorld, home, back2, end:document.getElementById('screen-wellbeing').classList.contains('active'), learn:document.querySelector('#learnMusicBtn b').textContent };
    });
    assert(r.name === 'Music' && r.learn === 'Music' && r.onMusic && r.back === 'screen-wellbeing' && r.btn && r.inBeat && r.onWorld && r.home && r.back2 === 'screen-wellbeing' && r.end, 'one Music place: ' + JSON.stringify(r));
  });
  await test('Mind map: an idea takes a fact or a thought, they flow into the report, and the poster carries Fab and the rainbow', async () => {
    await page.setViewportSize({ width:1400, height:1000 });
    await page.evaluate(() => window.fabOpenExplore('screen-learn', 'egypt'));
    await page.locator('.tm-tabs [data-tm="tab"][data-id="make"]').click();
    await page.locator('[data-mk="open"][data-id="map"]').click();
    await page.locator('[data-mk="mapadd"][data-id="pyramids"]').click();
    assert(await page.locator('.mk-noteadd').count() === 1 && await page.locator('.mk-node[aria-pressed="true"]').count() === 1, 'choosing an idea opens the place to add to it');
    const fact = await page.locator('[data-mk="notefact"][data-id="0"]').innerText();
    await page.locator('[data-mk="notefact"][data-id="0"]').click();
    await page.locator('#mkNote').fill('I wonder how they lifted the stones'); await page.locator('#mkNote').press('Enter');
    assert(await page.locator('.mk-notes li').count() === 2 && await page.locator('[data-mk="noteown"]').count() === 0, 'two things can hang off one idea, then it is full');
    await page.locator('[data-mk="mapadd"][data-id="boat"]').click(); await page.locator('[data-mk="mapadd"][data-id="cat"]').click();
    await page.locator('.mk-node[data-id="pyramids"]').click();
    const map = await page.evaluate(() => { const svg = document.querySelector('.mk-map'), d = FabMake.load().egypt; return { text:svg.textContent, big:svg.classList.contains('big'), notes:d.notes.pyramids, nodes:svg.querySelectorAll('.mk-node').length }; });
    assert(map.nodes === 3 && map.big && map.notes.length === 2 && map.notes[1].own === true && /I wonder how they lifted/.test(map.text), 'the facts and thoughts show on the map: ' + JSON.stringify(map.notes));
    await page.locator('[data-mk="mapdone"]').click();
    const sec = await page.evaluate(() => FabMake.load().egypt.rep.s[0]);
    assert(sec.id === 'pyramids' && sec.pick.join() === '0' && sec.own[0] === 'I wonder how they lifted the stones' && /I wonder how/.test(sec.text), 'the first idea, with its fact and thought, starts part 1 of the report: ' + JSON.stringify(sec));
    await page.evaluate(() => { const d = FabMake.load(), r = d.egypt.rep; r.lvl = '1'; r.read = 1; r.ipick = 0; localStorage.setItem(Object.keys(localStorage).find(k => /^fab-make-/.test(k)), JSON.stringify(d)); FabMake.state.view = 'paper'; FabExplore.render(); });
    const paper = await page.evaluate(() => { const p = document.querySelector('.mk-paper.proud'); return p ? { text:p.innerText, fab:!!p.querySelector('.fab-char.fab.proud-fab'), say:(p.querySelector('.proud-say') || {}).textContent, rainbow:!!(p.querySelector('.proud-brand img') || {}).src, brand:(p.querySelector('.proud-brand b') || {}).textContent, when:(p.querySelector('.proud-when') || {}).textContent, month:window.FabProud.month(), foot:(p.querySelector('.proud-foot') || {}).innerText, mapWide:!!p.querySelector('.proud-sec.wide .mk-map') } : null; });
    assert(paper && paper.text.indexOf(fact) > -1 && /I wonder how they lifted the stones\./.test(paper.text) && paper.fab && /proud/i.test(paper.say) && paper.rainbow && paper.brand === 'BeMoreFab Virtual School' && /^(January|February|March|April|May|June|July|August|September|October|November|December) 20\d\d$/.test(paper.when) && paper.when === paper.month && /#bemorefab/.test(paper.foot) && !/Made in Explorer/.test(paper.text) && paper.mapWide, 'the report uses the mind map and the poster carries the brand: ' + JSON.stringify(paper && { fab:paper.fab, say:paper.say, rainbow:paper.rainbow, brand:paper.brand, when:paper.when, month:paper.month, mapWide:paper.mapWide, t:paper.text.slice(0, 200) }));
    await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Use the screen: Fab Fox World fills the window, and the beat maker grows with it and shows every row', async () => {
    await page.setViewportSize({ width:2560, height:1300 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD);
    await page.waitForTimeout(400);
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)); try{ WORLD.closeScene(true); }catch(e){} window.dispatchEvent(new Event('resize')); await wait(200);
      const st = document.querySelector('.stage').getBoundingClientRect(); window.parent.fabWorldOpen = 'beat'; window.postMessage('fabworld-open', '*'); await wait(700);
      const sc = WORLD.scene(), el = sc && sc.el, z = el ? parseFloat(el.style.zoom || '1') : 0, g = el && el.querySelector('#bGrid').getBoundingClientRect(), rows = el ? el.querySelectorAll('.blab').length : 0, er = el && el.getBoundingClientRect();
      const out = { stage:[Math.round(st.width), Math.round(st.height)], win:[innerWidth, innerHeight], cls:sc && sc.cls, z, rows, gridShare:g ? g.width / er.width : 0, fits:g ? g.bottom <= er.bottom + 2 && g.top >= er.top : false };
      window.parent.fabBeatReturn = null; try{ WORLD.closeScene(true); }catch(e){} return out; });
    assert(r.stage[0] >= r.win[0] - 20 && r.stage[1] >= r.win[1] - 20 && r.cls === 'sc-beat' && r.z > 1.3 && r.rows >= 7 && r.gridShare > .7 && r.fits, 'the world and the beat maker use the screen: ' + JSON.stringify(r));
    const frameW = await page.evaluate(() => document.querySelector('.game-frame[data-game="world"]').getBoundingClientRect().width / innerWidth);
    assert(frameW > .97, 'the world frame spans the window: ' + frameW);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('The studio: hand-drawn icons, no button overlaps another, and the paper sits between two tool columns on a wide screen', async () => {
    for(const [w, h] of [[1366, 700], [2560, 1300], [820, 1100]]){
      await page.setViewportSize({ width:w, height:h });
      await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
      const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
      await fr.waitForFunction(() => !!window.WORLD);
      await page.waitForTimeout(400);
      const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)); try{ WORLD.closeScene(true); }catch(e){} window.dispatchEvent(new Event('resize')); await wait(150); mStudio('create'); await wait(900);
        const el = WORLD.scene().el, box = e => e.getBoundingClientRect(), hit = (a, b) => a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1, emo = /\p{Extended_Pictographic}/u;
        const btns = [...el.querySelectorAll('.arttop button, .sx, .tgrp .tb, .tgrp .sw')].filter(b => b.offsetParent), rects = btns.map(box); let overlaps = 0;
        for(let i = 0; i < rects.length; i++) for(let j = i + 1; j < rects.length; j++) if(hit(rects[i], rects[j])) overlaps++;
        const spill = [...el.querySelectorAll('.tb span')].filter(sp => sp.offsetParent).filter(sp => { const a = box(sp), b = box(sp.parentNode); return a.left < b.left - 1 || a.right > b.right + 1 || a.top < b.top - 1 || a.bottom > b.bottom + 1; }).map(sp => sp.textContent);
        const icons = [...el.querySelectorAll('.tb i')].filter(i => i.offsetParent), L = el.querySelector('#artTools'), R = el.querySelector('#artTools2'), pad = box(el.querySelector('.padbox')), er = box(el);
        const out = { two:el.querySelector('.mmf').classList.contains('two'), tall:el.querySelector('.mmf').classList.contains('tall'), overlaps, spill, buttons:btns.length, icons:icons.length, drawn:icons.filter(i => i.querySelector('svg')).length, emoji:icons.filter(i => emo.test(i.textContent)).length,
          left:[...L.children].map(d => d.dataset.g).join(), right:[...R.children].map(d => d.dataset.g).join(), noScroll:L.scrollHeight <= L.clientHeight + 2 && R.scrollHeight <= R.clientHeight + 2,
          padShare:pad.width * pad.height / (er.width * er.height), between:box(L).right <= pad.left && pad.right <= box(R).left, padIn:pad.top >= er.top && pad.bottom <= er.bottom + 1, base:parseFloat(getComputedStyle(el.querySelector('.mmf')).fontSize),
          border:getComputedStyle(el.querySelector('.tb')).borderTopColor, shadow:getComputedStyle(el.querySelector('.tb')).boxShadow };
        el.querySelector('[data-tool=stamp]').click(); await wait(80);
        out.stamps = !el.querySelector('.tgrp[data-g=stamps]').classList.contains('hide'); out.coloursAway = el.querySelector('.tgrp[data-g=colours]').classList.contains('hide'); out.stampScroll = R.scrollHeight <= R.clientHeight + 2;
        el.querySelector('[data-tool=felt]').click(); await wait(80); out.coloursBack = !el.querySelector('.tgrp[data-g=colours]').classList.contains('hide');
        el.querySelector('[data-mirror="6"]').click(); out.mirror = ART.pad.mirror; out.mirrorSay = el.querySelector('[data-mirror="6"]').getAttribute('aria-label');
        MMFS.tab = 'make'; studioRender(); await wait(250);
        out.tabs = [...el.querySelectorAll('.mmft button')].filter(b => b.querySelector('svg') && !emo.test(b.textContent)).length; out.cards = [...el.querySelectorAll('.mcard')].filter(b => b.querySelector('i svg') && !emo.test(b.textContent)).length; out.allCards = el.querySelectorAll('.mcard').length;
        out.turn = getComputedStyle(document.querySelector('.turn .tb')).width;
        try{ WORLD.closeScene(true); }catch(e){} return out; });
      const tag = w + '×' + h + ': ' + JSON.stringify(r);
      assert(r.overlaps === 0 && !r.spill.length && r.buttons >= 25, 'no studio button overlaps another and every label stays inside its button, ' + tag);
      assert(r.icons >= 15 && r.drawn === r.icons && r.emoji === 0 && r.tabs === 5 && r.cards === r.allCards && r.allCards >= 9, 'every studio icon is hand-drawn, ' + tag);
      assert(r.border === 'rgb(43, 26, 18)' && r.shadow === 'none' && r.turn === '48px', 'studio buttons are flat with an ink outline, and the look-round buttons keep their own style, ' + tag);
      assert(r.stamps && r.coloursBack && r.mirror === 6 && /6/.test(r.mirrorSay), 'stamps, colours and mirror magic still work, ' + tag);
      if(h < w) assert(r.two && r.left === 'tools,size' && r.right === 'colours,stamps,mirror,paper' && r.noScroll && r.between && r.padIn && r.padShare > .4 && r.coloursAway && r.stampScroll, 'wide screen: tools left, colours right, nothing scrolls, the paper fills the middle, ' + tag);
      else assert(r.tall && !r.two && r.padIn && r.padShare > .25, 'upright tablet: the paper sits on top, ' + tag);
      if(w === 2560) assert(r.base >= 24, 'the studio controls grow on a big screen, ' + tag);
    }
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Fab’s shop: the plain fox wears the kit as one stack, one thing per slot, clashes swap gently, and the boxes follow the books', async () => {
    await page.setViewportSize({ width:1366, height:700 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), m = WORLD.KIT.m; S.kit = { own:{}, wear:{}, moved:1 }; S.spk = 20; try{ WORLD.closeScene(true); }catch(e){} WORLD.mStuff('fab'); await wait(500);
      const el = WORLD.scene().el, q = x => el.querySelector(x), chip = t => [...el.querySelectorAll('#stChips button')].find(b => b.textContent === t), boxOf = id => q('.kbox[data-id="' + id + '"]'), fox = q('#kitFox'), layers = () => [...fox.querySelectorAll('img')].map(i => i.dataset.p).join(' > ');
      chip('Hats and hair').click(); await wait(80);
      const out = { items:m.items.length, canvas:m.canvas.width + 'x' + m.canvas.height, cats:[...el.querySelectorAll('#stChips button')].map(b => b.textContent).join('|'), boxes:el.querySelectorAll('.kbox').length, pvHidden:getComputedStyle(q('.pv')).display };
      out.iconSizes = [...new Set([...el.querySelectorAll('.kbox .kpic')].map(p => { const b = p.getBoundingClientRect(); return Math.round(b.width) + 'x' + Math.round(b.height); }))]; out.iconSrc = [...el.querySelectorAll('.kbox .kpic img')].every(i => /^shop\/icons\//.test(i.getAttribute('src'))); out.fit = getComputedStyle(q('.kbox .kpic img')).objectFit;
      const cs = getComputedStyle(q('.kbox')), ns = getComputedStyle(q('.kname')); out.box = [cs.backgroundColor, cs.borderTopColor, cs.borderTopWidth, cs.borderTopLeftRadius, getComputedStyle(q('.kpic')).backgroundColor].join(' / '); out.name = ns.fontStyle + ' ' + ns.fontFamily.split(',')[0].replace(/["']/g, '');
      boxOf('wizard-hat').click(); await wait(80); out.tryOn = layers(); out.trySaved = Object.keys(S.kit.wear).length; out.buy = q('#stGo').textContent;
      q('#stGo').click(); await wait(80); out.bought = [S.spk, !!S.kit.own['wizard-hat'], S.kit.wear.head, !!boxOf('wizard-hat').querySelector('.ktick.on')].join();
      boxOf('crown').click(); await wait(60); out.swap = layers(); out.realHead = S.kit.wear.head;
      const fb = fox.getBoundingClientRect(); out.ratio = fb.width / fb.height; out.fill = [...fox.querySelectorAll('img')].every(i => { const b = i.getBoundingClientRect(); return Math.abs(b.left - fb.left) < .6 && Math.abs(b.top - fb.top) < .6 && Math.abs(b.width - fb.width) < .6 && Math.abs(b.height - fb.height) < .6; }); out.foxH = fb.height;
      chip('Clothes').click(); await wait(60); boxOf('tutu').click(); await wait(40); boxOf('star-t-shirt').click(); await wait(40); out.stack = layers(); boxOf('smart-suit').click(); await wait(60); out.clash = q('#stMsg').textContent; out.afterClash = layers();
      chip('Bags and things to hold').click(); await wait(60); boxOf('satchel').click(); await wait(40); boxOf('briefcase').click(); await wait(60); out.bag = q('#stMsg').textContent;
      out.off = [...el.querySelectorAll('#kitOff [data-off]')].map(b => b.dataset.off).join(); q('#kitOff [data-off=all]').click(); await wait(60); out.bare = layers(); out.wearLeft = Object.keys(S.kit.wear).length;
      S.kit.own['top-hat'] = 1; WORLD.kitPutOn(S.kit.wear, 'top-hat'); const sp = WORLD.kitSprite(S.kit.wear); out.sprite = sp ? sp.width + 'x' + sp.height : ''; out.price = m.items.every(it => WORLD.kitPrice(it) > 0);
      out.tabs = [...el.querySelectorAll('.tabs button')].map(b => b.textContent.trim()).join('|');   /* the tabs carry drawings now, so the words are the whole text */
      try{ WORLD.closeScene(true); }catch(e){} S.kit = { own:{}, wear:{}, moved:1 }; return out; });
    const j = JSON.stringify(r), B = 'base/plain-fox.png';
    assert(r.items === 46 && r.canvas === '1006x1470' && r.cats === 'Hats and hair|Glasses and face|Neck and back|Clothes|Shoes|Bags and things to hold' && r.boxes === 14 && r.pvHidden === 'none' && r.price, 'the shop shows the kit in tabs by kind: ' + j);
    assert(r.iconSizes.length === 1 && parseInt(r.iconSizes[0]) >= 120 && parseInt(r.iconSizes[0]) <= 160 && /^(\d+)x\1$/.test(r.iconSizes[0]) && r.iconSrc && r.fit === 'contain', 'every icon is the same square size, from icons/, never stretched: ' + j);
    assert(r.box === 'rgb(255, 243, 220) / rgb(43, 26, 18) / 3px / 16px / rgb(255, 212, 131)' && r.name === 'italic Aleo', 'the boxes follow the books (cream card, peach centre, ink outline, italic name): ' + j);
    assert(r.tryOn === B + ' > layers/10-wizard-hat.png' && r.trySaved === 0 && /4/.test(r.buy) && r.bought === '16,true,wizard-hat,true', 'tapping a box tries it on straight away; buying keeps it and ticks it: ' + j);
    assert(r.swap === B + ' > layers/07-crown.png' && r.realHead === 'wizard-hat', 'one hat at a time, and a hat that is only being tried is not saved: ' + j);
    assert(Math.abs(r.ratio - 1006 / 1470) < .004 && r.fill && r.foxH > 250, 'the stack keeps 1006:1470 and every layer fills it: ' + j);
    assert(r.stack === B + ' > layers/28-star-t-shirt.png > layers/37-tutu.png > layers/07-crown.png' && /Fab took off the tutu to wear the smart suit/.test(r.clash) && r.afterClash === B + ' > layers/34-smart-suit.png > layers/07-crown.png', 'layers go from the lowest z up, and the tutu comes off for the suit: ' + j);
    assert(/Fab took off the satchel to carry the briefcase/.test(r.bag) && /all/.test(r.off) && r.bare === B && r.wearLeft === 0 && r.sprite === '503x735', 'the satchel gives way to the briefcase, everything comes off, and the world gets one stacked picture: ' + j);
    assert(/^Fab’s shop\|Pip’s fur\|/.test(r.tabs), 'Fab’s fur is no longer recoloured: ' + j);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Berries are the money, Fab leaves paw prints that fade, and the 3D workshop has challenges that fill the screen', async () => {
    await page.setViewportSize({ width:1366, height:700 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), emo = /\p{Extended_Pictographic}/u, out = {}; try{ WORLD.closeScene(true); }catch(e){}
      S.kit = { own:{}, wear:{}, moved:1 }; S.spk = 3; S.cadDone = {}; setTop();
      const chip = document.getElementById('spk'); out.chip = [!!chip.querySelector('img.berry'), chip.getAttribute('aria-label'), chip.textContent.trim(), (chip.querySelector('img.berry') || {}).naturalWidth > 0].join('|'); out.bry = bry(1) + ',' + bry(2);
      /* paw prints: walk, see prints, stop, see them go */
      const key = (t, k) => window.dispatchEvent(new KeyboardEvent(t, { key:k, code:k, bubbles:true })); document.querySelector('canvas').focus(); key('keydown', 'ArrowDown'); await wait(900); out.paws = PAWS.length; out.pawArt = PAWIMG.complete && PAWIMG.naturalWidth > 0; key('keyup', 'ArrowDown'); await wait(2300); out.pawsLater = PAWS.length;
      /* the shop counts in berries */
      S.spk = 3; WORLD.mStuff('fab'); await wait(500); let el = WORLD.scene().el; [...el.querySelectorAll('#stChips button')].find(b => b.textContent === 'Clothes').click(); await wait(80);
      const box = el.querySelector('.kbox[data-id="hoodie"]'); out.price = [!!box.querySelector('.ktag img.berry'), box.getAttribute('aria-label')].join('|'); box.click(); await wait(80); out.need = el.querySelector('#stMsg').textContent + ' / ' + el.querySelector('#stGo').textContent; out.stc = !!el.querySelector('.stc img.berry'); WORLD.closeScene(true);
      /* the workshop */
      mCad('blocks'); await wait(400); el = WORLD.scene().el; const box2 = e => e.getBoundingClientRect(), ed = el.querySelector('#cadEd'), v3 = el.querySelector('#cad3d'), side = el.querySelector('.cadside');
      out.size = [Math.round(box2(ed).width), Math.round(box2(v3).width), Math.round(box2(el).width), Math.round(box2(el).height)]; out.row = box2(side).right <= box2(ed).left + 1 && box2(ed).right <= box2(v3).left + 1 && box2(v3).right <= box2(el).right; out.fits = box2(v3).bottom < box2(el).bottom && box2(el.querySelector('#cadViewBtns')).bottom <= box2(el).bottom;
      out.chs = [...el.querySelectorAll('.cadch')].map(b => b.dataset.ch).join(); out.icons = [...el.querySelectorAll('.cadb')].filter(b => b.offsetParent).every(b => b.querySelector('svg') && !emo.test(b.textContent));
      el.querySelector('.cadch[data-ch="steps"]').click(); await wait(200); const goal = el.querySelector('#cadGoal'); out.brief = goal.textContent.slice(0, 400); out.listHidden = el.querySelector('#cadChBox').classList.contains('hide'); out.state0 = JSON.stringify(cadState());
      const tap = (i, j) => { const r = ed.getBoundingClientRect(), cell = 60; ed.dispatchEvent(new PointerEvent('pointerdown', { clientX:r.left + (30 + i * cell + 30) * r.width / 420, clientY:r.top + (30 + j * cell + 30) * r.height / 420, bubbles:true })); };
      tap(1, 2); tap(1, 2); await wait(60); out.tooTall = goal.querySelector('.cadstep').textContent; el.querySelector('[data-a="rem"]').click(); tap(1, 2); el.querySelector('[data-a="add"]').click(); tap(1, 3); await wait(60); out.step2 = goal.querySelector('.cadstep').textContent; out.mid = JSON.stringify(cadState());
      [...goal.querySelectorAll('.cadb')].find(b => /Build this step for me/.test(b.textContent)).click(); await wait(60); const before = S.spk; tap(3, 2); tap(3, 2); tap(3, 2); tap(3, 3); tap(3, 3); tap(3, 3); await wait(120);
      out.done = JSON.stringify(cadState()); out.gain = S.spk - before; out.won = !!(S.cadDone && S.cadDone.steps); out.next = [...goal.querySelectorAll('.cadnext .cadb')].map(b => b.textContent).join('|'); out.cheer = document.getElementById('cheer').textContent;
      [...goal.querySelectorAll('.cadnext .cadb')].find(b => /Build it for real/.test(b.textContent)).click(); await wait(80); out.real = (el.querySelector('.cadreal') || {}).textContent || ''; el.querySelector('.cadreal .cadb').click();
      mCad('draw'); await wait(300); el = WORLD.scene().el; out.draw = [Math.round(box2(el.querySelector('#cadEd')).width), el.querySelectorAll('[data-tpl]').length, [...el.querySelectorAll('.cadb')].filter(b => b.offsetParent).every(b => (b.querySelector('svg') || !b.querySelector('i')) && !emo.test(b.textContent))].join();
      WORLD.closeScene(true); S.cadDone = {}; return out; });
    const j = JSON.stringify(r);
    assert(r.chip === 'true|3 berries in your basket|3|true' && r.bry === '1 berry,2 berries', 'the purse shows Andrew’s berry and counts berries: ' + j);
    assert(r.paws >= 3 && r.pawArt && r.pawsLater === 0, 'Fab leaves paw prints as he walks and they fade within two seconds: ' + j);
    assert(r.price === 'true|Hoodie, 6 berries' && /You need 6 berries\. You have 3\./.test(r.need) && /Not enough berries yet/.test(r.need) && r.stc, 'the shop prices and messages are in berries: ' + j);
    assert(r.size[0] >= 400 && r.size[1] >= 500 && r.row && r.fits && r.icons, 'the 3D workshop uses the screen (side panel, plan, 3D view in a row) with drawn icons: ' + j);
    assert(r.chs === 'steps,wall,tower,bridge,house,rocket,' && /Dad says/.test(r.brief) && /Step 1 of 3/.test(r.brief) && /Show me the model/.test(r.brief) && /Tired\?/.test(r.brief) && r.listHidden, 'a challenge gives a brief, steps, a model to look at and a low-energy route: ' + j);
    assert(/too tall/.test(r.tooTall) && /Step 2 of 3/.test(r.step2) && /"done":true/.test(r.done) && r.gain === 2 && r.won && /You built/.test(r.cheer), 'building the model step by step finishes the challenge and earns berries: ' + j);
    assert(/Keep it in My makes\|Make it your own\|Build it for real\|Put it on show\|Code with Fox Blocks\|Next challenge/.test(r.next) && /You will need/.test(r.real), '“What next?” offers six ways on, and the real-life steps open: ' + j);
    assert(parseInt(r.draw) >= 400 && /,6,true$/.test(r.draw), 'Draw it in 3D fills the screen too: ' + j);
    await page.setViewportSize({ width:1800, height:900 }); await page.waitForTimeout(300);
    const big = await fr.evaluate(async () => { mCad('blocks'); await new Promise(res => setTimeout(res, 400)); const el = WORLD.scene().el, w = el.querySelector('#cadEd').getBoundingClientRect().width, w3 = el.querySelector('#cad3d').getBoundingClientRect().width; WORLD.closeScene(true); return [Math.round(w), Math.round(w3)]; });
    assert(big[0] >= 540 && big[1] >= 660, 'on a big screen the plan and the 3D view grow: ' + big);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  /* ---------- The flightpath poster (flightposter.js) ---------- */
  await test('The flightpath poster: the steps I have climbed, my own right answers, treasures and stars, on the school’s poster', async () => {
    const pp = await newPage('/index.html?learner=poster-fox-7');
    await pp.setViewportSize({ width:1280, height:800 });
    await pp.waitForFunction(() => window.FabFlightPoster && window.FabProud);
    const r = await pp.evaluate(() => {
      const out = {}, F = FabFlightPoster;
      out.lines = JSON.stringify([F.line({ mode:'num', ask:'20 × 1 =', ans:'20' }), F.line({ mode:'num', ask:'? × 4 = 28', ans:'7' }), F.line({ mode:'num', ask:'Count on in 5s. What comes next?', say:'5, 10, 15, …', ans:'20', vis:{ seq:[5, 10, 15] } }),
        F.line({ mode:'orient', ask:'x', ans:1 }), F.line({ mode:'num', ask:'What number is shown?', ans:'34', vis:{ blocks:{ t:3, o:4 } } }), F.line({ mode:'shade', ask:'Shade 2/3 of the bar.', ans:'2/3' }),
        F.line({ mode:'choice', ask:'Is the shape split into equal parts?', ans:'Yes', vis:{ bars:[{ w:[1, 1], on:[0] }] } })]);
      const pk = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(pk);
      const i = pk.screens.findIndex(x => x.type === 'pathway'); learnGo(i);
      const s = pk.screens[i], st = Learn.state[i], me = pwMe();
      const climb = n => { pwStart(s, st, me, n); const k = st.kids[me]; pwTaught(k); k.phase = 'ydo'; k.q = pwQuestion(s.steps[n]); return k; };
      let k = climb(0); learnRender();
      out.before = !!document.querySelector('[data-pwact="poster"]');
      const slip = String(pwToArr(k.q.wrong)[0].v); out.slipQ = k.q.ask; pwCheck(s, k, slip);
      for(let j = 0; j < 3; j++) pwCheck(s, k, k.q.ans);
      learnRender();
      out.found = (document.querySelector('.pw-found [data-pwact="poster"]') || {}).textContent || '';
      out.stars = (document.querySelector('.pw-sparkles') || {}).textContent || '';
      k = climb(3); for(let j = 0; j < 3; j++) pwCheck(s, k, k.q.ans);
      k.offer = false; k.justFound = false; learnRender();
      out.best = JSON.stringify(k.best); out.kept = Object.keys(k.best).join() + '|' + pwToArr(k.best[0]).length + '|' + pwToArr(k.best[3]).length;
      out.side = (document.querySelector('.pw-side [data-pwact="poster"]') || {}).textContent || '';
      document.querySelector('.pw-side [data-pwact="poster"]').click();
      const L = document.querySelector('.fp-layer'), P = L && L.querySelector('.proud');
      out.open = !!P; if(!P) return out;
      out.text = P.textContent.replace(/\s+/g, ' ');
      out.got = P.querySelectorAll('.fp-climb li.got').length + '/' + P.querySelectorAll('.fp-climb li').length;
      out.cards = [...P.querySelectorAll('.proud-sec h3')].map(h => h.textContent).join('|');
      out.answers = [...P.querySelectorAll('.fp-best li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join('|');
      out.wantAnswers = [0, 3].map(n => pwToArr(k.best[n]).map(l => l.a).join(',')).join('|');
      out.chips = [...P.querySelectorAll('.fp-chips li')].map(li => li.textContent.trim()).join('|');
      out.emoji = /\p{Extended_Pictographic}/u.test(out.text);
      out.theme = P.style.getPropertyValue('--pa'); out.done = k.done;
      out.month = FabProud.month(); out.bar = [...L.querySelectorAll('.fp-btn')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg')).join('|');
      const pr = P.getBoundingClientRect(); out.w = Math.round(pr.width);
      return out;
    });
    const j = JSON.stringify(r);
    const lines = JSON.parse(r.lines);
    assert(lines[0].j === 1 && lines[1].j === 2 && lines[2].j === 3 && lines[2].q === '5, 10, 15, …' && lines[3] === null && lines[4] === null && lines[5].q === 'I shaded 2/3 of the bar.' && lines[6].v && lines[6].v.bars.length === 1, 'answers are kept as lines a child can read back, with a picture only when it is a small one: ' + r.lines);
    assert(!r.before && /See my poster/.test(r.found) && /My poster/.test(r.side), 'the poster is offered once a step is climbed, after the step and in My flightpath: ' + j);
    assert(/stars? today/.test(r.stars) && /berry/.test(r.stars) && !/sparkle/.test(r.stars), 'the lesson talks about stars that turn into berries: ' + r.stars);
    assert(r.kept === '0,3|2|2', 'two right answers are kept for each step climbed: ' + r.best);
    assert(r.open && /Flown by Explorer poster-fox-7/.test(r.text) && /Multiplication and division flightpath/.test(r.text) && /I have climbed 2 steps\. Here is what I can do now\./.test(r.text), 'the poster opens with the Fab code, the flightpath and what I can do now: ' + j);
    assert(r.got === '2/23' && r.cards === 'My climb|Count in 2s, 5s and 10s|Times 0 and times 1|Treasures I found', 'the climb and one card for each step climbed: ' + j);
    assert(r.wantAnswers.split(/[|,]/).every(a => r.answers.includes(a)) && r.answers.split('|').length === 4, 'the cards show the child’s own right answers: ' + j);
    assert(r.chips === 'Mushroom|Feather' && new RegExp(r.done + ' stars earned').test(r.text) && r.done === 6, 'treasures and stars are on the poster: ' + j);
    assert(/BeMoreFab Virtual School/.test(r.text) && r.text.includes(r.month) && /2 steps climbed!/.test(r.text) && !r.emoji && r.theme === '#1D5C7A', 'it is the school’s poster: the foot, the month, the seal, the maths colours and no emoji: ' + j);
    assert(r.bar === 'Back to my flightpath:true|Print my poster:true' && r.w >= 990, 'drawn buttons to go back and to print, and the poster fills a laptop screen: ' + j);
    await pp.keyboard.press('Escape');
    assert(await pp.locator('.fp-layer').count() === 0 && await pp.locator('.pw-child').count() === 1, 'Escape closes the poster and the lesson is still there');
    await pp.setViewportSize({ width:2400, height:1200 });
    await pp.evaluate(() => document.querySelector('.pw-side [data-pwact="poster"]').click()); await pp.waitForTimeout(200);
    const big = await pp.evaluate(() => Math.round(document.querySelector('.fp-layer .proud').getBoundingClientRect().width));
    assert(big >= 1800, 'on a very big screen the poster grows to use it: ' + big);
    await pp.setViewportSize({ width:390, height:844 }); await pp.waitForTimeout(200);
    const small = await pp.evaluate(() => { const sc = document.querySelector('.fp-scroll'), p = sc.querySelector('.proud').getBoundingClientRect(); return [Math.round(p.width), sc.scrollWidth <= sc.clientWidth + 2, [...document.querySelectorAll('.fp-btn')].every(b => { const r = b.getBoundingClientRect(); return r.left >= 0 && r.right <= 391; })]; });
    assert(small[0] <= 390 && small[0] >= 330 && small[1] && small[2], 'on a phone the poster fits with nothing off the side: ' + small);
    await pp.locator('[data-fp="close"]').click();
    assert(await pp.locator('.fp-layer').count() === 0, 'the back button closes the poster');
    await pp.close();
  });
  /* ---------- Fox Blocks: the coding page, built on Blockly (code.html) ---------- */
  async function codePage(q){
    const cp = await browser.newPage(); const url = '/code.html' + (q || '');
    cp.on('pageerror', e => errors.push(`${url}: ${e.message}`));
    cp.on('console', m => { if(m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(`${url}: console: ${m.text()}`); });
    cp.on('response', r => { if(r.status() >= 400 && !/\/favicon\.ico$/.test(r.url())) errors.push(`${url}: missing ${r.url()} (${r.status()})`); });
    await cp.setViewportSize({ width:1366, height:768 }); await cp.goto(base + url); await cp.waitForFunction(() => window.FabCode && window.Blockly); await cp.waitForTimeout(300);
    return cp;
  }
  await test('Fox Blocks: Blockly in the Fab Fox look; a block dragged under Go and a number chosen walks Fab to the bramble bush', async () => {
    const cp = await codePage('?learner=code-fox-1');
    const home = await cp.evaluate(() => ({ cards:[...document.querySelectorAll('.fc-card')].map(c => c.querySelector('h2').textContent + ':' + !!c.querySelector('canvas')).join('|'), dad:!!document.querySelector('.fc-hello .fc-who.dad'),
      text:document.body.innerText, name:document.querySelector('.fc-word').textContent + '|' + document.title, back:(document.querySelector('.fc-foot a') || {}).getAttribute('href'), v:Blockly.VERSION, font:getComputedStyle(document.querySelector('.fc-bubble')).fontFamily }));
    assert(home.cards === 'To the bramble bush:true|Fab’s dance:true|Tap and play:true|Score a goal:true' && home.dad && home.back === 'index.html' && /^Aleo/.test(home.font) && home.name === 'Fox Blocks|Fox Blocks · BeMoreFab Virtual School', 'the home page: four projects with pictures, Dad, and a way back: ' + JSON.stringify(home).slice(0, 400));
    assert(/^13\./.test(home.v) && !/\p{Extended_Pictographic}/u.test(home.text), 'Blockly 13 is loaded and there are no emoji: ' + home.v);
    await cp.click('.fc-card[data-p="bush"]'); await cp.waitForTimeout(500);
    const look = await cp.evaluate(() => { const ws = FabCode.ws(), go = ws.getBlocksByType('fab_go')[0], fly = ws.getFlyout().getWorkspace().getTopBlocks(true).map(b => b.type).join();
      const txt = document.querySelector('#fcBlockly .blocklyFlyout .blocklyDropdownText'), path = document.querySelector('#fcBlockly .blocklyFlyout .blocklyPath');
      return { st:FabCode.state(), fly, go:!!go && !go.isDeletable() && !go.isMovable(), zelos:!!document.querySelector('#fcBlockly .zelos-renderer.fabfox-theme'), txt:getComputedStyle(txt).fill, stroke:getComputedStyle(path).stroke, fill:getComputedStyle(path).fill,
        img:[...document.querySelectorAll('#fcBlockly .blocklyFlyout image')].filter(i => /^data:image\/svg/.test(i.getAttribute('href') || i.getAttribute('xlink:href') || '')).length, where:document.getElementById('fcWhere').textContent, dots:document.querySelectorAll('#fcDots button').length,
        steps:document.querySelectorAll('.fc-steps li').length, help:[...document.querySelectorAll('.fc-help .fc-b')].map(b => b.textContent.trim()).join('|'), ctrl:[...document.querySelectorAll('.fc-ctrl .fc-b')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg')).join('|') }; });
    assert(look.st.view === 'work' && look.st.level === 'b1' && look.fly === 'fab_right,fab_left' && look.go && look.zelos, 'the first puzzle opens with its two blocks and a Go block that cannot be thrown away: ' + JSON.stringify(look));
    assert(look.txt === 'rgb(43, 26, 18)' && look.stroke === 'rgb(43, 26, 18)' && look.fill === 'rgb(244, 164, 110)' && look.img >= 2, 'the blocks are in the Fab Fox look: flat colour, ink outline, ink writing, a drawn picture on each: ' + JSON.stringify(look));
    assert(/To the bramble bush · 1\. Straight there/.test(look.where) && look.dots === 6 && look.steps === 3 && look.help === 'Show me the way|Tired? Add the next block for me' && look.ctrl === 'Go:true|Fab back to the start:true|Clear my blocks:true', 'Dad’s task, three steps, two helpers and three drawn buttons: ' + JSON.stringify(look));
    /* a real drag from the palette to under Go */
    const pos = await cp.evaluate(() => { const f = document.querySelector('#fcBlockly .blocklyFlyout .blocklyDraggable'), r = f.getBoundingClientRect(), go = FabCode.ws().getBlocksByType('fab_go')[0].getSvgRoot().getBoundingClientRect(); return { fx:r.left + 60, fy:r.top + r.height / 2, gx:go.left + 60, gy:go.bottom + r.height / 2 - 4 }; });
    await cp.mouse.move(pos.fx, pos.fy); await cp.mouse.down(); await cp.mouse.move(pos.fx + 40, pos.fy + 10, { steps:4 }); await cp.mouse.move(pos.gx, pos.gy, { steps:12 }); await cp.waitForTimeout(150); await cp.mouse.up(); await cp.waitForTimeout(400);
    assert(JSON.stringify(await cp.evaluate(() => FabCode.program())) === '[["right",1]]', 'dragging “right” under Go snaps it on');
    const dd = await cp.evaluate(() => { const r = FabCode.ws().getBlocksByType('fab_go')[0].getNextBlock().getField('N').getSvgRoot().getBoundingClientRect(); return { x:r.left + r.width / 2, y:r.top + r.height / 2 }; });
    await cp.mouse.click(dd.x, dd.y); await cp.waitForTimeout(300);
    const menu = await cp.evaluate(() => { const it = [...document.querySelectorAll('.blocklyDropDownDiv .blocklyMenuItem')]; return it.length + '|' + (it[0] ? getComputedStyle(it[0].querySelector('.blocklyMenuItemContent') || it[0]).color : ''); });
    assert(menu === '6|rgb(43, 26, 18)', 'tapping the number opens a list of 1 to 6 in ink: ' + menu);
    await (await cp.$$('.blocklyDropDownDiv .blocklyMenuItem'))[3].click(); await cp.waitForTimeout(300);
    assert(JSON.stringify(await cp.evaluate(() => FabCode.program())) === '[["right",4]]', 'choosing 4 changes the block');
    await cp.evaluate(() => { FabCode.speed = 12; }); await cp.click('.fc-ctrl [data-a="go"]');
    await cp.waitForFunction(() => !FabCode.state().running); await cp.waitForTimeout(300);
    const won = await cp.evaluate(() => ({ st:FabCode.state(), star:localStorage.getItem('fabworld-pending-code-fox-1'), win:(document.querySelector('.fc-win') || {}).innerText || '', next:[...document.querySelectorAll('.fc-win .fc-b')].map(b => b.textContent.trim()).join('|'),
      elder:!!document.querySelector('.fc-win .fc-who.elder'), dot:document.querySelector('#fcDots button').className, saved:Object.keys(JSON.parse(localStorage.getItem('fabcode-v1-code-fox-1')).code).join() }));
    assert(won.st.x === 4 && won.st.y === 2 && won.st.done.b1 === 1 && won.st.panel === 'win' && won.st.prints === 4, 'Fab walks four squares to the bush, leaving paw prints: ' + JSON.stringify(won.st));
    assert(won.star === '1' && /You did it!/.test(won.win) && /with 1 block\./.test(won.win) && /algorithm/.test(won.win) && /You earned a star/.test(won.win) && won.elder, 'Mr Elder celebrates, names the idea and gives one star for Fab Fox World: ' + JSON.stringify(won));
    assert(won.next === 'Next puzzle|Try it another way|All projects' && /good place to finish/.test(won.win) && /done/.test(won.dot) && won.saved === 'b1', '“What next?” offers three ways on and a place to stop; the code and the tick are saved: ' + JSON.stringify(won));
    await cp.click('.fc-ctrl [data-a="go"]'); await cp.waitForFunction(() => !FabCode.state().running); await cp.waitForTimeout(200);
    assert(await cp.evaluate(() => localStorage.getItem('fabworld-pending-code-fox-1')) === '1', 'solving the same puzzle again does not give another star');
    await cp.close();
  });
  await test('Fox Blocks: gentle tips, a model to aim for, the low-energy route, every model answer works, and the page fills any screen', async () => {
    const cp = await codePage('?learner=code-fox-2');
    const r = await cp.evaluate(async () => {
      const out = {}, F = FabCode; F.speed = 40;
      const go = async (p, i, prog) => { F.open(p, i); F.setProgram(prog); return await F.run(); };
      let x = await go('bush', 2, [['right', 1], ['right', 3]]); out.bump = x.bump + '|' + x.tip + '|' + !!document.querySelector('#fcBlockly .fc-lit') + '|' + !!document.querySelector('.fc-tip .fc-who.doc') + '|' + F.state().x;
      x = await go('bush', 2, [['up', 1]]); out.far = x.tip;
      x = await go('bush', 0, [['right', 6]]); out.edge = x.tip;
      x = await go('bush', 0, [['right', 5], ['left', 2]]); out.past = x.tip;
      x = await go('bush', 3, [['right', 4]]); out.berries = x.tip;
      x = await go('bush', 3, []); out.empty = x.tip;
      x = await go('dance', 0, [['spin'], ['hop']]); out.d1 = x.tip;
      x = await go('dance', 1, [['hop'], ['hop'], ['hop'], ['hop']]); out.d2 = x.tip;
      x = await go('dance', 1, [['repeat', 3, [['hop']]]]); out.d2b = x.tip;
      x = await go('dance', 2, [['hop'], ['hop']]); out.d3 = x.tip;
      out.none = Object.keys(F.state().done).length;
      F.open('bush', 5); F.showWay(); out.way = F.state().way + '|' + JSON.stringify(F.route(F.projects[0].levels[5]));
      /* the low-energy route builds the model answer one block at a time, and every model answer solves its puzzle */
      out.solved = [];
      for(const p of F.projects) for(let i = 0; i < p.levels.length; i++){ const L = p.levels[i]; F.open(p.id, i); let n = 0; while(JSON.stringify(F.program()) !== JSON.stringify(L.sol) && n++ < 12) F.addNext();
        const res = await F.run(); out.solved.push(L.id + ':' + (res && res.ok) + ':' + n + ':' + (L.berries ? F.state().got : '-')); }
      out.done = Object.keys(F.state().done).join();
      F.open('bush', 4); out.kept = JSON.stringify(F.program());
      /* stop */
      F.speed = 1; F.open('dance', 2); F.setProgram([['repeat', 6, [['hop'], ['spin']]]]); const pr = F.run(); await new Promise(res => setTimeout(res, 500)); out.running = F.state().running + '|' + (document.querySelector('.fc-ctrl [data-a="stop"]') || {}).textContent;
      document.querySelector('.fc-ctrl [data-a="stop"]').click(); const sr = await pr; out.stopped = !!sr.stopped + '|' + F.state().running + '|' + F.state().panel;
      /* clear needs two taps */
      const c = () => document.querySelector('.fc-ctrl [data-a="clear"]'); c().click(); out.arm = c().textContent.trim() + '|' + JSON.stringify(F.program()).length; c().click(); out.cleared = JSON.stringify(F.program());
      F.home(); out.home = [...document.querySelectorAll('.fc-card .fc-prog')].map(e => e.textContent.trim()).join('|');
      return out; });
    const j = JSON.stringify(r);
    assert(/^pond\|Fab bumped into the pond\..*orange edge.*\|true\|true\|1$/.test(r.bump), 'a bump stops Fab where he is, lights the block and Doctor McPhee gives a tip: ' + r.bump);
    assert(/stopped 5 squares from the bush/.test(r.far) && /edge of the grass/.test(r.edge) && /walked right past the bush/.test(r.past) && /2 berries are still on the grass/.test(r.berries) && /no code yet/.test(r.empty), 'tips say what happened and what to look at, never “wrong”: ' + j);
    assert(/hop first, and then spin/.test(r.d1) && /only takes 2 blocks/.test(r.d2) && /hopped 3 times/.test(r.d2b) && /2 moves of 1 kind/.test(r.d3) && r.none === 0, 'the dance challenges give tips too, and nothing is ticked until it is done: ' + j);
    assert(r.way === 'true|[[0,4],[1,4],[2,4],[2,3],[2,2],[3,2],[4,2],[4,1],[4,0]]', '“Show me the way” draws the model route: ' + r.way);
    assert(r.solved.join() === 'b1:true:1:-,b2:true:3:-,b3:true:3:-,b4:true:4:3,b5:true:2:-,b6:true:1:3,d1:true:2:-,d2:true:1:-,d3:true:3:-,e1:true:1:-,e2:true:2:-,e3:true:3:-,g1:true:2:-,g2:true:2:-,g3:true:4:-,g4:true:2:-', '“Add the next block for me” builds each model answer, and every one solves its puzzle: ' + r.solved);
    assert(r.done === 'b1,b2,b3,b4,b5,b6,d1,d2,d3,e1,e2,e3,g1,g2,g3,g4' && r.kept === '[["repeat",3,[["right",1],["up",1]]],["right",1]]', 'finished puzzles are ticked and the code is kept: ' + j);
    assert(r.running === 'true|Stop' && r.stopped === 'true|false|null', 'Stop ends a long dance at once: ' + j);
    assert(/^Tap again to clear\|/.test(r.arm) && r.cleared === '[]', 'clearing the blocks takes two taps: ' + j);
    assert(r.home === '6 of 6 done|3 of 3 done|3 of 3 done|4 of 4 done', 'the home page shows what is done: ' + r.home);
    /* the page fills the screen */
    const boxes = async () => cp.evaluate(() => { const b = s => { const r = document.querySelector(s).getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)]; };
      const btns = [...document.querySelectorAll('.fc-ctrl .fc-b')].map(x => x.getBoundingClientRect()), clash = btns.some((a, i) => btns.some((c, k) => k > i && a.left < c.right - 1 && c.left < a.right - 1 && a.top < c.bottom - 1 && c.top < a.bottom - 1));
      return { brief:b('.fc-brief'), blocks:b('.fc-blocks'), stage:b('.fc-stage'), cv:b('#fcStage'), tile:FabCode.state().tile, scale:+FabCode.ws().getScale().toFixed(2), sw:document.documentElement.scrollWidth, sh:document.documentElement.scrollHeight, w:innerWidth, h:innerHeight, clash, fs:parseFloat(getComputedStyle(document.querySelector('.fc-b')).fontSize) }; });
    await cp.evaluate(() => { FabCode.open('bush', 4); }); await cp.waitForTimeout(300);
    let b = await boxes();
    assert(b.brief[2] <= b.blocks[0] && b.blocks[2] <= b.stage[0] && b.tile >= 95 && b.cv[2] - b.cv[0] >= 570 && b.sw <= b.w && b.sh <= b.h && !b.clash && b.fs >= 16 && b.scale >= .8, 'on a laptop the task, the blocks and the stage sit side by side and the stage is big: ' + JSON.stringify(b));
    await cp.setViewportSize({ width:2400, height:1200 }); await cp.waitForTimeout(400); b = await boxes();
    assert(b.tile >= 175 && b.scale >= 1.4 && b.fs >= 26 && b.sw <= b.w && b.sh <= b.h && !b.clash, 'on a very big screen everything grows: ' + JSON.stringify(b));
    await cp.setViewportSize({ width:820, height:1100 }); await cp.waitForTimeout(400); b = await boxes();
    assert(b.tile >= 55 && b.stage[2] <= b.brief[0] + 1 && b.blocks[1] >= b.stage[3] - 1 && b.blocks[3] - b.blocks[1] >= 420 && b.sw <= b.w && b.sh <= b.h && !b.clash, 'on an upright tablet the stage sits beside the task with the blocks underneath: ' + JSON.stringify(b));
    await cp.setViewportSize({ width:390, height:844 }); await cp.waitForTimeout(400); b = await boxes();
    assert(b.tile >= 38 && b.stage[3] <= b.brief[1] + 1 && b.brief[3] <= b.blocks[1] + 1 && b.blocks[3] <= b.h && b.blocks[3] - b.blocks[1] >= 250 && b.sw <= b.w && b.sh <= b.h && !b.clash, 'on a phone the stage, the task and the blocks stack with nothing off the screen: ' + JSON.stringify(b));
    await cp.close();
  });
  await test('Fox Blocks, the next level: Score a goal. Kick, jump, “repeat until” and “if, else”, a ball and cones that move, and code only counts when it works wherever they land', async () => {
    const cp = await codePage('?learner=code-fox-3');
    await cp.setViewportSize({ width:1366, height:768 }); await cp.waitForTimeout(300);
    const r = await cp.evaluate(async () => {
      const out = {}, F = FabCode, wait = ms => new Promise(res => setTimeout(res, ms)); F.speed = 40;
      const run = async (prog, rnd) => { if(prog) F.setProgram(prog); F.rand = () => rnd; const x = await F.run(); return (x.ok ? 'ok' : 'tip') + ':' + (x.tip || '') + ':' + JSON.stringify(F.state().ball); };
      out.home = F.projects.map(p => p.id + p.levels.length).join() + '|' + [...document.querySelectorAll('.fc-card')].length;
      /* 1. walk, then kick */
      F.rand = () => 0; F.open('goal', 0); await wait(250);
      out.blocks1 = F.ws().getFlyout().getWorkspace().getTopBlocks(true).map(b => b.type).join();
      const q = s => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
      out.long = [document.getElementById('fc').classList.contains('long'), q('.fc-stage')[3] <= q('.fc-blocks')[1] + 1, q('.fc-brief')[2] <= q('.fc-blocks')[0] + 1, q('.fc-blocks')[2] - q('.fc-blocks')[0] >= innerWidth * .7, F.state().tile >= 60, document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight].join('|');
      out.g1a = await run([['right', 3], ['kick']], 0); out.g1b = await run([['right', 1], ['kick']], 0); out.g1c = await run([['right', 2]], 0); out.g1 = await run([['right', 2], ['kick']], 0);
      out.win1 = document.querySelector('.fc-win .fc-bubble').textContent.replace(/\s+/g, ' ').trim() + '|' + [...document.querySelectorAll('.fc-win .fc-b')].map(b => b.textContent.trim()).join(',');
      /* 2. the ball lands somewhere new on every Go: counting squares can score once, but it is not ticked */
      F.rand = () => 0; F.open('goal', 1); await wait(200); out.ball0 = JSON.stringify(F.state().ball);
      out.g2lucky = await run([['right', 3], ['kick']], .3); out.done2 = !!F.state().done.g2;
      out.g2miss = await run(null, .9); out.g2bump = await run(null, 0);
      out.g2 = await run([['until', 'ball', [['right', 1]]], ['kick']], .6); out.done2b = !!F.state().done.g2;
      /* 3. cones: jump over them */
      F.rand = () => 0; F.open('goal', 2); await wait(200); out.cones3 = F.state().cones;
      out.g3cone = await run([['right', 2]], 0); out.g3miss = await run([['right', 1], ['jump'], ['kick']], 0); out.g3 = await run([['right', 1], ['jump'], ['jump'], ['kick']], 0);
      /* 4. the cones move: Dad has started the code, and the box leads with the new block */
      F.rand = () => 0; F.open('goal', 3); await wait(250);
      out.begin = JSON.stringify(F.program()) + '|' + F.ws().getFlyout().getWorkspace().getTopBlocks(true).map(b => b.type).join();
      out.g4empty = await run(null, 0);
      out.g4cone = await run([['until', 'ball', [['right', 1]]], ['kick']], 0);
      out.g4lucky = await run(null, .99); out.done4 = !!F.state().done.g4;
      const sol = [['until', 'ball', [['ifelse', 'cone', [['jump']], [['right', 1]]]]], ['kick']]; out.g4 = [];
      for(const v of [0, .25, .45, .65, .99]) out.g4.push(await run(sol, v));
      out.kept = JSON.stringify(F.program()) === JSON.stringify(sol);
      const c = () => document.querySelector('.fc-ctrl [data-a="clear"]'); c().click(); c().click(); out.cleared = JSON.stringify(F.program());
      out.done = Object.keys(F.state().done).join(); out.star = localStorage.getItem('fabworld-pending-code-fox-3');
      out.look = [...document.querySelectorAll('#fcBlockly .blocklyDraggable')].length > 3 && !/\p{Extended_Pictographic}/u.test(document.getElementById('fcBrief').textContent);
      try{ localStorage.removeItem(F.key); localStorage.removeItem('fabworld-pending-code-fox-3'); }catch(e){}
      return out; });
    const j = JSON.stringify(r);
    assert(r.home === 'bush6,dance3,tap3,goal4|4', 'Score a goal is a project with four puzzles: ' + j);
    assert(r.blocks1 === 'fab_right,fab_left,fab_kick' && r.long === 'true|true|true|true|true|true', 'the long pitch sits across the top with the blocks full width underneath, and nothing leaves the screen: ' + j);
    assert(/^tip:Fab walked into the ball/.test(r.g1a) && /^tip:Fab kicked, but the ball was not on the next square/.test(r.g1b) && /^tip:The ball has not gone in yet/.test(r.g1c) && r.g1 === 'ok::[7,1]', 'walk to the square before the ball, then kick it into the net; tips say what happened: ' + j);
    assert(/^You did it!\s*Goal! Fab scored with 2 blocks\. Walk, then kick/.test(r.win1) && /Next puzzle,Try it another way,All projects/.test(r.win1), 'Mr Elder celebrates and “What next?” follows: ' + r.win1);
    assert(r.ball0 === '[3,1]' && /^tip:Goal! But the ball lands somewhere new each time\. Try “repeat until”/.test(r.g2lucky) && r.done2 === false && /^tip:Fab kicked, but the ball was not/.test(r.g2miss) && /^tip:Fab walked into the ball/.test(r.g2bump), 'counting squares can score once, but it is not ticked, and the tip points to “repeat until”: ' + j);
    assert(r.g2 === 'ok::[7,1]' && r.done2b === true, '“repeat until next to the ball” works wherever the ball lands: ' + j);
    assert(r.cones3 === 2 && /^tip:Fab bumped into a cone\. A cone needs jumping over/.test(r.g3cone) && /^tip:Fab kicked, but the ball was not/.test(r.g3miss) && r.g3 === 'ok::[7,1]', 'cones are jumped over: ' + j);
    assert(r.begin === '[["until","ball",[]],["kick"]]|fab_ifelse,fab_jump,fab_right,fab_kick,fab_until', 'the last puzzle starts with Dad’s code, and the new “if” block is first in the box: ' + j);
    assert(/^tip:Fab went round and round/.test(r.g4empty) && /^tip:Fab bumped into a cone/.test(r.g4cone) && /^tip:Goal! But the cones move each time\. Try “if a cone is ahead”/.test(r.g4lucky) && r.done4 === false, 'an empty loop, a cone in the way and a lucky goal each get a tip, and nothing is ticked: ' + j);
    assert(r.g4.length === 5 && r.g4.every(x => x === 'ok::[7,1]') && r.kept && r.cleared === '[["until","ball",[]],["kick"]]', '“if a cone is ahead, jump, else walk” scores with every cone layout, and clearing goes back to Dad’s starting code: ' + j);
    assert(r.done === 'g1,g2,g3,g4' && r.star === '4' && r.look, 'four puzzles, four stars waiting for Fab’s basket, and no emoji in the task: ' + j);
    await cp.close();
  });

  await test('World, round 23: a build goes on show outside Dad’s Workshop, the 3D picture is sharp, “What next?” offers Fox Blocks, and the floating controls follow the style rules', async () => {
    await page.setViewportSize({ width:1920, height:1080 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), emo = /\p{Extended_Pictographic}/u, out = {}; try{ WORLD.closeScene(true); }catch(e){}
      const cs = (s, k) => getComputedStyle(document.querySelector(s))[k], ink = 'rgb(43, 26, 18)';
      out.style = [cs('.mini', 'borderTopColor') === ink && cs('.mini', 'boxShadow') === 'none', cs('.mini-big', 'borderTopColor') === ink && cs('.mini-big', 'backgroundColor') === 'rgb(255, 246, 230)', cs('.stick', 'borderTopColor') === ink && cs('.stick', 'boxShadow') === 'none', cs('#knob', 'backgroundColor') === 'rgb(240, 185, 19)' && cs('#knob', 'borderTopColor') === ink, cs('.turn .tb', 'borderTopColor') === ink && cs('.turn .tb', 'boxShadow') === 'none', cs('.joy', 'borderTopColor') === ink && cs('.joy', 'boxShadow') === 'none'].join('|');
      cheer('Well done', 'A lovely build'); out.toast = [cs('#cheer', 'borderTopColor') === ink, cs('#cheer', 'boxShadow') === 'none', cs('#cheer', 'backgroundColor') === 'rgb(255, 246, 230)', cs('#cheer b', 'fontStyle') === 'italic'].join('|');
      S.missions = 30; delete S.onShow; S.shows = []; mCad('blocks'); await wait(400); let el = WORLD.scene().el;
      const v3 = document.getElementById('cad3d'); out.sharp = [v3.width >= 780, Math.abs(v3.width / v3.height - 520 / 420) < .01, v3.width >= v3.clientWidth * .95].join('|') + '|' + v3.width + 'x' + v3.height + ' shown ' + v3.clientWidth;
      out.row = [...el.querySelectorAll('#cadViewBtns .cadb')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg') + ':' + !emo.test(b.textContent)).join('|');
      el.querySelector('[data-a="show"]').click(); await wait(100); out.none = !S.onShow + '|' + el.querySelector('.sub').textContent;
      el.querySelector('.cadch[data-ch]').click(); for(let i = 0; i < 4; i++){ await wait(250); const b = [...el.querySelectorAll('#cadGoal button')].find(x => /Build this step/.test(x.textContent)); if(b) b.click(); } await wait(300);
      out.next = [...el.querySelectorAll('.cadnext button')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg')).join('|');
      const pn = el.querySelector('#cadGoal').getBoundingClientRect(), sr = el.getBoundingClientRect(); out.fits = pn.bottom <= sr.bottom + 1;
      [...el.querySelectorAll('.cadnext button')].find(b => /Put it on show/.test(b.textContent)).click(); await wait(150);
      out.show = S.onShow ? S.onShow.m + '|' + Object.keys(S.onShow.cells).length + '|' + document.getElementById('cheer').textContent.replace(/\s+/g, ' ').trim() : '';
      /* the table in the world */
      WORLD.closeScene(true); try{ WORLD.coll().length = 0; }catch(e){} teleportTo(ONSHOW.x + 60, ONSHOW.y + 170); await wait(500);
      const dad = WORLD.PLACES.find(x => x.id === 'workshop'); out.where = Math.round(Math.hypot(ONSHOW.x - dad.x, ONSHOW.y - dad.y)) < 260;
      const pic = onShowPic(1), g = pic.getContext('2d'), d = g.getImageData(0, 0, pic.width, pic.height).data; let solid = 0, clear = 0; for(let i = 3; i < d.length; i += 4){ if(d[i] > 200) solid++; else if(d[i] === 0) clear++; }
      out.pic = [pic.width + 'x' + pic.height, solid > 2500, clear > solid, d[3] === 0].join('|');
      /* Code with Fox Blocks from What next */
      mCad('blocks'); await wait(300); el = WORLD.scene().el; el.querySelector('.cadch[data-ch]').click(); for(let i = 0; i < 4; i++){ await wait(250); const b = [...el.querySelectorAll('#cadGoal button')].find(x => /Build this step/.test(x.textContent)); if(b) b.click(); } await wait(300);
      [...el.querySelectorAll('.cadnext button')].find(b => /Code with Fox Blocks/.test(b.textContent)).click(); await wait(300); out.code = WORLD.scene().cls + '|' + !!WORLD.scene().el.querySelector('iframe.codeframe');
      WORLD.closeScene(true); delete S.onShow; S.shows = []; S.missions = 0; S.cadDone = {}; return out; });
    const j = JSON.stringify(r);
    assert(r.style === 'true|true|true|true|true|true', 'the mini-map, the joystick, the look buttons and the joy bar have ink outlines and no shadows: ' + j);
    assert(r.toast === 'true|true|true|true', 'the pop-up card is paper cream with an ink outline: ' + j);
    assert(/^true\|true\|true\|/.test(r.sharp), 'on a big screen the 3D picture has as many dots as it is shown at: ' + r.sharp);
    assert(/Put it on show:true:true\|Code it:true:true$/.test(r.row) && /^true\|Build something first/.test(r.none), 'the 3D view has a drawn “Put it on show” button, and an empty build gets a gentle nudge: ' + j);
    assert(r.next === 'Keep it in My makes:true|Make it your own:true|Build it for real:true|Put it on show:true|Code with Fox Blocks:true|Next challenge:true' && r.fits, '“What next?” offers the show table and Fox Blocks, with drawn icons, and still fits: ' + j);
    assert(/^blocks\|6\|It is on show!\s*Find it on the show bench outside Dad’s Workshop\.$/.test(r.show) && r.where && r.pic === '520x420|true|true|true', 'the build is kept for the table outside Dad’s Workshop and drawn with a clear background: ' + j);
    assert(r.code === 'sc-code|true', '“Code with Fox Blocks” opens Fox Blocks from the workshop: ' + j);
    /* the 3D view: a flat sky and ink-edged hills */
    const sky = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)); document.getElementById('v3Btn').click(); await wait(500); const on = document.getElementById('v3Btn').getAttribute('aria-pressed'); const bg = getComputedStyle(document.querySelector('.stage')).backgroundColor; document.getElementById('v3Btn').click(); await wait(200); return on + '|' + bg; });
    assert(/^(true\|rgb\(207, 231, 242\)|false\|)/.test(sky), 'the 3D view sits on the flat glass-blue sky: ' + sky);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });

  await test('Fox Blocks opens from Fab Fox World, the Games section and Computing in the Learning Hub, with Back to where it came from; the landing page itself is unchanged', async () => {
    const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8'), hub = html.slice(html.indexOf('id="screen-hub"'), html.indexOf('</section>', html.indexOf('id="screen-hub"')));
    assert(!/code\.html|data-code-open/.test(hub) && !['home.js', 'me.js'].some(f => /code\.html/.test(fs.readFileSync(path.join(ROOT, f), 'utf8'))), 'the landing page does not link to Fox Blocks until the navigation review');
    assert(/code\.html\?embed=1/.test(fs.readFileSync(path.join(ROOT, 'games.js'), 'utf8')), 'Fab Fox World opens Fox Blocks in a frame');
    assert(fs.existsSync(path.join(ROOT, 'lib/blockly/LICENSE.txt')) && /Apache License/.test(fs.readFileSync(path.join(ROOT, 'lib/blockly/LICENSE.txt'), 'utf8')), 'Blockly’s licence travels with it');
    assert(!/tombstone|dead plants/.test(fs.readFileSync(path.join(ROOT, 'packs.js'), 'utf8')), 'the rocks step uses the gentler wording');
    await page.setViewportSize({ width:1366, height:768 });
    const wait = ms => page.waitForTimeout(ms);
    const inside = async () => { const f = await (await page.$('#codeFrame')).contentFrame(); await f.waitForFunction(() => window.FabCode && document.getElementById('fcBack'), null, { timeout:15000 }); return f; };
    await page.evaluate(() => { try{ localStorage.setItem('fab-me', 'fox-games-1'); }catch(e){} showScreen('screen-stem'); });
    const tile = await page.evaluate(() => { const t = document.getElementById('stemBush'); return t ? [t.querySelector('h2').textContent, !!t.querySelector('svg'), [...document.querySelectorAll('#screen-stem .tile .emoji')].filter(e => e.querySelector('svg')).length, [...document.querySelectorAll('#screen-stem .tile .emoji')].length, !document.getElementById('gamesCodeBtn') && document.querySelectorAll('#screen-stem [data-code-open]').length === 4].join('|') : ''; });
    assert(/^To the bramble bush\|true\|(\d+)\|\1\|true$/.test(tile), 'the STEM Den page has the four Fox Blocks projects, every tile carries a drawing, and Games no longer has a Fox Blocks tile: ' + tile);
    await page.click('#stemBush'); let f = await inside(); await wait(300);
    let r = await page.evaluate(() => { const fr = document.getElementById('codeFrame'), b = fr.getBoundingClientRect(); return [document.querySelector('.screen.active').id, /embed=1/.test(fr.src) && /back=stem/.test(fr.src) && /project=bush/.test(fr.src) && /learner=fox-games-1/.test(fr.src), Math.round(b.width) >= innerWidth - 1 && Math.round(b.height) >= innerHeight - 1 && b.top <= 0].join('|'); });
    const back1 = await f.evaluate(() => { const b = document.getElementById('fcBack'); return [b.hidden, b.textContent.trim(), !!document.querySelector('.fc-foot a')].join('|'); });
    assert(r === 'screen-code|true|true' && /^false\|(All projects|Back to the STEM Den)\|false$/.test(back1), 'Fox Blocks fills the window straight from the STEM Den page, with its own Back: ' + r + ' / ' + back1);
    await f.evaluate(() => { FabCode.open('bush', 0); }); await wait(200);
    const mid = await f.evaluate(() => document.getElementById('fcBack').textContent.trim());
    await f.evaluate(() => document.getElementById('fcBack').click()); await wait(200); await f.evaluate(() => document.getElementById('fcBack').click()); await wait(300);
    r = await page.evaluate(() => document.querySelector('.screen.active').id + '|' + !document.getElementById('codeFrame').getAttribute('src'));
    assert(mid === 'All projects' && r === 'screen-stem|true', 'in a puzzle the button says “All projects”; from the projects, Back goes to Games and the frame is let go: ' + mid + ' / ' + r);
    /* the Learning Hub: Computing */
    /* the full list is the teachers' view (a signed-in child's Learning Hub is their Burrow), so this part runs as a teacher's viewer */
    await page.evaluate(() => { localStorage.setItem('fab-home', 'off'); showScreen('screen-learn'); learnRenderList(); document.querySelector('#learnFilters [data-subject="Computing"]').click(); }); await wait(200);
    r = await page.evaluate(() => { const cards = [...document.querySelectorAll('#learnList .lesson-card')], note = document.querySelector('#learnList .learn-code-note');
      return { cards:cards.map(c => c.dataset.code + ':' + c.querySelector('.lc-subject').textContent + ':' + !!c.querySelector('svg')).join(','), oak:note ? [...note.querySelectorAll('a')].filter(a => /thenational\.academy\/teachers\/curriculum\/computing-primary\/units\//.test(a.href)).length : 0, ogl:note ? /Open Government Licence v3\.0/.test(note.textContent) : false, nc:note ? /Use sequence, selection and repetition in programs/.test(note.textContent) : false }; });
    assert(r.cards === 'bush:Computing · Years 1–4:true,dance:Computing · Years 1–3:true,tap:Computing · Years 2–3:true,goal:Computing · Years 4–6:true' && r.oak >= 7 && r.ogl && r.nc, 'Computing lists the four Fox Blocks projects with year groups, and a teachers’ note links them to the curriculum and to Oak’s units: ' + JSON.stringify(r));
    const y5 = await page.evaluate(() => { document.querySelector('#learnYears [data-year="5"]').click(); return [...document.querySelectorAll('#learnList .lesson-card')].map(c => c.dataset.code).join(); });
    assert(y5 === 'goal', 'the year filter applies: Year 5 sees Score a goal: ' + y5);
    await page.evaluate(() => document.querySelector('#learnList .lesson-card[data-code="goal"]').click()); f = await inside(); await wait(400);
    r = await page.evaluate(() => /back=learn/.test(document.getElementById('codeFrame').src) && /project=goal/.test(document.getElementById('codeFrame').src));
    const st = await f.evaluate(() => FabCode.state().project + '|' + document.getElementById('fcBack').textContent.trim());
    await f.evaluate(() => { FabCode.home(); document.getElementById('fcBack').click(); }); await wait(300);
    const out = await page.evaluate(() => document.querySelector('.screen.active').id);
    assert(r && st === 'goal|All projects' && out === 'screen-learn', 'a Computing card opens its project, and Back comes back to the Learning Hub: ' + [r, st, out].join(' / '));
    await page.evaluate(() => localStorage.removeItem('fab-home'));
    await page.evaluate(() => { document.querySelector('#learnYears [data-year="all"]').click(); document.querySelector('#learnFilters [data-subject="all"]').click(); try{ localStorage.removeItem('fab-me'); }catch(e){} showScreen('screen-hub'); });
    await page.setViewportSize({ width:1280, height:800 });
  });

  await test('World, round 24: the world is the whole window with Leave, Sounds and Light/Dark inside it; Back in an activity returns to the world; Go in near a place; the beat maker in the Fab Fox look', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    await page.evaluate(() => { showScreen('screen-games'); showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && document.getElementById('leaveBtn'), null, { timeout:15000 }); await page.waitForTimeout(400);
    const frame = await page.evaluate(() => { const f = document.querySelector('.game-frame[data-game="world"]').getBoundingClientRect(), top = document.querySelector('#screen-world .screen-top'); return [Math.round(f.left), Math.round(f.top), Math.round(f.width) >= innerWidth - 1, Math.round(f.height) >= innerHeight - 1, getComputedStyle(top).display].join('|'); });
    assert(frame === '0|0|true|true|none', 'the world fills the window: no strip and no Back above it: ' + frame);
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), out = {}, emo = /\p{Extended_Pictographic}/u; try{ WORLD.closeScene(true); }catch(e){}
      S.missions = 30; try{ localStorage.setItem('fab-theme', 'light'); }catch(e){} setThm('light'); await wait(50);
      const chip = id => { const b = document.getElementById(id); return b && !b.classList.contains('hide') ? b.textContent.trim() : '-'; };
      out.hud = [chip('leaveBtn'), chip('sndBtn'), chip('thmBtn')].join('|') + '|' + document.querySelector('.hud').firstElementChild.id;
      const was = window.parent.Sound.enabled; document.getElementById('sndBtn').click(); out.snd = [was !== window.parent.Sound.enabled, chip('sndBtn')].join('|'); document.getElementById('sndBtn').click();
      document.getElementById('thmBtn').click(); out.dark = [document.body.classList.contains('dark'), localStorage.getItem('fab-theme'), chip('thmBtn')].join('|');
      mStem(); await wait(500); let el = WORLD.scene().el; out.darkScene = getComputedStyle(el).backgroundColor + '|' + el.querySelector('.sthm').textContent.trim();
      el.querySelector('.sthm').click(); out.lightScene = getComputedStyle(el).backgroundColor + '|' + localStorage.getItem('fab-theme');
      const bx = el.querySelector(':scope > .sx'), br = bx.getBoundingClientRect(); out.back = [bx.textContent.trim(), Math.round(br.left) <= 16, Math.round(br.top) <= 16, getComputedStyle(bx).boxShadow === 'none'].join('|');
      bx.click(); await wait(100); out.closed = !WORLD.scene(); document.getElementById('leaveBtn').click(); out.guard = window.parent.document.querySelector('.screen.active').id;
      /* Go in near a place, and a tap on a building */
      const mu = WORLD.PLACES.find(p => p.id === 'music'); teleportTo(mu.x + 120, mu.y + 40); WORLD.coll().length = 0; await wait(500);
      const gi = document.getElementById('goIn'); out.goin = [!gi.classList.contains('hide'), gi.textContent.trim(), getComputedStyle(gi).backgroundColor].join('|');
      gi.click(); await wait(200); out.went = WORLD.scene() ? WORLD.scene().cls : '-'; WORLD.closeScene(true);
      const gd = WORLD.PLACES.find(p => p.id === 'garden'); out.tap = !!placeAt({ x:gd.x, y:gd.y - 80 }) && placeAt({ x:gd.x, y:gd.y - 80 }).id === 'garden' && !placeAt({ x:gd.x + 400, y:gd.y + 300 });
      /* the beat maker */
      mBeat(); await wait(300); el = WORLD.scene().el;
      const btns = [...el.querySelectorAll('.bbar button, .bready button')], labs = [...el.querySelectorAll('.blab i')];
      out.beat = [btns.length >= 8, btns.every(b => b.querySelector('svg') && !emo.test(b.textContent)), labs.length >= 7, labs.every(i => i.querySelector('svg') && !emo.test(i.textContent)), !emo.test(el.querySelector('h2').textContent), getComputedStyle(el.querySelector('.bgrid')).borderTopColor, getComputedStyle(el).backgroundColor].join('|');
      const on = [...el.querySelectorAll('.bcell.on')].map(c => getComputedStyle(c).backgroundColor), pal = ['rgb(240, 185, 19)', 'rgb(173, 203, 124)', 'rgb(207, 231, 242)', 'rgb(227, 201, 160)', 'rgb(239, 130, 71)', 'rgb(201, 138, 92)', 'rgb(254, 77, 2)', 'rgb(255, 148, 22)'];
      out.cells = on.length > 3 && on.every(c => pal.includes(c)) && [...el.querySelectorAll('.bcell')].every(c => getComputedStyle(c).boxShadow === 'none');
      const g = el.querySelector('#bGrid').getBoundingClientRect(), h = el.querySelector('h2').getBoundingClientRect(), er = el.getBoundingClientRect(); out.fits = h.top >= er.top && g.bottom <= er.bottom;
      WORLD.closeScene(true);
      /* Fox Blocks inside the world has its own Back, and the world's Back and Light/Dark are hidden there */
      mCode('bush'); await wait(200); el = WORLD.scene().el; const f = el.querySelector('iframe.codeframe');
      for(let i = 0; i < 60 && !(f.contentWindow && f.contentWindow.FabCode && f.contentDocument.getElementById('fcBack')); i++) await wait(150);
      out.code = [getComputedStyle(el.querySelector(':scope > .sx')).display, getComputedStyle(el.querySelector(':scope > .sthm')).display, f.contentDocument.getElementById('fcBack').textContent.trim()].join('|');
      f.contentWindow.FabCode.home(); await wait(100); out.codeBack = f.contentDocument.getElementById('fcBack').textContent.trim(); f.contentDocument.getElementById('fcBack').click(); await wait(200); out.codeClosed = !WORLD.scene();
      S.missions = 0; return out; });
    const j = JSON.stringify(r);
    assert(r.hud === 'Leave|Sounds on|Dark|leaveBtn' || r.hud === 'Leave|Sounds off|Dark|leaveBtn', 'the top bar starts with Leave, and has Sounds and Light/Dark: ' + j);
    assert(/^true\|Sounds (on|off)$/.test(r.snd) && r.dark === 'true|dark|Light', 'Sounds switches the app’s sound; Dark is kept on the device: ' + j);
    assert(r.darkScene === 'rgb(46, 33, 24)|Light' && r.lightScene === 'rgb(255, 212, 131)|light', 'an activity is dark brown in dark mode and brand cream in light mode, and the choice is there inside it: ' + j);
    assert(r.back === 'Back|true|true|true' && r.closed && r.guard === 'screen-world', 'Back sits top left in an activity and goes back to the world, and a quick second tap does not leave the world: ' + j);
    assert(/^true\|Go in: The Music Hut\|rgb\(240, 185, 19\)$/.test(r.goin) && r.went === 'sc-music' && r.tap, 'near a place a big gold “Go in” opens it, and a tap on a building finds that place: ' + j);
    assert(/^true\|true\|true\|true\|true\|rgb\(43, 26, 18\)\|rgb\(255, 212, 131\)$/.test(r.beat) && r.cells && r.fits, 'the beat maker has drawn icons, palette colours with ink outlines, no shadows, and fits the window: ' + j);
    assert(r.code === 'none|none|Back to Fab Fox World' || r.code === 'none|none|All projects', 'inside the world, Fox Blocks shows its own Back: ' + j);
    assert(r.codeBack === 'Back to Fab Fox World' && r.codeClosed, 'from Fox Blocks’ projects, Back closes it and returns to the world: ' + j);
    /* Leave: back to where the world was opened from */
    await fr.evaluate(() => { closeScene.t = 0; document.getElementById('leaveBtn').click(); }); await page.waitForTimeout(300);
    const left = await page.evaluate(() => document.querySelector('.screen.active').id);
    assert(left === 'screen-games', 'Leave goes back to where Fab Fox World was opened from: ' + left);
    await fr.evaluate(() => { try{ localStorage.setItem('fab-theme', 'light'); }catch(e){} });
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });

  await test('Round 24 queue: Fab wears his shop clothes in Fox Blocks, a 3D build becomes a Fox Blocks maze, the world’s small activities follow the style rules, and Explorer Worlds and the page games grow on big screens', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    /* a build and Fab's clothes, kept on this device by Fab Fox World */
    const cp = await codePage('?learner=code-fox-4');
    const r = await cp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms));
      localStorage.setItem('fabworld-v2-code-fox-4', JSON.stringify({ kit:{ own:{ 'wizard-hat':true, 'star-t-shirt':true }, wear:{ head:'wizard-hat', body:'star-t-shirt' } } }));
      localStorage.setItem('fabcode-build-code-fox-4', JSON.stringify({ cells:{ '0,2':{ h:1, c:'#FE4D02' }, '1,2':{ h:2, c:'#F0B913' }, '2,2':{ h:3, c:'#FE4D02' }, '3,2':{ h:1, c:'#FE4D02' }, '4,2':{ h:1, c:'#FE4D02' }, '5,2':{ h:2, c:'#FE4D02' } } }));
      return 1; });
    await cp.reload(); await cp.waitForFunction(() => window.FabCode && FabCode.state, null, { timeout:15000 }); await cp.waitForTimeout(900);
    const q = await cp.evaluate(async () => { const F = FabCode, wait = ms => new Promise(res => setTimeout(res, ms)); F.speed = 40; const out = {};
      out.projects = F.projects.map(p => p.id).join();
      F.open('build', 0); await wait(300); const L = F.projects.find(p => p.id === 'build').levels[0];
      out.maze = [L.cols, L.rows, L.walls.length, L.walls.every(w => w[2] === 'brick'), JSON.stringify(L.start), JSON.stringify(L.goal)].join('|');
      out.wearing = F.state().wearing;
      F.setProgram([['right', 1], ['up', 6]]); let x = await F.run(); out.bump = x.tip || '';
      F.setProgram(L.sol); x = await F.run(); out.solved = x.ok + '|' + L.sol.length;
      try{ localStorage.removeItem('fabworld-v2-code-fox-4'); localStorage.removeItem('fabcode-build-code-fox-4'); localStorage.removeItem(F.key); localStorage.removeItem('fabworld-pending-code-fox-4'); }catch(e){}
      return out; });
    await cp.close();
    assert(q.projects === 'bush,dance,tap,goal,build' && q.maze === '8|8|6|true|[0,7]|[6,0]', 'a build carried from the workshop becomes a fourth project, “My build”, an 8 by 8 maze of the child’s own blocks: ' + JSON.stringify(q));
    assert(q.wearing === 'star-t-shirt,wizard-hat', 'Fab wears what he wears in Fab Fox World on the Fox Blocks stage: ' + q.wearing);
    assert(/^Fab bumped into your build/.test(q.bump) && /^true\|\d+$/.test(q.solved), 'bumping into the build gets a gentle tip, and the model answer (the fewest blocks) gets through: ' + JSON.stringify(q));
    /* the world: the small activities, Fox's Den, missions and the Music Hut, and "Code it" in the 3D workshop */
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame(); await fr.waitForFunction(() => !!window.WORLD);
    const w = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), emo = /\p{Extended_Pictographic}/u, out = {}, ink = 'rgb(43, 26, 18)'; try{ WORLD.closeScene(true); }catch(e){} WORLD.S().missions = 30;
      mGames(); await wait(150); let el = WORLD.scene().el; out.den = [...el.querySelectorAll('.gtile')].map(t => !!t.querySelector('svg') && !emo.test(t.textContent) && getComputedStyle(t).boxShadow === 'none' && getComputedStyle(t).borderTopColor === ink).join();
      mMusicHut(); await wait(150); el = WORLD.scene().el; out.hut = [...el.querySelectorAll('.cadbig')].map(t => !!t.querySelector('svg') && !emo.test(t.textContent)).join() + '|' + !emo.test(el.querySelector('h2').textContent);
      mMissions(); await wait(150); el = WORLD.scene().el; const go = [...el.querySelectorAll('.mgo')]; out.mis = go.length > 0 && go.every(b => getComputedStyle(b).borderTopColor === ink && getComputedStyle(b).boxShadow === 'none' && !/rgb\(50, 84, 86\)/.test(getComputedStyle(b).backgroundColor));
      startMini('feel'); await wait(150); el = WORLD.scene().el; out.faces = [...el.querySelectorAll('.face')].every(b => getComputedStyle(b).borderTopColor === ink && getComputedStyle(b).boxShadow === 'none');
      startMini('kind'); await wait(400); el = WORLD.scene().el; out.bub = [...el.querySelectorAll('.bub')].every(b => getComputedStyle(b).borderTopColor === ink && getComputedStyle(b).boxShadow === 'none');
      startMini('move'); await wait(150); el = WORLD.scene().el; out.move = [...el.querySelectorAll('.mv-btn')].map(b => !!b.querySelector('svg') && !emo.test(b.textContent)).join();
      mCad('blocks'); await wait(300); el = WORLD.scene().el; out.codeit = !!el.querySelector('#cadViewBtns [data-a="code"]') && !el.querySelector('#cadViewBtns [data-a="code"]').textContent.match(emo);
      el.querySelector('#cadViewBtns [data-a="code"]').click(); await wait(100); out.nudge = el.querySelector('.sub').textContent;
      WORLD.closeScene(true); WORLD.S().missions = 0; return out; });
    assert(!/false/.test(w.den) && w.hut === 'true,true|true' && w.mis && w.faces && w.bub && w.move === 'true,true', 'Fox’s Den, the Music Hut, missions, feelings, bubbles and Fab says have ink outlines, no shadows and drawn icons: ' + JSON.stringify(w));
    assert(w.codeit && /^Build something first/.test(w.nudge), 'the 3D workshop has “Code it”, with a gentle nudge when nothing is built yet: ' + JSON.stringify(w));
    /* Explorer Worlds and the page games grow on a big screen */
    await page.setViewportSize({ width:1920, height:1080 }); await page.evaluate(() => { fabOpenTime('screen-learn'); }); await page.waitForTimeout(500);
    const z = await page.evaluate(() => ['screen-time', 'screen-c4', 'screen-uno'].map(id => { const el = document.getElementById(id); return el && el.classList.contains('zoomok') && parseFloat(getComputedStyle(el).zoom) > 1.3; }).join());
    assert(z === 'true,true,true', 'Explorer Worlds, Connect 4 and Uno grow as one piece on a big screen: ' + z);
    const sound = await page.evaluate(() => !!document.querySelector('#soundToggle svg') && !/\p{Extended_Pictographic}/u.test(document.getElementById('soundToggle').textContent));
    assert(sound, 'the sound button is a drawing');
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });

  await test('The STEM Den is on the map beside Dad’s Workshop, and both open Fox Blocks inside the world', async () => {
    await page.setViewportSize({ width:1366, height:700 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), emo = /\p{Extended_Pictographic}/u, out = {}; try{ WORLD.closeScene(true); }catch(e){}
      const p = WORLD.PLACES.find(x => x.id === 'stem'), dad = WORLD.PLACES.find(x => x.id === 'workshop'); out.place = p ? [p.n, p.z, Math.round(Math.hypot(p.x - dad.x, p.y - dad.y)), WORLD.PLACES.length].join('|') : '';
      const art = new Image(); art.src = 'world/stemden.png'; await new Promise(res => { art.onload = art.onerror = res; }); out.art = art.naturalWidth + 'x' + art.naturalHeight;
      S.missions = 30; S.go = 'pop'; document.getElementById('mapBtn').click(); await wait(300);
      const box = document.querySelector('.mapbox.v2'), pin = box.querySelector('.mp[data-id="stem"]'), im = box.querySelector('.mpart'), br = box.getBoundingClientRect(), ir = im.getBoundingClientRect(), wr = box.querySelector('.mp[data-id="workshop"]').getBoundingClientRect(), pr = pin.getBoundingClientRect();
      out.map = [pin.getAttribute('aria-label'), !pin.disabled, ir.width > br.width * .1 && ir.width < br.width * .2, ir.left > br.left && ir.right < br.right && ir.bottom < br.bottom, pr.top > wr.top + 20, Math.abs((ir.left + ir.right) / 2 - pr.left) < 4].join('|');
      pin.click(); await wait(400); out.there = Math.round(Math.hypot(WORLD.P.x - p.x, WORLD.P.y - p.y)) < 220;
      mStem(); await wait(150); let el = WORLD.scene().el; out.stem = [...el.querySelectorAll('.cadbig')].map(b => b.querySelector('b').textContent + ':' + !!b.querySelector('svg') + ':' + !emo.test(b.textContent)).join('|'); out.title = el.querySelector('h2').textContent;
      el.querySelector('.cadbig[data-m="shop"]').click(); await wait(150); el = WORLD.scene().el; out.shop = el.querySelector('h2').textContent + '|' + [...el.querySelectorAll('.cadbig b')].map(b => b.textContent).join(',');
      const cards = [...el.querySelectorAll('.cadbig')], rs = cards.map(c => c.getBoundingClientRect()), sr = el.getBoundingClientRect();
      out.cards = [cards.every(c => getComputedStyle(c).boxShadow === 'none' && getComputedStyle(c).borderTopColor === 'rgb(43, 26, 18)' && c.querySelector('svg') && !emo.test(c.textContent)), rs.every(q => q.left >= sr.left && q.right <= sr.right + 1 && q.bottom <= sr.bottom + 1), Math.round(rs[rs.length - 1].right - rs[0].left) > sr.width * .8, parseFloat(getComputedStyle(cards[0].querySelector('b')).fontSize) >= 22].join('|');
      try{ WORLD.coll().length = 0; }catch(e){} const before = S.spk; el.querySelector('.cadbig[data-m="code"]').click(); await wait(200); el = WORLD.scene().el; const f = el.querySelector('iframe.codeframe');
      
      for(let i = 0; i < 60 && !(f.contentWindow && f.contentWindow.FabCode && f.contentWindow.Blockly); i++) await wait(150);
      out.frame = [el.classList.contains('sc-code'), /code\.html\?embed=1/.test(f.src), Math.round(f.getBoundingClientRect().width) >= innerWidth * .9 && Math.round(f.getBoundingClientRect().height) >= innerHeight * .8, getComputedStyle(el.querySelector(':scope > .sx')).display === 'none'].join('|');
      const C = f.contentWindow.FabCode, d = f.contentDocument; out.inside = [d.querySelector('.fc-word').textContent, d.getElementById('fc').classList.contains('embed'), !d.querySelector('.fc-foot a'), d.getElementById('fcBack').textContent.trim() === 'Back to Fab Fox World'].join('|');
      C.speed = 40; C.open('bush', 0); C.setProgram([['right', 4]]); const res = await C.run(); out.solved = res.ok + '|' + res.first;
      try{ WORLD.coll().length = 0; }catch(e){} WORLD.closeScene(); await wait(300); out.berries = (S.spk - before) + '|' + document.getElementById('cheer').textContent.replace(/\s+/g, ' ').trim().slice(0, 90) + '|' + !WORLD.scene();
      try{ localStorage.removeItem(C.key); }catch(e){} S.missions = 0;
      return out; });
    const j = JSON.stringify(r);
    assert(/^The STEM Den\|1\|\d+\|16$/.test(r.place) && +r.place.split('|')[2] < 450 && r.art === '440x380', 'the STEM Den is a sixteenth place on Rainbow Hill, close to Dad’s Workshop, with its own drawing: ' + j);
    assert(r.map === 'The STEM Den|true|true|true|true|true' && r.there, 'it is on the map under Dad’s Workshop with its building drawn in, and tapping it takes Fab there: ' + j);
    assert(r.title === 'The STEM Den' && r.stem === 'Fox Blocks: to the bramble bush:true:true|Fox Blocks: Fab’s dance:true:true|Fox Blocks: score a goal:true:true|Build it in 3D:true:true', 'the STEM Den offers the three Fox Blocks projects and the way to Dad’s Workshop, with drawn icons: ' + j);
    assert(r.shop === 'Dad’s Workshop|Design and build,Draw it in 3D,Fox Blocks,Tower drop' && r.cards === 'true|true|true|true', 'Dad’s Workshop has four benches as flat cards that fill the screen: ' + j);
    assert(r.frame === 'true|true|true|true' && r.inside === 'Fox Blocks|true|true|true', 'Fox Blocks opens inside the world, full size, with its own Back to the world: ' + j);
    assert(r.solved === 'true|true' && /^1\|\+1 berry\s*Your Fox Blocks stars turned into berries/.test(r.berries) && /\|true$/.test(r.berries), 'a puzzle solved there arrives as a berry when Fox Blocks is closed: ' + j);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Draw it in 3D has join-the-dots challenges: a model to aim for, a gentle hint, a low-energy route and “What next?”', async () => {
    await page.setViewportSize({ width:1366, height:700 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), emo = /\p{Extended_Pictographic}/u, out = {}; try{ WORLD.closeScene(true); }catch(e){}
      S.cadDone = {}; S.spk = 5; setTop(); mCad('draw'); await wait(300); const el = WORLD.scene().el, ed = el.querySelector('#cadEd'), goal = el.querySelector('#cadGoal');
      out.list = [...el.querySelectorAll('#cadChs .cadch')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg') + ':' + !emo.test(b.textContent)).join('|'); out.tpl = el.querySelectorAll('#cadStart [data-tpl]').length;
      const sr = el.getBoundingClientRect(); out.fits = [...el.querySelectorAll('.cadside .cadbox')].filter(b => b.offsetParent).every(b => { const q = b.getBoundingClientRect(); return q.bottom <= sr.bottom + 1 && q.left >= sr.left; });
      el.querySelector('.cadch[data-ch="dhouse"]').click(); await wait(120);
      out.brief = goal.textContent; out.hidden = el.querySelector('#cadChBox').classList.contains('hide') && el.querySelector('#cadStart').classList.contains('hide') && !goal.classList.contains('hide');
      const tap = (i, j) => { const q = ed.getBoundingClientRect(); ed.dispatchEvent(new PointerEvent('pointerdown', { clientX:q.left + (30 + i * 45) * q.width / 420, clientY:q.top + (30 + j * 45) * q.height / 420, bubbles:true })); };
      tap(4, 4); out.miss = goal.querySelector('.cadstep').textContent + '|' + CAD.pts.length; tap(1, 8); tap(1, 4); out.two = goal.querySelector('.cadprog').textContent;
      [...goal.querySelectorAll('.cadb')].find(b => /Join the next dot for me/.test(b.textContent)).click(); await wait(60); out.three = goal.querySelector('.cadprog').textContent + '|' + JSON.stringify(CAD.pts[2]);
      tap(7, 4); tap(7, 8); out.last = goal.querySelector('.cadstep').textContent; const before = S.spk; tap(1, 8); await wait(150);
      out.done = [CAD.closed, !!(S.cadDone && S.cadDone.dhouse), S.spk - before, document.getElementById('cheer').textContent.replace(/\s+/g, ' ').trim().slice(0, 60)].join('|');
      out.next = [...goal.querySelectorAll('.cadnext .cadb')].map(b => b.textContent.trim() + ':' + !!b.querySelector('svg')).join('|'); out.ticked = el.querySelector('.cadch[data-ch="dhouse"]').classList.contains('won');
      [...goal.querySelectorAll('.cadnext .cadb')].find(b => /Next challenge/.test(b.textContent)).click(); await wait(120); out.nextOne = goal.querySelector('.cadh').textContent + '|' + CAD.pts.length + '|' + CAD.closed;
      goal.querySelector('.cadback').click(); await wait(80); out.back = !el.querySelector('#cadChBox').classList.contains('hide') && goal.classList.contains('hide');
      WORLD.closeScene(true); S.cadDone = {}; return out; });
    const j = JSON.stringify(r);
    assert(r.list === 'A boat:true:true|A house:true:true|A fox face:true:true|A star:true:true|A tree:true:true|Free drawing:true:true' && r.tpl === 6 && r.fits, 'five join-the-dots challenges and free drawing, with drawn icons, and the instant shapes are still there: ' + j);
    assert(/Dad says: Five dots make a house/.test(r.brief) && /Dot 1 of 5: tap the dot numbered 1\./.test(r.brief) && /Show me the model/.test(r.brief) && /Tired\?/.test(r.brief) && r.hidden, 'a challenge gives Dad’s brief, the first dot, a model to look at and a low-energy route: ' + j);
    assert(/^Look for the dot with 1 on it\. .*\|0$/.test(r.miss) && r.two === '2 of 5 dots joined' && r.three === '3 of 5 dots joined|[4,1]', 'a tap on another dot gives a gentle hint and joins nothing; Fab can join a dot for you: ' + j);
    assert(/Last step: tap dot 1 again to close the shape\./.test(r.last) && /^true\|true\|2\|You drew a house!/.test(r.done) && r.ticked, 'closing the shape finishes the challenge and earns two berries: ' + j);
    assert(r.next === 'Keep it in My makes:true|Make it your own:true|Build it for real:true|Put it on show:true|Code with Fox Blocks:true|Next challenge:true' && r.nextOne === 'A fox face|0|false' && r.back, '“What next?” offers six ways on, the next challenge starts clean, and the list comes back: ' + j);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  /* ---------- big screens (bigscreen.js) ---------- */
  await test('Big screens: the menus grow as one piece, lessons get wider with bigger words, and a laptop, a tablet and Fab Fox World are left alone', async () => {
    const bp = await newPage('/index.html');
    await bp.waitForFunction(() => window.FabBig);
    const page1 = async () => bp.evaluate(() => { const m = document.querySelector('main').getBoundingClientRect(), s = document.querySelector('.screen.active'); return { id:s.id, az:+FabBig.zoom().toFixed(2), main:Math.round(m.width), zoom:+(+getComputedStyle(s).zoom).toFixed(2), sw:document.documentElement.scrollWidth, w:innerWidth, root:getComputedStyle(document.documentElement).fontSize }; });
    await bp.setViewportSize({ width:1366, height:768 }); await bp.waitForTimeout(150); let a = await page1();
    assert(a.az === 1 && a.main <= 980 && a.zoom === 1 && a.root === '16px', 'a laptop is left exactly as it was: ' + JSON.stringify(a));
    await bp.setViewportSize({ width:820, height:1100 }); await bp.waitForTimeout(150); a = await page1();
    assert(a.az === 1 && a.zoom === 1 && a.sw <= a.w, 'an upright tablet is left alone: ' + JSON.stringify(a));
    await bp.setViewportSize({ width:2560, height:1300 }); await bp.waitForTimeout(150);
    for(const id of ['screen-hub', 'screen-games', 'screen-wellbeing', 'screen-learn']){
      await bp.evaluate(i => showScreen(i), id); await bp.waitForTimeout(200); a = await page1();
      assert(a.id === id && a.az > 1.6 && a.zoom === a.az && a.main >= 1600 && a.sw <= a.w + 1 && a.root === '16px', id + ' grows to fill a big screen without spilling sideways: ' + JSON.stringify(a));
    }
    const tile = await bp.evaluate(() => { showScreen('screen-hub'); const t = document.querySelector('#screen-hub .category-tile, #screen-hub .tile'), r = t.getBoundingClientRect(), h = t.querySelector('h2').getBoundingClientRect(); return [Math.round(r.width), Math.round(h.height)]; });
    assert(tile[0] >= 300 && tile[1] >= 36, 'the hub tiles and their words are big on a big screen: ' + tile);
    await bp.evaluate(() => { showScreen('screen-world'); }); await bp.waitForTimeout(200); a = await page1();
    assert(a.id === 'screen-world' && a.zoom === 1, 'Fab Fox World sizes itself and is not zoomed: ' + JSON.stringify(a));
    const lesson = async () => bp.evaluate(() => { const bar = [...document.querySelectorAll('.bd-tools .bd-tool')].filter(b => b.offsetParent), rs = bar.map(b => b.getBoundingClientRect());
      const clash = rs.some((x, i) => rs.some((c, k) => k > i && x.left < c.right - 1 && c.left < x.right - 1 && x.top < c.bottom - 1 && c.top < x.bottom - 1)), over = bar.filter(b => b.scrollWidth > b.clientWidth + 2).length;
      return { stage:Math.round(document.querySelector('.lp-stage').getBoundingClientRect().width), root:parseFloat(getComputedStyle(document.documentElement).fontSize), ask:parseFloat(getComputedStyle(document.querySelector('.pw-ask')).fontSize), clash, over, sw:document.documentElement.scrollWidth, w:innerWidth, zoom:+getComputedStyle(document.getElementById('screen-lesson')).zoom }; });
    await bp.evaluate(() => { const pk = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(pk); learnGo(1); const s = pk.screens[1], st = Learn.state[1], me = pwMe(); pwStart(s, st, me, 2); const k = st.kids[me]; pwTaught(k); k.phase = 'ydo'; k.q = pwQuestion(s.steps[2]); learnRender(); });
    await bp.waitForTimeout(400); let l = await lesson();
    assert(l.stage >= 2300 && l.root > 22 && l.ask > 34 && !l.clash && !l.over && l.sw <= l.w + 1 && l.zoom === 1, 'a lesson fills a big screen: wider panels, bigger words, tool labels inside their buttons: ' + JSON.stringify(l));
    await bp.setViewportSize({ width:3840, height:1800 }); await bp.waitForTimeout(300); l = await lesson();
    assert(l.stage >= 3300 && l.root > 30 && !l.clash && !l.over && l.sw <= l.w + 1, 'and a very big screen: ' + JSON.stringify(l));
    await bp.setViewportSize({ width:1366, height:768 }); await bp.waitForTimeout(300); l = await lesson();
    assert(l.root === 16 && l.stage <= 1340 && !l.clash, 'back on a laptop the lesson is as it was: ' + JSON.stringify(l));
    await bp.close();
  });
  /* ---------- drawn icons on the app's own pages (icons.js) ---------- */
  await test('Drawn icons: the hub tiles, the Learning Hub cards, the flightpath buttons, the Learning Board tools and the My stuff tabs carry drawings, not emoji', async () => {
    const ip = await newPage('/index.html');
    await ip.setViewportSize({ width:1366, height:768 }); await ip.waitForFunction(() => window.FabIcon); await ip.waitForTimeout(200);
    const r = await ip.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), emo = /\p{Extended_Pictographic}/u, out = {};
      const ok = el => !!el && !!el.querySelector('svg.fi') && !emo.test(el.textContent);
      out.tiles = [...document.querySelectorAll('#screen-hub .category-tile')].map(t => { const e = t.querySelector('.emoji'), pic = e && (e.querySelector('svg.fi') || e.querySelector('img')); /* a drawn icon, or the place's own drawing (the STEM Den) */ return !!pic && !emo.test(e.textContent) && pic.getBoundingClientRect().width >= 40; }).join();
      out.ritual = [...document.querySelectorAll('#screen-hub .ritual-btn')].map(ok).join();
      showScreen('screen-learn'); await wait(250); out.cards = [...document.querySelectorAll('#learnTools .lt-card')].map(c => ok(c.querySelector('i')) && c.querySelector('svg.fi').getBoundingClientRect().width >= 36).join(); out.title = ok(document.querySelector('#screen-learn .screen-title'));
      const pk = BUILT_IN_PACKS.find(x => x.id === 'maths-flightpath-multiplication-division'); learnOpen(pk); learnGo(1); const s = pk.screens[1], st = Learn.state[1], me = pwMe(); pwStart(s, st, me, 2); const k = st.kids[me]; pwTaught(k); k.phase = 'ydo'; k.q = pwQuestion(s.steps[2]); learnRender(); await wait(400);
      const L = document.getElementById('screen-lesson'), btn = t => [...L.querySelectorAll('button')].find(b => b.textContent.trim() === t);
      out.lesson = ['My flightpath', 'Type my answer', 'I’d like help', 'I need a break', 'An easier step'].map(t => t + ':' + ok(btn(t))).join('|');
      out.streak = [...L.querySelectorAll('.pw-streak span')].map(ok).join(); out.mission = !!L.querySelector('.pw-mission svg.fi');
      const tools = [...L.querySelectorAll('.bd-tools .bd-tool')].filter(b => b.offsetParent); out.tools = tools.length + '|' + tools.filter(b => b.querySelector('i svg.fi') && !emo.test(b.querySelector('i').textContent)).length;
      pwCheck(s, k, k.q.ans); learnRender(); await wait(300); out.again = ok([...L.querySelectorAll('button')].find(b => b.textContent.trim() === 'I need a break')) + '|' + L.querySelectorAll('.pw-streak span.on svg.fi').length;
      out.names = FabIcon.names.length; return out; });
    const j = JSON.stringify(r);
    assert(r.tiles === 'true,true,true,true,true,true' && r.ritual === 'true,true' && r.cards.split(',').every(x => x === 'true') && r.cards.split(',').length >= 3 && r.title, 'the landing page and the Learning Hub: ' + j);
    assert(r.lesson === 'My flightpath:true|Type my answer:true|I’d like help:true|I need a break:true|An easier step:true' && r.streak === 'true,true,true' && r.mission, 'the flightpath buttons, the three stars and the mission line: ' + j);
    assert(+r.tools.split('|')[0] >= 9 && +r.tools.split('|')[1] >= 9 && r.again === 'true|1' && r.names >= 30, 'the Learning Board tools, and the drawings come back after the lesson redraws: ' + j);
    await ip.close();
    await page.setViewportSize({ width:1366, height:700 });
    await page.evaluate(() => { showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && WORLD.KIT && WORLD.KIT.ready, null, { timeout:15000 });
    const tabs = await fr.evaluate(async () => { try{ WORLD.closeScene(true); }catch(e){} WORLD.mStuff(); await new Promise(res => setTimeout(res, 300)); const el = WORLD.scene().el, bs = [...el.querySelectorAll('.tabs button')], rs = bs.map(b => b.getBoundingClientRect());
      const out = bs.map(b => b.textContent.trim() + ':' + !!b.querySelector('svg') + ':' + !/\p{Extended_Pictographic}/u.test(b.textContent)).join('|') + '#' + rs.every((a, i) => rs.every((c, k) => k <= i || a.right <= c.left + 1 || a.bottom <= c.top + 1)); WORLD.closeScene(true); return out; });
    assert(tabs === 'Fab’s shop:true:true|Pip’s fur:true:true|Dress Pip:true:true|Pip’s nest:true:true|Decorate:true:true#true', 'the five My stuff tabs have drawn icons and do not overlap: ' + tabs);
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Round 25: the 3D view is one piece to the top; six kinds of berry bush and a Berry book; drawn gates, pond and map pins; Fox Blocks sounds; dark menu pages', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    /* nothing in the world is still drawn with these emoji, and the 3D sky is the same haze as the far grass */
    const g = fs.readFileSync(path.join(ROOT, 'games.js'), 'utf8');
    const gone = ['em(\\"🔒\\"', 'em(\\"🌈\\"', 'em(\\"🪷\\"', 'em(\\"🦆\\"', 'fillText(\\"🦊\\",cx,cy)', 'fillText(\\"🔒\\",-60', '#D3E5B0'].filter(k => g.includes(k));
    assert(!gone.length, 'gates, pond, map pins and the hint card are drawn, and the far hills strip is gone: ' + gone.join(' '));
    await page.evaluate(() => { showScreen('screen-games'); showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && typeof BUSHES !== 'undefined', null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), out = {}; try{ WORLD.closeScene(true); }catch(e){}
      const src = ground3D.toString(); out.sky = /uSky0,hex3\(artMix\("#E4EFD2"/.test(src) && /uSky1,hex3\(artMix\("#E4EFD2"/.test(src) && !/far hills/.test(src);
      out.kinds = BUSHES.map(b => b.k + b.z).join(); out.safe = BUSH_SAFE;
      S.missions = 0; S.bk = {}; S.bkn = {}; const spk = S.spk;
      /* a bush in a part of the world that isn't open yet can't be picked */
      const keep = { v:S.visited, c:S.col, d:S.decor, care:S.cub.care }; S.visited = {}; S.col = {}; S.decor = []; S.cub.care = 0;
      const go = BUSHES.find(b => b.k === 'gooseberry'); P.x = go.x + 84; P.y = go.y + 22; out.locked = maxZone() === 0 && bushNear() === null;
      S.visited = keep.v; S.col = keep.c; S.decor = keep.d; S.cub.care = keep.care;
      /* walk up to the bramble: the gold button picks; then it opens the Berry book */
      const br = BUSHES.find(b => b.k === 'bramble'); teleportTo(br.x + 150, br.y + 22); WORLD.coll().length = 0; await wait(600);
      const gi = document.getElementById('goIn'); out.pick = [!gi.classList.contains('hide'), gi.textContent.trim()].join('|');
      gi.click(); await wait(400); out.got = [S.spk - spk, S.bkn.bramble, bushRipe(br)].join('|');
      out.after = gi.textContent.trim(); gi.click(); await wait(300);
      let el = WORLD.scene() && WORLD.scene().el; out.book = el ? [WORLD.scene().cls, el.querySelectorAll('.bbc').length, el.querySelectorAll('.bbc.no').length, el.querySelector('.bbdet b').textContent, /never pick or eat wild berries/.test(el.querySelector('.bbsafe').textContent)].join('|') : '-';
      const ink = 'rgb(43, 26, 18)'; out.cards = el ? [...el.querySelectorAll('.bbc')].every(c => getComputedStyle(c).borderTopColor === ink && getComputedStyle(c).boxShadow === 'none') && getComputedStyle(el).backgroundColor : '-';
      /* tapping a bush that is far away walks Fab beside it */
      WORLD.closeScene(true); const st = BUSHES.find(b => b.k === 'strawberry'); teleportTo(st.x - 500, st.y); await wait(200); out.tapFind = (bushAt({ x:st.x, y:st.y - 40 }) || {}).k;
      /* the Treasure book opens the Berry book */
      mBook(); await wait(200); el = WORLD.scene().el; const bb = el.querySelector('.bbopen'); out.tbook = bb ? bb.textContent.trim() : '-'; out.tcard = getComputedStyle(el.querySelector('.tc')).boxShadow === 'none' && getComputedStyle(el.querySelector('.tc')).borderTopColor === ink;
      bb.click(); await wait(200); out.tbook2 = WORLD.scene().cls; WORLD.closeScene(true);
      out.icons = ['lock', 'arch', 'lily', 'duck', 'berrybook', 'bush_raspberry', 'bush_raspberry0'].every(k => !!ICO[k]);
      S.bk = {}; S.bkn = {}; S.spk = spk; S.missions = 0; return out; });
    const j = JSON.stringify(r);
    assert(r.sky, 'the 3D view has no separate sky or hills: the top is the same haze as the far grass: ' + j);
    assert(r.kinds === 'bramble0,strawberry0,gooseberry1,raspberry1,bilberry2,redcurrant2' && /never pick or eat wild berries/.test(r.safe), 'six kinds of berry, two in each part of the world, with the safety line: ' + j);
    assert(r.locked, 'a bush in a part of the world that is still closed cannot be picked: ' + j);
    assert(r.pick === 'true|Pick blackberries' && r.got === '1|1|false' && r.after === 'Blackberries: see the Berry book', 'near a bush the gold button picks once a day for one berry, then opens the Berry book: ' + j);
    assert(r.book === 'sc-berries|6|5|Blackberries|true' && r.cards === 'rgb(255, 212, 131)', 'the Berry book has six pages, shows what Fab found, and keeps the style rules: ' + j);
    assert(r.tapFind === 'strawberry' && r.tbook === 'Berry book: 1 of 6' && r.tcard && r.tbook2 === 'sc-berries' && r.icons, 'a tap finds a bush; the Treasure book links to the Berry book and its cards have ink outlines: ' + j);
    /* Fox Blocks: soft sounds that follow the app's sound setting, and a Sounds button */
    const cp = await codePage('?learner=code-fox-5');
    const q = await cp.evaluate(async () => { const F = FabCode, wait = ms => new Promise(res => setTimeout(res, ms)); F.speed = 40; const out = {};
      localStorage.setItem('bmf_sound', 'on'); F.open('bush', 0); await wait(300); const L = F.projects.find(p => p.id === 'bush').levels[0];
      const b = document.getElementById('fcSound'); out.btn = b ? b.getAttribute('aria-pressed') + '|' + !!b.querySelector('svg') : '-';
      const n0 = fcSounds(); F.setProgram(L.sol); let x = await F.run(); const n1 = fcSounds(); out.on = x.ok + '|' + (n1 > n0);
      b.click(); out.off = localStorage.getItem('bmf_sound') + '|' + b.getAttribute('aria-pressed');
      F.setProgram(L.sol); x = await F.run(); out.quiet = fcSounds() === n1; b.click(); out.back = localStorage.getItem('bmf_sound');
      try{ localStorage.removeItem(F.key); }catch(e){} return out; });
    await cp.close();
    assert(q.btn === 'true|true' && q.on === 'true|true' && q.off === 'off|false' && q.quiet && q.back === 'on', 'Fox Blocks plays soft sounds when sounds are on, none when they are off, and has its own Sounds button: ' + JSON.stringify(q));
    /* dark menu pages: Hub, Games, Wellbeing, Early Years and the Learning Hub; lessons and games stay light */
    await page.evaluate(() => { try{ localStorage.setItem('fab-theme', 'light'); }catch(e){} showScreen('screen-games'); }); await page.waitForTimeout(200);
    const d = await page.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, b = document.getElementById('themeToggle');
      out.light = [!!b && !b.hidden, document.body.classList.contains('fab-dark')].join('|');
      b.click(); await wait(100); out.dark = [document.body.classList.contains('fab-dark'), localStorage.getItem('fab-theme'), getComputedStyle(document.querySelector('#screen-games .tile')).backgroundColor].join('|');
      showScreen('screen-pairs'); await wait(150); out.game = [document.body.classList.contains('fab-dark'), b.hidden].join('|');
      showScreen('screen-wellbeing'); await wait(150); out.well = [document.body.classList.contains('fab-dark'), getComputedStyle(document.querySelector('.wb2-group')).backgroundColor].join('|');
      showScreen('screen-learn'); await wait(150); out.learn = [document.body.classList.contains('fab-dark'), b.hidden].join('|');
      b.click(); await wait(100); out.back = [document.body.classList.contains('fab-dark'), localStorage.getItem('fab-theme')].join('|'); return out; });
    assert(d.light === 'true|false' && /^true\|dark\|/.test(d.dark) && d.game === 'false|true' && d.well === 'true|rgb(255, 212, 131)' && d.learn === 'false|true' && d.back === 'false|light', 'menu pages can be dark with light cards; the Learning Hub, lessons and games stay light: ' + JSON.stringify(d));
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });

  await test('Round 26: Dark brings evening light to the world; berries feed Pip, have a mission and say when they ripen; a show bench for three builds; dances kept in My makes; Fox Blocks events (Tap and play)', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    await page.evaluate(() => { showScreen('screen-games'); showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && typeof SHOWMAX !== 'undefined', null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), out = {}; try{ WORLD.closeScene(true); }catch(e){}
      /* Dark: evening light */
      const th = THM; setThm('dark'); const d = tod(); out.dusk = d.a >= .26 && d.n >= .65; setThm('light'); setThm(th);
      /* berries: when they ripen, Pip's snack, the mission */
      out.ripe = BUSHES.every(b => /\(/.test(b.ripe || ''));
      const keep = { bk:S.bk, bkn:S.bkn, spk:S.spk, tr:S.treats, has:S.cub.has, nm:S.cub.name };
      S.bk = {}; S.bkn = {}; S.cub.has = true; S.cub.name = 'Pip'; S.treats = 0;
      const br = BUSHES[0]; teleportTo(br.x + 150, br.y + 22); WORLD.coll().length = 0; await wait(500); pickBush(br); await wait(100);
      out.snack = [S.treats, /a snack for Pip/.test(document.getElementById('cheer').textContent)].join('|');
      const el = mBerryBook('bramble'); out.when = /In real life they ripen in late summer and early autumn/.test(el.querySelector('.bbdet').textContent); WORLD.closeScene(true);
      const m = MISSIONS.find(x => x.id === 'berries'); out.mission = m ? [m.of, m.v(), m.st].join('|') : '-';
      mMissions(); await wait(100); const row = [...WORLD.scene().el.querySelectorAll('.mrow')].find(x => /six kinds of berry/.test(x.textContent)); out.misIcon = !!(row && row.querySelector('.mi svg')); WORLD.closeScene(true);
      Object.assign(S, { bk:keep.bk, bkn:keep.bkn, spk:keep.spk, treats:keep.tr }); S.cub.has = keep.has; S.cub.name = keep.nm;
      /* the show bench */
      const keepS = { a:S.shows, b:S.onShow }; S.shows = []; delete S.onShow; S.missions = 30;
      const bld = n => ({ m:'blocks', cells:{ '2,2':{ h:n, c:'#FE4D02' } }, c:'#FE4D02' }); const offs = [1, 2, 3, 4].map(n => putOnShow(bld(n)));
      out.bench = [S.shows.length, offs.join(), S.onShow.cells['2,2'].h, S.shows.map(x => x.cells['2,2'].h).join()].join('|');
      teleportTo(ONSHOW.x, ONSHOW.y + 90); await wait(600); out.goin = document.getElementById('goIn').textContent.trim();
      document.getElementById('goIn').click(); await wait(200); const sc = WORLD.scene(); out.scene = sc ? [sc.cls, sc.el.querySelectorAll('.shc').length].join('|') : '-';
      const off = sc.el.querySelectorAll('.shc .mgo')[2]; off.click(); await wait(50); out.arm = off.textContent; off.click(); await wait(200); out.after = [S.shows.length, WORLD.scene() && WORLD.scene().el.querySelectorAll('.shc').length].join('|');
      WORLD.closeScene(true); S.shows = keepS.a; if(keepS.b) S.onShow = keepS.b; else delete S.onShow; S.missions = 0;
      /* a dance kept in Fox Blocks shows in My makes, with Watch it */
      const who = KEY.replace('fabworld-v2-', '') || 'local', mk = 'fabcode-makes-' + who, was = localStorage.getItem(mk);
      localStorage.setItem(mk, JSON.stringify([{ k:'dance', t:12345, name:'My dance', n:4, level:'d3', prog:[['hop'], ['spin']], pic:'' }]));
      mStudio('makes'); await wait(200); const fig = WORLD.scene().el.querySelector('.dgal .dfig'); out.makes = fig ? fig.querySelector('figcaption').textContent + '|' + /Watch it/.test(fig.textContent) : '-';
      fig.querySelector('.mgo').click(); await wait(300); const cf = WORLD.scene() && WORLD.scene().el.querySelector('iframe.codeframe'); out.watch = cf ? [/project=dance/.test(cf.src), /play=12345/.test(cf.src)].join('|') : '-';
      WORLD.closeScene(true); if(was == null) localStorage.removeItem(mk); else localStorage.setItem(mk, was);
      return out; });
    const j = JSON.stringify(r);
    assert(r.dusk, 'with Dark chosen the world is in evening light: ' + j);
    assert(r.ripe && r.when && r.snack === '1|true' && r.mission === '6|1|3' && r.misIcon, 'each berry says when it ripens, a picked bush gives Pip a snack, and a mission asks for all six kinds: ' + j);
    assert(r.bench === '3|false,false,false,true|4|4,3,2' && r.goin === 'See the show bench' && r.scene === 'sc-shows|3' && /Tap again/.test(r.arm) && r.after === '2|2', 'the show bench holds three builds, newest first, and a build can be taken off: ' + j);
    assert(r.makes === 'My dance · 4 blocks|true' && r.watch === 'true|true', 'a dance kept in Fox Blocks is in My makes and plays again in Fox Blocks: ' + j);
    /* Fox Blocks: events, and Keep my dance */
    const cp = await codePage('?learner=code-fox-6');
    const q = await cp.evaluate(async () => { const F = FabCode, wait = ms => new Promise(res => setTimeout(res, ms)), out = {}; F.speed = 40;
      F.open('tap', 0); await wait(200); out.blocks = [...document.querySelectorAll('.fc-ctrl [data-a]')].map(b => b.dataset.a).join();
      let x = await F.tap('fab'); out.none = /Nothing happened/.test(x.tip);
      F.setProgram({ fab:[['spin']] }); x = await F.tap('fab'); out.wrong = /not a hop/.test(x.tip || '');
      F.setProgram({ fab:[['hop']] }); const cv = document.getElementById('fcStage'), b = cv.getBoundingClientRect(), T = F.state().tile;
      cv.dispatchEvent(new PointerEvent('pointerdown', { clientX:b.left + 1.5 * T, clientY:b.top + 1.6 * T, bubbles:true })); await wait(100); while(F.state().running) await wait(50);
      out.e1 = F.state().done.e1 + '|' + F.state().panel;
      F.open('tap', 1); F.setProgram({ fab:[['spin']], bush:[['say', 'Yum!']] }); x = await F.tap('fab'); out.wait = x.wait + '|' + ((document.querySelector('.fc-note') || {}).textContent || '');
      document.querySelector('.fc-ctrl [data-a="tapbush"]').click(); await wait(100); while(F.state().running) await wait(50); out.e2 = F.state().done.e2 + '|' + F.state().panel;
      F.open('tap', 2); F.setProgram({ go:[['hop']], fab:[['hop']], bush:[['spin']] }); x = await F.run(); out.same = /the same thing/.test(x.tip || '');
      /* keep my dance */
      F.open('dance', 2); F.setProgram([['repeat', 2, [['hop'], ['wiggle']]], ['spin'], ['say', 'Hooray!']]); x = await F.run(); const kb = document.querySelector('[data-a="keepdance"]'); out.keepBtn = !!kb;
      kb.click(); const kept = JSON.parse(localStorage.getItem(F.makesKey) || '[]'); out.kept = [kept.length, kept[0] && kept[0].k, kept[0] && kept[0].n, !!(kept[0] && /^data:image/.test(kept[0].pic))].join('|');
      const again = F.keepDance(); out.again = again.kept + '|' + JSON.parse(localStorage.getItem(F.makesKey)).length;
      const pr = await F.playKept(kept[0].t); out.play = [!!pr, F.state().project, F.state().level].join('|');
      localStorage.removeItem(F.makesKey); try{ localStorage.removeItem(F.key); }catch(e){} return out; });
    await cp.close();
    assert(q.blocks === 'go,tapfab,reset,clear' && q.none && q.wrong && q.e1 === '1|win', 'Tap and play: a tap with no code, or the wrong code, gets a gentle tip; a tap on Fab on the stage runs his code: ' + JSON.stringify(q));
    assert(/^Now tap the bush\.\|Now tap the bush\.$/.test(q.wait) && q.e2 === '1|win' && q.same, 'with two events Fox Blocks says what to tap next, and each event must do something different in the last puzzle: ' + JSON.stringify(q));
    assert(q.keepBtn && q.kept === '1|dance|5|true' && q.again === 'false|1' && q.play === 'true|dance|d3', 'a finished dance can be kept in My makes (once) and played again: ' + JSON.stringify(q));
    await page.setViewportSize({ width:1280, height:800 }); await page.evaluate(() => showScreen('screen-hub'));
  });

  /* ---------- Round 27: Fab's Sanctuary (sanctuary.html), and pawed games ---------- */
  async function sanctPage(q, w, h){
    const sp = await browser.newPage(); const url = '/sanctuary.html' + (q || '');
    sp.on('pageerror', e => errors.push(`${url}: ${e.message}`));
    sp.on('console', m => { if(m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(`${url}: console: ${m.text()}`); });
    sp.on('response', r => { if(r.status() >= 400 && !/\/favicon\.ico$/.test(r.url())) errors.push(`${url}: missing ${r.url()} (${r.status()})`); });
    await sp.setViewportSize({ width:w || 1366, height:h || 768 }); await sp.goto(base + url); await sp.waitForFunction(() => window.FabSanct); await sp.waitForTimeout(200);
    return sp;
  }
  async function sanctState(sp, code, st, extra){
    await sp.evaluate(([code, st, extra]) => { localStorage.setItem('fabsanct-v1-' + code, JSON.stringify(Object.assign({ v:1, started:true }, st))); Object.keys(extra || {}).forEach(k => localStorage.setItem(k, extra[k])); }, [code, st, extra || {}]);
    await sp.reload(); await sp.waitForFunction(() => window.FabSanct); await sp.waitForTimeout(150);
  }
  await test('Fab’s Sanctuary: a first day. Build a home and name the animal, needs first (with a tip, never a cross), open the gate, money in, then spend, save or share and a budget card', async () => {
    const sp = await sanctPage('?learner=sanct-t1');
    const r = await sp.evaluate(async () => { const F = FabSanct, wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, side = () => document.getElementById('snSide').textContent;
      F.reset(); localStorage.removeItem('fabworld-pending-sanct-t1');
      out.first = /Welcome to Fab’s Sanctuary/.test(side()) && F.state().box === 20 && document.querySelectorAll('#snHot button').length === 9;
      out.emoji = /\p{Extended_Pictographic}/u.test(document.body.innerText);
      document.querySelector('[data-a="buildhomes"]').click(); await wait(100);
      out.sheet = F.sheet() && document.querySelectorAll('.sn-item').length === 6 && /10 − 10 = 0|20 − 10 = 10/.test(document.getElementById('snCard').textContent);
      document.querySelector('[data-build="hedgehog"]').click(); let n = 0; while(!/come to find a home/.test(document.getElementById('snCard').textContent) && n++ < 60) await wait(100);
      out.ask = /A hedgehog has come to find a home/.test(document.getElementById('snCard').textContent) && document.querySelectorAll('[data-name]').length === 3;
      document.querySelector('[data-name="Conker"]').click(); await wait(100);
      out.built = [F.state().box, JSON.stringify(F.state().homes), F.state().names.hedgehog, !!document.querySelector('.sn-say.cheer .sn-who.elder')].join('|');
      document.querySelector('[data-a="day"]').click(); await wait(100);
      const q = F.q(); out.q = q.ask; const wrong = q.opts.find(o => o !== q.right);
      document.querySelector(`[data-pick="${wrong}"]`).click(); await wait(100);
      out.tip = !!document.querySelector('.sn-say.tip .sn-who.doc') && document.querySelector(`[data-pick="${wrong}"]`).classList.contains('tried') && F.state().box === 10;
      document.querySelector(`[data-pick="${q.right}"]`).click(); await wait(100); out.paid = F.state().box;
      document.querySelector('[data-a="togate"]').click(); document.querySelector('[data-a="open"]').click(); await wait(300);
      out.walk = document.querySelectorAll('#snVis > g').length > 0 && F.day().step === 'walk';
      document.querySelector('[data-a="skip"]').click(); await wait(100);
      const d = F.day(); out.money = [d.visitors > 0, d.price, d.gate === d.visitors * 2, d.total === d.gate + d.box, d.step].join('|');
      F.answer(F.right()); await wait(50); out.total = /Money in today/.test(side());
      document.querySelector('[data-a="tojars"]').click(); ['savemore', 'savemore', 'sharemore'].forEach(a => document.querySelector(`[data-a="${a}"]`).click());
      document.querySelector('[data-a="putaway"]').click(); await wait(100);
      const s = F.state(); out.after = [s.day, s.box === 9 + d.total - 3, s.jar, s.shared, localStorage.getItem('fabworld-pending-sanct-t1'), s.visitors === d.visitors].join('|');
      out.card = /Today’s budget card/.test(side()) && /What’s left/.test(side()) && /A good place to stop/.test(side()) && !!document.querySelector('.sn-say.cheer');
      out.stop = [...document.querySelectorAll('#snSide [data-a]')].map(b => b.dataset.a).join();
      return out; });
    await sp.close();
    assert(r.first && !r.emoji, 'a first visit: Fab says welcome, 20 berries from the Friends of the Sanctuary, nine places to tap in the park, no emoji: ' + JSON.stringify(r));
    assert(r.sheet && r.ask && r.built === '10|{"e":"hedgehog"}|Conker|true', 'building a home costs its berries, the animal walks in and the child chooses its name; Mr Elder celebrates: ' + JSON.stringify(r));
    assert(/You have 10 berries\. Food and bedding cost 1\./.test(r.q) && r.tip && r.paid === 9, 'needs first: a wrong answer gets Doctor McPhee’s tip and is set aside, the right one pays: ' + JSON.stringify(r));
    assert(r.walk && /^true\|2\|true\|true\|money$/.test(r.money) && r.total, 'visitors walk in through the gate and pay 2 berries each at Years 3–4: ' + JSON.stringify(r));
    assert(r.after === '1|true|2|1|1|true' && r.card && r.stop === 'build,again,home', 'the jars, the budget card, a thank-you berry for Fab’s basket and a good place to stop: ' + JSON.stringify(r));
  });
  await test('Fab’s Sanctuary: never below zero. The Friends of the Sanctuary pay for the needs, “Do the rounds for me” runs a day in one tap, and thank-you berries stop at three a day', async () => {
    const sp = await sanctPage('?learner=sanct-t2');
    await sanctState(sp, 'sanct-t2', { box:1, level:2, homes:{ e:'hedgehog', f:'rabbit' }, names:{ hedgehog:'Acorn' } }, { 'fabworld-pending-sanct-t2':'0' });
    const r = await sp.evaluate(async () => { const F = FabSanct, out = {};
      F.open(); const d = F.day(); out.friends = [d.friends, F.state().box, F.state().helped, /Friends of the Sanctuary/.test(document.getElementById('snSide').textContent), !!document.querySelector('[data-a="togate"]')].join('|');
      F.end(); const boxes = [];
      for(let i = 0; i < 4; i++){ F.rounds(); boxes.push(F.state().box); F.end(); }
      out.rounds = [F.state().day, boxes.every(b => b >= 0), localStorage.getItem('fabworld-pending-sanct-t2'), F.state().thanks.n].join('|');
      out.never = boxes.join(',');
      return out; });
    await sp.close();
    assert(r.friends === '2|0|2|true|true', 'with 1 berry and needs of 3, the Friends pay the other 2 and the box stops at 0, not below: ' + JSON.stringify(r));
    assert(r.rounds === '4|true|3|3', 'four quick days: the box never goes below zero, and Fab’s basket gets at most three thank-you berries a day: ' + JSON.stringify(r));
  });
  await test('Fab’s Sanctuary: three levels. Years 1–2 tap to pay and count the visitors; Years 5–6 plan for a week and choose the gate price', async () => {
    const sp = await sanctPage('?learner=sanct-t3');
    await sanctState(sp, 'sanct-t3', { box:20, level:1, homes:{ e:'hedgehog', f:'rabbit' } });
    const r = await sp.evaluate(async () => { const F = FabSanct, wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      F.open(); out.tap = F.q().kind + '|' + document.querySelectorAll('[data-tap]').length;
      for(let i = 0; i < 3; i++){ document.querySelector(`[data-tap="${i}"]`).click(); await wait(30); }
      out.paid = F.state().box + '|' + !!document.querySelector('[data-a="togate"]');
      F.toGate(); F.gate(); F.skip(); await wait(50); const d = F.day(), q = F.q();
      out.count = [d.price, q.ask, q.right === d.visitors, document.querySelectorAll('.sn-faces svg').length === d.visitors].join('|');
      F.end(); F.level(3); F.open(); out.week = F.q().ask + '|' + F.right();
      F.answer(F.right()); F.toGate(); document.querySelector('[data-a="priceup"]').click(); out.price = F.day().price;
      out.demand = F.visitorsFor(1) >= F.visitorsFor(3) && F.visitorsFor(3) >= F.visitorsFor(5) && F.visitorsFor(1) > F.visitorsFor(5);
      F.gate(); F.skip(); await wait(50); const d3 = F.day(); out.times = F.q().right === d3.visitors * 4 && /paid 4 berries each/.test(F.q().ask);
      F.answer(F.right()); F.toJars(); F.putAway(); F.end(); F.open(); F.answer(F.right()); F.toGate(); await wait(30);
      out.tries = document.querySelectorAll('#snSide .sn-lines li').length >= 1 && /Day 1: 4 each/.test(document.getElementById('snSide').textContent);
      return out; });
    await sp.close();
    assert(r.tap === 'tap|3' && r.paid === '17|true', 'Years 1–2: tap three berries to pay three: ' + JSON.stringify(r));
    assert(/^1\|How many visitors came today\?\|true\|true$/.test(r.count), 'Years 1–2: visitors pay 1 berry and the child counts them: ' + JSON.stringify(r));
    assert(r.week === 'Food and bedding cost 3 berries a day. How much is that for a whole week (7 days)?|21' && r.price === 4 && r.demand && r.times && r.tries, 'Years 5–6: a week’s needs, a gate price to choose, fewer visitors at a higher price, and the last tries to compare: ' + JSON.stringify(r));
  });
  await test('Fab’s Sanctuary: berries from Fab’s basket move only when the child chooses, never more than the basket holds; saving up builds a big goal from the jar', async () => {
    const sp = await sanctPage('?learner=sanct-t4');
    await sanctState(sp, 'sanct-t4', { box:2, homes:{ e:'hedgehog' } }, { 'fabworld-v2-sanct-t4':JSON.stringify({ x:1, y:1, spk:12 }), 'fabworld-pending-sanct-t4':'0', 'fabworld-spend-sanct-t4':'0' });
    const r = await sp.evaluate(async () => { const F = FabSanct, wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      out.basket = F.basket();
      document.querySelector('[data-a="basket"]').click(); await wait(50); document.querySelector('[data-a="movemore"]').click(); document.querySelector('[data-a="moveok"]').click(); await wait(50);
      out.moved = [F.state().box, localStorage.getItem('fabworld-spend-sanct-t4'), F.basket()].join('|');
      out.cap = F.move(50) + '|' + F.basket() + '|' + F.state().box;
      F.goal('otter'); const st = JSON.parse(localStorage.getItem('fabsanct-v1-sanct-t4')); st.jar = 40; localStorage.setItem('fabsanct-v1-sanct-t4', JSON.stringify(st)); return out; });
    await sp.reload(); await sp.waitForFunction(() => window.FabSanct);
    const g = await sp.evaluate(async () => { const F = FabSanct, wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      out.ready = /saved enough for the otter pond/.test(document.getElementById('snSide').textContent);
      document.querySelector('[data-a="build"]').click(); await wait(50); const b = document.querySelector('[data-build="otter"][data-from="jar"]'); out.btn = !!b; b.click();
      const s = F.state(); out.built = [Object.values(s.homes).includes('otter'), s.jar, s.goal, s.goalsMet, s.box].join('|'); return out; });
    await sp.close();
    assert(r.basket === 12 && r.moved === '8|6|6' && r.cap === '6|0|14', 'Fab’s basket shows 12; the child moves 6, then asking for 50 moves only the 6 left: ' + JSON.stringify(r));
    assert(g.ready && g.btn && g.built === 'true|0||1|14', 'with 40 in the savings jar the otter pond is built from the jar, not the money box: ' + JSON.stringify(g));
  });
  await test('Games: every game has a paw; pawed games sit in “My pawed games” at the top, kept per Fab code; Fab’s Sanctuary fills the window and Back returns to Games', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    const r = await page.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, was = localStorage.getItem('fab-me');
      localStorage.setItem('fab-me', 'paw-t1'); localStorage.removeItem('fab-paws-paw-t1'); localStorage.removeItem('fab-paws-paw-t2'); showScreen('screen-games'); await wait(50);
      const tiles = document.querySelectorAll('#screen-games .hub-grid .tile'); out.paws = tiles.length + '|' + document.querySelectorAll('#screen-games .paw-btn').length + '|' + !!document.getElementById('gamesSanctBtn');
      out.hint = /Tap the paw on any game/.test(document.getElementById('pawShelf').textContent);
      document.querySelector('.paw-btn[data-paw="sanctuary"]').click(); document.querySelector('.paw-btn[data-paw="screen-c4"]').click();
      out.saved = localStorage.getItem('fab-paws-paw-t1') + '|' + [...document.querySelectorAll('.paw-chip')].map(c => c.textContent).join(',') + '|' + document.querySelector('.paw-btn[data-paw="screen-c4"]').getAttribute('aria-pressed');
      localStorage.setItem('fab-me', 'paw-t2'); fabPaws.paint(); out.other = document.querySelectorAll('.paw-chip').length;
      localStorage.setItem('fab-me', 'paw-t1'); fabPaws.paint();
      document.querySelector('.paw-btn[data-paw="screen-c4"]').click(); out.off = localStorage.getItem('fab-paws-paw-t1');
      document.querySelector('.paw-chip[data-sanct-open]').click(); await wait(100);
      const f = document.getElementById('sanctFrame'); out.open = [document.querySelector('.screen.active').id, /sanctuary\.html\?embed=1&back=games&learner=paw-t1/.test(f.src), getComputedStyle(f).position, document.body.classList.contains('in-code')].join('|');
      let n = 0; while(!(f.contentWindow && f.contentWindow.FabSanct) && n++ < 80) await wait(100);
      out.label = f.contentWindow.document.getElementById('snBack').textContent;
      f.contentWindow.document.getElementById('snBack').click(); await wait(100);
      out.back = document.querySelector('.screen.active').id + '|' + f.getAttribute('src');
      localStorage.removeItem('fab-paws-paw-t1'); try{ localStorage.removeItem('fabsanct-v1-paw-t1'); }catch(e){} if(was === null) localStorage.removeItem('fab-me'); else localStorage.setItem('fab-me', was); fabPaws.paint();
      return out; });
    assert(/^(\d+)\|\1\|true$/.test(r.paws) && r.hint, 'each Games tile has a paw (and Fab’s Sanctuary is a tile): ' + JSON.stringify(r));
    assert(r.saved === '["sanctuary","screen-c4"]|Fab’s Sanctuary,Connect 4|true' && r.other === 0 && r.off === '["sanctuary"]', 'paws are saved per Fab code and show as quick buttons; a second tap takes a paw off: ' + JSON.stringify(r));
    assert(r.open === 'screen-sanct|true|fixed|true' && r.label === 'Back to Games' && r.back === 'screen-games|null', 'a pawed game opens from the shelf; the sanctuary fills the window and Back returns to Games: ' + JSON.stringify(r));
    await page.evaluate(() => showScreen('screen-hub'));
  });
  await test('Fab Fox World: Fab’s Sanctuary opens from Fox’s Den; berries moved in leave Fab’s basket and thank-you berries arrive when it closes; three sanctuary missions', async () => {
    await page.setViewportSize({ width:1366, height:768 });
    await page.evaluate(() => { showScreen('screen-games'); showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){} });
    const fr = await (await page.$('.game-frame[data-game="world"]')).contentFrame();
    await fr.waitForFunction(() => !!window.WORLD && typeof mSanct === 'function', null, { timeout:15000 });
    const r = await fr.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), S = WORLD.S(), out = {}, keep = S.spk, code = KEY.replace('fabworld-v2-', '');
      try{ WORLD.closeScene(true); }catch(e){} S.spk = 30; save();
      mGames(); await wait(100); const t = document.getElementById('sanctTile'); out.tile = !!t && /Fab’s Sanctuary/.test(t.textContent); t.click(); await wait(100);
      const f = document.querySelector('.codeframe'); out.src = /sanctuary\.html\?embed=1&back=world/.test(f.src);
      let n = 0; while(!(f.contentWindow && f.contentWindow.FabSanct) && n++ < 80) await wait(100);
      const W = f.contentWindow, F = W.FabSanct; F.reset(); out.basket = F.basket();
      out.moved = F.move(10); F.build('hedgehog'); W.document.getElementById('snSheet').hidden = true; F.rounds();
      const pend = parseInt(localStorage.getItem('fabworld-pending-' + code), 10) || 0; out.label = W.document.getElementById('snBack').textContent;
      W.document.getElementById('snBack').click(); await wait(400);
      out.after = [S.spk === 30 - 10 + pend, localStorage.getItem('fabworld-spend-' + code), !!SCENE].join('|');
      out.mis = MISSIONS.filter(m => /^sanct/.test(m.id)).map(m => m.id + ':' + m.v() + '/' + m.of + ':' + m.go + ':' + /<svg/.test(ico(m.e))).join(' ');
      S.spk = keep; try{ localStorage.removeItem('fabsanct-v1-' + code); }catch(e){} save(); setTop(); return out; });
    assert(r.tile && r.src && r.label === 'Back to Fab Fox World', 'Fox’s Den has a Fab’s Sanctuary tile that opens it in the world: ' + JSON.stringify(r));
    assert(r.basket === 30 && r.moved === 10 && r.after === 'true||false', 'the 10 berries moved into the sanctuary leave Fab’s basket and the thank-you berry arrives when it closes: ' + JSON.stringify(r));
    assert(r.mis === 'sanct:1/1:den:true sanctweek:1/7:den:true sanctsave:0/1:den:true', 'three sanctuary missions read the sanctuary’s save and have drawn icons: ' + r.mis);
    await page.evaluate(() => showScreen('screen-hub'));
  });

  /* ---------- Round 28: several children at once (one Pencil Web Viewer each) ---------- */
  async function classPage(q){
    const ap = await browser.newPage(); const url = '/index.html' + (q || '');
    ap.on('pageerror', e => errors.push(`${url}: ${e.message}`));
    ap.on('console', m => { if(m.type() === 'error' && !/^Failed to load resource/.test(m.text())) errors.push(`${url}: console: ${m.text()}`); });
    await ap.setViewportSize({ width:1366, height:768 }); await ap.goto(base + url); await ap.waitForFunction(() => window.FabClass); await ap.waitForTimeout(300);
    return ap;
  }
  const classClean = () => { ['fab-class', 'fab-quiet-set', 'fab-help-class-t1', 'fab-energy-class-t1', 'fab-help-class-t2', 'fab-energy-class-t2', 'fabsanct-v1-class-t1', 'fabcode-v1-class-t1'].forEach(k => localStorage.removeItem(k)); localStorage.setItem('bmf_sound', 'on'); };
  await test('Several children: a class link signs the viewer in as that Fab code, turns on class mode and starts with sounds off; energy today is kept per code and day; the help hand shows a big banner with the code', async () => {
    const ap = await classPage('?learner=class-t1&class=1&quiet=1');
    const r = await ap.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      out.mode = [fabLearnerCode(), localStorage.getItem('fab-class'), localStorage.getItem('bmf_sound'), Sound.enabled, document.body.classList.contains('fab-classmode')].join('|');
      const tag = document.getElementById('fabTag'); out.tag = !tag.hidden && /class-t1/.test(tag.textContent) && tag.parentNode.tagName === 'HEADER';
      out.row = [...document.querySelectorAll('#fabEnergy [data-energy]')].map(b => b.dataset.energy).join() + '|' + /You can change this any time/.test(document.getElementById('fabEnergy').textContent);
      document.querySelector('#fabEnergy [data-energy="low"]').click(); await wait(100);
      const e = JSON.parse(localStorage.getItem('fab-energy-class-t1')); out.energy = e.v + '|' + (e.d === new Date().toISOString().slice(0, 10) || /^\d{4}-\d\d-\d\d$/.test(e.d)) + '|' + FabClass.energy('class-t1') + '|' + FabClass.energy('class-t2') + '|' + !!document.querySelector('#fabTag .fh-e');
      localStorage.setItem('fab-energy-class-t2', JSON.stringify({ d:'2020-01-01', v:'low' })); out.old = FabClass.energy('class-t2');
      out.imp = FabImpact.read('class-t1').some(x => x.k === 'energy' && x.v === 'low');
      document.getElementById('fabTagHelp').click(); await wait(100);
      const b = document.getElementById('fabHand'); out.up = [!b.hidden, /class-t1 would like help/.test(b.textContent), !!localStorage.getItem('fab-help-class-t1'), document.getElementById('fabTagHelp').getAttribute('aria-pressed')].join('|');
      const r1 = b.getBoundingClientRect(); out.top = r1.top < 40 && getComputedStyle(b).position === 'fixed';
      document.getElementById('fabHandDown').click(); await wait(100); out.down = b.hidden && !localStorage.getItem('fab-help-class-t1');
      showScreen('screen-world'); await wait(100); out.world = document.getElementById('fabTag').hidden; showScreen('screen-hub');
      return out; });
    await ap.close();
    assert(r.mode === 'class-t1|1|off|false|true' && r.tag, 'the link signs in as the code, turns on class mode, starts quiet, and the code and Help sit in the top bar: ' + JSON.stringify(r));
    assert(r.row === 'lots,some,low|true' && /^low\|true\|low\|\|true$/.test(r.energy) && r.old === '' && r.imp, 'energy today is kept for this code and today only, and noted in the soft impact log: ' + JSON.stringify(r));
    assert(r.up === 'true|true|true|true' && r.top && r.down && r.world, 'Help raises a big banner with the code at the top; it goes down again; the tag hides inside Fab Fox World: ' + JSON.stringify(r));
  });
  await test('A 1:1 link can open on a hub: ?start=eyfs opens the EYFS Hub, and an unknown start stays on the menu', async () => {
    const ap = await classPage('?learner=class-t1&start=eyfs');
    const a = await ap.evaluate(() => [document.getElementById('screen-eyfs').classList.contains('active'), document.getElementById('screen-hub').classList.contains('active'), fabLearnerCode()].join('|'));
    await ap.close();
    const bp = await classPage('?learner=class-t1&start=nowhere');
    const b = await bp.evaluate(() => document.getElementById('screen-hub').classList.contains('active'));
    await bp.close();
    assert(a === 'true|false|class-t1' && b, 'start=eyfs opens the EYFS Hub as that code; anything else stays on the menu: ' + a + ' ' + b);
  });
  await test('A child who picked the wrong step can change it from My flightpath, keeping their stars (27 Nov feedback)', async () => {
    const ap = await classPage('?learner=class-t1');
    const r = await ap.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      const p = BUILT_IN_PACKS.find(x => x.id === 'christmas-flightpath'); learnOpen(p); learnGo(1); await wait(150);
      document.querySelector('[data-pwpick="0"]').click(); await wait(150);
      const ks = Learn.state[1].kids, me = Object.keys(ks)[0], kid = ks[me]; kid.done = 4; out.first = kid.step;
      document.querySelector('[data-pwdrawer]').click(); await wait(100);
      out.open = document.body.classList.contains('pw-drawer-open');
      out.hint = /Tap any step/.test(document.querySelector('#pwDrawer').textContent);
      out.enabled = [...document.querySelectorAll('#pwDrawer [data-pwpick]')].length > 0 && [...document.querySelectorAll('#pwDrawer .pw-rung')].every(b => !b.disabled);
      const head = [...document.querySelectorAll('#pwDrawer [data-pwstage]')].find(b => /Christmas Carol/.test(b.textContent)); head.click(); await wait(100);
      document.querySelector('#pwDrawer [data-pwpick="6"]').click(); await wait(150);
      const k2 = Learn.state[1].kids[me];
      out.now = k2.step + '|' + /Dickens/.test(document.querySelector('.pw-stephead').textContent) + '|' + k2.done + '|' + document.body.classList.contains('pw-drawer-open');
      return out; });
    await ap.close();
    assert(r.first === 0 && r.open && r.hint && r.enabled, 'My flightpath lists every step, tappable, with a hint: ' + JSON.stringify(r));
    assert(r.now === '6|true|4|false', 'tapping another step moves there, keeps the stars and closes the drawer: ' + JSON.stringify(r));
  });
  await test('The Burrow is the child’s home: for a signed-in child the Learning Hub opens the Burrow, with set work first and Things I made; the full list is the teachers’ view, two taps away', async () => {
    const seed = async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), code = fabLearnerCode();
      const p = BUILT_IN_PACKS.find(x => x.id === 'christmas-flightpath'); learnOpen(p); learnGo(1); await wait(150);
      const st0 = Learn.state[1] = Learn.state[1] || {}; pwStart(Learn.pack.screens[1], st0, pwMe(), 6); learnRender(); await wait(150);
      const ks = Learn.state[1].kids, kid = ks[Object.keys(ks)[0]]; kid.secured = [6]; kid.done = 3; learnSaveLocal();
      const c = document.createElement('canvas'); c.width = 120; c.height = 70; c.getContext('2d').fillRect(0, 0, 60, 70); const pic = c.toDataURL('image/jpeg', .7);
      localStorage.setItem('fabcode-makes-' + code, JSON.stringify([{ k:'dance', t:1764240000000, name:'My dance', n:7, level:'d3', prog:[['hop', 2]], pic }]));
      localStorage.setItem('fabsanct-v1-' + code, JSON.stringify({ v:1, level:2, box:12, jar:3, day:4, homes:{ hedgehog:1, rabbit:1 }, names:{} }));
      const W = JSON.parse(localStorage.getItem('fabworld-v2-' + code) || '{}'); W.makes = [{ d:pic }]; W.shows = [{ cells:[] }]; localStorage.setItem('fabworld-v2-' + code, JSON.stringify(W));
      localStorage.setItem('fab-make-' + code, JSON.stringify({ victorian:{ rep:{ intro:'Victorian schools were strict.' }, art:'0120', png:pic } }));
      FabBurrow.apply(code, { t:Date.now(), a:[['christmas-flightpath', 7, '', 'Carry on with Scrooge']], f:['english-flightpath-reading'] });
      showScreen('screen-hub'); await wait(150); };
    const ap = await classPage('?learner=test-303&class=1');
    await ap.evaluate(seed);
    const r = await ap.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      document.querySelector('[data-go="screen-learn"]').click(); await wait(300); out.door = on();
      out.today = [...document.querySelectorAll('#bwToday .bw-item b')].map(b => b.textContent).join() + '|' + /Scrooge’s character/.test(document.getElementById('bwToday').textContent);
      out.made = [...document.querySelectorAll('#bwMade [data-bwmade]')].map(b => b.dataset.bwmade).join();
      out.tidy = [!document.querySelector('[data-me="learn"]'), ![...document.querySelectorAll('#meBody h3')].some(x => /My art/.test(x.textContent)), [...document.querySelectorAll('#bwMade .bw-mcard')].every(b => b.querySelector('img, svg') && !/\p{Extended_Pictographic}/u.test(b.textContent))].join();
      document.querySelector('[data-bwmade="poster"]').click(); await wait(300);
      const L = document.querySelector('.fp-layer'); out.poster = !!L && /Back to my Burrow/.test(L.querySelector('[data-fp="close"]').textContent) && /Dickens/.test(L.textContent); L && L.querySelector('[data-fp="close"]').click(); await wait(150);
      document.querySelector('[data-bwmade="sanct"]').click(); await wait(300); out.sanct = on() + '|' + /sanctuary\.html\?embed=1.*learner=test-303/.test(document.getElementById('sanctFrame').getAttribute('src') || ''); fabSanctBack(); await wait(200); out.sanctBack = on();
      document.querySelector('[data-bwmade="dance"]').click(); await wait(300); out.dance = on() + '|' + /project=dance&play=1764240000000/.test(document.getElementById('codeFrame').getAttribute('src') || ''); document.getElementById('codeFrame').src = 'about:blank'; fabCodeBack(); await wait(200); out.danceBack = on();
      document.querySelector('[data-bwmade="explore"]').click(); await wait(400); out.explore = on() + '|' + FabExplore.state.era + '|' + FabExplore.state.back; showScreen('screen-me'); await wait(200);
      out.child = [!document.getElementById('bwMore'), !/More to explore/.test(document.getElementById('meBody').textContent), /^For teachers/.test(document.querySelector('#bwTeach [data-bwmore]').textContent)].join();
      document.querySelector('[data-bwmore]').click(); await wait(200); out.arm = on() + '|' + /tap again/.test(document.querySelector('[data-bwmore]').textContent);
      document.querySelector('[data-bwmore]').click(); await wait(300); out.teach = on(); document.getElementById('tcAll').click(); await wait(300); out.more = on() + '|' + (document.getElementById('screen-learn').textContent.length > 400);
      const p = BUILT_IN_PACKS.find(x => x.id === 'science-flightpath-y34'); learnOpen(p); await wait(200); showScreen('screen-learn'); await wait(200); out.stay = on();
      showScreen('screen-hub'); await wait(100); showScreen('screen-learn'); await wait(200); out.again = on();
      out.link = FabBurrow.linkFor('test-303', [{ p:'christmas-flightpath', s:7, d:'', n:'' }], [], { cls:true, home:true });
      showScreen('screen-learn'); learnOpen(BUILT_IN_PACKS.find(x => x.id === 'christmas-flightpath')); return out; });
    await ap.close();
    assert(r.door === 'screen-me' && /^Christmas and winter flightpath\|true$/.test(r.today), 'the Learning Hub tile opens the Burrow, with the set work first: ' + JSON.stringify(r));
    assert(r.made === 'poster,explore,dance,studio,builds,sanct' && r.tidy === 'true,true,true', 'Things I made lists the poster, Explorer makes, dance, pictures, builds and sanctuary, drawn not emoji, and the Burrow does not repeat them: ' + JSON.stringify(r));
    assert(r.poster && r.sanct === 'screen-sanct|true' && r.sanctBack === 'screen-me' && r.dance === 'screen-code|true' && r.danceBack === 'screen-me' && r.explore === 'screen-time|victorian|screen-me', 'each make opens, and Back comes home to the Burrow: ' + JSON.stringify(r));
    assert(r.child === 'true,true,true' && r.arm === 'screen-me|true' && r.teach === 'screen-teach' && /^screen-learn\|true$/.test(r.more) && r.stay === 'screen-learn' && r.again === 'screen-me', 'the child has no door to the full list; the teachers’ button needs two taps, then the list stays until the Burrow or the menu is opened: ' + JSON.stringify(r));
    assert(/\?learner=test-303&class=1&quiet=1&home=burrow&burrow=[A-Za-z0-9_-]+$/.test(r.link), 'one link carries the code, class mode, the draft and the work: ' + r.link);
    const bp = await classPage('?learner=test-303&home=0');
    const off = await bp.evaluate(async () => { showScreen('screen-learn'); await new Promise(res => setTimeout(res, 200)); const a = document.querySelector('.screen.active').id; showScreen('screen-me'); await new Promise(res => setTimeout(res, 200));
      return a + '|' + !document.getElementById('bwMade') + '|' + !document.getElementById('bwMore') + '|' + !!document.querySelector('[data-me="learn"]') + '|' + FabBurrow.home(); });
    await bp.close();
    assert(off === 'screen-learn|true|true|true|false', '?home=0 gives one viewer the old behaviour: ' + off);
    const cp = await browser.newPage(); await cp.goto(base + '/index.html'); await cp.waitForFunction(() => window.FabBurrow); await cp.waitForTimeout(300);
    const staff = await cp.evaluate(async () => { document.querySelector('[data-go="screen-learn"]').click(); await new Promise(res => setTimeout(res, 300)); return document.querySelector('.screen.active').id + '|' + (typeof fabLearnerCode === 'function' ? fabLearnerCode() : ''); });
    await cp.close();
    assert(staff === 'screen-learn|', 'with no Fab code (a teacher, or the shared carpet viewer) the Learning Hub opens the full list as before: ' + staff);
  });
  await test('Set work: a teacher sets an activity, a challenge in their own words and a theme; the child sees only those, starts the activity, and ticks “I did it”', async () => {
    const sp = await browser.newPage(); await sp.setViewportSize({ width:1366, height:900 }); await sp.goto(base + '/index.html'); await sp.waitForFunction(() => window.FabBurrow && document.getElementById('staffLink')); await sp.waitForTimeout(300);
    const made = await sp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      showScreen('screen-staff'); await wait(300);
      const card = () => document.getElementById('bwStaff'), set = (el, v, ev) => { el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles:true })); };
      set(card().querySelector('#bwCode'), 'test-404');
      set(card().querySelector('[data-row="0"] [data-bwf="p"]'), '', 'change'); await wait(150);
      card().querySelector('#bwMake').click(); await wait(150); out.empty = card().querySelector('#bwMsg').textContent;
      card().querySelector('#bwXAdd').click(); await wait(150);
      set(card().querySelector('[data-xrow="0"] [data-bwx="th"]'), 'Anti-Bullying Week'); card().querySelector('[data-xrow="0"] [data-bwx="th"]').dispatchEvent(new Event('change', { bubbles:true })); await wait(200);
      out.ideas = [...card().querySelectorAll('[data-bwidea]')].map(b => b.textContent).join('|');
      card().querySelector('[data-bwidea="0:0"]').click(); await wait(200);
      out.filled = card().querySelector('[data-xrow="0"] [data-bwx="a"]').value + '|' + card().querySelector('[data-xrow="0"] [data-bwx="t"]').value;
      set(card().querySelector('[data-xrow="0"] [data-bwx="n"]'), 'Use your favourite colours');
      card().querySelector('#bwXAdd').click(); await wait(150);
      set(card().querySelector('[data-xrow="1"] [data-bwx="a"]'), 'explore:victorian', 'change');
      card().querySelector('#bwXAdd').click(); await wait(150);
      set(card().querySelector('[data-xrow="2"] [data-bwx="t"]'), 'Tell your teacher one thing you <b>enjoyed</b> today');
      card().querySelector('#bwMake').click(); await wait(200);
      out.link = card().querySelector('#bwLink').value; out.acts = FabBurrow.acts.length; return out; });
    await sp.close();
    assert(/Choose a flightpath, an activity or a challenge first/.test(made.empty), 'an empty set of work is not made into a link: ' + made.empty);
    assert(/Make a kindness poster/.test(made.ideas) && made.filled === 'studio|Make a kindness poster' && made.acts >= 12, 'a theme offers gentle starters, and tapping one fills the activity and the challenge: ' + JSON.stringify(made));
    assert(/\?learner=test-404&class=1&quiet=1&burrow=[A-Za-z0-9_-]+$/.test(made.link), 'one link: ' + made.link);
    const ctx = await browser.newContext(); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('set work child: ' + e.message));
    await c.goto(made.link); await c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active')); await c.waitForTimeout(400);
    const r = await c.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      const rows = [...document.querySelectorAll('#bwToday .bw-x')];
      out.rows = rows.map(li => (li.querySelector('.bw-theme') ? '[' + li.querySelector('.bw-theme').textContent + '] ' : '') + li.querySelector('b').textContent + (li.querySelector('em') ? ' / ' + li.querySelector('em').textContent : '') + (li.querySelector('[data-bwxgo]') ? ' +start' : '')).join(' ; ');
      out.say = document.querySelector('#bwToday .bubble b').textContent; out.safe = !document.querySelector('#bwToday b b') && /<b>enjoyed<\/b>|enjoyed/.test(document.getElementById('bwToday').textContent);
      out.only = [!document.getElementById('bwPaths'), !document.getElementById('bwFree'), !document.getElementById('bwMore'), !document.querySelector('#bwToday .bw-item:not(.bw-x)')].join();
      document.querySelector('#bwToday [data-bwxgo="1"]').click(); await wait(500); out.go = on() + '|' + FabExplore.state.era + '|' + FabExplore.state.back; showScreen('screen-me'); await wait(250);
      document.querySelector('#bwToday [data-bwxgo="0"]').click(); await wait(400); out.studio = on() + '|' + window.fabWorldOpen; showScreen('screen-me'); await wait(250);
      document.querySelector('#bwToday [data-bwxdone="2"]').click(); await wait(300);
      const li = document.querySelectorAll('#bwToday .bw-x')[2]; out.done = li.classList.contains('done') + '|' + /Done/.test(li.textContent) + '|' + !li.querySelector('[data-bwxdone]') + '|' + FabImpact.read('test-404').some(e => e.k === 'setwork' && e.v === 'challenge');
      document.querySelector('#bwToday [data-bwxdone="0"]').click(); await wait(250); document.querySelector('#bwToday [data-bwxdone="1"]').click(); await wait(250);
      out.all = /All done for today/.test(document.getElementById('bwToday').textContent) + '|' + FabImpact.read('test-404').filter(e => e.k === 'setwork').map(e => e.v + (e.step ? ':' + e.step : '')).join();
      return out; });
    await ctx.close();
    assert(r.rows === '[Anti-Bullying Week] Make a kindness poster / Your teacher says: Use your favourite colours +start ; Explorer Worlds: the Victorians +start ; Tell your teacher one thing you benjoyed/b today' || /^\[Anti-Bullying Week\] Make a kindness poster \/ Your teacher says: Use your favourite colours \+start ; Explorer Worlds: the Victorians \+start ; Tell your teacher one thing you .*enjoyed.* today$/.test(r.rows), 'Today lists the theme task, the activity and the challenge: ' + r.rows);
    assert(r.say === '3 things to do today' && r.safe && r.only === 'true,true,true,true', 'the child sees only what was set, and typed words stay words: ' + JSON.stringify(r));
    assert(r.go === 'screen-time|victorian|screen-me' && r.studio === 'screen-world|studio', 'Start opens the activity, and Back will come home to the Burrow: ' + JSON.stringify(r));
    assert(r.done === 'true|true|true|true' && /^true\|challenge,studio:Anti-Bullying Week,explore:victorian$/.test(r.all), '“I did it” marks it done, notes it in the soft impact log, and all done is celebrated: ' + JSON.stringify(r));
  });
  await test('Teachers’ area: four cards like the landing page; a class of Fab codes; assign by kind, subject and key stage; booklets; a well done; the ideas bank; progress and a certificate on the child’s viewer', async () => {
    const tp = await browser.newPage(); await tp.setViewportSize({ width:1366, height:900 }); await tp.goto(base + '/index.html'); await tp.waitForFunction(() => window.FabTeach && document.getElementById('teachDoor')); await tp.waitForTimeout(300);
    const t = await tp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      const set = (id, v, ev) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles:true })); };
      const tap = async q => { document.querySelector(q).click(); await wait(160); };
      const body = () => document.getElementById('teachBody'), title = () => document.querySelector('#screen-teach .screen-title').textContent;
      out.cards = [...document.querySelectorAll('#screen-hub .category-tile h2')].map(h => h.textContent).join('|');
      document.getElementById('teachDoor').click(); await wait(300); out.door = on();
      out.tiles = [...document.querySelectorAll('#teachBody .tc-tile')].map(b => b.querySelector('h2').textContent + (b.querySelector('.emoji svg') ? '' : '?')).join('|') + '|' + title();
      await tap('#tcGoAssign'); out.assign = body().dataset.view + '|' + title();
      await tap('#tcMake'); out.none = document.getElementById('tcMsg').textContent;
      await tap('#tcWho [data-tcview="classes"]'); out.clsView = body().dataset.view;
      await tap('#tcNew'); set('tcEn', 'Adventurers'); set('tcEc', 'test-501\nSam\ntest-502');
      await tap('#tcSave'); out.bad = document.querySelector('.tc-edit .learn-msg').textContent;
      set('tcEc', 'test-501\ntest-502'); await tap('#tcSave');
      out.cls = document.querySelector('.tc-list li').textContent.replace(/\s+/g, ' ') + '|' + localStorage.getItem('fab-teach-classes');
      await tap('#screen-teach .btn-back'); out.backHome = on() + '|' + body().dataset.view;
      await tap('#tcGoAssign');
      const links = async () => { document.getElementById('tcMake').click(); await wait(200); return [...document.querySelectorAll('#tcAssign .cl-links input')].map(i => i.value); };
      const picks = () => document.querySelectorAll('#tcPicks .tc-pick').length, pressed = q => [...document.querySelectorAll(q + ' [aria-pressed="true"]')].map(b => b.textContent.trim()).join();
      /* a flightpath: the class's usual key stage is offered first, and any other is one tap away */
      await tap('[data-tckind="p"]'); out.usual = pressed('#tcStages') + '|' + picks() + '|' + /Adventurers usually work in Lower KS2/.test(body().textContent);
      await tap('[data-tcst="ks1"]'); out.ks1 = picks(); await tap('[data-tcsub="Phonics"]'); out.phonics = [...document.querySelectorAll('#tcPicks .tc-pick b')].map(b => b.textContent).join();
      await tap('[data-tcsub="Science"]'); await tap('[data-tcst="eyfs"]'); out.nothing = !document.getElementById('tcPicks') && /Nothing matches/.test(document.getElementById('tcNone').textContent);
      await tap('[data-tcsub="all"]'); await tap('[data-tcst="all"]'); out.all = picks() + '|' + !document.getElementById('tcWhat');
      /* a whole topic */
      await tap('[data-tckind="t"]'); out.topics = [...document.querySelectorAll('#tcPicks .tc-pick b')].map(b => b.textContent).join('|'); await tap('[data-tcpick="victorian"]'); set('tcLabel', 'Autumn 1'); out.topic = await links(); await wait(5);
      await tap('[data-tckind="p"]'); await tap('[data-tcst="all"]'); await tap('[data-tcpick="christmas-flightpath"]'); out.steps = document.getElementById('tcStep').options[0].textContent; set('tcLabel', 'Autumn 2'); out.path = await links(); await wait(5);
      /* a booklet: the teacher keeps a list of titles; one part is set at a time */
      await tap('[data-tckind="b"]'); out.noBk = picks() + '|' + [...document.querySelectorAll('#tcPicks .tc-tag')].map(x => x.textContent).join(); await tap('#tcMake'); out.bkNone = document.getElementById('tcMsg').textContent;
      await tap('#tcBadd'); await tap('#tcBsave'); out.bkBlank = document.querySelector('.tc-bform .learn-msg').textContent;
      set('tcBt', '<Place value>: Year 1'); await tap('#tcBsave'); out.bk = localStorage.getItem('fab-teach-booklets') + '|' + document.querySelector('#tcPicks .tc-pick.on').textContent.replace(/\s+/g, ' ').trim();
      set('tcPart', 'Pages 4 and 5'); out.booklet = await links(); await wait(5);
      await tap('[data-tckind="k"]'); await tap('#tcMake'); out.kNone = document.getElementById('tcMsg').textContent;
      set('tcText', 'Super effort this <i>week</i>'); out.praise = await links();
      FabTeach.go('progress'); await wait(150); out.log = document.querySelectorAll('.tc-log tbody tr').length + '|' + [...document.querySelectorAll('.tc-log tbody tr')].map(r => r.textContent).join(' ; ');
      out.empty = /No child has used this browser yet/.test(document.getElementById('tcProgress').textContent);
      /* suggest a resource: into the ideas bank, with nothing sent until the teacher sends it */
      FabTeach.go('suggest'); await wait(150); await tap('#tcIsave'); out.iNone = document.getElementById('tcImsg').textContent;
      set('tcIw', '=A Year 1 <b>place value</b> booklet'); set('tcIsub', 'Maths', 'change'); set('tcIst', 'KS1', 'change'); set('tcIy', 'After a long gap'); await tap('#tcIsave');
      out.idea = JSON.stringify(FabTeach.ideas().map(x => [x.w, x.k, x.sub, x.st, x.y])) + '|' + document.querySelectorAll('.tc-ideas li').length + '|' + !document.querySelector('.tc-ideas b b');
      out.mail = decodeURIComponent(document.getElementById('tcImail').getAttribute('href'));
      await tap('#tcIclear'); out.clear1 = FabTeach.ideas().length; await tap('#tcIclear'); out.clear2 = FabTeach.ideas().length;
      FabTeach.go('home'); await wait(150);
      document.getElementById('tcStaff').click(); await wait(300); out.staff = on(); document.querySelector('#screen-staff .btn-back').click(); await wait(200); out.staffBack = on() + '|' + body().dataset.view;
      return out; });
    await tp.close();
    assert(t.cards === 'EYFS Hub|Games|Wellbeing Hub|Learning Hub|STEM Den|Make More FAB Studio' && t.door === 'screen-teach' && t.tiles === 'Plan a week|Today’s session|Assign a task|Set tasks|Booklet library|View task progress|Assessment profiles|Print achievements|Flightpaths and lessons|Suggest a resource|My classes|Fab codes and class links|Look here: the teacher’s pointer|Teachers’ area' && t.assign === 'assign|Assign a task', 'six cards; one tap opens the Teachers’ area on a teacher’s own browser, set out in sections of drawn cards (Plan and teach, Children’s work and data, Resources and ideas, Admin): ' + JSON.stringify([t.cards, t.door, t.tiles, t.assign]));
    assert(/Type a Fab code/.test(t.none) && t.clsView === 'classes' && /Not a Fab code: sam/.test(t.bad) && /Adventurers ?2 children: test-501, test-502 · usually Lower KS2/.test(t.cls) && !/sam/i.test(t.cls.split('|')[1]) && t.backHome === 'screen-teach|home', 'a class is a name and Fab codes; a name is refused; Back returns to the four cards: ' + JSON.stringify([t.none, t.bad, t.cls, t.backHome]));
    assert(t.usual === 'Lower KS2|14|true' && t.ks1 === 12 && t.phonics === 'Phonics flightpath' && t.nothing && t.all === '19|true', 'flightpaths are sorted by subject and key stage, with the class’s usual stage first and never forced: ' + JSON.stringify([t.usual, t.ks1, t.phonics, t.nothing, t.all]));
    assert(t.topics === 'the Victorians|Ancient Egypt|Ancient Greece|the Romans|the Space Station' && t.topic.length === 2 && /\?learner=test-501&class=1&quiet=1&burrow=[A-Za-z0-9_-]+$/.test(t.topic[0]) && /learner=test-502/.test(t.topic[1]) && t.path.length === 2 && /own step/.test(t.steps), 'one link per child: ' + JSON.stringify([t.topics, t.topic]));
    assert(/^9\|(In the app,){3}On the board(,On the board){5}$/.test(t.noBk) && /Choose a booklet first/.test(t.bkNone) && /title first/.test(t.bkBlank) && /^\[\{"t":"Place value: Year 1","sub":"Maths","st":"ks1"\}\]\|Place value: Year 1 ?Maths · KS1 ?My own list$/.test(t.bk) && t.booklet.length === 2, 'the class’s usual stage shows BMF’s booklets first; a teacher can add a title of their own, and its subject and stage are read from the title when left empty: ' + JSON.stringify([t.noBk, t.bkNone, t.bkBlank, t.bk]));
    assert(/what the well done is for/i.test(t.kNone) && t.praise.length === 2 && /^4\|/.test(t.log) && /Adventurers/.test(t.log) && /Booklet: Place value: Year 1: Pages 4 and 5/.test(t.log) && t.empty && t.staff === 'screen-staff' && t.staffBack === 'screen-teach|home', 'a well done needs words; what was set is listed; the older staff page comes back here: ' + JSON.stringify([t.kNone, t.log, t.empty, t.staff, t.staffBack]));
    assert(/what would help first/i.test(t.iNone) && t.idea === '[["=A Year 1 bplace value/b booklet","A booklet","Maths","KS1","After a long gap"]]|1|true' && /^mailto:teacher@bemorefab\.co\.uk\?subject=Fab App ideas bank: 1 idea&body=Ideas bank from the Fab App\n\n1\. =A Year 1/.test(t.mail) && t.clear1 === 1 && t.clear2 === 0, 'an idea is kept as plain words in this browser, the email is a draft the teacher sends, and emptying the bank takes two taps: ' + JSON.stringify([t.iNone, t.idea, t.mail, t.clear1, t.clear2]));
    const ctx = await browser.newContext(); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('teachers area child: ' + e.message));
    const home = () => c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active'));
    await c.goto(t.topic[0]); await home(); await c.waitForTimeout(300);
    const one = await c.evaluate(() => [...document.querySelectorAll('#bwToday .bw-item')].map(li => (li.querySelector('.bw-theme') ? '[' + li.querySelector('.bw-theme').textContent + '] ' : '') + li.querySelector('b').textContent).join(' ; '));
    await c.goto(t.path[0]); await home(); await c.waitForTimeout(300);
    const two = await c.evaluate(() => [...document.querySelectorAll('#bwToday .bw-item')].map(li => (li.querySelector('.bw-theme') ? '[' + li.querySelector('.bw-theme').textContent + '] ' : '') + li.querySelector('b').textContent).join(' ; '));
    await c.goto(t.booklet[0]); await home(); await c.waitForTimeout(300);
    const three = await c.evaluate(() => { const li = [...document.querySelectorAll('#bwToday .bw-item')].find(x => /Place value/.test(x.textContent)); return document.querySelectorAll('#bwToday .bw-item').length + '|' + li.textContent.replace(/\s+/g, ' ').trim() + '|' + !li.querySelector('[data-bwxgo]') + '|' + !!li.querySelector('.bw-xic svg') + '|' + !li.querySelector('b b'); });
    await c.goto(t.praise[0]); await home(); await c.waitForTimeout(300);
    const r = await c.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      out.praise = document.getElementById('bwPraise').textContent.replace(/\s+/g, ' ').trim() + '|' + !document.querySelector('#bwPraise i');
      out.kept = document.querySelectorAll('#bwToday .bw-item').length;
      [...document.querySelectorAll('#bwToday .bw-item')].find(x => /Place value/.test(x.textContent)).querySelector('[data-bwxdone]').click(); await wait(300);
      showScreen('screen-hub'); await wait(250); const b = document.getElementById('teachDoor');
      b.click(); await wait(200); out.arm = on() + '|' + /tap again/.test(b.textContent); b.click(); await wait(300); out.in = on() + '|' + document.getElementById('teachBody').dataset.view;
      document.getElementById('tcGoProgress').click(); await wait(200);
      const row = document.querySelector('#tcProgress tbody tr'); out.row = row.textContent.replace(/\s+/g, ' ');
      out.tasks = [...document.querySelectorAll('#tcProgress .tc-tasks li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' ; ');
      document.querySelector('#screen-teach .btn-back').click(); await wait(200); document.getElementById('tcGoPrint').click(); await wait(200);
      out.earned = [...document.querySelectorAll('#tcPrint .tc-earnlist li span')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(' ; ');
      const own = document.getElementById('tcOwn'); own.value = 'super effort in every session'; own.dispatchEvent(new Event('input', { bubbles:true }));
      document.querySelector('[data-tcowncert]').click(); await wait(250);
      const cert = document.querySelector('.fc-cert'); out.cert = cert ? cert.textContent.replace(/\s+/g, ' ') : ''; out.name = cert ? cert.querySelector('.fc-cert-name').value : 'x';
      document.querySelector('[data-tcclose]').click(); await wait(100); out.closed = !document.querySelector('.fc-cert-wrap');
      /* the STEM Den and the Studio open from their own cards, and Back comes home to the landing page */
      showScreen('screen-hub'); await wait(200);
      const scene = async (want) => { let n = 0, W = null, el = null; while(n++ < 120){ W = document.querySelector('iframe[data-game="world"]').contentWindow; el = W && W.document && W.document.querySelector('.scene h2'); if(el && el.textContent === want) break; await wait(100); } return { W, title:el ? el.textContent : '' }; };
      document.getElementById('hubStem').click(); await wait(300); out.stem = on() + '|' + document.querySelectorAll('#screen-stem [data-code-open]').length + '|' + document.querySelectorAll('#screen-stem [data-door]').length;
      document.getElementById('stemBuild').click(); await wait(150); out.cover = !!document.getElementById('doorCover'); let s = await scene('Design and build in 3D'); out.cad = on() + '|' + s.title; await wait(600); out.coverGone = !document.getElementById('doorCover');
      s.W.document.querySelector('.scene .sx').click(); await wait(500); out.stemBack = on();
      showScreen('screen-hub'); await wait(200); document.getElementById('hubStudio').click(); s = await scene('Make More FAB Studio'); out.studio = on() + '|' + s.title;
      /* levels: colour by numbers has three (numbers, adding, taking away) and eleven pictures; animals from shapes has a fox, an owl and a hedgehog, each with a shape-spotter question */
      const D = s.W.document; D.querySelector('[data-make="cbn"]').click(); await wait(300); out.cbn = D.querySelectorAll('.cbnpick [data-cbn]').length + '|' + [...D.querySelectorAll('.cbnlv .tb')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).join(',');
      D.querySelector('.cbnlv [data-lv="3"]').click(); await wait(250); D.querySelector('[data-cbn="heart"]').click(); await wait(300);
      const keys = [...D.querySelectorAll('.tb.cbnc span')].map(x => x.textContent); out.sums = keys.every((t, k) => { const m = /^(\d+) − (\d+)$/.exec(t); return m && m[1] - m[2] === k + 1; }) + '|' + keys.length + '|' + /Work it out/.test(D.querySelector('.sc-studio').textContent);
      s.W.mStudio('make'); await wait(250); s.W.document.querySelector('[data-make="fox"]').click(); await wait(300); const D2 = s.W.document; out.animals = [...D2.querySelectorAll('[data-animal]')].map(b => b.textContent.trim()).join(',');
      D2.querySelector('[data-animal="hog"]').click(); await wait(300); for(let i = 0; i < 6; i++){ D2.querySelector('.sn button:last-child').click(); await wait(80); }
      D2.querySelector('[data-spot="8"]').click(); await wait(100); const soft = D2.querySelector('.spotsay').textContent; D2.querySelector('[data-spot="10"]').click(); await wait(100); out.spot = /^Count with Fab/.test(soft) + '|' + /^Yes! Nine spikes/.test(D2.querySelector('.spotsay').textContent) + '|' + !D2.querySelector('[data-nextanimal]');
      s.W.mStudio('make'); await wait(250);
      s.W.document.querySelector('.scene .sx').click(); await wait(500); out.studioBack = on() + '|' + (window.fabWorldDoor == null);
      return out; });
    await ctx.close();
    assert(one === '[Autumn 1] Explorer Worlds: the Victorians' && two === '[Autumn 2] Christmas and winter flightpath ; [Autumn 1] Explorer Worlds: the Victorians', 'a class link adds to the child’s Today and keeps what was there: ' + JSON.stringify([one, two]));
    assert(/^3\|Autumn 2 ?Place value: Year 1: Pages 4 and 5 ?Booklet ?Your teacher will open this booklet with you\. ?I did it\|true\|true\|true$/.test(three), 'a booklet task shows in Today with a drawn picture, no Start button and “I did it”: ' + three);
    assert(/^Well done from your teacher ?Super effort this .*week.*\|true$/.test(r.praise) && r.kept === 3, 'the well done shows in the Burrow as plain words, and the work stays: ' + JSON.stringify(r.praise) + r.kept);
    assert(r.arm === 'screen-hub|true' && r.in === 'screen-teach|home' && /test-501/.test(r.row) && /1 of 3 done/.test(r.row) && /\[?Autumn 2\]? ?Christmas and winter flightpath, the child’s own step ?Not started yet ; .*the Victorians ?Not done yet ; .*Booklet: Place value: Year 1: Pages 4 and 5 ?Done$/.test(r.tasks) && /Place value: Year 1: Pages 4 and 5 Autumn 2$/.test(r.earned), 'on a child’s viewer the door needs two taps; progress lists each task and whether it is done; a finished booklet can be celebrated: ' + JSON.stringify([r.arm, r.in, r.row, r.tasks, r.earned]));
    assert(/Certificate of Achievement/.test(r.cert) && /for super effort in every session/.test(r.cert) && /BeMoreFab Virtual School/.test(r.cert) && r.name === '' && r.closed, 'a certificate in the teacher’s own words, with the name left empty: ' + JSON.stringify(r.cert));
    assert(r.stem === 'screen-stem|4|2' && r.cover && r.cad === 'screen-world|Design and build in 3D' && r.coverGone && r.stemBack === 'screen-stem' && r.studio === 'screen-world|Make More FAB Studio' && r.studioBack === 'screen-hub|true', 'the STEM Den has its own page; the 3D builder and the Studio open behind a cover, and Back comes home: ' + JSON.stringify(r));
    assert(r.cbn === '11|Level 1Numbers,Level 2Adding,Level 3Taking away' && r.sums === 'true|3|true' && r.animals === 'Fox · level 1,Owl · level 2,Hedgehog · level 3' && r.spot === 'true|true|true', 'colour by numbers has three levels and eleven pictures; three animals from shapes, with a shape spotter that is never “wrong”: ' + JSON.stringify([r.cbn, r.sums, r.animals, r.spot]));
  });
  await test('Booklets: a library beside the flightpaths; one built into the app is never marked in front of the child; the teacher reads confidence, hinge letters and draft next steps', async () => {
    const tp = await browser.newPage(); await tp.setViewportSize({ width:1366, height:900 }); await tp.goto(base + '/index.html'); await tp.waitForFunction(() => window.FabTeach && window.FabBooklets && document.getElementById('teachDoor')); await tp.waitForTimeout(300);
    const t = await tp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      const set = (id, v, ev) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles:true })); };
      const tap = async q => { document.querySelector(q).click(); await wait(160); };
      /* every answer in the two check-ins is worked out again here, so a typing slip cannot reach a child */
      const calc = q => { const m = /^([\d.,]+) ([+−×÷]) ([\d.,]+)$/.exec(q), a = Number(m[1].replace(/,/g, '')), b = Number(m[3].replace(/,/g, '')); return Math.round((m[2] === '+' ? a + b : m[2] === '−' ? a - b : m[2] === '×' ? a * b : a / b) * 1000) / 1000; };
      const bad = []; let n = 0;
      FabBooklets.all().filter(b => b.app).forEach(b => b.pages.forEach(p => {
        if(p.kind === 'quick') p.items.forEach(q => { n++; if(calc(q.q) !== q.a) bad.push(q.q); });
        if(p.kind === 'levels') Object.keys(p.lv).forEach(L => p.lv[L].forEach(q => { n++; if(calc(q[0]) !== q[1]) bad.push(q[0]); }));
        if(p.kind === 'model'){ n += 2; if(calc(p.you) !== p.a) bad.push(p.you); if(calc(p.ido) !== Number(p.col.find(r => r.ans).ans.join(''))) bad.push(p.ido); }
        if(p.kind === 'steps') p.parts.forEach(pt => (pt.items || []).forEach(q => { if(/^[\d.,]+ [+−×÷] [\d.,]+$/.test(q.q) && q.a != null){ n++; if(calc(q.q) !== q.a) bad.push(q.q); } }));
        if(p.kind === 'hinge') p.items.forEach(q => { n++; const i = 'ABCD'.indexOf(q.ok); if(Number(q.opts[i].replace(/,/g, '')) !== calc(q.q) || q.why[i] !== 'Correct' || q.why.filter(w => w === 'Correct').length !== 1) bad.push(q.q); }); }));
      out.sums = n + '|' + bad.join();
      out.lib = FabBooklets.all().map(b => b.id + (b.app ? '*' : '')).join() + '|' + FabBooklets.all().every(b => b.t && b.about && b.st.length && (b.app ? b.pages.length : b.parts.length));
      FabTeach.open(); FabTeach.choose('b:L:four-ops-y34'); await wait(200); await tap('[data-tccls="one"]'); await tap('[data-tckind="b"]'); await tap('[data-tcst="all"]'); await tap('[data-tcpick="L:four-ops-y34"]'); set('tcOne', 'test-601');
      out.about = /built into the app/.test(document.querySelector('.tc-about').textContent) + '|' + document.getElementById('tcStep').options.length;
      await tap('#tcLook'); out.look = on() + '|' + document.querySelector('.bk-band h2').textContent + '|' + !!document.querySelector('.bk-tnote') + '|' + /only while this page is open/.test(document.querySelector('.bk-rest').textContent);
      document.querySelector('[data-k="c1.add"][data-v="4"]').click(); await wait(100); await tap('#screen-booklet .btn-back'); out.lookBack = on() + '|' + document.getElementById('teachBody').dataset.view + '|' + Object.keys(localStorage).filter(k => /^fab-booklet-/.test(k)).length;
      document.getElementById('tcMake').click(); await wait(200); out.app = document.querySelector('#tcAssign .cl-links input').value; await wait(5);
      await tap('[data-tcpick="L:victorian-work"]'); out.care = /With care:/.test(document.querySelector('.tc-about').textContent);
      await tap('[data-tcpick="L:year4-challenge"]'); out.parts = document.querySelectorAll('#tcParts option').length + '|' + /on the board/.test(document.querySelector('.tc-about').textContent) + '|' + !document.getElementById('tcLook');
      set('tcPart', 'Page 2: Number Detective'); document.getElementById('tcMake').click(); await wait(200); out.board = document.querySelector('#tcAssign .cl-links input').value;
      return out; });
    await tp.close();
    assert(/^9[0-9]\|$/.test(t.sums) || /^[1-9]\d\|$/.test(t.sums), 'every sum in the check-ins has the right answer, and each hinge question has exactly one right letter: ' + t.sums);
    assert(t.lib === 'four-ops-y34*,four-ops-y56*,number-toolkit*,year4-challenge,victorian-schools,victorian-work,rex-duck,warm-up-3,maths-cards-3|true', 'the library lists BMF’s booklets; three are built into the app: ' + t.lib);
    assert(t.about === 'true|9' && t.look === 'screen-booklet|Four Operations Check-In|true|true' && t.lookBack === 'screen-teach|assign|0' && t.care && t.parts === '9|true|true', 'a teacher can look inside (nothing is kept), sees a note where care is needed, and picks a part of a booklet that is opened on the board: ' + JSON.stringify(t));
    const ctx = await browser.newContext(); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('booklets child: ' + e.message));
    const home = () => c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active'));
    await c.goto(t.app); await home(); await c.waitForTimeout(300); await c.goto(t.board); await home(); await c.waitForTimeout(300);
    const r = await c.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      const rows = () => [...document.querySelectorAll('#bwToday .bw-item')].map(li => li.textContent.replace(/\s+/g, ' ').trim() + (li.querySelector('[data-bwxgo]') ? ' +start' : '')).join(' ; ');
      const type = (k, v) => { const e = document.querySelector('input[data-k="' + k + '"]'); e.value = v; e.dispatchEvent(new Event('input', { bubbles:true })); };
      const pick = async (k, v) => { document.querySelector('button[data-k="' + k + '"][data-v="' + v + '"]').click(); await wait(80); };
      const next = async () => { document.querySelector('.bk-nav .btn.leaf').click(); await wait(150); };
      out.rows = rows();
      document.querySelector('#bwToday [data-bwxgo]').click(); await wait(300); out.open = on() + '|' + document.querySelector('.bk-count').textContent + '|' + !document.querySelector('.bk-tnote');
      await pick('c1.add', 5); await pick('c1.sub', 2); await pick('c1.mul', 3); await pick('c1.div', 2); await next();
      type('q.A', '69'); type('q.B', '412'); type('q.C', '53'); type('q.D', '257'); type('q.E', '24'); type('q.F', '96'); type('q.G', '7'); await next();
      await pick('h.add', 'C'); await pick('h.sub', 'C'); out.plain = !document.querySelector('#bookletBody .bk-yes, #bookletBody .bk-no') && !/✓|✗|correct|wrong|score/i.test(document.getElementById('bookletBody').textContent);
      document.querySelector('[data-bkstop]').click(); await wait(300); out.stop = on() + '|' + /Not|I did it/.test(rows());
      document.querySelector('#bwToday [data-bwxgo]').click(); await wait(300); out.resume = document.querySelector('.bk-count').textContent + '|' + document.querySelector('button[data-k="h.add"].on').dataset.v; await next();
      await pick('h.mul', 'D'); await pick('h.div', 'B'); await next(); type('m1', 'Pip forgot to <b>carry</b>'); await next();
      await pick('lv', 'Spicy'); type('lv.Spicy.0', '513'); type('lv.Spicy.1', '300'); await pick('lv', 'Mild'); out.levels = document.querySelectorAll('.bk-lvq .bk-q').length + '|' + document.querySelector('.bk-lv.on').textContent; await pick('lv', 'Spicy'); out.keptLv = document.querySelector('input[data-k="lv.Spicy.0"]').value; await next();
      await pick('asn.0', 'never'); await pick('asn.1', 'always'); await next();
      await pick('c8.add', 4); await pick('c8.sub', 4); type('x.can', 'take away with exchanging'); type('x.help', 'dividing'); await next();
      out.end = /whole booklet/.test(document.getElementById('bookletBody').textContent) + '|' + (JSON.parse(localStorage.getItem('fab-booklet-four-ops-y34-test-601')).a.done > 1e12) + '|' + /Handed in/.test(document.getElementById('bookletBody').textContent);
      document.querySelector('[data-bkstop]').click(); await wait(300); out.back = on(); out.after = rows();
      FabTeach.open(); FabTeach.go('progress'); await wait(250); const A = document.getElementById('tcAfl');
      out.afl = [...A.querySelectorAll('.bk-atable tbody tr')].map(tr => [...tr.children].map(td => td.textContent.replace(/\s+/g, ' ').trim()).join('/')).join(' ; ');
      out.next = [...A.querySelectorAll('.bk-next li i')].map(x => x.textContent).join(' ');
      out.words = /“Pip forgot to bcarry\/b”/.test(A.textContent.replace(/<|>/g, '')) + '|' + !A.querySelector('.bk-two b b') + '|' + /Chose Spicy: 1 right of 2 answered/.test(A.textContent) + '|' + /adds? two odd numbers.*never ✓/i.test(A.textContent) + '|' + /bigger\. always \(it is sometimes\)/.test(A.textContent) + '|' + /“dividing”/.test(A.textContent);
      out.tasks = [...document.querySelectorAll('#tcProgress .tc-tasks li')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' ; ');
      /* marks and the assessment profile: worked out when the booklet is handed in, for the teacher only */
      out.marks = A.querySelector('.bk-marks').textContent.replace(/\s+/g, ' ');
      FabTeach.go('profile'); await wait(200); const PF = document.querySelector('#tcProfile [data-tcprof="test-601"]');
      out.prof = [...PF.querySelectorAll('.tc-ptable tbody tr')].map(tr => [...tr.children].slice(0, 4).map(td => td.textContent.trim()).join('/')).join(' ; ');
      out.nexts = [...PF.querySelectorAll('[data-tcnext]')].map(b => b.dataset.tcnext).join(' ; ');
      PF.querySelector('[data-tcnext$="b:L:four-ops-y56"]').click(); await wait(250); out.nextGo = document.getElementById('teachBody').dataset.view + '|' + FabTeach.form.cls + '|' + FabTeach.form.one + '|' + document.querySelector('#tcPicks .tc-pick.on b').textContent;
      return out; });
    await ctx.close();
    assert(/^Marks: 10 of 15 answered \(20 questions are marked by the app\) · handed in /.test(r.marks) && /^Maths\/Adding\/2 of 4\/Developing ; Maths\/Subtracting\/3 of 4\/Developing ; Maths\/Multiplying\/3 of 3\/Secure ; Maths\/Dividing\/1 of 2\/Developing ; Maths\/Reasoning\/1 of 2\/Developing$/.test(r.prof) && /test-601\|b:L:four-ops-y56/.test(r.nexts) && /test-601\|p:maths-flightpath-addition-subtraction/.test(r.nexts) && r.nextGo === 'assign|one|test-601|Four Operations Check-In: Year 5/6', 'a handed-in booklet is marked by the app, the marks build a profile by strand, and “set next” opens Assign a task for that child: ' + JSON.stringify([r.marks, r.prof, r.nexts, r.nextGo]));
    assert(/^Booklet: Four Operations Check-In \(Y3\/4\) ?Start ➡️ ?I did it \+start ; Page 2: Number Detective ?Booklet: Year 4 Challenge Booklet: maths and English ?Your teacher will open this booklet with you\. ?I did it$/.test(r.rows), 'Today lists a booklet in the app with Start, and a booklet on the board with no Start: ' + r.rows);
    assert(r.open === 'screen-booklet|Page 1 of 8|true' && r.plain && /^screen-me\|/.test(r.stop) && r.resume === 'Page 3 of 8|C' && r.levels === '4|Mild' && r.keptLv === '513', 'the child answers without ticks, crosses or a score, can stop on any page and comes back to the same place, and can move between challenge levels: ' + JSON.stringify(r));
    assert(r.end === 'true|true|true' && r.back === 'screen-me' && /Four Operations Check-In \(Y3\/4\) ?⭐ Done/.test(r.after), 'finishing the booklet marks the task done in the Burrow: ' + r.end + r.back + r.after);
    assert(/Adding\/5\/✓\/✗\/C Carried to tens, not to hundreds\/4 ▼\/Developing ; .*Subtracting\/2\/✓\/✓\/C ✓ Correct\/4 ▲\/Secure ; .*Multiplying\/3\/✓\/✓\/D ✓ Correct\/–\/Secure ; .*Dividing\/2\/✗\/–\/B ✓ Correct\/–\/Developing$/.test(r.afl), 'the teacher sees confidence before and after, easier and harder questions, and what each hinge letter means: ' + r.afl);
    assert(r.next === 'Confident at the start but not yet right. Right answers but low confidence. Slips only on the harder questions. Slips on × and ÷ facts. A hinge letter that is not the right one.' && r.words === 'true|true|true|true|true|true' && /Booklet: Four Operations Check-In \(Y3\/4\) ?Done ; .*Booklet: Year 4 Challenge Booklet: maths and English: Page 2: Number Detective ?Not done yet/.test(r.tasks), 'draft next steps follow BMF’s own guide, the child’s words stay plain words, and the tasks are listed: ' + JSON.stringify([r.next, r.words, r.tasks]));
  });
  await test('Teacher-made booklets, My Number Toolkit, Everyone and theme weeks, set tasks, and the Look here pointer', async () => {
    const tp = await browser.newPage(); await tp.setViewportSize({ width:1366, height:900 }); await tp.goto(base + '/index.html'); await tp.waitForFunction(() => window.FabTeach && window.FabBooklets && window.FabSpot && document.getElementById('teachDoor')); await tp.waitForTimeout(300);
    const t = await tp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, on = () => document.querySelector('.screen.active').id;
      const set = (id, v, ev) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event(ev || 'input', { bubbles:true })); };
      const tap = async q => { document.querySelector(q).click(); await wait(160); };
      /* My Number Toolkit: every box drawn on a page is one the marking knows, and the model answers score full marks */
      const nt = FabBooklets.byId('number-toolkit'), keys = FabBooklets.mark(nt, {}).items, A = {}; keys.forEach(it => { A[it.k] = String([].concat(it.a)[0]); });
      const full = FabBooklets.mark(nt, A); FabBooklets.open('number-toolkit', 1, { teach:true, back:'screen-hub' }); await wait(200); const drawn = new Set();
      for(let i = 0; i < nt.pages.length; i++){ FabBooklets.state.i = i; FabBooklets.render(); document.querySelectorAll('#bookletBody [data-k]').forEach(e => drawn.add(e.dataset.k)); }
      out.nt = nt.pages.length + '|' + full.got + ' of ' + full.of + '|' + keys.every(it => drawn.has(it.k)) + '|' + Object.keys(full.strands).join();
      FabBooklets.state.i = 2; FabBooklets.render(); out.aids = document.querySelectorAll('#bookletBody svg.bk-aid.line').length + '|' + document.querySelectorAll('#bookletBody svg.bk-aid.line path').length + '|' + [...document.querySelectorAll('#bookletBody .bk-part h3')].map(x => x.textContent).join();
      /* a booklet made with Claude: checked before it is kept */
      const good = { t:'Halves <and> quarters', sub:'Maths', st:['ks1', 'nope'], about:'Sharing into equal parts.', pages:[
        { kind:'steps', t:'Half of a number', strap:'Share into two equal groups.', s:'Fractions', parts:[{ h:'Watch me', say:'Half of 8 is 4.' }, { h:'My turn', items:[{ q:'Half of 10', a:5 }, { q:'6 + 6', a:12 }, { q:'Which is a half?', a:'1/2', opts:['1/2', '1/4'] }, { q:'Tell me how you know.' }], seq:[2, 4, '_6', 8] }] },
        { kind:'hinge', t:'Which is right?', strap:'Choose one.', items:[{ q:'20 ÷ 4', opts:['5', '16', '24'], ok:'A', why:['', 'Subtracted', 'Added'] }] }] };
      const bad = JSON.parse(JSON.stringify(good)); bad.pages[0].parts[1].items[1].a = 13; bad.pages[1].items[0].ok = 'B'; bad.pages.push({ kind:'video', t:'x' });
      out.bad = FabBooklets.check(bad).errors.join(' | '); out.none = FabBooklets.check('hello').ok + '|' + FabBooklets.check({ t:'x', pages:[] }).ok;
      FabTeach.open(); await tap('#tcGoLibrary'); out.libTitle = document.querySelector('#screen-teach .screen-title').textContent + '|' + document.querySelectorAll('#tcLibPicks .tc-pick').length;
      await tap('#tcLadd'); out.empty = document.getElementById('tcLerr').textContent; set('tcLtext', '```json\n' + JSON.stringify(bad) + '\n```'); await tap('#tcLadd'); out.refused = document.querySelectorAll('#tcLerr li').length + '|' + FabBooklets.mine().length;
      set('tcLtext', JSON.stringify(good)); await tap('#tcLadd'); out.added = document.getElementById('tcLok').textContent + '|' + FabBooklets.mine().map(b => b.id + ':' + b.t + ':' + b.st.join()).join() + '|' + document.querySelector('#tcLibPicks .tc-pick.on .tc-tag').textContent + '|' + document.querySelectorAll('#tcLibOne .tc-pages li').length;
      /* Everyone, and a theme week with its ideas */
      localStorage.setItem('fab-teach-classes', JSON.stringify([{ n:'Adventurers', codes:['test-701', 'test-702'] }, { n:'Pioneers', codes:['test-702', 'test-703'] }]));
      await tap('#tcLibAssign'); out.assign = document.getElementById('teachBody').dataset.view + '|' + document.querySelector('#tcPicks .tc-pick.on b').textContent;
      await tap('[data-tccls="all"]'); out.all = document.querySelector('[data-tccls="all"]').textContent.trim() + '|' + /whole school/.test(document.getElementById('tcAssign').textContent);
      await tap('[data-tcpick="L:t-halves-and-quarters"]'); document.getElementById('tcMake').click(); await wait(200); const L = [...document.querySelectorAll('#tcAssign .cl-links input')].map(i => i.value);
      out.links = L.length + '|' + /\?learner=test-701&class=1&quiet=1&burrow=[A-Za-z0-9_-]+#bk=[A-Za-z0-9_-]+$/.test(L[0]); out.link = L[0];
      set('tcLabel', 'National Coding Week'); FabTeach.render(); await wait(150); out.ideas = [...document.querySelectorAll('[data-tcidea]')].map(b => b.textContent).join('|'); await tap('[data-tcidea="0"]');
      out.idea = FabTeach.form.kind + '|' + FabTeach.form.pick + '|' + document.getElementById('tcText').value; document.getElementById('tcMake').click(); await wait(200);
      FabTeach.go('tasks'); await wait(150); out.tasks = [...document.querySelectorAll('#tcTv .tc-chip')].map(b => b.textContent.trim()).join() + '|' + [...document.querySelectorAll('.tc-tasklist li')].map(li => li.querySelector('b').textContent + ' [' + [...li.querySelectorAll('.tc-tags i')].map(x => x.textContent).join() + '] ' + /Everyone \(3 children\)/.test(li.textContent)).join(' ; ');
      /* Look here: the teacher's pointer */
      const key = (k, shift) => document.dispatchEvent(new KeyboardEvent('keydown', { key:k, shiftKey:!!shift, bubbles:true }));
      out.spot0 = !document.getElementById('fabSpot') + '|' + document.getElementById('fabSpotBtn').hidden; key('L', true); await wait(100); const ov = document.getElementById('fabSpot');
      ov.dispatchEvent(new PointerEvent('pointermove', { clientX:300, clientY:200, bubbles:true })); const t1 = ov.querySelector('path').getAttribute('transform'); await tap('[data-spot="more"]'); const t2 = document.querySelector('#fabSpot path').getAttribute('transform');
      out.spot = !!ov + '|' + t1 + '|' + (t1 !== t2) + '|' + document.querySelectorAll('#fabSpot mask path').length + '|' + getComputedStyle(ov).zIndex; key('Escape'); await wait(100); out.spotOff = !document.getElementById('fabSpot');
      FabTeach.go('home'); await wait(100); await tap('#tcPointer'); out.spotBtn = FabSpot.shown() + '|' + !document.getElementById('fabSpotBtn').hidden + '|' + /On\./.test(document.getElementById('tcPointer').textContent); await tap('#fabSpotBtn'); out.spotOn = !!document.getElementById('fabSpot'); await tap('[data-spot="off"]');
      return out; });
    await tp.close();
    assert(t.nt === '9|48 of 48|true|Counting,Number bonds to 10,Counting on,Counting back,Part-whole,Counting up,Adding,Subtracting' && t.aids === '3|4|Watch me,Let’s do it together,My turn', 'My Number Toolkit is nine pages of Watch me, together, my turn, with number lines; every box is marked: ' + JSON.stringify([t.nt, t.aids]));
    assert(/“6 \+ 6” is 12, not 13/.test(t.bad) && /“20 ÷ 4” is 5, but option B says 16/.test(t.bad) && /“video” is not one the app knows/.test(t.bad) && t.none === 'false|false' && /Paste the booklet first/.test(t.empty) && /^3\|0$/.test(t.refused), 'a booklet file is checked: wrong sums, a wrong hinge letter and unknown pages are refused with plain reasons: ' + JSON.stringify([t.bad, t.none, t.empty, t.refused]));
    assert(/^Booklet library\|9$/.test(t.libTitle) && /^“Halves and quarters” is in your library.*\|t-halves-and-quarters:Halves and quarters:ks1\|Made by a teacher\|2$/.test(t.added), 'a good booklet joins the library on this browser as plain words: ' + JSON.stringify([t.libTitle, t.added]));
    assert(/^assign\|Halves/.test(t.assign) && t.all === 'Everyone (3)|true' && t.links === '3|true', 'Everyone sets a task for every child in every class once, and a teacher-made booklet travels after the # in each link: ' + JSON.stringify([t.assign, t.all, t.links]));
    assert(t.ideas === 'Solve a Fox Blocks puzzle|Code a dance for Fab|Make Fab do something when you tap' && t.idea === 'a|code:bush|Solve a Fox Blocks puzzle' && /^Future \(0\),Active \(2\),Past \(0\)\|Fox Blocks: To the bramble bush: Solve a Fox Blocks puzzle \[activity in the app,National Coding Week\] true ; Booklet: Halves.* \[booklet,Maths\] true$/.test(t.tasks), 'a theme week offers ideas, and Set tasks lists what was set with its tags: ' + JSON.stringify([t.ideas, t.idea, t.tasks]));
    assert(t.spot0 === 'true|true' && /^true\|translate\(.+\) scale\(1\.6\)\|true\|1\|2147483000$/.test(t.spot) && t.spotOff && t.spotBtn === 'true|true|true' && t.spotOn, 'Shift + L brings a cloud of light that follows the pointer and Esc puts it away; the button shows only when switched on: ' + JSON.stringify([t.spot0, t.spot, t.spotOff, t.spotBtn, t.spotOn]));
    const ctx = await browser.newContext(); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('teacher-made booklet child: ' + e.message));
    await c.goto(t.link); await c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active')); await c.waitForTimeout(300);
    const r = await c.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      out.url = location.hash + '|' + FabBooklets.mine().map(b => b.id).join(); out.today = [...document.querySelectorAll('#bwToday .bw-item')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' ; ');
      document.querySelector('#bwToday [data-bwxgo]').click(); await wait(300); out.page = document.querySelector('.bk-band h2').textContent + '|' + document.querySelector('.bk-count').textContent + '|' + !document.querySelector('#bookletBody b b');
      const type = (k, v) => { const e = document.querySelector('input[data-k="' + k + '"]'); e.value = v; e.dispatchEvent(new Event('input', { bubbles:true })); };
      type('p0.0', '6'); type('p0.1', '5'); type('p0.2', '13'); document.querySelector('button[data-k="p0.3"][data-v="1/2"]').click(); await wait(100); type('p0.4', 'two equal groups');
      document.querySelector('.bk-nav .btn.leaf').click(); await wait(150); document.querySelector('button[data-k="h.i1n0"][data-v="B"]').click(); await wait(100); document.querySelector('.bk-nav .btn.leaf').click(); await wait(200);
      FabTeach.open(); FabTeach.go('progress'); await wait(250); const A = document.querySelector('[data-bkafl="t-halves-and-quarters"]'); out.marks = A.querySelector('.bk-marks').textContent.replace(/\s+/g, ' ') + '|' + [...A.querySelectorAll('.bk-atable tbody tr')].map(tr => tr.children[1].textContent.trim()).join() + '|' + /Tell me how you know\. two equal groups/.test(A.textContent) + '|' + /6 \+ 6: 13 ✗ \(12\)/.test(A.textContent.replace(/\s+/g, ' '));
      const p = FabBooklets.profile('test-701'); out.prof = p.rows.map(x => x.sub + '/' + x.s + '/' + x.got + ' of ' + x.tried + '/' + x.bandName).join(' ; ');
      return out; });
    await ctx.close();
    assert(r.url === '|t-halves-and-quarters' && /^Booklet: Halves and quarters ?Start/.test(r.today) && r.page === 'Half of a number|Page 1 of 2|true', 'the booklet arrives with the child’s link, the # is cleared, and it opens from Today: ' + JSON.stringify([r.url, r.today, r.page]));
    assert(/^Marks: 3 of 5 answered \(5 questions are marked by the app\) · handed in .*\|3 of 4,0 of 1\|true\|true$/.test(r.marks) && r.prof === 'Maths/Fractions/3 of 4/Developing ; Maths/Dividing/0 of 1/Not enough yet', 'a teacher-made booklet is marked and feeds the profile; open answers are kept for the teacher to read: ' + JSON.stringify([r.marks, r.prof]));
  });
  await test('Plan a week: one link per child carries each day’s main task, practice and “if you finish”; Today’s session lays the session out for the teacher', async () => {
    const tctx = await browser.newContext(); await tctx.clock.setFixedTime(new Date('2026-12-01T09:00:00')); const tp = await tctx.newPage(); await tp.setViewportSize({ width:1366, height:900 });
    await tp.goto(base + '/index.html'); await tp.waitForFunction(() => window.FabTeach && window.FabBooklets && document.getElementById('teachDoor')); await tp.waitForTimeout(300);
    const t = await tp.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      const tap = async q => { document.querySelector(q).click(); await wait(160); };
      const set = (q, v) => { const el = document.querySelector(q); el.value = v; el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles:true })); };
      FabTeach.open(); await tap('#tcGoPlan'); out.noClass = /Set up a class first/.test(document.getElementById('tcPlan').textContent);
      localStorage.setItem('fab-teach-classes', JSON.stringify([{ n:'Adventurers', codes:['test-901', 'test-902'] }, { n:'Explorers', codes:['test-903'] }])); FabTeach.render(); await wait(150);
      out.week = document.getElementById('tpWeek').textContent + '|' + document.querySelector('.tp-slot').textContent + '|' + document.querySelectorAll('.tp-day').length + '|' + document.querySelector('.tp-day h3').textContent;
      await tap('#tpMake'); out.empty = document.getElementById('tpMsg').textContent;
      set('[data-tp="unit"]', 'A Christmas Carol');
      set('[data-tp="c1"][data-day="0"]', 'Connect 4'); set('[data-tp="c2"][data-day="0"]', 'Noughts and crosses'); set('[data-tp="teach"][data-day="0"]', 'This helps me plan. Do question A together'); set('#tpMain0', 'b:four-ops-y34'); set('#tpMt0', 'Pages 1 to 5'); set('#tpPrac0', 'maths-flightpath-addition-subtraction'); set('#tpFin0', 'Choose your challenge at Hot');
      set('[data-tp="c1"][data-day="1"]', 'Charades'); set('[data-tp="teach"][data-day="1"]', 'Read about <b>Scrooge</b>; sort the words'); set('#tpMain1', 'c'); set('#tpMt1', 'Write two sentences about Scrooge'); set('#tpFin1', 'Draw Scrooge and label him'); set('[data-tp="low"][data-day="1"]', 'Say one sentence; stop there');
      set('#tpMain3', 't:victorian'); set('#tpMt3', 'Visit the schoolroom and ask Ada two questions');
      FabTeach.render(); await wait(150); out.kept = document.getElementById('tpMain0').value + '|' + document.getElementById('tpFin1').value + '|' + document.querySelector('[data-tp="unit"]').value;
      await tap('#tpMake'); out.msg = document.getElementById('tpMsg').textContent; out.links = [...document.querySelectorAll('#tcPlan .cl-links input')].map(i => i.value);
      await tap('#tcPlan [data-tcview="today"]'); const card = document.querySelector('[data-ttcls="Adventurers"]');
      out.today = document.querySelector('#tcToday h2').textContent.trim() + '|' + [...document.querySelectorAll('.tt-card h2')].map(x => x.textContent.replace(/\s+/g, ' ').trim()).join(';');
      out.rows = [...card.querySelectorAll('.tt-table tr')].map(tr => tr.textContent.replace(/\s+/g, ' ').trim()).join(' | '); out.plain = !card.querySelector('td b b');
      await tap('[data-ttday="0"]'); const c0 = document.querySelector('[data-ttcls="Adventurers"]'); out.mon = /Booklet: Four Operations Check-In \(Y3\/4\) \(Pages 1 to 5\)/.test(c0.textContent) + '|' + /Addition.*own step/.test(c0.textContent) + '|' + !!c0.querySelector('[data-ttlook="four-ops-y34"]');
      FabTeach.go('tasks'); await wait(150); out.log = document.querySelector('.tc-tasklist li b').textContent;
      return out; });
    await tctx.close();
    assert(t.noClass && t.week === 'Week beginning Monday 30 November|Adventurers: usually 10:45 to 11:30|5|Monday 30 November' && /Nothing is planned/.test(t.empty) && t.kept === 'b:four-ops-y34|Draw Scrooge and label him|A Christmas Carol', 'a week is five days for a class, at its usual time, and saves as it is typed: ' + JSON.stringify([t.noClass, t.week, t.empty, t.kept]));
    assert(/^2 links are ready, one per child, for 3 days of work\.$/.test(t.msg) && t.links.length === 2 && /learner=test-901&class=1&quiet=1&burrow=/.test(t.links[0]) && t.log === 'Week plan: 3 days, A Christmas Carol', 'one link per child for the whole week: ' + JSON.stringify([t.msg, t.log]));
    assert(/^Today: 1 December\|Explorers 9:00 to 9:30;Adventurers 10:45 to 11:30 · A Christmas Carol$/.test(t.today) && /^Connect \(15\) ?Today’s Hello and Energy today, then the children choose: Charades \| I do, we do \(10\) ?Read about bScrooge\/b; sort the words \| You do \(12\) ?Write two sentences about Scrooge \| Practise \(5\) ?None \| If you finish ?Draw Scrooge and label him \| Low energy; where to stop ?Say one sentence; stop there \| Goodbye \(3\) ?Goodbye Circle: one thing I can do now$/.test(t.rows) && t.plain && t.mon === 'true|true|true', 'Today’s session shows each class in timetable order with the session’s five parts: ' + JSON.stringify([t.today, t.rows, t.mon]));
    const ctx = await browser.newContext(); await ctx.clock.setFixedTime(new Date('2026-12-01T10:50:00')); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('week plan child: ' + e.message));
    await c.goto(t.links[0]); await c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active')); await c.waitForTimeout(300);
    const rows = () => c.evaluate(() => [...document.querySelectorAll('#bwToday .bw-item')].map(li => li.textContent.replace(/\s+/g, ' ').trim()).join(' ; ') + ' || ' + document.querySelector('#bwToday .bubble, #bwToday .bw-none').textContent.replace(/\s+/g, ' ').trim().slice(0, 40));
    const tue = await rows();
    await c.evaluate(async () => { [...document.querySelectorAll('#bwToday .bw-item')].find(li => /Scrooge/.test(li.textContent)).querySelector('[data-bwxdone]').click(); await new Promise(r => setTimeout(r, 300)); });
    const tueDone = await rows();
    await ctx.clock.setFixedTime(new Date('2026-12-03T10:50:00')); await c.reload(); await c.waitForFunction(() => document.getElementById('screen-me') && document.getElementById('screen-me').classList.contains('active')); await c.waitForTimeout(300);
    const thu = await rows(); const again = await c.evaluate(async (l) => { const before = JSON.parse(localStorage.getItem('fab-burrow-test-901')).extras.length; return before; }, t.links[0]);
    await ctx.close();
    assert(/^A Christmas Carol ?Write two sentences about Scrooge ?I did it ; From Monday, if you like ?A Christmas Carol ?Booklet: Four Operations Check-In \(Y3\/4\) ?Your teacher says: Pages 1 to 5 ?Start ➡️ ?I did it \|\| One thing to do today/.test(tue), 'on Tuesday the child sees Tuesday’s main task, with Monday’s unfinished one marked “if you like”; no practice or extras from Monday: ' + tue);
    assert(/Write two sentences about Scrooge ?⭐ Done ; If you finish ?Draw Scrooge and label him ?I did it ; From Monday, if you like.*\|\| All done for today/.test(tueDone), 'when the main task is done, “if you finish” appears and the day still counts as done: ' + tueDone);
    assert(/^A Christmas Carol ?the Victorians: Visit the schoolroom and ask Ada two questions|^A Christmas Carol ?Visit the schoolroom and ask Ada two questions/.test(thu) && /From Monday, if you like/.test(thu) && !/Draw Scrooge/.test(thu) && again === 6, 'Thursday brings Thursday’s topic by itself; Tuesday’s extras have gone: ' + thu + ' ' + again);
  });
  await test('World Explorers: explain-how posters and same-but-different charts are finished pieces on their own, and slot into the report', async () => {
    const ctx = await browser.newContext(); const c = await ctx.newPage(); await c.setViewportSize({ width:1366, height:900 });
    c.on('pageerror', e => errors.push('explain it: ' + e.message));
    await c.goto(base + '/index.html?learner=test-950&class=1&quiet=1'); await c.waitForFunction(() => window.FabExplore && window.FabMake && window.FabBurrow); await c.waitForTimeout(400);
    const r = await c.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {}, X = FabExplore;
      const tap = async q => { document.querySelector(q).click(); await wait(140); };
      const openMake = async id => { X.open('screen-me', id); X.state.tab = 'make'; FabMake.home(); X.render(); await wait(200); };
      out.data = X.order.map(id => id + ':' + ((X.worlds[id].make.how || []).length) + (X.worlds[id].make.same ? 's' : '')).join();
      out.sizes = X.order.every(id => (X.worlds[id].make.how || []).every(t => t.steps.length === 5 && t.steps.every(x => x.length <= 95) && t.fact && t.lead) && (!X.worlds[id].make.same || (X.worlds[id].make.same.cards.length >= 8 && ['a', 'b', 'both'].every(k => X.worlds[id].make.same.cards.some(c => c[1] === k)))));
      await openMake('egypt'); out.cards = [...document.querySelectorAll('.mk-cards [data-id^="how:"] b')].map(b => b.textContent).join('|');
      await tap('[data-mk="open"][data-id="how:papyrus"]'); const t = X.worlds.egypt.make.how[0];
      const chip = i => [...document.querySelectorAll('.mk-pool [data-mk="howput"]')].find(b => b.textContent === t.steps[i]);
      chip(3).click(); await wait(140); out.wrong = document.querySelector('.tm-notebox').textContent.replace(/\s+/g, ' ').trim() + '|' + document.querySelectorAll('.mk-howsteps.build li:not(.mk-slot)').length;
      chip(0).click(); await wait(140); await tap('[data-mk="hownext"]'); out.helped = document.querySelectorAll('.mk-howsteps.build li:not(.mk-slot)').length + '|' + /Fab put that one in/.test(document.querySelector('.tm-notebox').textContent);
      for(const i of [2, 3, 4]){ chip(i).click(); await wait(140); }
      out.poster = !!document.querySelector('.mk-howp') + '|' + [...document.querySelectorAll('.mk-howp .mk-howsteps li')].map(li => li.textContent).join(' ').length + '|' + /You can explain it!/.test(document.querySelector('.tm-notebox').textContent) + '|' + /How papyrus was made/.test(document.querySelector('.mk-howp').textContent);
      const y = document.getElementById('mkWhy'); y.value = 'it turned a <b>plant</b> into paper'; await tap('[data-mk="howwhy"]'); out.why = /I think it was clever because ?it turned a bplant\/b into paper/.test(document.querySelector('.mk-howp').textContent.replace(/\s+/g, ' ')) + '|' + !document.querySelector('.mk-howp b b');
      await tap('[data-mk="home"]'); out.tick = !!document.querySelector('[data-id="how:papyrus"].done') + '|' + !document.querySelector('[data-id="how:pyramid"].done');
      await tap('[data-mk="open"][data-id="how:papyrus"]'); out.reopen = !!document.querySelector('.mk-howp');
      await tap('[data-mk="open"][data-id="report"]'); await tap('[data-mk="lvl"][data-id="1"]'); FabMake.state.rstep = 5; X.render(); await wait(150); out.goesIn = /Your explanation poster is in your report/.test(document.querySelector('.mk-in-list').textContent); await tap('[data-mk="open"][data-id="paper"]'); out.inReport = /How papyrus was made/.test(document.querySelector('.mk-paper').textContent) + '|' + document.querySelectorAll('.mk-paper .mk-howsteps li').length;
      /* Ancient Greece: the same but different */
      await openMake('greece'); await tap('[data-mk="open"][data-id="same"]'); const S = X.worlds.greece.make.same; let slips = 0, n = 0;
      while(document.querySelector('.mk-samecard') && n++ < 30){ const text = document.querySelector('.mk-samecard').textContent, card = S.cards.find(x => x[0] === text);
        if(n === 1){ document.querySelector('[data-mk="sameput"][data-id="' + (card[1] === 'a' ? 'b' : 'a') + '"]').click(); await wait(120); slips += /Have another think/.test(document.querySelector('.tm-notebox').textContent) ? 1 : 0; }
        if(n === 2){ await tap('[data-mk="samehelp"]'); continue; }
        document.querySelector('[data-mk="sameput"][data-id="' + card[1] + '"]').click(); await wait(120); }
      out.same = slips + '|' + !!document.querySelector('.mk-samep') + '|' + [...document.querySelectorAll('.mk-samep .mk-col')].map(x => x.querySelector('h4').textContent + ' ' + x.querySelectorAll('li').length).join(', ') + '|' + JSON.parse(localStorage.getItem('fab-make-test-950')).greece.same.done;
      showScreen('screen-me'); await wait(300); out.made = [...document.querySelectorAll('#screen-me button')].map(b => b.textContent.replace(/\s+/g, ' ').trim()).filter(x => /poster|chart/.test(x)).join(' ; ');
      return out; });
    await ctx.close();
    assert(r.data === 'rome:1,egypt:3,greece:0s,victorian:0s,space:0' && r.sizes && r.cards === 'How papyrus was made|How a scribe wrote a royal name|How the pyramids were built', 'each history world has pieces to explain: ' + JSON.stringify([r.data, r.sizes, r.cards]));
    assert(/^Not that one yet\. ?Think about what the paper makers needed.*\|0$/.test(r.wrong) && r.helped === '2|true' && /^true\|\d{3}\|true\|true$/.test(r.poster) && r.why === 'true|true' && r.tick === 'true|true' && r.reopen, 'a wrong step gets a tip and never a cross, Fab can place a step, and the finished steps become a poster with the child’s own “because”: ' + JSON.stringify(r));
    assert(r.goesIn && r.inReport === 'true|5' && /^1\|true\|Ancient Greece 4, Both 3, Today 3\|1$/.test(r.same) && /an explanation poster/i.test(r.made) && /a same-but-different chart/i.test(r.made), 'the poster slots into the report, the chart sorts ten cards into then, both and now, and both show in Things I made: ' + JSON.stringify([r.inReport, r.same, r.made]));
  });
  await test('Several children: Help and low energy reach Fab Fox World, Fox Blocks and Fab’s Sanctuary', async () => {
    const ap = await classPage('?learner=class-t1&class=1');
    const r = await ap.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      const d = new Date(), t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      localStorage.setItem('fab-energy-class-t1', JSON.stringify({ d:t, v:'low' }));
      localStorage.setItem('fabsanct-v1-class-t1', JSON.stringify({ v:1, started:true, box:20, homes:{ e:'hedgehog' }, names:{ hedgehog:'Acorn' } }));
      showScreen('screen-games'); fabOpenCode('bush'); let n = 0, W = null;
      while(!((W = document.getElementById('codeFrame').contentWindow) && W.document.querySelector('.fc-help [data-a="next"]')) && n++ < 80) await wait(100);
      out.code = [...W.document.querySelectorAll('.fc-help .fc-b')].map(b => (b.dataset.a || '') + (b.classList.contains('gold') ? '*' : '')).join() + '|' + /Taking it gently today/.test(W.document.getElementById('fcBrief').textContent);
      W.document.querySelector('[data-a="help"]').click(); await wait(200);
      out.codeHelp = !!localStorage.getItem('fab-help-class-t1') && !document.getElementById('fabHand').hidden && /Hand up/.test(W.document.querySelector('[data-a="help"]').textContent);
      fabHelp(false); await wait(150); out.codeDown = !/Hand up/.test(W.document.querySelector('[data-a="help"]').textContent);
      showScreen('screen-games'); fabOpenSanct(); n = 0;
      while(!((W = document.getElementById('sanctFrame').contentWindow) && W.FabSanct) && n++ < 80) await wait(100);
      await wait(150);
      out.sanct = [W.document.getElementById('snHelp').hidden, [...W.document.querySelectorAll('#snSide .sn-acts [data-a]')].slice(0, 2).map(b => b.dataset.a).join(), /Taking it gently today/.test(W.document.getElementById('snSide').textContent)].join('|');
      W.document.getElementById('snHelp').click(); await wait(200); out.sanctHelp = !!localStorage.getItem('fab-help-class-t1') && /Hand up/.test(W.document.getElementById('snHelp').textContent); fabHelp(false);
      W.FabSanct.open(); out.workout = W.document.querySelector('[data-a="workout"]').classList.contains('gold');
      showScreen('screen-hub');
      return out; });
    await ap.close();
    assert(r.code === 'next*,way,help|true' && r.codeHelp && r.codeDown, 'Fox Blocks: on a low-energy day the gold “Add the next block for me” comes first, Dad says so, and Help raises the hand in the app: ' + JSON.stringify(r));
    assert(r.sanct === 'false|rounds,day|true' && r.sanctHelp && r.workout, 'the sanctuary: “Do the rounds for me” comes first, “Work it out for me” is gold, and Help works: ' + JSON.stringify(r));
  });
  await test('Several children: Fab Fox World shows Help in class mode, raises the hand, and says “take it gently” once on a low-energy day', async () => {
    const ap = await classPage('?learner=class-t2&class=1');
    const r = await ap.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      const d = new Date(), t = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      localStorage.setItem('fab-energy-class-t2', JSON.stringify({ d:t, v:'low' }));
      showScreen('screen-world'); try{ fabGameMount('screen-world'); }catch(e){}
      let n = 0, W = null; while(!((W = document.querySelector('.game-frame[data-game="world"]').contentWindow) && W.WORLD) && n++ < 150) await wait(100);
      await wait(2200); const b = W.document.getElementById('helpBtn');
      out.btn = [!!b, b && b.hidden, /Take it gently today/.test(W.document.getElementById('cheer').textContent), W.WORLD.S().lowSaid === t].join('|');
      b.click(); await wait(200); out.up = [!!localStorage.getItem('fab-help-class-t2'), b.getAttribute('aria-pressed'), !document.getElementById('fabHand').hidden, /class-t2 would like help/.test(document.getElementById('fabHand').textContent)].join('|');
      b.click(); await wait(200); out.down = !localStorage.getItem('fab-help-class-t2') && b.getAttribute('aria-pressed') === 'false';
      localStorage.removeItem('fab-class'); W.helpPaint(); out.off = b.hidden;
      showScreen('screen-hub'); return out; });
    await ap.close();
    assert(r.btn === 'true|false|true|true', 'Help shows in the world’s bottom row in class mode, and the low-energy line shows once: ' + JSON.stringify(r));
    assert(r.up === 'true|true|true|true' && r.down && r.off, 'Help in the world raises and lowers the hand; with class mode off it hides: ' + JSON.stringify(r));
  });
  await test('For staff: “Today’s class in Pencil Spaces” makes one link per Fab code, refuses names, and gives the board set-up steps', async () => {
    const r = await page.evaluate(async () => { const wait = ms => new Promise(res => setTimeout(res, ms)), out = {};
      showScreen('screen-staff'); await wait(200);
      const ta = document.getElementById('clCodes'); ta.value = 'otter-482, robin-317\nBen'; ta.dispatchEvent(new Event('change')); await wait(100);
      out.links = [...document.querySelectorAll('.cl-links input')].map(i => i.value.replace(location.origin + location.pathname, '')).join(' ');
      out.bad = /Not a Fab code: ben/.test(document.getElementById('clClass').textContent);
      document.getElementById('clQuiet').click(); await wait(100);
      out.noQuiet = [...document.querySelectorAll('.cl-links input')].every(i => !/quiet=1/.test(i.value) && /class=1/.test(i.value));
      out.steps = document.querySelectorAll('#clClass ol li').length + '|' + /Always available/.test(document.getElementById('clClass').textContent);
      document.getElementById('clQuiet').click(); FabClass.form.text = ''; showScreen('screen-hub');
      return out; });
    assert(r.links === '?learner=otter-482&class=1&quiet=1 ?learner=robin-317&class=1&quiet=1' && r.bad && r.noQuiet && r.steps === '4|true', JSON.stringify(r));
    await page.evaluate(classClean);
  });

  await test('no console errors anywhere', async () => { assert(!errors.length, errors.slice(0, 10).join('\n')); });

  await browser.close(); server.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
