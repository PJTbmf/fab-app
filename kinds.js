/* kinds.js — extra flightpath question kinds: addition and subtraction, and fractions.
   Loaded after the main script, so it can add to PW_GEN, PW_DEFAULT_HINT, PW_WORKED, PATHWAY_KINDS and the picture drawing.
   Every generator returns plain data { mode, ask, vis, ans, wrong:[{v, tag}], vars, say }.
   The "wrong" lists are the slips that Oak National Academy records for each topic, written as answers a child might give.
   Everything here is a draft for a teacher to check. */
(function(){
  'use strict';
  const R = pwRand, pick = pwPick, between = pwBetween, shuffle = pwShuffle, arr = pwToArr;
  const W = (v, tag) => ({ v, tag });
  const dg = n => String(n).split('').map(Number);
  const rev = n => Number(String(n).split('').reverse().join(''));
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const range = n => Array.from({ length:n }, (_, i) => i);
  const fr = (n, d) => `${n}/${d}`;
  const mix = (w, n, d) => `${w} ${n}/${d}`;
  const NAMES = { 2:'half', 3:'third', 4:'quarter', 5:'fifth', 6:'sixth', 7:'seventh', 8:'eighth', 9:'ninth', 10:'tenth', 11:'eleventh', 12:'twelfth' };
  const NUMW = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven'];
  const plural = d => d === 2 ? 'halves' : NAMES[d] ? `${NAMES[d]}s` : `${d}ths`;
  const frWords = (k, d) => k === 1 ? `one ${NAMES[d]}` : `${NUMW[k]} ${plural(d)}`;
  const opName = { '+':'add', '−':'take away' };

  /* ---------- column working (used to build the slips children make, and to check answers) ---------- */
  const noCarry = (a, b) => { const x = dg(a).reverse(), y = dg(b).reverse(), L = Math.max(x.length, y.length); let r = 0;
    for(let i = 0; i < L; i++){ const s = (x[i] || 0) + (y[i] || 0); r += (i === L - 1 ? s : s % 10) * Math.pow(10, i); } return r; };
  const carries = (a, b) => { const x = dg(a).reverse(), y = dg(b).reverse(), L = Math.max(x.length, y.length); let c = 0, n = 0;
    for(let i = 0; i < L; i++){ const s = (x[i] || 0) + (y[i] || 0) + c; c = s >= 10 ? 1 : 0; n += c; } return n; };
  /* mode: 'ok' = correct working, 'big' = take the smaller digit from the bigger, 'keep' = forget to reduce the next column after exchanging */
  const subSlip = (a, b, mode) => { const x = dg(a).reverse(), y = dg(b).reverse(); let br = 0, r = 0;
    for(let i = 0; i < x.length; i++){ const d = y[i] || 0;
      if(mode === 'big'){ r += Math.abs(x[i] - d) * Math.pow(10, i); continue; }
      let t = x[i] - (mode === 'keep' ? 0 : br);
      if(t < d){ t += 10; br = 1; } else br = 0;
      r += (t - d) * Math.pow(10, i); }
    return r; };
  const exchanges = (a, b) => { const x = dg(a).reverse(), y = dg(b).reverse(); let br = 0, n = 0, chain = false;
    for(let i = 0; i < x.length; i++){ const t = x[i] - br, d = y[i] || 0; if(x[i] === 0 && br === 1) chain = true; if(t < d){ br = 1; n++; } else br = 0; }
    return { n, chain }; };
  const roundTo = (n, r) => Math.floor(n / r + 0.5) * r;
  const rname = r => ({ 10:'ten', 100:'hundred', 1000:'thousand', 10000:'ten thousand' }[r] || String(r));

  const G = {
    /* ================= ADDITION AND SUBTRACTION ================= */
    bonds(p){
      const T = Number(p.total) || 10, forms = arr(p.forms).length ? arr(p.forms) : ['missing', 'missingFirst', 'minus'];
      const form = pick(forms), a = between(1, T - 1), ans = T - a;
      const wrong = [W(T + a, 'added'), W(a, 'copied'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      if(form === 'minus') return { mode:'num', ask:`${T} − ${a} =`, ans, wrong, say:`${T} − ${a}`, vars:{ form, a, T, ans } };
      return { mode:'num', ask:form === 'missingFirst' ? `? + ${a} = ${T}` : `${a} + ? = ${T}`, vis:{ frame:[a, T] }, ans, wrong, say:`${T} − ${a}`, vars:{ form, a, T, ans } };
    },
    threeAdd(p){
      const x = between(1, 9), y = 10 - x, z = between(2, 9), seq = shuffle([x, y, z]), ans = 10 + z;
      const wrong = [W(10 + (R(2) ? x : y) + z, 'reAdd'), W(seq[0] + seq[1], 'dropped'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      return { mode:'num', ask:`${seq.join(' + ')} =`, ans, wrong, say:seq.join(' + '), vars:{ x, y, z, pair:`${x} + ${y}`, ans } };
    },
    bridge10(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['add', 'sub']);
      if(form === 'add'){
        const a = between(2, 9), b = between(11 - a, 9), ans = a + b, toTen = 10 - a;
        return { mode:'num', ask:`${a} + ${b} =`, ans, wrong:[W(ans - 10, 'forgotTen'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')], say:`${a} + ${b}`,
          vars:{ form, a, b, toTen, rest:b - toTen, ans } };
      }
      const b = between(3, 9), top = between(11, 9 + b), down = top - 10, left = b - down, ans = top - b;
      return { mode:'num', ask:`${top} − ${b} =`, ans, wrong:[W(10 + left, 'addedLeft'), W(top + b, 'added'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')], say:`${top} − ${b}`,
        vars:{ form, top, b, down, left, ans } };
    },
    difference(p){
      const max = Number(p.max) || 20;
      const cx = pick([{ A:'fox', B:'squirrel', what:'acorns' }, { A:'owl', B:'hedgehog', what:'berries' }, { A:'rabbit', B:'mouse', what:'carrots' },
        { A:'duck', B:'frog', what:'pebbles' }, { A:'robin', B:'badger', what:'leaves' }, { A:'bee', B:'ladybird', what:'flowers' }]);
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['more', 'fewer', 'altogether']);
      const a = between(6, max), b = between(2, a - 1), diff = a - b, sum = a + b;
      const story = `A ${cx.A} has ${a} ${cx.what}. A ${cx.B} has ${b} ${cx.what}.`;
      const vars = { form, a, b, A:cx.A, B:cx.B, what:cx.what };
      if(form === 'altogether'){
        return { mode:'num', ask:`${story} How many ${cx.what} altogether?`, vis:{ pwm:{ whole:'?', parts:[a, b] } }, ans:sum,
          wrong:[W(diff, 'wrongOp'), W(a, 'bigger'), W(sum + 1, 'countSlip'), W(sum - 1, 'countSlip')], say:`${a} + ${b}`, vars:{ ...vars, ans:sum } };
      }
      const who = form === 'more' ? cx.A : cx.B;
      return { mode:'num', ask:`${story} How many ${form === 'more' ? 'more' : 'fewer'} ${cx.what} does the ${who} have?`,
        vis:{ cmp:[{ n:a, l:cx.A }, { n:b, l:cx.B }] }, ans:diff,
        wrong:[W(sum, 'wrongOp'), W(a, 'bigger'), W(diff + 1, 'countSlip'), W(diff - 1, 'countSlip')], say:`${a} − ${b}`, vars:{ ...vars, ans:diff } };
    },
    tensOnes(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['tens', 'ones', 'cross']), up = R(2) === 0, op = up ? '+' : '−';
      if(form === 'tens'){
        const t = between(1, 6) * 10, n = up ? between(11, 99 - t) : between(10 + t, 99), ans = up ? n + t : n - t, tens = t / 10;
        return { mode:'num', ask:`${n} ${op} ${t} =`, ans, wrong:[W(up ? n + tens : n - tens, 'onesDigit'), W(up ? n + 1 : n - 1, 'onesDigit'), W(ans + 10, 'countSlip'), W(ans - 10, 'countSlip')],
          say:`${n} ${op} ${t}`, vars:{ form, n, t, tens, op, up:up ? 1 : 0, nTens:Math.floor(n / 10), ans } };
      }
      if(form === 'ones'){
        let n, b, u;
        do { n = between(11, 98); u = n % 10; } while(up ? u > 8 : u < 1);
        b = up ? between(1, 9 - u) : between(1, u);
        const ans = up ? n + b : n - b;
        return { mode:'num', ask:`${n} ${op} ${b} =`, ans, wrong:[W(up ? n + b * 10 : n - b * 10, 'tensOnesMixed'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')],
          say:`${n} ${op} ${b}`, vars:{ form, n, b, u, op, up:up ? 1 : 0, ans } };
      }
      /* crossing a ten */
      let n, b, u;
      if(up){ u = between(1, 9); b = between(10 - u, 9); n = between(1, 8) * 10 + u; }
      else { u = between(0, 8); b = between(u + 1, 9); n = between(2, 9) * 10 + u; }
      const ans = up ? n + b : n - b;
      const wrong = up ? [W(ans - 10, 'forgotTen'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')]
        : [W(ans + 10, 'keptTens'), ...(u > 0 ? [W(Math.floor(n / 10) * 10 + (b - u), 'smallFromBig')] : []), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      return { mode:'num', ask:`${n} ${op} ${b} =`, ans, wrong, say:`${n} ${op} ${b}`,
        vars:{ form, n, b, op, up:up ? 1 : 0, u, toTen:10 - u, rest:b - (10 - u), nextTen:n - u + 10, prevTen:n - u, down:u, left:b - u, nTens:Math.floor(n / 10), lower:Math.floor(n / 10) - 1, base:n - 10, bondLeft:10 - b, ans } };
    },
    twoDigitAdd(p){
      const want = pick(arr(p.forms).length ? arr(p.forms) : ['plain', 'cross']) === 'cross';
      let a, b, tries = 0;
      do { a = between(11, 88); b = between(11, 88); tries++; } while(((a % 10 === 0 || b % 10 === 0) || ((a % 10 + b % 10 >= 10) !== want) || a + b > 99) && tries < 500);
      const ans = a + b, aT = Math.floor(a / 10), bT = Math.floor(b / 10), aO = a % 10, bO = b % 10;
      const wrong = [W((aT + bT) * 10, 'forgotOnes'), W(a + rev(b), 'transposed'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      if(want) wrong.unshift(W(ans - 10, 'forgotTen'));
      return { mode:'num', ask:`${a} + ${b} =`, ans, wrong, say:`${a} + ${b}`, vars:{ a, b, aT, aO, bT, bO, bTens:bT * 10, onesSum:aO + bO, cross:want ? 1 : 0, ans } };
    },
    twoDigitSub(p){
      const want = pick(arr(p.forms).length ? arr(p.forms) : ['plain', 'cross']) === 'cross';
      let a, b, tries = 0;
      do { a = between(31, 99); b = between(11, a - 10); tries++; } while((a % 10 === 0 || b % 10 === 0 || ((a % 10 < b % 10) !== want)) && tries < 500);
      const ans = a - b, aT = Math.floor(a / 10), bT = Math.floor(b / 10), aO = a % 10, bO = b % 10;
      const wrong = want ? [W(subSlip(a, b, 'big'), 'smallFromBig'), W(ans + 10, 'keptTens'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')]
        : [W(a + b, 'wrongOp'), W(subSlip(a, b, 'big'), 'smallFromBig'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      return { mode:'num', ask:`${a} − ${b} =`, ans, wrong, say:`${a} − ${b}`, vars:{ a, b, aT, aO, bT, bO, bTens:bT * 10, afterTens:a - bT * 10, cross:want ? 1 : 0, ans } };
    },
    missingNumber(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['addend', 'part', 'whole']);
      const p1 = between(11, 69), p2 = between(11, 99 - p1), w = p1 + p2;
      if(form === 'whole'){
        const wrong = [W(Math.abs(p1 - p2), 'wrongOp'), W(p1, 'copied'), W(rev(w), 'transposed'), W(w + 10, 'countSlip')];
        return { mode:'num', ask:`? − ${p2} = ${p1}`, vis:{ pwm:{ whole:'?', parts:[p1, p2] } }, ans:w, wrong, say:`${p1} + ${p2}`, vars:{ form, w, p1, p2, ans:w } };
      }
      const wrong = [W(w + p2, 'wrongOp'), W(p2, 'copied'), W(rev(p1), 'transposed'), W(p1 + 10, 'countSlip'), W(p1 - 10, 'countSlip')];
      return { mode:'num', ask:form === 'addend' ? `? + ${p2} = ${w}` : `${w} − ? = ${p2}`, vis:{ pwm:{ whole:w, parts:['?', p2] } }, ans:p1, wrong, say:`${w} − ${p2}`, vars:{ form, w, p1, p2, ans:p1 } };
    },
    mentalAdj(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['ones', 'tens', 'hundreds']);
      const up = R(2) === 0, op = up ? '+' : '−';
      const wrapDigit = (n, pos, delta) => { const d = dg(n); const i = d.length - 1 - pos; d[i] = (d[i] + delta + 10) % 10; return Number(d.join('')); };
      if(form === 'ones'){
        const cross = R(10) < 6; let n, b, tries = 0;
        do { n = between(110, 889); b = between(1, 9); tries++; } while((up ? (n % 10 + b >= 10) : (n % 10 < b)) !== cross && tries < 300);
        const ans = up ? n + b : n - b;
        return { mode:'num', ask:`${pwFmt(n)} ${op} ${b} =`, ans, wrong:[W(wrapDigit(n, 0, up ? b : -b), 'noCross'), W(up ? n + b * 10 : n - b * 10, 'wrongDigit'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')],
          say:`${n} ${op} ${b}`, vars:{ form, n, b, op, up:up ? 1 : 0, ans } };
      }
      if(form === 'tens'){
        const cross = R(10) < 6; let n, t, tries = 0;
        do { n = between(110, 889); t = between(1, 9) * 10; tries++; } while((up ? (n % 100 + t >= 100) : (n % 100 < t)) !== cross && tries < 300);
        const ans = up ? n + t : n - t;
        return { mode:'num', ask:`${n} ${op} ${t} =`, ans, wrong:[W(wrapDigit(n, 1, up ? t / 10 : -t / 10), 'noCross'), W(up ? n + t / 10 : n - t / 10, 'wrongDigit'), W(ans + 10, 'countSlip'), W(ans - 10, 'countSlip')],
          say:`${n} ${op} ${t}`, vars:{ form, n, t, op, up:up ? 1 : 0, ans } };
      }
      if(form === 'hundreds'){
        const h = between(1, 5) * 100, n = up ? between(101, 999 - h) : between(h + 10, 999), ans = up ? n + h : n - h;
        return { mode:'num', ask:`${n} ${op} ${h} =`, ans, wrong:[W(up ? n + h / 10 : n - h / 10, 'wrongDigit'), W(ans + 100, 'countSlip'), W(ans - 100, 'countSlip'), W(up ? n + h * 10 : n - h * 10, 'wrongDigit')],
          say:`${n} ${op} ${h}`, vars:{ form, n, h, op, up:up ? 1 : 0, ans } };
      }
      /* adjust: add or subtract a number just under a multiple of ten, a hundred or a thousand */
      const ks = arr(p.ks).length ? arr(p.ks) : [9, 19, 99, 199], k = pick(ks), max = Number(p.max) || 999, near = k + 1;
      const a = up ? between(Math.floor(max / 10) + 1, max - near - 1) : between(near + 11, max), ans = up ? a + k : a - k;
      const wrong = up ? [W(ans + 1, 'forgotAdjust'), W(ans + 2, 'wrongWayAdjust'), W(ans - 1, 'countSlip')] : [W(ans - 1, 'forgotAdjust'), W(ans - 2, 'wrongWayAdjust'), W(ans + 1, 'countSlip')];
      return { mode:'num', ask:`${pwFmt(a)} ${op} ${pwFmt(k)} =`, ans, wrong, say:`${pwFmt(a)} ${op} ${pwFmt(near)} ${up ? '−' : '+'} 1`, vars:{ form:'adjust', a, k, near, op, up:up ? 1 : 0, back:up ? 'take away' : 'give back', first:up ? 'Add' : 'Take away', ans } };
    },
    columnAdd(p){
      const D = pick(arr(p.digits).length ? arr(p.digits) : [3]), regroup = p.regroup || 'any', uneq = !!p.unequal;
      const Db = uneq && R(2) === 0 && D > 2 ? D - between(1, Math.min(2, D - 2)) : D;
      const cap = Math.pow(10, D) - 1;
      let a = 0, b = 0;
      if(regroup === 'none'){
        const xa = [], xb = [];
        for(let i = 0; i < D; i++){
          const leadA = i === D - 1, leadB = i === Db - 1;
          const da = leadA ? between(1, leadB ? 8 : 9) : between(0, 9);
          const db = i >= Db ? 0 : between(leadB ? 1 : 0, 9 - da);
          xa.push(da); xb.push(db);
        }
        a = Number(xa.reverse().join('')); b = Number(xb.reverse().join(''));
      } else {
        let tries = 0;
        do {
          a = between(Math.pow(10, D - 1), cap); b = between(Math.pow(10, Db - 1), Math.pow(10, Db) - 1); tries++;
        } while(!(a + b <= cap && (regroup === 'any' || carries(a, b) >= 1)) && tries < 800);
      }
      const ans = a + b, aO = a % 10, bO = b % 10;
      const wrong = [W(noCarry(a, b), 'noCarry'), W(ans + 10, 'extraCarry')];
      if(Db < D) wrong.unshift(W(a + b * Math.pow(10, D - Db), 'misaligned'));
      wrong.push(W(ans + 100, 'countSlip'), W(ans - 10, 'countSlip'));
      return { mode:'num', ask:'Work it out. Use paper if it helps!', vis:{ column:[String(a), `+ ${b}`] }, ans, wrong, say:`${pwFmt(a)} + ${pwFmt(b)}`,
        vars:{ a, b, aO, bO, onesSum:aO + bO, carries:carries(a, b), ans, D, Db } };
    },
    columnSub(p){
      const D = pick(arr(p.digits).length ? arr(p.digits) : [3]), regroup = p.regroup || 'any', uneq = !!p.unequal;
      const Db = uneq && R(2) === 0 && D > 2 ? D - between(1, Math.min(2, D - 2)) : D;
      let a = 0, b = 0, tries = 0, ok = false;
      do {
        a = between(Math.pow(10, D - 1), Math.pow(10, D) - 1);
        if(regroup === 'zero' && D >= 3){ const pos = between(1, D - 2); const s = dg(a).reverse(); s[pos] = 0; a = Number(s.reverse().join('')); }
        b = between(Math.pow(10, Db - 1), Math.min(Math.pow(10, Db) - 1, a - 1));
        tries++;
        const ex = exchanges(a, b);
        ok = b >= 1 && b < a && (regroup === 'any' || (regroup === 'none' && ex.n === 0) || (regroup === 'some' && ex.n >= 1) || (regroup === 'zero' && ex.chain));
      } while(!ok && tries < 3000);
      const ans = a - b, aO = a % 10, bO = b % 10, ex = exchanges(a, b);
      const wrong = [W(subSlip(a, b, 'big'), 'smallFromBig'), W(subSlip(a, b, 'keep'), 'noExchange'), W(a + b, 'wrongOp'), W(ans + 10, 'countSlip'), W(ans - 10, 'countSlip')];
      return { mode:'num', ask:'Work it out. Use paper if it helps!', vis:{ column:[String(a), `− ${b}`] }, ans, wrong, say:`${pwFmt(a)} − ${pwFmt(b)}`,
        vars:{ a, b, aO, bO, exch:ex.n, chain:ex.chain ? 1 : 0, ans, D, Db } };
    },
    estimateCheck(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['estimate', 'inverse']);
      if(form === 'estimate'){
        const r = pick(arr(p.rounds).length ? arr(p.rounds) : [100]), up = R(2) === 0;
        let a, b, ra, rb, est, floorEst, tries = 0;
        do {
          a = between(r * 2, r * 9 - 1); b = between(r * 2, r * 9 - 1);
          if(!up && b > a){ const t = a; a = b; b = t; }
          ra = roundTo(a, r); rb = roundTo(b, r);
          est = up ? ra + rb : ra - rb;
          floorEst = up ? Math.floor(a / r) * r + Math.floor(b / r) * r : Math.floor(a / r) * r - Math.floor(b / r) * r;
          tries++;
        } while((a % r === 0 || b % r === 0 || est <= 0 || floorEst === est || floorEst <= 0 || (up && a + b > 9999)) && tries < 800);
        const op = up ? '+' : '−';
        const third = [est + r, est - r, est + 2 * r, est - 2 * r].find(v => v > 0 && v !== est && v !== floorEst);
        return { mode:'choice', ask:`Round to the nearest ${rname(r)}. Which is the best estimate for ${pwFmt(a)} ${op} ${pwFmt(b)}?`, ans:String(est), choices:shuffle([String(est), String(floorEst), String(third)]),
          wrong:[W(String(floorEst), 'wrongRound'), W(String(third), 'offByRound')], say:`${pwFmt(ra)} ${op} ${pwFmt(rb)}`, vars:{ form, a, b, op, r, rname:rname(r), ra, rb, est, ans:est } };
      }
      const up = R(2) === 0;
      let x, y; do { x = between(101, 899); y = between(101, 899); } while(x === y || x === 2 * y || y === 2 * x);
      const total = x + y;
      if(up){
        const ans = `${total} − ${y}`, w1 = `${total} + ${y}`, w2 = `${Math.max(x, y)} − ${Math.min(x, y)}`;
        return { mode:'choice', ask:`Which calculation checks that ${x} + ${y} = ${total}?`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'wrongOp'), W(w2, 'wrongInverse')],
          reveal:`${ans} should give ${x}.`, vars:{ form:'inverseAdd', x, y, total, ans } };
      }
      const big = total, ans = `${x} + ${y}`, w1 = `${big} + ${y}`, w2 = `${big} − ${y}`;
      return { mode:'choice', ask:`Which calculation checks that ${big} − ${y} = ${x}?`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'wrongOp'), W(w2, 'repeated')],
        reveal:`${ans} should give ${big}.`, vars:{ form:'inverseSub', x, y, total:big, ans } };
    },
    balance(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['adjustAdd', 'redistribute', 'missingEq']);
      const a = between(21, 68), b = between(21, 68), s = a + b, k = between(2, 9);
      if(form === 'adjustAdd'){
        const sgn = R(2) === 0 ? 1 : -1, nb = b + sgn * k, ans = s + sgn * k;
        return { mode:'num', ask:`${a} + ${b} = ${s}. So ${a} + ${nb} =`, ans, wrong:[W(s, 'noChange'), W(s - sgn * k, 'wrongWay'), W(s + 2 * sgn * k, 'twice')], say:`${s} ${sgn > 0 ? '+' : '−'} ${k}`,
          vars:{ form, a, b, s, k, nb, dir:sgn > 0 ? 'up' : 'down', ans } };
      }
      if(form === 'redistribute'){
        return { mode:'num', ask:`${a} + ${b} = ${s}. So ${a + k} + ${b - k} =`, ans:s, wrong:[W(s + k, 'onlyUp'), W(s - k, 'onlyDown'), W(s + 2 * k, 'onlyUp')], vars:{ form, a, b, s, k, na:a + k, nb:b - k, ans:s } };
      }
      if(form === 'missingEq'){
        return { mode:'num', ask:`${a} + ${b} = ${a + k} + ?`, ans:b - k, wrong:[W(b + k, 'wrongWay'), W(s, 'equalsMakes'), W(a + k, 'copied')], vars:{ form, a, b, s, k, na:a + k, ans:b - k } };
      }
      const big = between(61, 99), small = between(21, big - 11), d = big - small;
      if(form === 'constDiff'){
        return { mode:'num', ask:`${big} − ${small} = ${d}. So ${big + k} − ${small + k} =`, ans:d, wrong:[W(d + k, 'adjustedDifference'), W(d - k, 'adjustedDifference'), W(d + 2 * k, 'adjustedDifference')],
          vars:{ form, a:big, b:small, d, k, na:big + k, nb:small + k, ans:d } };
      }
      const kk = between(2, Math.min(9, d - 1));
      return { mode:'num', ask:`${big} − ${small} = ${d}. So ${big} − ${small + kk} =`, ans:d - kk, wrong:[W(d + kk, 'wrongWay'), W(d, 'noChange'), W(d - 2 * kk, 'twice')], say:`${d} − ${kk}`,
        vars:{ form:'subSubtrahend', a:big, b:small, d, k:kk, nb:small + kk, ans:d - kk } };
    },

    /* ================= FRACTIONS ================= */
    equalParts(p){
      const equal = R(2) === 0, n = between(2, 4);
      let w;
      if(equal) w = Array(n).fill(1);
      else if(n === 2) w = pick([[1, 2], [2, 3], [2, 1], [3, 5]]);
      else do { w = Array.from({ length:n }, () => between(1, 3)); } while(w.every(x => x === w[0]));
      return { mode:'choice', ask:'Is the shape split into equal parts?', vis:{ bars:[{ w, on:[0] }] }, ans:equal ? 'Yes' : 'No', choices:shuffle(['Yes', 'No']),
        wrong:[W(equal ? 'No' : 'Yes', equal ? 'equalAsUnequal' : 'unequalAsEqual')], reveal:equal ? 'Yes, the parts are all the same size.' : 'No, the parts are different sizes.', vars:{ n, equal:equal ? 1 : 0 } };
    },
    fracRead(p){
      const dens = arr(p.dens).length ? arr(p.dens) : [2, 3, 4], form = pick(arr(p.forms).length ? arr(p.forms) : ['shaded']);
      let d = pick(dens), k;
      if(p.nonUnit){ const big = dens.filter(x => x >= 3); d = pick(big.length ? big : [3]); k = between(2, d - 1); }
      else if(p.unit) k = 1;
      else k = between(1, d - 1);
      const ans = fr(k, d), flipped = fr(d, k);
      if(form === 'words'){
        const w2 = fr(k, d + 1);
        return { mode:'choice', ask:`Which fraction is “${frWords(k, d)}”?`, ans, choices:shuffle([ans, flipped, w2]), wrong:[W(flipped, 'flipped'), W(w2, 'neighbourDenominator')],
          reveal:`${ans} means ${frWords(k, d)}.`, vars:{ k, d, name:NAMES[d] || `${d}th`, parts:plural(d), words:frWords(k, d) } };
      }
      const w2 = d - k === k ? fr(k, d + 1) : fr(k, d - k), tag2 = d - k === k ? 'neighbourDenominator' : 'shadedOverUnshaded';
      const on = shuffle(range(d)).slice(0, k).sort((x, y) => x - y);
      return { mode:'choice', ask:'What fraction of the shape is shaded?', vis:{ bars:[{ w:Array(d).fill(1), on }] }, ans, choices:shuffle([ans, flipped, w2]),
        wrong:[W(flipped, 'flipped'), W(w2, tag2)], reveal:`${ans}: ${k} of the ${d} equal parts ${k === 1 ? 'is' : 'are'} shaded.`, vars:{ k, d, name:NAMES[d] || `${d}th`, parts:plural(d), unshaded:d - k, isare:k === 1 ? 'is' : 'are' } };
    },
    fracOfSet(p){
      const dens = arr(p.dens).length ? arr(p.dens) : [2, 4], d = pick(dens);
      const wantNon = !p.unit && d >= 3 && Math.random() < (p.mix == null ? 0.5 : Number(p.mix));
      const k = wantNon ? between(2, d - 1) : 1, m = between(1, Number(p.maxPart) || 10), whole = d * m, ans = k * m;
      const wrong = [W(d, 'numeralAsAnswer'), W(whole - ans, 'otherPart'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')];
      if(k > 1) wrong.unshift(W(m, 'onePart'));
      return { mode:'num', ask:`${fr(k, d)} of ${pwFmt(whole)} =`, vis:{ bars:[{ w:Array(d).fill(1), on:range(k), cap:`The whole is ${pwFmt(whole)}` }] }, ans, wrong,
        say:`${pwFmt(whole)} ÷ ${d}${k > 1 ? ` × ${k}` : ''}`, vars:{ k, d, m, whole, ans, name:NAMES[d] || `${d}th`, parts:plural(d) } };
    },
    fracCompare(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['unit']);
      const bar = (n, d) => ({ w:Array(d).fill(1), on:range(n), cap:fr(n, d) });
      const big = Math.random() < 0.7, word = big ? 'bigger' : 'smaller';
      const val = x => x[0] / x[1];
      if(form === 'equalHalf'){
        const [a, b, c, d] = pick(arr(p.pairs).length ? arr(p.pairs) : [[1, 2, 2, 4]]);
        const A = fr(a, b), B = fr(c, d), flip = R(2) === 0, first = flip ? B : A, second = flip ? A : B, eq = 'They are equal';
        return { mode:'choice', ask:`Which is bigger: ${first} or ${second}? Or are they equal?`, vis:{ bars:flip ? [bar(c, d), bar(a, b)] : [bar(a, b), bar(c, d)] }, ans:eq, choices:shuffle([first, second, eq]),
          wrong:[W(B, 'biggerNumbers'), W(A, 'wrongWay')], reveal:`${A} and ${B} are the same size.`, vars:{ A, B, a, b, c, d } };
      }
      if(form === 'half'){
        const d = between(3, 12), evenEq = d % 2 === 0 && R(100) < 22;
        const n = evenEq ? d / 2 : (() => { let k; do { k = between(1, d - 1); } while(2 * k === d); return k; })();
        const ans = 2 * n > d ? 'more than 1/2' : 2 * n < d ? 'less than 1/2' : 'equal to 1/2';
        const all = ['more than 1/2', 'less than 1/2', 'equal to 1/2'];
        return { mode:'choice', ask:`Is ${fr(n, d)} more than, less than or equal to 1/2?`, ans, choices:shuffle(all), wrong:all.filter(x => x !== ans).map(x => W(x, 'wrongSide')),
          reveal:`${fr(n, d)} is ${ans}.`, vars:{ n, d, double:2 * n } };
      }
      let x, y, tag = 'wrongWay', pics = true;
      if(form === 'unit'){ const d1 = between(2, 10); let d2; do { d2 = between(2, 10); } while(d2 === d1); x = [1, d1]; y = [1, d2]; tag = 'biggerDenominator'; }
      else if(form === 'sameDen'){ const d = between(4, 10); const n1 = between(1, d - 1); let n2; do { n2 = between(1, d - 1); } while(n2 === n1); x = [n1, d]; y = [n2, d]; }
      else if(form === 'sameNum'){ const n = between(2, 4); const d1 = between(n + 1, 10); let d2; do { d2 = between(n + 1, 10); } while(d2 === d1); x = [n, d1]; y = [n, d2]; tag = 'biggerDenominator'; }
      else {
        pics = false;
        do { const d1 = between(3, 12), d2 = between(3, 12); x = [between(1, d1 - 1), d1]; y = [between(1, d2 - 1), d2]; } while(x[1] === y[1] || x[0] * y[1] === y[0] * x[1]);
      }
      const bigger = val(x) > val(y) ? x : y, smaller = bigger === x ? y : x, askBigger = form === 'unrelated' ? true : big;
      const ans = fr(...(askBigger ? bigger : smaller)), other = fr(...(askBigger ? smaller : bigger));
      return { mode:'choice', ask:`Which is ${askBigger ? 'bigger' : 'smaller'}: ${fr(...x)} or ${fr(...y)}?`, vis:pics ? { bars:[bar(...x), bar(...y)] } : null, ans, choices:shuffle([fr(...x), fr(...y)]),
        wrong:[W(other, tag)], reveal:`${ans} is the ${askBigger ? 'bigger' : 'smaller'} one.`, vars:{ n1:x[0], d1:x[1], n2:y[0], d2:y[1], word:askBigger ? 'bigger' : 'smaller', ans } };
    },
    fracEquiv(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['scale']);
      if(form === 'simplify'){
        const bases = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [1, 6], [5, 6], [3, 8], [5, 8], [2, 7], [4, 5]];
        const [a, b] = pick(bases), g = pick(arr(p.gs).length ? arr(p.gs) : [2, 3, 4, 5, 6]), n = a * g, d = b * g, ans = fr(a, b);
        const spf = [2, 3, 5].find(f => g % f === 0), cands = [];
        if(spf && spf < g) cands.push([fr(n / spf, d / spf), 'notSimplest']);
        cands.push([fr(a, d), 'divideTopOnly'], [fr(n, b), 'divideBottomOnly']);
        const wr = cands.filter(c => c[0] !== ans).slice(0, 2);
        return { mode:'choice', ask:`Write ${fr(n, d)} in its simplest form.`, ans, choices:shuffle([ans, ...wr.map(w => w[0])]), wrong:wr.map(w => W(w[0], w[1])), reveal:`${fr(n, d)} = ${ans}.`, vars:{ n, d, a, b, g } };
      }
      const bases = arr(p.bases).length ? arr(p.bases) : [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 6], [5, 6]];
      const [a, b] = pick(bases), m = pick(arr(p.ms).length ? arr(p.ms) : [2, 3, 4]), D = b * m, ans = a * m;
      return { mode:'num', ask:`${fr(a, b)} = ?/${D}`, vis:p.pic ? { bars:[{ w:Array(b).fill(1), on:range(a), cap:fr(a, b) }, { w:Array(D).fill(1), on:[], cap:`?/${D}` }] } : null, ans,
        wrong:[W(a + (D - b), 'addedSame'), W(D, 'denominatorCopy'), W(a, 'kept'), W(ans + 1, 'countSlip')], reveal:`${a}/${b} = ${ans}/${D}.`, vars:{ a, b, m, D, ans } };
    },
    mixedImproper(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['toImproper']);
      if(form === 'toMixed'){
        const d = between(3, 8), w = between(2, 5), r = between(1, d - 1), N = w * d + r, ans = mix(w, r, d);
        const w1 = mix(w - 1, r + d, d), swapOk = w < d && r !== w, w2 = swapOk ? mix(r, w, d) : mix(w + 1, r, d), tag2 = swapOk ? 'swappedParts' : 'wholeOff';
        return { mode:'choice', ask:`Write ${fr(N, d)} as a mixed number.`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'leaveImproper'), W(w2, tag2)],
          reveal:`${fr(N, d)} = ${ans}.`, vars:{ N, d, w, r, parts:plural(d), wd:w * d } };
      }
      const d = between(2, 8), w = between(1, p.pic ? 3 : 4), n = between(1, d - 1), ans = w * d + n;
      const vis = p.pic ? { bars:[...range(w).map(() => ({ w:Array(d).fill(1), on:range(d) })), { w:Array(d).fill(1), on:range(n) }] } : null;
      return { mode:'num', ask:`${mix(w, n, d)} = ?/${d}`, vis, ans, wrong:[W(w + n, 'addedWhole'), W(w * d, 'forgotNumerator'), W(ans + d, 'countSlip'), W(ans - 1, 'countSlip')],
        say:`${w} × ${d} + ${n}`, vars:{ w, n, d, wd:w * d, parts:plural(d), ans } };
    },
    fracAddSub(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['same']);
      if(form === 'same'){
        const d = between(4, 12), a = between(1, d - 2), b = between(1, d - 1 - a), ans = fr(a + b, d), w1 = fr(a + b, d + d), w2 = fr(d, a + b);
        return { mode:'choice', ask:`${fr(a, d)} + ${fr(b, d)} =`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'addedAcross'), W(w2, 'flipped')], say:`${fr(a, d)} + ${fr(b, d)}`,
          vars:{ form:'same', a, b, d, parts:plural(d), sum:a + b, ans } };
      }
      if(form === 'sub'){
        const d = between(4, 12), a = between(3, d - 1), b = between(1, a - 1), ans = fr(a - b, d), w1 = fr(a + b, d), w2 = fr(d, a - b);
        return { mode:'choice', ask:`${fr(a, d)} − ${fr(b, d)} =`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'wrongOp'), W(w2, 'flipped')], say:`${fr(a, d)} − ${fr(b, d)}`,
          vars:{ form:'sub', a, b, d, parts:plural(d), diff:a - b, ans } };
      }
      if(form === 'toWhole'){
        const d = between(4, 12), a = between(1, d - 1), ans = d - a;
        return { mode:'num', ask:`${fr(a, d)} + ?/${d} = 1`, ans, wrong:[W(a, 'copied'), W(d, 'denominator'), W(ans + 1, 'countSlip'), W(ans - 1, 'countSlip')], say:`${d} − ${a}`, vars:{ form:'toWhole', a, d, parts:plural(d), ans } };
      }
      if(form === 'mixed'){
        const d = between(4, 10), a = between(1, d - 2), b = between(1, d - 1 - a), w1 = between(1, 3), w2 = between(1, 2);
        const ans = mix(w1 + w2, a + b, d), x1 = mix(w1 + w2, a + b, d + d), x2 = mix(Math.max(w1, w2), a + b, d);
        return { mode:'choice', ask:`${mix(w1, a, d)} + ${mix(w2, b, d)} =`, ans, choices:shuffle([ans, x1, x2]), wrong:[W(x1, 'addedAcross'), W(x2, 'forgotWhole')],
          reveal:`${mix(w1, a, d)} + ${mix(w2, b, d)} = ${ans}.`, vars:{ form:'mixed', a, b, d, w1, w2, parts:plural(d), ans } };
      }
      /* unlike denominators, where one denominator is a multiple of the other */
      const sub = form === 'unlikeSub';
      let d1, m, a, b, tries = 0, num;
      do {
        d1 = pick([2, 3, 4, 5]); m = pick([2, 3, 4]); a = between(1, d1 - 1); b = between(1, d1 * m - 1); tries++;
        num = sub ? a * m - b : a * m + b;
      } while((d1 * m > 12 || (sub ? num < 1 : num >= d1 * m) || gcd(num, d1 * m) !== 1 || (sub && (a === b))) && tries < 800);
      const d2 = d1 * m, ans = fr(num, d2);
      if(sub){
        const w1 = fr(a * m + b, d2); let w2 = fr(Math.abs(a - b), d2), t2 = 'keptDenominator'; if(w2 === ans) { w2 = fr(d2, num); t2 = 'flipped'; }
        return { mode:'choice', ask:`${fr(a, d1)} − ${fr(b, d2)} =`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'wrongOp'), W(w2, t2)], say:`${fr(a * m, d2)} − ${fr(b, d2)}`,
          vars:{ form:'unlike', a, b, d1, d2, m, am:a * m, parts:plural(d2), ans } };
      }
      const w1 = fr(a + b, d1 + d2), w2 = fr(a + b, d2);
      return { mode:'choice', ask:`${fr(a, d1)} + ${fr(b, d2)} =`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'addedAcross'), W(w2, 'keptDenominator')], say:`${fr(a * m, d2)} + ${fr(b, d2)}`,
        vars:{ form:'unlike', a, b, d1, d2, m, am:a * m, parts:plural(d2), ans } };
    },
    fracDec(p){
      const form = pick(arr(p.forms).length ? arr(p.forms) : ['toDecimal']);
      if(form === 'toFraction'){
        const [dec, n, d] = pick([['0.5', 1, 2], ['0.25', 1, 4], ['0.75', 3, 4], ['0.2', 1, 5], ['0.4', 2, 5], ['0.6', 3, 5], ['0.3', 3, 10], ['0.7', 7, 10]]);
        const digits = dec.slice(2), ans = fr(n, d), w1 = `1/${digits}`, w2 = `${digits}/${digits.length === 1 ? 100 : 1000}`, raw = `${digits}/${digits.length === 1 ? 10 : 100}`;
        return { mode:'choice', ask:`${dec} as a fraction is…`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'oneOver'), W(w2, 'placeSlip')], reveal:`${dec} = ${raw}${raw === ans ? '' : ` = ${ans}`}.`, vars:{ dec, n, d, raw, form } };
      }
      const [n, d, dec] = pick([[1, 2, '0.5'], [1, 4, '0.25'], [3, 4, '0.75'], [1, 5, '0.2'], [2, 5, '0.4'], [3, 5, '0.6'], [4, 5, '0.8'], [1, 10, '0.1'], [3, 10, '0.3'], [7, 10, '0.7']]);
      const w1 = `${n}.${d}`, w2 = `0.${n}${d}`;
      const eq = d === 10 ? `${n}/10` : d === 4 ? `${n * 25}/100` : d === 5 ? `${n * 2}/10` : `${n * 5}/10`;
      const equiv = d === 10 ? `${fr(n, d)} is ${n} tenths` : `${fr(n, d)} = ${eq}`;
      return { mode:'choice', ask:`${fr(n, d)} as a decimal is…`, ans:dec, choices:shuffle([dec, w1, w2]), wrong:[W(w1, 'digitsCopied'), W(w2, 'digitsAfterPoint')], reveal:`${equiv}, so it is ${dec}.`, vars:{ n, d, dec, equiv, form } };
    },
    fracTimes(p){
      const within = p.within !== false && R(100) < (p.over ? 0 : 100);
      let w, k, d, tries = 0;
      do { d = between(3, 9); k = between(1, d - 1); w = between(2, 6); tries++; } while(((within ? w * k >= d : w * k <= d) || (w * k) % d === 0) && tries < 800);
      const ans = fr(w * k, d), w1 = fr(w * k, w * d), w2 = fr(k, w * d);
      return { mode:'choice', ask:`${w} × ${fr(k, d)} =`, ans, choices:shuffle([ans, w1, w2]), wrong:[W(w1, 'multipliedBoth'), W(w2, 'denominatorMultiplied')], say:`${w} × ${fr(k, d)}`,
        vars:{ w, k, d, wk:w * k, parts:plural(d), lot:frWords(k, d), ans } };
    },
  };

  /* ---------- Hints: what a child sees with no step-specific hint ---------- */
  const D = {
    bonds: q => q.vars.form === 'minus' ? `Take ${q.vars.a} away from ${q.vars.T}. Use the counters or your fingers if it helps.` : `Start at ${q.vars.a}. How many more do you need to count on to reach ${q.vars.T}?`,
    threeAdd: q => 'Look for two numbers that make 10 first. Add those, then add the last number.',
    bridge10: q => q.vars.form === 'add' ? `Make 10 first. ${q.vars.a} needs ${q.vars.toTen} more to reach 10.` : `Go back to 10 first: ${q.vars.top} − ${q.vars.down} = 10. How much more do you still need to take away?`,
    difference: q => q.vars.form === 'altogether' ? 'Put the two amounts together. Is that adding or taking away?' : 'Line the two amounts up side by side. How many more does the bigger one have?',
    tensOnes: q => ({ tens:`Only the tens digit changes. ${q.vars.n} is ${q.vars.nTens} tens and ${q.vars.n % 10} ones.`,
      ones:`Only the ones digit changes. The tens stay the same.`,
      cross:q.vars.up ? `Make the next ten first: ${q.vars.n} + ${q.vars.toTen} = ${q.vars.nextTen}. Then add the rest.` : (q.vars.down === 0 ? `${q.vars.n} is ${q.vars.lower} tens and 10 ones. Take ${q.vars.b} away from the 10 ones.` : `Go back to the ten first: ${q.vars.n} − ${q.vars.down} = ${q.vars.prevTen}. Then take away the rest.`) })[q.vars.form],
    twoDigitAdd: q => `Split ${q.vars.b} into ${q.vars.bTens} and ${q.vars.bO}. Add the tens, then the ones.${q.vars.cross ? ' The ones make a new ten.' : ''}`,
    twoDigitSub: q => `Take away the tens first: ${q.vars.a} − ${q.vars.bTens} = ${q.vars.afterTens}. Then take away ${q.vars.bO}.${q.vars.cross ? ' You will cross a ten, so go back to the ten first.' : ''}`,
    missingNumber: q => q.vars.form === 'whole' ? `The whole is made of ${q.vars.p1} and ${q.vars.p2}. Put the parts together.` : `The whole is ${q.vars.w}. One part is ${q.vars.p2}. What is the other part?`,
    mentalAdj: q => ({ ones:'Only the ones digit changes, unless you cross a ten. Check the tens digit.', tens:'Only the tens digit changes, unless you cross a hundred. Check the hundreds digit.',
      hundreds:'Only the hundreds digit changes. The tens and ones stay the same.',
      adjust:`${pwFmt(q.vars.k)} is just 1 less than ${pwFmt(q.vars.near)}. ${q.vars.first} ${pwFmt(q.vars.near)}, then ${q.vars.back} 1.` })[q.vars.form],
    columnAdd: q => `Start with the ones: ${q.vars.aO} + ${q.vars.bO} = ${q.vars.onesSum}.${q.vars.onesSum > 9 ? ' That makes a ten, so carry 1 to the tens column.' : ''} Then do the tens.`,
    columnSub: q => `Start with the ones. Can you take ${q.vars.bO} from ${q.vars.aO}? ${q.vars.aO >= q.vars.bO ? 'Yes, so take it away.' : (q.vars.chain ? 'Not yet. There is a zero next door, so look one column further along for something to exchange.' : 'Not yet, so exchange one ten for ten ones first.')}`,
    estimateCheck: q => ({ estimate:`Round each number to the nearest ${q.vars.rname}. Then add or take away the rounded numbers.`,
      inverseAdd:'Adding and taking away undo each other. Start from the total and take away one of the parts.',
      inverseSub:'Adding and taking away undo each other. Start from the answer and put back what was taken away.' })[q.vars.form],
    balance: q => ({ adjustAdd:`One number went ${q.vars.dir} by ${q.vars.k}. What happens to the total?`, redistribute:`One number went up by ${q.vars.k} and the other went down by ${q.vars.k}. What happens to the total?`,
      missingEq:`The first number went up by ${q.vars.k}. What must happen to the other number to keep both sides equal?`,
      constDiff:`Both numbers moved by the same amount. What happens to the gap between them?`,
      subSubtrahend:`You take away ${q.vars.k} more. What happens to what is left?` })[q.vars.form],
    equalParts: q => 'Do the parts look the same size? Imagine laying one on top of another.',
    fracRead: q => q.vars.words ? 'The bottom number is how many equal parts there are. The top number is how many we have.' : 'Count all the equal parts for the bottom number. Then count the shaded parts for the top number.',
    fracOfSet: q => `Share ${pwFmt(q.vars.whole)} equally into ${q.vars.d} groups. How many in each group?${q.vars.k > 1 ? ` Then take ${q.vars.k} of the groups.` : ''}`,
    fracCompare: q => q.vars.word ? (q.vars.d1 === q.vars.d2 ? 'The parts are the same size, so the one with more parts is bigger.' : (q.vars.n1 === 1 && q.vars.n2 === 1 ? 'The more parts a whole is cut into, the smaller each part is.' : (q.vars.n1 === q.vars.n2 ? 'You have the same number of parts. Which fraction has bigger parts?' : 'Is each fraction more or less than 1/2? Compare the top number with half of the bottom number.'))) : (q.vars.double != null ? `Double ${q.vars.n} is ${q.vars.double}. Compare it with ${q.vars.d}.` : 'Look at the pictures. Are the shaded parts the same amount?'),
    fracEquiv: q => q.vars.g ? `Find a number that goes into both ${q.vars.n} and ${q.vars.d}. Divide the top and the bottom by it.` : `The whole is now cut into ${q.vars.D} parts instead of ${q.vars.b}. Every part is cut into ${q.vars.m}, so do the same to the top number.`,
    mixedImproper: q => q.vars.N ? `How many whole ones can you make? Each whole needs ${q.vars.d} ${q.vars.parts}.` : `Each whole is ${q.vars.d} ${q.vars.parts}. How many ${q.vars.parts} in ${q.vars.w} wholes? Then add the extra.`,
    fracAddSub: q => ({ same:`The parts are all ${q.vars.parts}, so the bottom number stays the same. Just add the top numbers.`, sub:`The parts are all ${q.vars.parts}, so the bottom number stays the same. Just take away the top numbers.`,
      toWhole:`How many ${q.vars.parts} make a whole? Take away the ${q.vars.a} you already have.`, mixed:'Add the whole numbers, then add the fractions. The bottom number stays the same.',
      unlike:`Make the bottoms the same first. Change ${fr(q.vars.a, q.vars.d1)} into ${q.vars.parts}.` })[q.vars.form],
    fracDec: q => q.vars.form === 'toFraction' ? `Say it in tenths or hundredths: ${q.vars.dec} is ${q.vars.raw.replace('/', ' out of ')}. Can the fraction be made simpler?` : `Make the bottom number 10 or 100 first: ${q.vars.equiv}. Then say it as a decimal.`,
    fracTimes: q => `Think of ${q.vars.w} lots of ${q.vars.lot}. The size of the parts stays the same, so the bottom number does not change.`,
  };

  /* ---------- Worked step: shown after a second slip, so it gives more away ---------- */
  const K = {
    bonds: q => q.vars.form === 'minus' ? `${q.vars.T} − ${q.vars.a}: count back ${q.vars.a} from ${q.vars.T}, or think of the bond that goes with it.` : `${q.vars.a} + ${q.vars.ans} = ${q.vars.T}. What goes with ${q.vars.a}?`,
    threeAdd: q => `${q.vars.pair} = 10. Now 10 + ${q.vars.z}.`,
    bridge10: q => q.vars.form === 'add' ? `Split ${q.vars.b} into ${q.vars.toTen} and ${q.vars.rest}. ${q.vars.a} + ${q.vars.toTen} = 10, then 10 + ${q.vars.rest}.` : `Split ${q.vars.b} into ${q.vars.down} and ${q.vars.left}. ${q.vars.top} − ${q.vars.down} = 10, then 10 − ${q.vars.left}.`,
    difference: q => q.vars.form === 'altogether' ? `${q.vars.a} and ${q.vars.b} together: ${q.vars.a} + ${q.vars.b}.` : `The difference is the bigger take the smaller: ${q.vars.a} − ${q.vars.b}.`,
    tensOnes: q => ({ tens:`${q.vars.n} ${q.vars.op} ${q.vars.t}: change the tens digit by ${q.vars.tens}.`, ones:`${q.vars.n % 10} ${q.vars.op} ${q.vars.b} makes ${q.vars.up ? q.vars.n % 10 + q.vars.b : q.vars.n % 10 - q.vars.b} ones. The tens stay the same.`,
      cross:q.vars.up ? `${q.vars.n} + ${q.vars.toTen} = ${q.vars.nextTen}, then add ${q.vars.rest} more.` : (q.vars.down === 0 ? `10 − ${q.vars.b} = ${q.vars.bondLeft}, so ${q.vars.base} + ${q.vars.bondLeft}.` : `${q.vars.n} − ${q.vars.down} = ${q.vars.prevTen}, then take away ${q.vars.left} more.`) })[q.vars.form],
    twoDigitAdd: q => `${q.vars.a} + ${q.vars.bTens} = ${q.vars.a + q.vars.bTens}. Then add ${q.vars.bO} more.`,
    twoDigitSub: q => `${q.vars.a} − ${q.vars.bTens} = ${q.vars.afterTens}. Then take away ${q.vars.bO} more.`,
    missingNumber: q => q.vars.form === 'whole' ? `${q.vars.p1} + ${q.vars.p2}.` : `${q.vars.w} − ${q.vars.p2}.`,
    mentalAdj: q => q.vars.form === 'adjust' ? `${pwFmt(q.vars.a)} ${q.vars.op} ${pwFmt(q.vars.near)} = ${pwFmt(q.vars.up ? q.vars.a + q.vars.near : q.vars.a - q.vars.near)}. Now ${q.vars.back} 1.` : 'Change just that one digit. Watch out if it goes past 9 or below 0.',
    columnAdd: q => `Ones: ${q.vars.aO} + ${q.vars.bO} = ${q.vars.onesSum}. ${q.vars.onesSum > 9 ? `Write ${q.vars.onesSum % 10}, carry 1.` : `Write ${q.vars.onesSum}.`} ${q.vars.D <= 2 ? 'Then the tens.' : q.vars.D === 3 ? 'Then the tens, then the hundreds.' : 'Then the tens, hundreds and thousands.'}`,
    columnSub: q => q.vars.aO >= q.vars.bO && !q.vars.chain ? `Ones: ${q.vars.aO} − ${q.vars.bO} = ${q.vars.aO - q.vars.bO}. Then move to the tens.` : (q.vars.chain ? 'A zero has no ten to give. Exchange from the next column along, pass a ten down, then exchange again.' : `Exchange one ten for ten ones: ${q.vars.aO + 10} − ${q.vars.bO} = ${q.vars.aO + 10 - q.vars.bO}. The tens column is now one less.`),
    estimateCheck: q => q.vars.form === 'estimate' ? `${pwFmt(q.vars.a)} is about ${pwFmt(q.vars.ra)} and ${pwFmt(q.vars.b)} is about ${pwFmt(q.vars.rb)}.` : (q.vars.form === 'inverseAdd' ? `${q.vars.x} + ${q.vars.y} = ${q.vars.total}, so ${q.vars.total} − ${q.vars.y} should give ${q.vars.x}.` : `${q.vars.total} − ${q.vars.y} = ${q.vars.x}, so ${q.vars.x} + ${q.vars.y} should give ${q.vars.total}.`),
    balance: q => ({ adjustAdd:`${q.vars.s} is the old total. One number went ${q.vars.dir} by ${q.vars.k}, so the total goes ${q.vars.dir} by ${q.vars.k} too.`, redistribute:`We took ${q.vars.k} from one number and gave it to the other, so nothing was lost.`,
      missingEq:`The left side has ${q.vars.s}. Both sides must be equal.`, constDiff:`Both numbers went up by ${q.vars.k}, so the gap between them stays the same.`,
      subSubtrahend:`Taking away more leaves less. ${q.vars.d} − ${q.vars.k}.` })[q.vars.form],
    equalParts: q => 'Equal means exactly the same size. Compare each part with the others.',
    fracRead: q => q.vars.words ? `“${q.vars.words}”: ${q.vars.k} is the number of parts we have, and ${q.vars.d} is the number of equal parts in the whole.` : `There are ${q.vars.d} equal parts in all, and ${q.vars.k} of them ${q.vars.k === 1 ? 'is' : 'are'} shaded.`,
    fracOfSet: q => `${pwFmt(q.vars.whole)} ÷ ${q.vars.d} = ${q.vars.m}.${q.vars.k > 1 ? ` ${q.vars.k} × ${q.vars.m} = ${q.vars.ans}.` : ''}`,
    fracCompare: q => q.vars.A ? `${q.vars.A} and ${q.vars.B} are the same size, even though they look different.` : (q.vars.double != null ? `Half of ${q.vars.d} is ${q.vars.d / 2}. ${q.vars.n} is ${2 * q.vars.n > q.vars.d ? 'more than' : 2 * q.vars.n < q.vars.d ? 'less than' : 'equal to'} that.` : `The ${q.vars.word} fraction is ${q.vars.ans}.`),
    fracEquiv: q => q.vars.g ? `${q.vars.n} ÷ ${q.vars.g} and ${q.vars.d} ÷ ${q.vars.g}.` : `${q.vars.a} × ${q.vars.m} = ${q.vars.ans}. Both numbers are multiplied by ${q.vars.m}.`,
    mixedImproper: q => q.vars.N ? `${q.vars.N} ÷ ${q.vars.d} = ${q.vars.w} with ${q.vars.r} left over.` : `${q.vars.w} × ${q.vars.d} = ${q.vars.wd}. Then add ${q.vars.n}.`,
    fracAddSub: q => ({ same:`Count in ${q.vars.parts}: ${q.vars.a} + ${q.vars.b} = ${q.vars.sum}, so ${q.vars.sum} ${q.vars.parts}.`, sub:`Count in ${q.vars.parts}: ${q.vars.a} − ${q.vars.b} = ${q.vars.diff}, so ${q.vars.diff} ${q.vars.parts}.`,
      toWhole:`A whole is ${q.vars.d} ${q.vars.parts}. ${q.vars.d} − ${q.vars.a}.`, mixed:`Add the wholes: ${q.vars.w1} + ${q.vars.w2}. Then add the parts: ${q.vars.a} + ${q.vars.b} ${q.vars.parts}.`,
      unlike:`Change to ${q.vars.parts}: ${fr(q.vars.a, q.vars.d1)} = ${fr(q.vars.am, q.vars.d2)}.` })[q.vars.form],
    fracDec: q => q.vars.form === 'toFraction' ? `${q.vars.dec} = ${q.vars.raw}. Divide the top and bottom by the same number to simplify.` : `${q.vars.equiv}, so the decimal is ${q.vars.dec}.`,
    fracTimes: q => `${q.vars.w} × ${q.vars.k} = ${q.vars.wk}, so there are ${q.vars.wk} ${q.vars.parts}. The bottom number stays ${q.vars.d}.`,
  };

  /* ---------- Register the kinds ---------- */
  Object.keys(G).forEach(k => { if(!PATHWAY_KINDS.includes(k)) PATHWAY_KINDS.push(k); });
  Object.assign(PW_GEN, G);
  Object.assign(PW_DEFAULT_HINT, D);
  Object.assign(PW_WORKED, K);

  /* ---------- Pictures ---------- */
  const prevVis = window.pwVisHTML;
  const numFlex = (x, other, whole) => /^\d+$/.test(String(x)) ? Math.max(2, Number(x)) : (/^\d+$/.test(String(whole)) && /^\d+$/.test(String(other)) ? Math.max(2, Number(whole) - Number(other)) : (/^\d+$/.test(String(other)) ? Math.max(2, Number(other)) : 10));
  window.pwVisHTML = function(q){
    const v = q.vis || {};
    if(v.frame){
      const on = Number(v.frame[0]), total = Number(v.frame[1]), n = Math.ceil(total / 10); let left = on;
      const frames = range(n).map(() => `<span class="kx-frame">${range(10).map(() => `<i class="${left-- > 0 ? 'on' : ''}"></i>`).join('')}</span>`).join('');
      return `<div class="kx-frames" role="img" aria-label="${on} counters on a frame of ${total}">${frames}</div>`;
    }
    if(v.pwm){
      const ps = arr(v.pwm.parts), whole = v.pwm.whole;
      const seg = (x, i) => `<span class="${x === '?' ? 'kx-q' : ''}" style="flex:${numFlex(x, ps[1 - i], whole)}">${esc(pwFmt(x))}</span>`;
      return `<div class="kx-pwm" role="img" aria-label="part part whole bar"><div class="kx-whole ${whole === '?' ? 'kx-q' : ''}">${esc(pwFmt(whole))}</div><div class="kx-parts">${ps.map(seg).join('')}</div></div>`;
    }
    if(v.cmp){
      const rows = arr(v.cmp), max = Math.max(...rows.map(r => r.n));
      return `<div class="kx-cmp" role="img" aria-label="two bars to compare">${rows.map(r => `<div class="kx-cmp-row"><span class="kx-lab">${esc(r.l)}</span><span class="kx-bar" style="width:${Math.round(r.n / max * 100)}%"><b>${esc(r.n)}</b></span></div>`).join('')}</div>`;
    }
    if(v.bars){
      return `<div class="kx-bars">${arr(v.bars).map(b => {
        const ws = arr(b.w), on = arr(b.on);
        return `<div class="kx-fbar" role="img" aria-label="${ws.length} parts, ${on.length} shaded">${b.cap ? `<span class="kx-cap">${esc(b.cap)}</span>` : ''}<span class="kx-row">${ws.map((x, i) => `<i class="${on.includes(i) ? 'on' : ''}" style="flex:${x}"></i>`).join('')}</span></div>`;
      }).join('')}</div>`;
    }
    return prevVis(q);
  };

  const prevReveal = window.pwReveal;
  window.pwReveal = function(q){ return q && q.reveal ? `${q.reveal} Here's a new one to try.` : prevReveal(q); };

  const css = document.createElement('style');
  css.textContent = `
.kx-frames{ display:flex; gap:14px; justify-content:center; flex-wrap:wrap; margin:8px 0; }
.kx-frame{ display:grid; grid-template-columns:repeat(5,34px); grid-auto-rows:34px; gap:4px; padding:6px; background:#fff; border:3px solid var(--ink); border-radius:12px; }
.kx-frame i{ border-radius:50%; background:#f6efdc; border:2px solid #e6d8b8; }
.kx-frame i.on{ background:var(--salmon); border-color:var(--flame-dark); }
.kx-pwm{ width:min(440px,92%); margin:8px auto; font-family:var(--disp); font-weight:700; }
.kx-whole{ border:3px solid var(--ink); border-radius:12px 12px 0 0; text-align:center; padding:6px; background:#fff; font-size:1.5rem; }
.kx-parts{ display:flex; border:3px solid var(--ink); border-top:0; border-radius:0 0 12px 12px; overflow:hidden; }
.kx-parts span{ padding:8px 4px; text-align:center; font-size:1.4rem; background:var(--sunshine); }
.kx-parts span + span{ border-left:3px solid var(--ink); background:#fff3d4; }
.kx-q{ color:var(--flame-dark); }
.kx-cmp{ width:min(460px,94%); margin:8px auto; display:grid; gap:6px; font-family:var(--disp); font-weight:700; }
.kx-cmp-row{ display:grid; grid-template-columns:84px 1fr; align-items:center; gap:8px; }
.kx-lab{ text-align:right; font-size:1rem; text-transform:capitalize; }
.kx-bar{ display:block; min-width:36px; background:var(--salmon); border:3px solid var(--ink); border-radius:10px; padding:4px 10px; text-align:right; font-size:1.2rem; }
.kx-bars{ display:grid; gap:10px; justify-items:center; margin:8px 0; }
.kx-fbar{ width:min(420px,94%); }
.kx-cap{ display:block; text-align:left; font-family:var(--disp); font-weight:700; font-size:1rem; margin:0 0 3px 2px; color:var(--ink-soft); }
.kx-row{ display:flex; border:3px solid var(--ink); border-radius:10px; overflow:hidden; height:44px; background:#fff; }
.kx-row i{ border-left:3px solid var(--ink); background:#fffbf3; }
.kx-row i:first-child{ border-left:0; }
.kx-row i.on{ background:var(--salmon); }
`;
  document.head.appendChild(css);
  window.KINDS_LOADED = true;
})();
