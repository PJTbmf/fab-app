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
const TYPES = { '.html':'text/html; charset=utf-8', '.png':'image/png', '.js':'text/javascript', '.json':'application/json' };
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
    assert(r.rev === 2, 'rev should be 2');
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
    const url = '/index.html?lesson=maths-flightpath-multiplication-division&learner=Sam';
    const p1 = await newPage(url, ctx);
    await p1.evaluate(() => { learnGo(1); });
    await p1.locator('.pw-stage-head', { hasText: 'Doubling up' }).click();
    await p1.locator('[data-pwpick="5"]').click();
    await p1.close();
    const p2 = await newPage(url, ctx);
    const step = await p2.evaluate(() => Learn.step === 1 && Learn.state[1].kids['learner:Sam'].step);
    assert(step === 5, 'progress not restored: ' + step);
    await p2.evaluate(() => store.setJSON('bmf_progress_maths-flightpath-multiplication-division_Sam', { step:1, state:{ 1:{ kids:{ 'learner:Sam':{ step:4 } } } }, saved:1 }));
    await p2.close();
    const p3 = await newPage(url, ctx);
    const after = await p3.evaluate(() => (Learn.state[1] && Learn.state[1].kids) ? 'restored' : 'fresh');
    assert(after === 'fresh', 'old (rev 1) progress should be ignored');
    await ctx.close();
  });

  /* ---------- 6. Christmas Carol ---------- */
  await test('Meet Scrooge still opens and every screen renders', async () => {
    const n = await page.evaluate(() => {
      const p = BUILT_IN_PACKS.find(x => x.id === 'eng-y34-christmas-carol-l1');
      learnOpen(p);
      for(let i = 0; i <= p.screens.length; i++){ learnGo(i); if(!document.getElementById('lpStage').innerHTML.trim()) return -i; }
      return p.screens.length;
    });
    assert(n > 0, 'blank screen at ' + (-n));
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

  await test('no console errors anywhere', async () => { assert(!errors.length, errors.slice(0, 10).join('\n')); });

  await browser.close(); server.close();
  console.log(results.join('\n'));
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
