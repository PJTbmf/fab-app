/* Joins the Learning Board (board.js) and Show a link (coview.js) to the Learning Hub and lessons. */
(function(){
  'use strict';
  /* where the child is right now: the lesson, the screen, and (in a flightpath) their step */
  function current(){
    try{
      const p = Learn.pack; if(!p) return null;
      const s = p.screens[Learn.step]; if(!s) return { p };
      if(s.type === 'pathway'){
        const st = Learn.state[Learn.step], kid = st && pwKid(st, pwMe());
        if(kid && kid.step != null) return { p, s, stp:s.steps[kid.step], i:kid.step };
      }
      return { p, s };
    }catch(e){ return null; }
  }
  /* ---------- slides: the step's own teaching, ready to write on ---------- */
  const INK = '#2b2f3a', FLAME = '#FE4D02';
  const isMaths = c => /maths/i.test((c && c.p && c.p.subject) || '');
  function wrap(text, size, width){
    const per = Math.max(12, Math.floor((width || 1460) / (size * 0.52))), out = [];
    String(text || '').split('\n').forEach(par => {
      let ln = '';
      par.split(/\s+/).forEach(w => { if(!w) return; if((ln + ' ' + w).trim().length > per){ if(ln) out.push(ln); ln = w; } else ln = (ln + ' ' + w).trim(); });
      out.push(ln);
    });
    return out.join('\n');
  }
  const words = (txt, x, y, size, col) => ({ t:'x', x, y, s:size, c:col || INK, txt:wrap(txt, size, 1600 - x - 60) });
  /* A sum laid out in columns on squared paper, one digit to a square, ready for the teacher to work through. */
  function columnItems(a, op, b){
    const A = String(a).replace(/,/g, ''), Bn = String(b).replace(/,/g, '');
    if(!/^\d+$/.test(A) || !/^\d+$/.test(Bn)) return null;
    const G = 100, right = 11, top = 2, S = 88, items = [];
    const digit = (d, col, row, c) => items.push({ t:'x', x:(right - col) * G + 24, y:(top + row) * G + 4, s:S, c:c || INK, txt:d });
    [...A].reverse().forEach((d, i) => digit(d, i, 0));
    [...Bn].reverse().forEach((d, i) => digit(d, i, 1));
    const width = Math.max(A.length, Bn.length) + 1;
    digit(op === '-' ? '−' : op, width - 1, 1, FLAME);
    const y = (top + 2) * G + 6, x0 = (right - width + 1) * G - 6, x1 = (right + 1) * G + 6;
    items.push({ t:'s', m:'pen', c:INK, w:7, p:[x0, y, x1, y] });
    return items;
  }
  /* Short or long division as a "bus stop". */
  function busStopItems(a, b){
    const A = String(a).replace(/,/g, ''), Bn = String(b).replace(/,/g, '');
    if(!/^\d+$/.test(A) || !/^\d+$/.test(Bn)) return null;
    const G = 100, left = 5, top = 3, S = 88, items = [];
    [...Bn].forEach((d, i) => items.push({ t:'x', x:(left - Bn.length + i) * G + 24, y:top * G + 4, s:S, c:FLAME, txt:d }));
    [...A].forEach((d, i) => items.push({ t:'x', x:(left + i) * G + 24 + 20, y:top * G + 4, s:S, c:INK, txt:d }));
    const x0 = left * G + 4, x1 = (left + A.length) * G + 40, y = top * G - 6;
    items.push({ t:'s', m:'pen', c:INK, w:7, p:[x0, y + G + 8, x0 + 10, y + 36, x0 + 4, y, x1, y] });
    return items;
  }
  function modelItems(q, maths){
    const m = /^([\d,]+)\s*([+−\-×÷])\s*([\d,]+)$/.exec(String(q.say || '').trim());
    const written = /^(columnAdd|columnSub|mulWritten|longMul|shortDiv|longDiv)$/.test(q.kind || '') || (Array.isArray(q.vis) && q.vis.includes('column'));
    if(maths && m && written){
      const op = m[2] === '−' ? '-' : m[2];
      const it = op === '÷' ? busStopItems(m[1], m[3]) : columnItems(m[1], op, m[3]);
      if(it) return it;
    }
    return [words(q.ask || q.say || '', 80, 170, 76)];
  }
  function kidNow(){ try{ const st = Learn.state[Learn.step]; return st && pwKid(st, pwMe()); }catch(e){ return null; } }
  function slidesFor(c){
    if(!c || !c.stp) return null;
    const stp = c.stp, tc = stp.teach || {}, maths = isMaths(c), paper = maths ? 'squares' : 'lines', base = c.p.id + ':' + c.i;
    const q = () => { const k = kidNow(); return (k && (k.ex || k.q)) || pwQuestion(stp); };
    return () => {
      const list = [];
      if(tc.idea) list.push({ icon:'💡', name:'The big idea', make:() => ({ key:'slide:' + base + ':idea', title:`💡 ${stp.name}`, prompt:'', bg:'plain', items:[words(tc.idea, 80, 110, 66)] }) });
      list.push({ icon:'👀', name:'Model it (I do)', make:() => { const qq = q(); return { key:'slide:' + base + ':model:' + (qq.say || qq.ask), title:`👀 I do: ${stp.name}`, prompt:'Talk through each step as you write.', bg:paper, items:modelItems(qq, maths) }; } });
      list.push({ icon:'💭', name:'My thinking', make:() => {
        const qq = q(); let worked = '';
        try{ worked = PW_WORKED[qq.kind] ? PW_WORKED[qq.kind](qq) : pwFindHint(stp, qq, null).text; }catch(e){}
        const ans = qq.say ? `${qq.say} = ${pwShow(qq.ans)}` : `The answer is ${pwShow(qq.ans)}`;
        return { key:'slide:' + base + ':think:' + (qq.say || qq.ask), title:'💭 My thinking', prompt:'', bg:'lines', items:[words(worked || '', 80, 120, 62), words(ans, 80, 700, 72, FLAME)] };
      } });
      list.push({ icon:'🤝', name:'We do: one together', make:() => { const qq = pwQuestion(stp); return { key:'', title:`🤝 We do: ${stp.name}`, prompt:'Let’s try one together.', bg:paper, items:modelItems(qq, maths) }; } });
      list.push({ icon:'✏️', name:'Your turn', make:() => { const qq = pwQuestion(stp); return { key:'', title:`✏️ Your turn: ${stp.name}`, prompt:'Have a go on your own. Hints are always there.', bg:paper, items:modelItems(qq, maths) }; } });
      list.push({ icon:'📃', name:'Blank page', make:() => ({ key:'', title:'', prompt:'', bg:paper, items:[] }) });
      return list;
    };
  }
  function boardFor(c, withBooklet, extra){
    if(!c || !c.p) return FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' });
    const maths = /maths/i.test(c.p.subject || '');
    const stp = c.stp, opts = { id:'lesson:' + c.p.id, title:(c.p.emoji ? c.p.emoji + ' ' : '') + c.p.title, back:'screen-lesson', dock:true, slides:slidesFor(c) };
    if(extra) Object.assign(opts, extra);
    if(stp){
      opts.step = { key:c.p.id + ':' + c.i, title:`Step ${c.i + 1}: ${stp.name}`,
        prompt:stp.task || 'Show what you know, your way: draw it, write it, add stickers or a picture.', bg:maths ? 'squares' : 'lines' };
      if(withBooklet && stp.booklet && stp.booklet.url) opts.booklet = { url:stp.booklet.url, pages:stp.booklet.pages, title:stp.booklet.title };
    } else if(c.s){
      opts.step = { key:c.p.id + ':screen' + Learn.step, title:c.s.title || 'My page', prompt:'Write or draw your ideas here.', bg:maths ? 'squares' : 'lines' };
    }
    return FabBoard.open(opts);
  }
  function stepLinks(c){
    if(!c || !c.stp) return [];
    const out = [];
    (Array.isArray(c.stp.media) ? c.stp.media : []).forEach(m => { if(m && m.url) out.push({ u:m.url, t:m.title }); });
    try{ ((pwMediaSaved()[c.i]) || []).forEach(m => out.push({ u:m.u, t:m.t })); }catch(e){}
    return out;
  }
  function paintShare(){
    const can = window.CoView && CoView.canShare();
    ['learnLinkBtn', 'lpLink'].forEach(id => { const b = document.getElementById(id); if(b) b.hidden = !can; });
  }
  document.getElementById('learnBoardBtn').addEventListener('click', () => FabBoard.open({ id:'workbook', title:'My workbook', back:'screen-learn' }));
  document.getElementById('lpBoard').addEventListener('click', () => boardFor(current(), false));
  document.getElementById('lpLink').addEventListener('click', () => CoView.launcher({ links:stepLinks(current()) }));
  /* "Show it on the board": the board opens beside the lesson on the I do example, laid out ready to model. */
  async function modelOnBoard(){
    const c = current(); await boardFor(c, false);
    const sl = slidesFor(c); if(!sl) return;
    const pick = sl().find(x => /Model it/.test(x.name)); if(pick) FabBoard.addPages([pick.make()]);
  }
  /* Leaving the lesson closes a board that was docked beside it. */
  if(typeof window.showScreen === 'function'){
    const show = window.showScreen;
    window.showScreen = function(id){ if(id !== 'screen-lesson' && id !== 'screen-board' && window.FabBoard && FabBoard.docked()) FabBoard.undock(); return show.apply(this, arguments); };
  }
  document.addEventListener('click', e => {
    if(e.target.closest('[data-lbmodel]')){ e.preventDefault(); modelOnBoard(); }
    else if(e.target.closest('[data-lbwrite]')){ e.preventDefault(); boardFor(current(), false); }
    else if(e.target.closest('[data-lbbook]')){ e.preventDefault(); boardFor(current(), true); }
  });
  /* a link shared before this file loaded */
  try{ if(typeof Live !== 'undefined' && Live.pendingView){ CoView.fromShared(Live.pendingView); Live.pendingView = null; } }catch(e){}
  paintShare(); setInterval(paintShare, 3000);
  window.FabLearnBoard = { current, boardFor, slidesFor, modelOnBoard };
})();
