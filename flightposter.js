/* Fab flightpath poster: the proud page (proud.js) for a child's flightpath.
   A flightpath has no "end": a child climbs a step by getting three right, and chooses when to move on. So the poster is about
   what they can do NOW: the steps they have climbed, one or two of their own right answers for each, the treasures they found
   and the stars they earned. It never shows slips, tries or anyone else, and only ever a Fab code, never a name.

   The lesson engine (index.html) calls:
     FabFlightPoster.note(kid, q)      a right "You do" answer: keep it as one of this step's best answers
     FabFlightPoster.open(s, kid)      show the poster over the lesson (My flightpath, or straight after a step is climbed)
     FabFlightPoster.html(s, kid, pack) just the poster markup
   kid.best = { stepIndex: [ { q, a, j } ] } travels with the child's flightpath, so it is kept small: text only, two per step.   window.FabFlightPoster */
(function(){
  'use strict';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  /* live Spaces can hand a list back as an object with number keys */
  const arr = v => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.keys(v).sort((a, b) => a - b).map(k => v[k]) : []);
  const show = v => { const s = String(v); return /^\d{4,}$/.test(s) ? Number(s).toLocaleString('en-GB') : s; };
  const KEEP = 2, THEME = { maths:'maths', english:'english', phonics:'english', science:'science' };

  /* One right answer as a line a child can read back.  j: 1 = the answer finishes the sum ("20 × 1 =" + 20) · 2 = it fills the "?" ·
     3 = it carries on the pattern ("5, 10, 15, …") · 0 = a question and its answer, or a sentence with no answer part */
  function line(q){
    if(!q || q.mode === 'orient' || q.ans == null) return null;
    const ask = String(q.ask || '').replace(/\s+/g, ' ').trim(), ans = show(q.ans), say = String(q.say || '');
    if(!ask) return null;
    /* a question about a picture only makes sense with its picture: keep the small ones (fraction bars, equal groups), leave the rest out */
    const v = q.vis && typeof q.vis === 'object' ? q.vis : null; let pic;
    if(v && !(v.seq || v.column || v.bus)){
      if(v.bars && arr(v.bars).length <= 4) pic = { bars:arr(v.bars).map(b => ({ w:arr(b && b.w).map(Number), on:arr(b && b.on).map(Number) })) };
      else if(v.groups && v.groups * v.size <= 60) pic = { groups:+v.groups, size:+v.size };
      else return null;
    }
    const out = o => { if(pic) o.v = pic; return o; };
    if(q.mode === 'shade') return { q:ask.replace(/^Shade\b/, 'I shaded').replace(/\.$/, '') + '.', a:'', j:0 };
    if(/=\s*$/.test(ask)) return out({ q:ask, a:ans, j:1 });
    if(ask.includes('?') && !/[A-Za-z]{3}/.test(ask)) return out({ q:ask, a:ans, j:2 });
    if(/…\s*$/.test(say) && say.length < 60) return { q:say.trim(), a:ans, j:3 };
    return out({ q:ask.slice(0, 170), a:ans.slice(0, 90), j:0 });
  }
  function note(kid, q){
    try{
      if(!kid || kid.phase === 'wedo') return;
      const l = line(q); if(!l) return;
      const best = kid.best && typeof kid.best === 'object' && !Array.isArray(kid.best) ? kid.best : {};
      const list = arr(best[kid.step]).filter(x => x && !(x.q === l.q && x.a === l.a && JSON.stringify(x.v || 0) === JSON.stringify(l.v || 0)));
      list.push(l); best[kid.step] = list.slice(-KEEP); kid.best = best;
    }catch(e){}
  }
  function picHTML(v){
    if(!v || typeof v !== 'object') return '';
    if(v.bars) return `<span class="fp-pic" aria-hidden="true">${arr(v.bars).map(b => { const on = arr(b.on).map(Number); return `<span class="fp-barpic">${arr(b.w).map((w, i) => `<i class="${on.includes(i) ? 'on' : ''}" style="flex:${Math.max(.2, Number(w) || 1)}"></i>`).join('')}</span>`; }).join('')}</span>`;
    if(v.groups) return `<span class="fp-pic fp-grouppic" aria-hidden="true">${`<span>${'<i></i>'.repeat(Math.max(1, Math.min(12, v.size | 0)))}</span>`.repeat(Math.max(1, Math.min(12, v.groups | 0)))}</span>`;
    return '';
  }
  function lineHTML(l){ return picHTML(l.v) + lineText(l); }
  function lineText(l){
    const q = String(l.q || ''), a = `<b class="fp-a">${esc(l.a)}</b>`;
    if(l.j === 1) return `<span class="fp-sum">${esc(q)} ${a}</span>`;
    if(l.j === 2){ const i = q.indexOf('?'); return `<span class="fp-sum">${esc(q.slice(0, i))}${a}${esc(q.slice(i + 1))}</span>`; }
    if(l.j === 3) return `<span class="fp-sum">${esc(q.replace(/…\s*$/, ''))}${a}</span>`;
    return `<span class="fp-q">${esc(q)}</span>${l.a ? ' ' + a : ''}`;
  }

  const TICK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.6 4.8L19.5 7" fill="none" stroke="#2B1A12" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const STARLET = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.5 1.2 6.4L12 17.1l-5.7 3.1 1.2-6.4-4.7-4.5 6.4-.8z" fill="#F0B913" stroke="#2B1A12" stroke-width="1.8" stroke-linejoin="round"/></svg>';
  function badge(i){ try{ return typeof pwBadge === 'function' ? pwBadge(i).n : ''; }catch(e){ return ''; } }

  function got(s, kid){ return [...new Set(arr(kid && kid.secured).map(Number))].filter(i => s.steps[i]).sort((a, b) => a - b); }
  function html(s, kid, pack){
    const P = window.FabProud; if(!P || !s || !kid) return '';
    pack = pack || {};
    const done = got(s, kid), n = done.length, best = kid.best || {};
    let code = ''; try{ code = typeof fabLearnerCode === 'function' ? fabLearnerCode() : ''; }catch(e){}
    const climb = `<ol class="fp-climb" aria-label="${n} of ${s.steps.length} steps climbed">${s.steps.map((st, i) => {
      const on = done.includes(i), now = i === kid.step && !on;
      return `<li class="${on ? 'got' : now ? 'now' : ''}" title="${esc(st.name)}"><span>${on ? TICK : i + 1}</span></li>`;
    }).join('')}</ol><p class="fp-key"><i class="got">${TICK}</i> a step I have climbed${done.includes(kid.step) ? '' : ' <i class="now"></i> where I am now'}</p>`;
    const cards = [{ h:'My climb', wide:true, html:climb }];
    done.forEach(i => {
      const lines = arr(best[i]).filter(x => x && x.q).slice(-KEEP);
      cards.push({ h:s.steps[i].name, html:lines.length
        ? `<p class="fp-got">I got these right:</p><ul class="fp-best">${lines.map(l => `<li>${lineHTML(l)}</li>`).join('')}</ul>`
        : '<p class="fp-got">I got three right on this step.</p>' });
    });
    const names = done.map(badge).filter(Boolean);
    if(names.length) cards.push({ h:names.length === 1 ? 'A treasure I found' : 'Treasures I found', wide:true,
      html:`<ul class="fp-chips">${names.map(x => `<li>${STARLET}${esc(x)}</li>`).join('')}</ul><p class="fp-key">They are waiting in Fab Fox World.</p>` });
    const stars = Math.max(0, Number(kid.done) || 0);
    return P.page({
      theme:THEME[String(pack.subject || '').toLowerCase()] || 'fab', cls:'fp-paper',
      kicker:code ? 'Flown by Explorer ' + code : 'My flightpath',
      title:pack.title || s.title || 'My flightpath',
      lead:n ? `I have climbed ${n} step${n === 1 ? '' : 's'}. Here is what I can do now.` : 'My flightpath has begun. Every step I climb will show here.',
      cards,
      fact:stars ? { label:`${stars} star${stars === 1 ? '' : 's'} earned`, text:'Every star turns into a berry for Fab’s basket in Fab Fox World.' } : null,
      when:kid.when || P.stamp(),
      seal:n ? `${n} step${n === 1 ? '' : 's'} climbed!` : 'On my way!'
    });
  }

  /* ---- the layer over the lesson ---- */
  let layer = null, lastFocus = null;
  function fit(){
    if(!layer) return; const p = layer.querySelector('.proud'); if(!p) return;
    /* a poster should fill a big screen, not sit small in the middle of it: grow the whole page, never shrink it */
    const z = Math.max(1, Math.min(1.9, (window.innerWidth - 56) / 1000)); p.style.zoom = z > 1.02 ? z.toFixed(3) : '';
  }
  function close(){
    if(!layer) return; layer.remove(); layer = null; window.removeEventListener('resize', fit); document.removeEventListener('keydown', key, true);
    document.body.classList.remove('fp-open'); try{ if(lastFocus && lastFocus.isConnected) lastFocus.focus(); }catch(e){} lastFocus = null;
  }
  function key(e){ if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); } }
  function print(){
    document.body.classList.add('fp-printing');
    const done = () => { document.body.classList.remove('fp-printing'); window.removeEventListener('afterprint', done); };
    window.addEventListener('afterprint', done); try{ window.print(); }catch(e){ done(); } setTimeout(done, 6000);
  }
  function open(s, kid, pack){
    if(!window.FabProud || !s || !kid) return false;
    try{ pack = pack || (typeof Learn !== 'undefined' && Learn.pack) || {}; }catch(e){ pack = pack || {}; }
    close(); lastFocus = document.activeElement;
    layer = document.createElement('div'); layer.className = 'fp-layer'; layer.setAttribute('role', 'dialog'); layer.setAttribute('aria-modal', 'true'); layer.setAttribute('aria-label', 'My flightpath poster');
    layer.innerHTML = `<div class="fp-bar"><button type="button" class="fp-btn" data-fp="close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.5 5.5L8 12l6.5 6.5" fill="none" stroke="#2B1A12" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>Back to my flightpath</button>
      <button type="button" class="fp-btn gold" data-fp="print"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 9V3.8h10V9M7 17.5H4.2V9h15.6v8.5H17M7 14h10v6.4H7z" fill="#FFFDF7" stroke="#2B1A12" stroke-width="2.2" stroke-linejoin="round"/></svg>Print my poster</button></div>
      <div class="fp-scroll">${html(s, kid, pack)}</div>`;
    layer.addEventListener('click', e => { const b = e.target.closest('[data-fp]'); if(!b) return; if(b.dataset.fp === 'close') close(); else print(); });
    document.body.appendChild(layer); document.body.classList.add('fp-open');
    window.addEventListener('resize', fit); document.addEventListener('keydown', key, true); fit();
    try{ layer.querySelector('[data-fp="close"]').focus(); }catch(e){}
    return true;
  }
  /* the button the lesson shows once at least one step is climbed */
  function button(s, kid, big){
    if(!window.FabProud || !s || !kid || !got(s, kid).length) return '';
    return `<button type="button" class="btn ${big ? '' : 'small '}leaf fp-open-btn" data-pwact="poster">${STARLET}<span>${big ? 'See my poster' : 'My poster'}</span></button>`;
  }

  const css = document.createElement('style'); css.textContent = `
.fp-layer{position:fixed;inset:0;z-index:9000;display:flex;flex-direction:column;background:#FFD483;color:#2B1A12}
.fp-bar{flex:none;display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px clamp(12px,2.4vw,32px);background:#FFF6E6;border-bottom:4px solid #2B1A12}
.fp-btn{display:inline-flex;align-items:center;gap:8px;min-height:52px;padding:8px 20px 9px 14px;background:#FFFDF7;border:3px solid #2B1A12;border-radius:16px 20px 16px 18px;font:italic 700 clamp(1.05rem,1.5vw,1.4rem) Aleo,Georgia,serif;color:#2B1A12;cursor:pointer;box-shadow:none}
.fp-btn.gold{background:#F0B913}.fp-btn svg{width:1.5em;height:1.5em;flex:none}
.fp-btn:hover{transform:translateY(-1px)}.fp-btn:focus-visible{outline:4px solid #FE4D02;outline-offset:3px}
.fp-scroll{flex:1;min-height:0;overflow:auto;padding:clamp(14px,2.4vw,30px) clamp(10px,2.4vw,28px) 44px;-webkit-overflow-scrolling:touch}
body.fp-open{overflow:hidden}
.fp-climb{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:10px 8px;margin:4px 0 10px;padding:0}
.fp-climb li{margin:0}
.fp-climb li span{display:grid;place-items:center;width:46px;height:46px;border:3px solid #2B1A12;border-radius:50% 46% 52% 48%;background:#FFF6E6;font:700 1.15rem/1 Aleo,Georgia,serif;color:#2B1A12}
.fp-climb li:nth-child(odd) span{transform:rotate(-3deg)}.fp-climb li:nth-child(even) span{transform:rotate(2.5deg)}
.fp-climb li.got span{background:var(--pb,#F0B913)}.fp-climb li.now span{background:#fff;border-style:dashed;border-color:#FE4D02;color:#D9400A}
.fp-climb svg{width:26px;height:26px}
.proud .fp-key{font:italic 700 clamp(.95rem,1.3vw,1.1rem)/1.4 Aleo,Georgia,serif;text-align:center;margin:0}
.fp-key i{display:inline-grid;place-items:center;width:1.5em;height:1.5em;border:2.5px solid #2B1A12;border-radius:50%;vertical-align:-.36em;margin:0 .25em 0 .5em}
.fp-key i.got{background:var(--pb,#F0B913)}.fp-key i.now{background:#fff;border-style:dashed;border-color:#FE4D02}.fp-key i svg{width:1em;height:1em}
.proud .fp-got{font:italic 700 clamp(1rem,1.4vw,1.15rem)/1.3 Aleo,Georgia,serif;margin:0 0 6px}
.fp-best{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.fp-best li{background:#fff;border:2.5px solid #2B1A12;border-radius:12px 14px 12px 15px;padding:7px 12px 8px;font-size:clamp(1.08rem,1.6vw,1.25rem);line-height:1.4;margin:0}
.fp-best .fp-sum{font-size:1.2em;font-weight:700;letter-spacing:.01em}
.fp-best .fp-a{background:var(--pb,#F0B913);border-radius:8px;padding:0 .35em;white-space:nowrap}
.fp-best .fp-q + .fp-a,.fp-best .fp-q ~ .fp-a{white-space:normal;display:inline-block;margin-top:3px}
.fp-pic{display:flex;flex-direction:column;gap:5px;margin:2px 0 7px}
.fp-barpic{display:flex;height:30px;max-width:300px;border:2.5px solid #2B1A12;border-radius:6px;overflow:hidden;background:#fff}
.fp-barpic i{border-right:2.5px solid #2B1A12;min-width:0}.fp-barpic i:last-child{border-right:0}.fp-barpic i.on{background:var(--pb,#F0B913)}
.fp-grouppic{flex-direction:row;flex-wrap:wrap;gap:6px}
.fp-grouppic span{display:inline-flex;flex-wrap:wrap;gap:3px;max-width:76px;padding:4px 5px;border:2.5px solid #2B1A12;border-radius:10px;background:#fff}
.fp-grouppic i{width:11px;height:11px;border-radius:50%;background:#FE4D02;border:1.5px solid #2B1A12}
.fp-chips{list-style:none;display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:2px 0 10px;padding:0}
.fp-chips li{display:inline-flex;align-items:center;gap:6px;background:#fff;border:3px solid #2B1A12;border-radius:999px;padding:4px 16px 5px 10px;font:italic 700 clamp(1rem,1.5vw,1.2rem) Aleo,Georgia,serif;margin:0}
.fp-chips li:nth-child(odd){transform:rotate(-1.5deg)}.fp-chips li:nth-child(even){transform:rotate(1.5deg)}
.fp-chips svg{width:1.4em;height:1.4em;flex:none}
.fp-open-btn{display:inline-flex;align-items:center;gap:6px}.fp-open-btn svg{width:1.3em;height:1.3em;flex:none}
.pw-found .fp-open-btn{margin-top:10px}.pw-side .fp-open-btn{margin:2px auto 12px;display:flex}
@media (max-width:520px){.fp-bar{padding:8px}.fp-btn{padding:6px 12px 7px 8px;min-height:46px}.fp-climb li span{width:38px;height:38px;font-size:1rem}}
@media print{body.fp-printing *{visibility:hidden!important}body.fp-printing .fp-layer{position:static;display:block;background:none}body.fp-printing .fp-scroll{overflow:visible;padding:0}
  body.fp-printing .fp-paper,body.fp-printing .fp-paper *{visibility:visible!important}body.fp-printing .fp-paper{position:absolute;left:0;top:0;width:100%;max-width:none;zoom:1!important}body.fp-printing .fp-bar{display:none}}`;
  document.head.appendChild(css);

  window.FabFlightPoster = { note, open, close, html, button, line };
})();
